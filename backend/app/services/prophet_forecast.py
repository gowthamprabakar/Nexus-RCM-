"""
Prophet-based Forecasting Engine for NEXUS RCM
================================================
Provides weekly revenue and daily payment forecasting with graceful
model fallback:  Prophet  ->  statsmodels SARIMAX  ->  Exponential Smoothing

Public API
----------
  forecast_weekly_revenue(db, payer_id, weeks_ahead)
  forecast_daily_payments(db, payer_id, days_ahead)
  get_forecast_accuracy(db, payer_id)
"""

from __future__ import annotations

import hashlib
import logging
import time
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sqlalchemy import func, and_, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.rcm_extended import (
    ForecastTrainingWeekly,
    ForecastTrainingDaily,
    EraPayment,
)
from app.models.payer import Payer
from app.models.claim import Claim
from app.models.denial import Denial

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model availability detection
# ---------------------------------------------------------------------------
_MODEL_BACKEND: str = "none"

try:
    from prophet import Prophet  # type: ignore
    _MODEL_BACKEND = "prophet"
    log.info("Forecast engine: using Prophet")
except ImportError:
    try:
        from neuralprophet import NeuralProphet  # type: ignore
        _MODEL_BACKEND = "neuralprophet"
        log.info("Forecast engine: using NeuralProphet")
    except ImportError:
        try:
            from statsmodels.tsa.statespace.sarimax import SARIMAX  # type: ignore
            _MODEL_BACKEND = "sarimax"
            log.info("Forecast engine: using SARIMAX (statsmodels)")
        except ImportError:
            _MODEL_BACKEND = "ets"
            log.warning(
                "Forecast engine: no advanced model available. "
                "Falling back to pandas Exponential Smoothing."
            )


# ---------------------------------------------------------------------------
# In-memory model cache  (key -> (model, timestamp))
# ---------------------------------------------------------------------------
_CACHE: Dict[str, Tuple[Any, float]] = {}
_CACHE_TTL = 3600  # 1 hour
_CACHE_MAX = 50    # max entries


def _cache_key(*parts) -> str:
    raw = "|".join(str(p) for p in parts)
    return hashlib.md5(raw.encode()).hexdigest()


def _get_cached(key: str):
    entry = _CACHE.get(key)
    if entry and (time.time() - entry[1]) < _CACHE_TTL:
        return entry[0]
    return None


def _set_cached(key: str, obj):
    now = time.time()
    expired = [k for k, (_, ts) in _CACHE.items() if now - ts >= _CACHE_TTL]
    for k in expired:
        del _CACHE[k]
    if len(_CACHE) >= _CACHE_MAX:
        oldest = min(_CACHE, key=lambda k: _CACHE[k][1])
        del _CACHE[oldest]
    _CACHE[key] = (obj, now)


# ---------------------------------------------------------------------------
# Internal: build training dataframes from DB
# ---------------------------------------------------------------------------

