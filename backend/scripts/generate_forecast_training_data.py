"""
Generate 24 months of synthetic training data for the NEXUS RCM forecasting engine.
Creates and populates:
  - forecast_training_weekly  (50 payers x 104 weeks = 5,200 rows)
  - forecast_training_daily   (50 payers x ~730 days = ~36,500 rows)
"""

import asyncio
import sys
import os
import random
import math
from datetime import date, timedelta, datetime
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.db.session import AsyncSessionLocal

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

random.seed(42)

# Current date anchor
END_DATE = date(2026, 3, 27)
START_DATE = END_DATE - timedelta(days=730)  # ~24 months back

# Federal holidays (month, day) — fixed-date ones
FIXED_HOLIDAYS = {
    (1, 1),    # New Year
    (7, 4),    # Independence Day
    (11, 11),  # Veterans Day
    (12, 25),  # Christmas
}


def _nth_weekday(year, month, weekday, n):
    """Return the date of the nth occurrence of weekday in month/year."""
    first = date(year, month, 1)
    # weekday: 0=Mon
    offset = (weekday - first.weekday()) % 7
    d = first + timedelta(days=offset + 7 * (n - 1))
    return d


def _last_weekday(year, month, weekday):
    """Return the last occurrence of weekday in month/year."""
    if month == 12:
        last_day = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(year, month + 1, 1) - timedelta(days=1)
    offset = (last_day.weekday() - weekday) % 7
    return last_day - timedelta(days=offset)


def get_federal_holidays(year):
    """Return set of federal holiday dates for a given year."""
    holidays = set()
    # Fixed
    for m, d in FIXED_HOLIDAYS:
        holidays.add(date(year, m, d))
    # MLK Day: 3rd Monday of January
    holidays.add(_nth_weekday(year, 1, 0, 3))
    # Presidents Day: 3rd Monday of February
    holidays.add(_nth_weekday(year, 2, 0, 3))
    # Memorial Day: last Monday of May
    holidays.add(_last_weekday(year, 5, 0))
    # Labor Day: 1st Monday of September
    holidays.add(_nth_weekday(year, 9, 0, 1))
    # Columbus Day: 2nd Monday of October
    holidays.add(_nth_weekday(year, 10, 0, 2))
    # Thanksgiving: 4th Thursday of November
    holidays.add(_nth_weekday(year, 11, 3, 4))
    return holidays


# Pre-compute all holidays in range
ALL_HOLIDAYS = set()
for y in range(START_DATE.year, END_DATE.year + 1):
    ALL_HOLIDAYS |= get_federal_holidays(y)

# Holiday weeks (week containing a federal holiday)
HOLIDAY_WEEK_STARTS = set()
for h in ALL_HOLIDAYS:
    # Monday of that week
    ws = h - timedelta(days=h.weekday())
    HOLIDAY_WEEK_STARTS.add(ws)

# Payer group config: (base_charges_min, base_charges_max, adtp_base_range, adtp_variance)
PAYER_GROUP_CONFIG = {
    "G1_FEDERAL_FFS":        (500_000, 2_000_000, (14, 18), 2),
    "G2_MEDICARE_ADVANTAGE": (500_000, 2_000_000, (14, 18), 2),
    "G3_COMMERCIAL_NATIONAL":(200_000, 800_000,   (28, 35), 5),
    "G4_COMMERCIAL_REGIONAL":(200_000, 800_000,   (28, 35), 5),
    "G5_MANAGED_MEDICAID":   (100_000, 400_000,   (35, 55), 8),
    "G6_STATE_MEDICAID":     (100_000, 400_000,   (35, 55), 8),
    "G7_WORKERS_COMP_AUTO":  (50_000,  200_000,   (45, 90), 12),
    "G8_SELF_PAY_SECONDARY": (30_000,  120_000,   (20, 40), 6),
}

# Monthly seasonality multipliers (1-indexed month)
MONTH_SEASONALITY = {
    1: 0.90,   # Jan low
    2: 0.97,
    3: 1.08,   # Mar high
    4: 1.02,
    5: 1.01,
    6: 0.99,
    7: 0.98,
    8: 1.00,
    9: 1.02,
    10: 1.08,  # Oct high
    11: 0.98,
    12: 0.85,  # Dec low
}

# Weekday payment distribution (Mon-Fri)
WEEKDAY_DIST = {
    0: 0.15,  # Monday
    1: 0.22,  # Tuesday
    2: 0.25,  # Wednesday
    3: 0.23,  # Thursday
    4: 0.15,  # Friday
}

