"""
Model Governance Framework
============================
Monitor model drift, accuracy degradation, and retraining triggers.

Usage:
    gov = ModelGovernance()
    drift = gov.check_drift("denial_probability", recent_preds, actuals)
    report = gov.accuracy_report("appeal_success", preds, actuals)
    should, reason = gov.should_retrain("denial_probability")
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


class ModelGovernance:
    """In-memory model governance tracker."""

    def __init__(self) -> None:
        self._predictions: dict[str, list] = defaultdict(list)
        self._accuracy_history: dict[str, list] = defaultdict(list)
        self._last_retrain: dict[str, datetime] = {}
        self._thresholds = {
            "denial_probability": {"min_auc": 0.70, "max_drift_pvalue": 0.01},
            "appeal_success": {"min_auc": 0.65, "max_drift_pvalue": 0.01},
            "propensity_to_pay": {"min_auc": 0.75, "max_drift_pvalue": 0.01},
            "write_off": {"min_auc": 0.78, "max_drift_pvalue": 0.01},
            "payment_delay": {"max_rmse": 10, "max_drift_pvalue": 0.01},
        }

    def log_prediction(
        self,
        model_name: str,
        input_features: dict,
        prediction: float,
        actual_outcome: Optional[float] = None,
    ) -> None:
        self._predictions[model_name].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "prediction": prediction,
            "actual": actual_outcome,
            "features_hash": hash(frozenset(input_features.items())) if input_features else 0,
        })
        # Keep only last 10000 predictions
        if len(self._predictions[model_name]) > 10000:
            self._predictions[model_name] = self._predictions[model_name][-5000:]

    def check_drift(
        self,
        model_name: str,
        recent_predictions: list[float],
        actual_outcomes: list[float],
    ) -> dict:
        if len(recent_predictions) < 30 or len(actual_outcomes) < 30:
            return {"drift_detected": False, "ks_statistic": 0, "p_value": 1.0,
                    "note": "Insufficient data for drift detection"}

        preds = np.array(recent_predictions)
        actuals = np.array(actual_outcomes)

        try:
            from scipy.stats import ks_2samp
            stat, p_value = ks_2samp(preds, actuals)
        except ImportError:
            # Fallback: simple mean/std comparison
            pred_mean, pred_std = preds.mean(), preds.std()
            act_mean, act_std = actuals.mean(), actuals.std()
            stat = abs(pred_mean - act_mean) / max(pred_std, 0.01)
            p_value = max(0, 1 - stat / 3)

        threshold = self._thresholds.get(model_name, {}).get("max_drift_pvalue", 0.01)
        drift_detected = p_value < threshold

        if drift_detected:
            logger.warning("Drift detected for model %s: KS=%.4f, p=%.6f", model_name, stat, p_value)

        return {
            "drift_detected": drift_detected,
            "ks_statistic": round(float(stat), 4),
            "p_value": round(float(p_value), 6),
            "samples": len(recent_predictions),
            "threshold": threshold,
        }

    def accuracy_report(
        self,
        model_name: str,
        predictions: list[float],
        actuals: list[float],
    ) -> dict:
        if not predictions or not actuals:
            return {"model_name": model_name, "status": "no_data"}

        preds = np.array(predictions)
        acts = np.array(actuals)

        # Classification metrics (binary)
        if set(acts).issubset({0, 1, 0.0, 1.0}):
            pred_binary = (preds >= 0.5).astype(int)
            act_binary = acts.astype(int)
            tp = ((pred_binary == 1) & (act_binary == 1)).sum()
            fp = ((pred_binary == 1) & (act_binary == 0)).sum()
            tn = ((pred_binary == 0) & (act_binary == 0)).sum()
            fn = ((pred_binary == 0) & (act_binary == 1)).sum()
            total = tp + fp + tn + fn

            accuracy = (tp + tn) / max(total, 1)
            precision = tp / max(tp + fp, 1)
            recall = tp / max(tp + fn, 1)
            f1 = 2 * precision * recall / max(precision + recall, 0.001)

            try:
                from sklearn.metrics import roc_auc_score
                auc = roc_auc_score(act_binary, preds)
            except Exception:
                auc = 0.0

            report = {
                "model_name": model_name,
                "type": "classification",
                "samples": int(total),
                "accuracy": round(float(accuracy), 4),
                "precision": round(float(precision), 4),
                "recall": round(float(recall), 4),
                "f1_score": round(float(f1), 4),
                "auc": round(float(auc), 4),
                "confusion_matrix": {"tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn)},
            }
        else:
            # Regression metrics
            mse = float(np.mean((preds - acts) ** 2))
            rmse = float(np.sqrt(mse))
            mae = float(np.mean(np.abs(preds - acts)))
            mape = float(np.mean(np.abs((acts - preds) / np.maximum(np.abs(acts), 1)))) * 100

            report = {
                "model_name": model_name,
                "type": "regression",
                "samples": len(preds),
                "rmse": round(rmse, 4),
                "mae": round(mae, 4),
                "mape": round(mape, 2),
            }

        self._accuracy_history[model_name].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **{k: v for k, v in report.items() if k != "confusion_matrix"},
        })
        return report

    def should_retrain(self, model_name: str) -> tuple[bool, str]:
        history = self._accuracy_history.get(model_name, [])
        if not history:
            return False, "No accuracy history available"

        latest = history[-1]
        thresholds = self._thresholds.get(model_name, {})

        # Check AUC threshold
        if "auc" in latest and "min_auc" in thresholds:
            if latest["auc"] < thresholds["min_auc"]:
                return True, f"AUC {latest['auc']} below threshold {thresholds['min_auc']}"

        # Check RMSE threshold
        if "rmse" in latest and "max_rmse" in thresholds:
            if latest["rmse"] > thresholds["max_rmse"]:
                return True, f"RMSE {latest['rmse']} above threshold {thresholds['max_rmse']}"

        # Check for degradation trend
        if len(history) >= 3:
            key = "auc" if "auc" in latest else "rmse" if "rmse" in latest else None
            if key:
                recent = [h.get(key, 0) for h in history[-3:]]
                if key == "auc" and all(recent[i] > recent[i + 1] for i in range(len(recent) - 1)):
                    return True, f"{key} declining: {recent}"
                if key == "rmse" and all(recent[i] < recent[i + 1] for i in range(len(recent) - 1)):
                    return True, f"{key} increasing: {recent}"

        return False, "Model performance within acceptable range"

    def get_status(self) -> dict:
        status = {}
        for model_name in set(list(self._predictions.keys()) + list(self._accuracy_history.keys())):
            history = self._accuracy_history.get(model_name, [])
            preds = self._predictions.get(model_name, [])
            should, reason = self.should_retrain(model_name)
            status[model_name] = {
                "total_predictions_logged": len(preds),
                "accuracy_checks": len(history),
                "latest_metrics": history[-1] if history else None,
                "should_retrain": should,
                "retrain_reason": reason,
                "last_retrain": self._last_retrain.get(model_name, {}).isoformat()
                if model_name in self._last_retrain else None,
            }
        return status