async def _load_weekly_training(
    db: AsyncSession, payer_id: Optional[str] = None
) -> pd.DataFrame:
    """
    Try forecast_training_weekly first.
    If empty, derive from era_payments + claims + denials.
    """
    q = select(ForecastTrainingWeekly)
    if payer_id:
        q = q.where(ForecastTrainingWeekly.payer_id == payer_id)
    q = q.order_by(ForecastTrainingWeekly.week_start)

    result = await db.execute(q)
    rows = result.scalars().all()

    if rows:
        records = []
        for r in rows:
            records.append({
                "ds": r.week_start,
                "y": float(r.actual_payments or 0),
                "payer_id": r.payer_id,
                "payer_name": r.payer_name or "",
                "denial_count": int(r.denial_count or 0),
                "claims_submitted": int(r.claims_submitted or 0),
                "avg_adtp": float(r.avg_adtp or 0),
            })
        return pd.DataFrame(records)

    # ---- Fallback: derive from era_payments ----
    log.info("forecast_training_weekly empty — deriving from era_payments")

    era_q = select(
        EraPayment.payer_id,
        EraPayment.payment_week_start,
        func.sum(EraPayment.payment_amount).label("total"),
        func.count(EraPayment.era_id).label("cnt"),
    )
    if payer_id:
        era_q = era_q.where(EraPayment.payer_id == payer_id)
    era_q = era_q.group_by(
        EraPayment.payer_id, EraPayment.payment_week_start
    ).order_by(EraPayment.payment_week_start)

    era_result = await db.execute(era_q)
    era_rows = era_result.all()

    if not era_rows:
        return pd.DataFrame()

    # Payer name lookup
    payer_q = select(Payer)
    payer_result = await db.execute(payer_q)
    payer_map = {p.payer_id: p for p in payer_result.scalars().all()}

    records = []
    for r in era_rows:
        p = payer_map.get(r.payer_id)
        records.append({
            "ds": r.payment_week_start,
            "y": float(r.total or 0),
            "payer_id": r.payer_id,
            "payer_name": p.payer_name if p else "",
            "denial_count": 0,
            "claims_submitted": int(r.cnt or 0),
            "avg_adtp": float(p.adtp_days if p else 30),
        })
    return pd.DataFrame(records)


async def _load_daily_training(
    db: AsyncSession, payer_id: Optional[str] = None
) -> pd.DataFrame:
    """
    Try forecast_training_daily first.
    If empty, derive from era_payments.
    """
    q = select(ForecastTrainingDaily)
    if payer_id:
        q = q.where(ForecastTrainingDaily.payer_id == payer_id)
    q = q.order_by(ForecastTrainingDaily.payment_date)

    result = await db.execute(q)
    rows = result.scalars().all()

    if rows:
        records = []
        for r in rows:
            records.append({
                "ds": r.payment_date,
                "y": float(r.payment_amount or 0),
                "payer_id": r.payer_id,
                "payer_name": r.payer_name or "",
                "day_of_week": int(r.day_of_week or 0),
                "is_month_end": 1 if r.is_month_end else 0,
                "is_holiday": 1 if r.is_holiday else 0,
            })
        return pd.DataFrame(records)

    # ---- Fallback: derive from era_payments ----
    log.info("forecast_training_daily empty — deriving from era_payments")

    era_q = select(
        EraPayment.payer_id,
        EraPayment.payment_date,
        func.sum(EraPayment.payment_amount).label("total"),
        func.count(EraPayment.era_id).label("cnt"),
    )
    if payer_id:
        era_q = era_q.where(EraPayment.payer_id == payer_id)
    era_q = era_q.group_by(
        EraPayment.payer_id, EraPayment.payment_date
    ).order_by(EraPayment.payment_date)

    era_result = await db.execute(era_q)
    era_rows = era_result.all()

    if not era_rows:
        return pd.DataFrame()

    payer_q = select(Payer)
    payer_result = await db.execute(payer_q)
    payer_map = {p.payer_id: p for p in payer_result.scalars().all()}

    records = []
    for r in era_rows:
        p = payer_map.get(r.payer_id)
        d = r.payment_date
        next_day = d + timedelta(days=1)
        records.append({
            "ds": d,
            "y": float(r.total or 0),
            "payer_id": r.payer_id,
            "payer_name": p.payer_name if p else "",
            "day_of_week": d.weekday(),
            "is_month_end": 1 if next_day.month != d.month else 0,
            "is_holiday": 0,
        })
    return pd.DataFrame(records)


# ---------------------------------------------------------------------------
# Internal: model fitting & prediction
# ---------------------------------------------------------------------------