# Average claim amounts by payer group
AVG_CLAIM_AMOUNT = {
    "G1_FEDERAL_FFS": 350,
    "G2_MEDICARE_ADVANTAGE": 400,
    "G3_COMMERCIAL_NATIONAL": 550,
    "G4_COMMERCIAL_REGIONAL": 500,
    "G5_MANAGED_MEDICAID": 280,
    "G6_STATE_MEDICAID": 250,
    "G7_WORKERS_COMP_AUTO": 650,
    "G8_SELF_PAY_SECONDARY": 200,
}


def is_last_3_business_days(d):
    """Check if date is within the last 3 business days of its month."""
    if d.month == 12:
        next_month_1 = date(d.year + 1, 1, 1)
    else:
        next_month_1 = date(d.year, d.month + 1, 1)
    last_day = next_month_1 - timedelta(days=1)
    # Count business days from last_day backwards
    biz_count = 0
    check = last_day
    while biz_count < 3:
        if check.weekday() < 5 and check not in ALL_HOLIDAYS:
            biz_count += 1
            if check == d:
                return True
        check -= timedelta(days=1)
        if check < d:
            break
    return False


# ---------------------------------------------------------------------------
# DDL
# ---------------------------------------------------------------------------

CREATE_WEEKLY = """
CREATE TABLE IF NOT EXISTS forecast_training_weekly (
    id SERIAL PRIMARY KEY,
    week_start DATE NOT NULL,
    payer_id VARCHAR NOT NULL,
    payer_name VARCHAR NOT NULL,
    gross_charges NUMERIC NOT NULL,
    expected_payments NUMERIC NOT NULL,
    actual_payments NUMERIC NOT NULL,
    denial_count INTEGER NOT NULL,
    denial_amount NUMERIC NOT NULL,
    claims_submitted INTEGER NOT NULL,
    claims_paid INTEGER NOT NULL,
    avg_adtp NUMERIC NOT NULL,
    collection_rate NUMERIC NOT NULL
);
"""

CREATE_DAILY = """
CREATE TABLE IF NOT EXISTS forecast_training_daily (
    id SERIAL PRIMARY KEY,
    payment_date DATE NOT NULL,
    payer_id VARCHAR NOT NULL,
    payer_name VARCHAR NOT NULL,
    payment_amount NUMERIC NOT NULL,
    payment_count INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    is_month_end BOOLEAN NOT NULL,
    is_holiday BOOLEAN NOT NULL
);
"""


# ---------------------------------------------------------------------------
# Main generation
# ---------------------------------------------------------------------------

async def main():
    async with AsyncSessionLocal() as session:
        # 1. Create tables
        await session.execute(text(CREATE_WEEKLY))
        await session.execute(text(CREATE_DAILY))
        await session.commit()
        print("[OK] Tables created / verified.")

        # Clear old data
        await session.execute(text("TRUNCATE forecast_training_weekly RESTART IDENTITY"))
        await session.execute(text("TRUNCATE forecast_training_daily RESTART IDENTITY"))
        await session.commit()
        print("[OK] Old data cleared.")

        # 2. Fetch payers
        result = await session.execute(
            text("SELECT payer_id, payer_name, payer_group, denial_rate, adtp_days FROM payer_master ORDER BY payer_id")
        )
        payers = result.fetchall()
        print(f"[OK] Loaded {len(payers)} payers from payer_master.")

        if not payers:
            print("[ERROR] No payers found. Aborting.")
            return

        # 3. Generate week starts (Mondays)
        first_monday = START_DATE - timedelta(days=START_DATE.weekday())  # align to Monday
        week_starts = []
        ws = first_monday
        while ws <= END_DATE:
            week_starts.append(ws)
            ws += timedelta(days=7)
        total_weeks = len(week_starts)
        print(f"[OK] Generating {total_weeks} weeks from {week_starts[0]} to {week_starts[-1]}.")

        # 4. Generate day list
        all_days = []
        d = START_DATE
        while d <= END_DATE:
            all_days.append(d)
            d += timedelta(days=1)
        print(f"[OK] Generating {len(all_days)} days from {START_DATE} to {END_DATE}.")

        # ------- WEEKLY DATA -------
        weekly_rows = []
        daily_rows = []
        sample_weekly = {}  # payer_id -> first 2 rows for display
        sample_daily_week = {}  # week_start -> daily rows for 1 payer

        for payer_id, payer_name, payer_group, denial_rate, adtp_days_base in payers:
            cfg = PAYER_GROUP_CONFIG.get(payer_group, PAYER_GROUP_CONFIG["G3_COMMERCIAL_NATIONAL"])
            base_min, base_max, adtp_range, adtp_var = cfg
            # Stable base for this payer
            payer_base_charges = random.uniform(base_min, base_max)
            avg_claim = AVG_CLAIM_AMOUNT.get(payer_group, 400)
            # ADTP trend: some groups increase over time
            adtp_increasing = payer_group in ("G3_COMMERCIAL_NATIONAL", "G4_COMMERCIAL_REGIONAL",
                                               "G5_MANAGED_MEDICAID", "G6_STATE_MEDICAID")

            for wi, ws in enumerate(week_starts):
                quarter_idx = wi // 13  # 0-based quarter number
                month = ws.month

                # Base charges with quarterly growth (+2% per quarter)
                growth = 1.0 + 0.02 * quarter_idx
                charges = payer_base_charges * growth

                # Monthly seasonality
                charges *= MONTH_SEASONALITY.get(month, 1.0)

                # Weekly noise ±15%
                charges *= random.uniform(0.85, 1.15)

                # Holiday week: -30%
                if ws in HOLIDAY_WEEK_STARTS:
                    charges *= 0.70

                charges = round(charges, 2)

                # Expected payments
                expected = round(charges * (1 - denial_rate), 2)

                # Actual payments (slight underpayment)
                actual = round(expected * (0.92 + random.random() * 0.08), 2)

                # Claims submitted
                claims_submitted = max(1, int(charges / avg_claim * random.uniform(0.9, 1.1)))

                # Claims paid
                claims_paid = max(0, int(claims_submitted * (1 - denial_rate) * random.uniform(0.95, 1.05)))
                claims_paid = min(claims_paid, claims_submitted)

                # Denial count & amount
                denial_count = claims_submitted - claims_paid
                denial_amount = round(charges * denial_rate * random.uniform(0.85, 1.15), 2)

                # ADTP
                adtp_trend = 0
                if adtp_increasing:
                    adtp_trend = quarter_idx * 0.5  # +0.5 days per quarter
                avg_adtp = round(adtp_days_base + adtp_trend + random.uniform(-adtp_var, adtp_var), 1)
                avg_adtp = max(5, avg_adtp)

                # Collection rate
                collection_rate = round(actual / expected * 100, 2) if expected > 0 else 0

                weekly_rows.append((
                    ws, payer_id, payer_name,
                    charges, expected, actual,
                    denial_count, denial_amount,
                    claims_submitted, claims_paid,
                    avg_adtp, collection_rate
                ))

                # Keep sample
                if payer_id not in sample_weekly:
                    sample_weekly[payer_id] = []
                if len(sample_weekly[payer_id]) < 2:
                    sample_weekly[payer_id].append({
                        "week_start": str(ws),
                        "gross_charges": charges,
                        "expected": expected,
                        "actual": actual,
                        "denials": denial_count,
                        "collection_rate": collection_rate,
                    })

                # ------- DAILY DATA for this payer/week -------
                week_days_in_range = []
                for offset in range(7):
                    day = ws + timedelta(days=offset)
                    if day < START_DATE or day > END_DATE:
                        continue
                    week_days_in_range.append(day)

                for day in week_days_in_range:
                    dow = day.weekday()
                    is_hol = day in ALL_HOLIDAYS
                    is_me = is_last_3_business_days(day)

                    if dow >= 5 or is_hol:
                        # Weekend or holiday: $0
                        daily_rows.append((
                            day, payer_id, payer_name,
                            0.0, 0, dow, is_me, is_hol
                        ))
                    else:
                        # Distribute weekly actual across weekdays
                        base_pct = WEEKDAY_DIST[dow]
                        payment = actual * base_pct
                        # Daily noise ±10%
                        payment *= random.uniform(0.90, 1.10)
                        # Month-end spike
                        if is_me:
                            payment *= 1.40
                        payment = round(payment, 2)

                        # Payment count proportional
                        pmt_count = max(1, int(claims_paid * base_pct * random.uniform(0.85, 1.15)))

                        daily_rows.append((
                            day, payer_id, payer_name,
                            payment, pmt_count, dow, is_me, is_hol or dow >= 5
                        ))

                    # Sample daily for first payer, first full week
                    if payer_id == payers[0][0] and ws == week_starts[2]:
                        if ws not in sample_daily_week:
                            sample_daily_week[ws] = []
                        sample_daily_week[ws].append({
                            "date": str(day),
                            "dow": dow,
                            "amount": daily_rows[-1][3],
                            "count": daily_rows[-1][4],
                            "is_holiday": is_hol,
                            "is_month_end": is_me,
                        })

        print(f"[OK] Generated {len(weekly_rows)} weekly rows, {len(daily_rows)} daily rows.")

        # ------- BULK INSERT -------
        print("[...] Inserting weekly data...")
        BATCH = 1000
        for i in range(0, len(weekly_rows), BATCH):
            batch = weekly_rows[i:i + BATCH]
            values_parts = []
            for r in batch:
                ws_val, pid, pname, gc, ep, ap, dc, da, cs, cp, adtp, cr = r
                pname_esc = pname.replace("'", "''")
                values_parts.append(
                    f"('{ws_val}','{pid}','{pname_esc}',{gc},{ep},{ap},{dc},{da},{cs},{cp},{adtp},{cr})"
                )
            sql = (
                "INSERT INTO forecast_training_weekly "
                "(week_start, payer_id, payer_name, gross_charges, expected_payments, "
                "actual_payments, denial_count, denial_amount, claims_submitted, claims_paid, "
                "avg_adtp, collection_rate) VALUES " + ",".join(values_parts)
            )
            await session.execute(text(sql))
            if (i // BATCH) % 5 == 0:
                await session.commit()
        await session.commit()
        print(f"[OK] Inserted {len(weekly_rows)} weekly rows.")

        print("[...] Inserting daily data...")
        for i in range(0, len(daily_rows), BATCH):
            batch = daily_rows[i:i + BATCH]
            values_parts = []
            for r in batch:
                pd_val, pid, pname, pa, pc, dow, ime, ih = r
                pname_esc = pname.replace("'", "''")
                ime_str = "TRUE" if ime else "FALSE"
                ih_str = "TRUE" if ih else "FALSE"
                values_parts.append(
                    f"('{pd_val}','{pid}','{pname_esc}',{pa},{pc},{dow},{ime_str},{ih_str})"
                )
            sql = (
                "INSERT INTO forecast_training_daily "
                "(payment_date, payer_id, payer_name, payment_amount, payment_count, "
                "day_of_week, is_month_end, is_holiday) VALUES " + ",".join(values_parts)
            )
            await session.execute(text(sql))
            if (i // BATCH) % 10 == 0:
                await session.commit()
        await session.commit()
        print(f"[OK] Inserted {len(daily_rows)} daily rows.")

        # ------- SUMMARY -------
        print("\n" + "=" * 70)
        print("FORECAST TRAINING DATA — GENERATION SUMMARY")
        print("=" * 70)
        print(f"  Total weekly rows : {len(weekly_rows)}")
        print(f"  Total daily rows  : {len(daily_rows)}")
        print(f"  Date range        : {START_DATE} to {END_DATE}")
        print(f"  Payers            : {len(payers)}")
        print(f"  Weeks             : {total_weeks}")

        # Sample weekly for 3 payers
        sample_payer_ids = [p[0] for p in payers[:3]]
        print(f"\n--- Sample Weekly Data (first 2 weeks for {sample_payer_ids}) ---")
        for pid in sample_payer_ids:
            rows = sample_weekly.get(pid, [])
            pname = next((p[1] for p in payers if p[0] == pid), pid)
            print(f"\n  {pid} ({pname}):")
            for r in rows:
                print(f"    {r['week_start']}  charges=${r['gross_charges']:>12,.2f}  "
                      f"expected=${r['expected']:>12,.2f}  actual=${r['actual']:>12,.2f}  "
                      f"denials={r['denials']:>4}  collection={r['collection_rate']:.1f}%")

        # Sample daily for 1 week
        if sample_daily_week:
            first_ws = list(sample_daily_week.keys())[0]
            print(f"\n--- Sample Daily Distribution (week of {first_ws}, payer {payers[0][0]}) ---")
            for dr in sample_daily_week[first_ws]:
                dow_name = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dr["dow"]]
                flags = ""
                if dr["is_holiday"]:
                    flags += " [HOLIDAY]"
                if dr["is_month_end"]:
                    flags += " [MONTH-END]"
                print(f"    {dr['date']} ({dow_name})  amount=${dr['amount']:>12,.2f}  "
                      f"count={dr['count']:>4}{flags}")

        # Verify row counts from DB
        wc = await session.execute(text("SELECT COUNT(*) FROM forecast_training_weekly"))
        dc = await session.execute(text("SELECT COUNT(*) FROM forecast_training_daily"))
        print(f"\n  DB verification — weekly: {wc.scalar()}, daily: {dc.scalar()}")
        print("=" * 70)
        print("[DONE] Forecast training data generation complete.")


if __name__ == "__main__":
    asyncio.run(main())