def _fit_and_predict_prophet(
    df: pd.DataFrame,
    periods: int,
    freq: str = "W",
    regressors: Optional[List[str]] = None,
) -> pd.DataFrame:
    """Fit Prophet model, return forecast dataframe."""
    from prophet import Prophet  # type: ignore

    m = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=(freq == "D"),
        daily_seasonality=False,
        interval_width=0.80,
    )

    train = df[["ds", "y"]].copy()
    train["ds"] = pd.to_datetime(train["ds"])

    if regressors:
        for reg in regressors:
            if reg in df.columns:
                m.add_regressor(reg)
                train[reg] = df[reg].values

    m.fit(train)

    future = m.make_future_dataframe(periods=periods, freq=freq)
    if regressors:
        for reg in regressors:
            if reg in df.columns:
                last_val = float(df[reg].iloc[-1]) if len(df) > 0 else 0
                if reg not in future.columns:
                    future[reg] = last_val

    forecast = m.predict(future)
    return forecast, m


def _fit_and_predict_neuralprophet(
    df: pd.DataFrame,
    periods: int,
    freq: str = "W",
    regressors: Optional[List[str]] = None,
) -> pd.DataFrame:
    """Fit NeuralProphet model, return forecast dataframe."""
    from neuralprophet import NeuralProphet  # type: ignore

    m = NeuralProphet(
        yearly_seasonality=True,
        weekly_seasonality=(freq == "D"),
        daily_seasonality=False,
    )

    train = df[["ds", "y"]].copy()
    train["ds"] = pd.to_datetime(train["ds"])

    if regressors:
        for reg in regressors:
            if reg in df.columns:
                m.add_future_regressor(reg)
                train[reg] = df[reg].values

    m.fit(train, freq=freq)

    future = m.make_future_dataframe(train, periods=periods)
    if regressors:
        for reg in regressors:
            if reg in df.columns:
                last_val = float(df[reg].iloc[-1]) if len(df) > 0 else 0
                if reg not in future.columns:
                    future[reg] = last_val

    forecast = m.predict(future)
    return forecast, m


def _fit_and_predict_sarimax(
    df: pd.DataFrame,
    periods: int,
    freq: str = "W",
    regressors: Optional[List[str]] = None,
) -> pd.DataFrame:
    """Fit SARIMAX model, return forecast-like dataframe."""
    from statsmodels.tsa.statespace.sarimax import SARIMAX  # type: ignore

    train = df[["ds", "y"]].copy()
    train["ds"] = pd.to_datetime(train["ds"])
    train = train.sort_values("ds").reset_index(drop=True)
    train = train.set_index("ds")

    y = train["y"]

    # Build exogenous matrix if regressors exist
    exog = None
    if regressors:
        exog_cols = [r for r in regressors if r in df.columns]
        if exog_cols:
            exog_df = df[["ds"] + exog_cols].copy()
            exog_df["ds"] = pd.to_datetime(exog_df["ds"])
            exog_df = exog_df.sort_values("ds").reset_index(drop=True)
            exog_df = exog_df.set_index("ds")
            exog = exog_df[exog_cols]

    # Determine seasonal period
    seasonal_period = 52 if freq == "W" else 7
    order = (1, 1, 1)
    # Only add seasonal if enough data
    if len(y) >= 2 * seasonal_period:
        seasonal_order = (1, 1, 0, seasonal_period)
    else:
        seasonal_order = (0, 0, 0, 0)

    try:
        model = SARIMAX(
            y,
            exog=exog,
            order=order,
            seasonal_order=seasonal_order,
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        fit = model.fit(disp=False, maxiter=200)
    except Exception:
        # Simpler fallback if SARIMAX fails
        model = SARIMAX(
            y, order=(1, 1, 0),
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        fit = model.fit(disp=False, maxiter=100)
        exog = None

    # Build future exog
    future_exog = None
    if exog is not None:
        last_row = exog.iloc[-1:]
        future_exog = pd.concat([last_row] * periods, ignore_index=True)
        future_exog.index = pd.date_range(
            start=y.index[-1] + pd.Timedelta(days=7 if freq == "W" else 1),
            periods=periods,
            freq=freq,
        )

    pred = fit.get_forecast(steps=periods, exog=future_exog)
    pred_mean = pred.predicted_mean
    conf = pred.conf_int(alpha=0.20)  # 80% CI

    # Build Prophet-compatible output
    last_date = y.index[-1]
    if freq == "W":
        future_dates = [last_date + timedelta(weeks=i + 1) for i in range(periods)]
    else:
        future_dates = [last_date + timedelta(days=i + 1) for i in range(periods)]

    # Historical fitted values
    fitted = fit.fittedvalues
    hist_dates = y.index.tolist()

    all_dates = hist_dates + future_dates
    yhat = list(fitted.values) + list(pred_mean.values)
    yhat_lower = [None] * len(hist_dates) + list(conf.iloc[:, 0].values)
    yhat_upper = [None] * len(hist_dates) + list(conf.iloc[:, 1].values)

    forecast_df = pd.DataFrame({
        "ds": all_dates,
        "yhat": yhat,
        "yhat_lower": yhat_lower,
        "yhat_upper": yhat_upper,
        "trend": yhat,  # SARIMAX doesn't decompose, use yhat
    })
    return forecast_df, fit


def _fit_and_predict_ets(
    df: pd.DataFrame,
    periods: int,
    freq: str = "W",
    regressors: Optional[List[str]] = None,
) -> pd.DataFrame:
    """Simple exponential smoothing fallback using pandas ewm."""
    train = df[["ds", "y"]].copy()
    train["ds"] = pd.to_datetime(train["ds"])
    train = train.sort_values("ds").reset_index(drop=True)

    y = train["y"]
    # Exponential weighted mean with span=4
    ewm = y.ewm(span=min(4, len(y)), adjust=False).mean()
    last_val = float(ewm.iloc[-1]) if len(ewm) > 0 else 0
    last_date = train["ds"].iloc[-1] if len(train) > 0 else pd.Timestamp.now()

    # Simple trend
    if len(y) >= 4:
        recent = y.iloc[-4:]
        trend = float((recent.iloc[-1] - recent.iloc[0]) / 4)
    else:
        trend = 0

    if freq == "W":
        future_dates = [last_date + timedelta(weeks=i + 1) for i in range(periods)]
    else:
        future_dates = [last_date + timedelta(days=i + 1) for i in range(periods)]

    predictions = []
    for i in range(periods):
        pred = max(0, last_val + trend * (i + 1))
        predictions.append(pred)

    # Confidence band: +/- 15% widening
    std_y = float(y.std()) if len(y) > 1 else last_val * 0.1
    lower = [max(0, p - std_y * (1 + 0.1 * i)) for i, p in enumerate(predictions)]
    upper = [p + std_y * (1 + 0.1 * i) for i, p in enumerate(predictions)]

    hist_dates = train["ds"].tolist()
    all_dates = hist_dates + future_dates
    yhat = list(ewm.values) + predictions
    yhat_lower = [None] * len(hist_dates) + lower
    yhat_upper = [None] * len(hist_dates) + upper

    forecast_df = pd.DataFrame({
        "ds": all_dates,
        "yhat": yhat,
        "yhat_lower": yhat_lower,
        "yhat_upper": yhat_upper,
        "trend": yhat,
    })
    return forecast_df, None


def _run_forecast(
    df: pd.DataFrame,
    periods: int,
    freq: str = "W",
    regressors: Optional[List[str]] = None,
) -> Tuple[pd.DataFrame, Any, str]:
    """
    Run forecast using the best available model backend.
    Returns (forecast_df, model_object, backend_name).
    """
    backend = _MODEL_BACKEND

    if backend == "prophet":
        try:
            fc, m = _fit_and_predict_prophet(df, periods, freq, regressors)
            return fc, m, "prophet"
        except Exception as e:
            log.warning("Prophet failed (%s), falling back to SARIMAX", e)
            backend = "sarimax"

    if backend == "neuralprophet":
        try:
            fc, m = _fit_and_predict_neuralprophet(df, periods, freq, regressors)
            return fc, m, "neuralprophet"
        except Exception as e:
            log.warning("NeuralProphet failed (%s), falling back to SARIMAX", e)
            backend = "sarimax"

    if backend == "sarimax":
        try:
            fc, m = _fit_and_predict_sarimax(df, periods, freq, regressors)
            return fc, m, "sarimax"
        except Exception as e:
            log.warning("SARIMAX failed (%s), falling back to ETS", e)

    # Final fallback
    fc, m = _fit_and_predict_ets(df, periods, freq, regressors)
    return fc, m, "exponential_smoothing"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def forecast_weekly_revenue(
    db: AsyncSession,
    payer_id: Optional[str] = None,
    weeks_ahead: int = 13,
) -> Dict[str, Any]:
    """
    Train on forecast_training_weekly data, predict next weeks_ahead weeks.
    Returns per-payer and total forecasts with confidence intervals.
    Uses whatever model installed: Prophet > NeuralProphet > SARIMAX > ETS
    """
    ck = _cache_key("weekly", payer_id or "ALL", weeks_ahead)
    cached = _get_cached(ck)
    if cached:
        return cached

    df = await _load_weekly_training(db, payer_id)

    if df.empty:
        return {
            "status": "no_data",
            "message": "No training data available for weekly forecast.",
            "model_backend": _MODEL_BACKEND,
            "payer_id": payer_id,
            "weeks_ahead": weeks_ahead,
            "forecasts": [],
            "total_forecast": [],
        }

    regressors = ["denial_count", "claims_submitted", "avg_adtp"]

    # Per-payer forecasts
    payer_ids = df["payer_id"].unique()
    payer_forecasts: List[Dict] = []
    all_payer_predictions: Dict[str, pd.DataFrame] = {}

    for pid in payer_ids:
        pdf = df[df["payer_id"] == pid].copy().reset_index(drop=True)

        if len(pdf) < 4:
            # Not enough data for meaningful forecast
            continue

        try:
            forecast_df, model, backend = _run_forecast(
                pdf, weeks_ahead, freq="W", regressors=regressors
            )
        except Exception as e:
            log.error("Forecast failed for payer %s: %s", pid, e)
            continue

        # Extract future-only predictions
        n_hist = len(pdf)
        future_fc = forecast_df.iloc[n_hist:].copy()

        payer_name = pdf["payer_name"].iloc[0] if "payer_name" in pdf.columns else pid

        weekly_preds = []
        for _, row in future_fc.iterrows():
            ds = row["ds"]
            if isinstance(ds, pd.Timestamp):
                ds = ds.date()
            weekly_preds.append({
                "week_start": str(ds),
                "predicted": round(float(row["yhat"]), 2),
                "lower": round(float(row.get("yhat_lower") or row["yhat"] * 0.85), 2),
                "upper": round(float(row.get("yhat_upper") or row["yhat"] * 1.15), 2),
            })

        payer_forecasts.append({
            "payer_id": pid,
            "payer_name": payer_name,
            "model_backend": backend,
            "training_points": len(pdf),
            "predictions": weekly_preds,
        })
        all_payer_predictions[pid] = future_fc

    # Aggregate total forecast across payers
    total_forecast = _aggregate_forecasts(all_payer_predictions, weeks_ahead, "W")

    result = {
        "status": "ok",
        "model_backend": _MODEL_BACKEND,
        "payer_id": payer_id,
        "weeks_ahead": weeks_ahead,
        "generated_at": str(date.today()),
        "payer_forecasts": payer_forecasts,
        "total_forecast": total_forecast,
    }

    _set_cached(ck, result)
    return result


async def forecast_daily_payments(
    db: AsyncSession,
    payer_id: Optional[str] = None,
    days_ahead: int = 30,
) -> Dict[str, Any]:
    """
    Train on forecast_training_daily data, predict next days_ahead days.
    Returns per-payer and total daily forecasts with confidence intervals.
    """
    ck = _cache_key("daily", payer_id or "ALL", days_ahead)
    cached = _get_cached(ck)
    if cached:
        return cached

    df = await _load_daily_training(db, payer_id)

    if df.empty:
        return {
            "status": "no_data",
            "message": "No training data available for daily forecast.",
            "model_backend": _MODEL_BACKEND,
            "payer_id": payer_id,
            "days_ahead": days_ahead,
            "forecasts": [],
            "total_forecast": [],
        }

    regressors = ["day_of_week", "is_month_end", "is_holiday"]

    payer_ids = df["payer_id"].unique()
    payer_forecasts: List[Dict] = []
    all_payer_predictions: Dict[str, pd.DataFrame] = {}

    for pid in payer_ids:
        pdf = df[df["payer_id"] == pid].copy().reset_index(drop=True)

        if len(pdf) < 7:
            continue

        try:
            forecast_df, model, backend = _run_forecast(
                pdf, days_ahead, freq="D", regressors=regressors
            )
        except Exception as e:
            log.error("Daily forecast failed for payer %s: %s", pid, e)
            continue

        n_hist = len(pdf)
        future_fc = forecast_df.iloc[n_hist:].copy()

        payer_name = pdf["payer_name"].iloc[0] if "payer_name" in pdf.columns else pid

        daily_preds = []
        for _, row in future_fc.iterrows():
            ds = row["ds"]
            if isinstance(ds, pd.Timestamp):
                ds = ds.date()
            daily_preds.append({
                "date": str(ds),
                "day_of_week": ds.strftime("%A") if hasattr(ds, "strftime") else "",
                "predicted": round(float(row["yhat"]), 2),
                "lower": round(float(row.get("yhat_lower") or row["yhat"] * 0.85), 2),
                "upper": round(float(row.get("yhat_upper") or row["yhat"] * 1.15), 2),
            })

        payer_forecasts.append({
            "payer_id": pid,
            "payer_name": payer_name,
            "model_backend": backend,
            "training_points": len(pdf),
            "predictions": daily_preds,
        })
        all_payer_predictions[pid] = future_fc

    total_forecast = _aggregate_forecasts(all_payer_predictions, days_ahead, "D")

    result = {
        "status": "ok",
        "model_backend": _MODEL_BACKEND,
        "payer_id": payer_id,
        "days_ahead": days_ahead,
        "generated_at": str(date.today()),
        "payer_forecasts": payer_forecasts,
        "total_forecast": total_forecast,
    }

    _set_cached(ck, result)
    return result


async def get_forecast_accuracy(
    db: AsyncSession,
    payer_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Compare last 4 weeks of actuals vs predictions.
    Returns MAPE, MAE, R-squared.

    1. Hold out last 4 weeks of training data
    2. Train on everything before
    3. Predict the held-out period
    4. Compare predictions to actuals
    """
    ck = _cache_key("accuracy", payer_id or "ALL")
    cached = _get_cached(ck)
    if cached:
        return cached

    df = await _load_weekly_training(db, payer_id)

    if df.empty or len(df) < 8:
        return {
            "status": "insufficient_data",
            "message": "Need at least 8 weeks of data for accuracy assessment.",
            "model_backend": _MODEL_BACKEND,
            "payer_id": payer_id,
            "metrics": {},
            "per_payer": [],
        }

    holdout_weeks = 4
    regressors = ["denial_count", "claims_submitted", "avg_adtp"]

    payer_ids = df["payer_id"].unique()
    per_payer_metrics: List[Dict] = []
    all_actuals = []
    all_preds = []

    for pid in payer_ids:
        pdf = df[df["payer_id"] == pid].copy().reset_index(drop=True)

        if len(pdf) < 8:
            continue

        train_df = pdf.iloc[:-holdout_weeks].copy().reset_index(drop=True)
        test_df = pdf.iloc[-holdout_weeks:].copy().reset_index(drop=True)

        try:
            forecast_df, _, backend = _run_forecast(
                train_df, holdout_weeks, freq="W", regressors=regressors
            )
        except Exception as e:
            log.error("Accuracy calc failed for payer %s: %s", pid, e)
            continue

        n_train = len(train_df)
        pred_rows = forecast_df.iloc[n_train: n_train + holdout_weeks]

        actuals = test_df["y"].values.astype(float)
        preds = pred_rows["yhat"].values.astype(float)

        # Ensure arrays align
        min_len = min(len(actuals), len(preds))
        actuals = actuals[:min_len]
        preds = preds[:min_len]

        if min_len == 0:
            continue

        mae = float(np.mean(np.abs(actuals - preds)))
        mape = float(
            np.mean(np.abs((actuals - preds) / np.where(actuals == 0, 1, actuals)))
            * 100
        )
        ss_res = float(np.sum((actuals - preds) ** 2))
        ss_tot = float(np.sum((actuals - np.mean(actuals)) ** 2))
        r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

        payer_name = pdf["payer_name"].iloc[0] if "payer_name" in pdf.columns else pid

        per_payer_metrics.append({
            "payer_id": pid,
            "payer_name": payer_name,
            "model_backend": backend,
            "holdout_weeks": min_len,
            "mae": round(mae, 2),
            "mape": round(mape, 2),
            "r_squared": round(r2, 4),
        })

        all_actuals.extend(actuals.tolist())
        all_preds.extend(preds.tolist())

    # Aggregate metrics
    overall_metrics = {}
    if all_actuals:
        a = np.array(all_actuals)
        p = np.array(all_preds)
        overall_metrics = {
            "mae": round(float(np.mean(np.abs(a - p))), 2),
            "mape": round(
                float(np.mean(np.abs((a - p) / np.where(a == 0, 1, a))) * 100), 2
            ),
            "r_squared": round(
                float(1 - np.sum((a - p) ** 2) / np.sum((a - np.mean(a)) ** 2))
                if np.sum((a - np.mean(a)) ** 2) > 0
                else 0.0,
                4,
            ),
            "total_actual": round(float(np.sum(a)), 2),
            "total_predicted": round(float(np.sum(p)), 2),
        }

    result = {
        "status": "ok",
        "model_backend": _MODEL_BACKEND,
        "payer_id": payer_id,
        "holdout_weeks": holdout_weeks,
        "generated_at": str(date.today()),
        "overall_metrics": overall_metrics,
        "per_payer": per_payer_metrics,
    }

    _set_cached(ck, result)
    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _aggregate_forecasts(
    payer_predictions: Dict[str, pd.DataFrame],
    periods: int,
    freq: str,
) -> List[Dict]:
    """Sum per-payer forecasts into total forecast by period."""
    if not payer_predictions:
        return []

    # Collect all predictions, group by date
    combined: Dict[str, Dict[str, float]] = {}

    for pid, fc_df in payer_predictions.items():
        for _, row in fc_df.iterrows():
            ds = row["ds"]
            if isinstance(ds, pd.Timestamp):
                ds_str = str(ds.date())
            else:
                ds_str = str(ds)

            if ds_str not in combined:
                combined[ds_str] = {"predicted": 0, "lower": 0, "upper": 0}

            yhat = float(row.get("yhat") or 0)
            yhat_lower = row.get("yhat_lower")
            yhat_upper = row.get("yhat_upper")
            combined[ds_str]["predicted"] += yhat
            combined[ds_str]["lower"] += float(yhat_lower) if yhat_lower is not None else yhat * 0.85
            combined[ds_str]["upper"] += float(yhat_upper) if yhat_upper is not None else yhat * 1.15

    result = []
    for ds_str in sorted(combined.keys()):
        entry = combined[ds_str]
        item = {
            "date": ds_str,
            "predicted": round(entry["predicted"], 2),
            "lower": round(entry["lower"], 2),
            "upper": round(entry["upper"], 2),
        }
        if freq == "W":
            item["week_start"] = ds_str
        result.append(item)

    return result
