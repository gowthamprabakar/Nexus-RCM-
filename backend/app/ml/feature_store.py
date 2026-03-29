"""Feature extraction layer — pulls raw data from PostgreSQL and returns
feature DataFrames ready for model training / inference.

All queries use ``sqlalchemy.text`` for performance and explicit control over
the SQL that hits the database.
"""

from __future__ import annotations

import logging
from typing import Sequence

import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Denial prediction features
# ---------------------------------------------------------------------------

_DENIAL_FEATURES_SQL = text("""
SELECT
    c.claim_id,

    -- Payer-level signals
    pm.denial_rate                                  AS payer_denial_rate,
    pm.adtp_days                                    AS payer_adtp_days,

    -- CRS score
    c.crs_score,
    CASE WHEN c.crs_passed THEN 1 ELSE 0 END       AS crs_passed_flag,

    -- Financial
    c.total_charges,

    -- Prior-auth
    CASE WHEN pa.auth_id IS NOT NULL THEN 1 ELSE 0 END AS has_prior_auth,
    CASE
        WHEN pa.status = 'approved'  THEN 1
        WHEN pa.status = 'denied'    THEN 2
        WHEN pa.status = 'pending'   THEN 3
        WHEN pa.status = 'expired'   THEN 4
        ELSE 0
    END                                             AS prior_auth_status_encoded,
    CASE
        WHEN pa.expiry_date IS NOT NULL AND pa.expiry_date < c.date_of_service
        THEN 1 ELSE 0
    END                                             AS prior_auth_expired_before_dos,

    -- Eligibility
    CASE
        WHEN e.subscriber_status = 'active'   THEN 1
        WHEN e.subscriber_status = 'inactive' THEN 2
        WHEN e.subscriber_status = 'termed'   THEN 3
        ELSE 0
    END                                             AS eligibility_status_encoded,

    -- Claim-line details
    cl_agg.claim_line_count,
    cl_agg.has_modifier,
    cl_agg.total_line_charges,
    cl_agg.distinct_cpt_count,

    -- Timing
    EXTRACT(EPOCH FROM (c.submission_date - c.date_of_service)) / 86400
                                                    AS days_to_submit,

    -- Provider denial rate over last 90 days (correlated subquery)
    COALESCE(prov_90.provider_denial_rate_90d, 0)   AS provider_denial_rate_90d,

    -- Denial-category encoded (for claims that already have a denial row)
    CASE
        WHEN d.denial_category = 'clinical'      THEN 1
        WHEN d.denial_category = 'administrative' THEN 2
        WHEN d.denial_category = 'eligibility'   THEN 3
        WHEN d.denial_category = 'authorization' THEN 4
        WHEN d.denial_category = 'coding'        THEN 5
        ELSE 0
    END                                             AS denial_category_encoded,

    -- Root-cause confidence
    COALESCE(rca.confidence_score, 0)               AS rca_confidence_score,
    COALESCE(rca.financial_impact, 0)               AS rca_financial_impact,

    -- Provider specialty encoded
    CASE
        WHEN prov.specialty = 'cardiology'       THEN 1
        WHEN prov.specialty = 'orthopedics'      THEN 2
        WHEN prov.specialty = 'oncology'         THEN 3
        WHEN prov.specialty = 'radiology'        THEN 4
        WHEN prov.specialty = 'general_practice' THEN 5
        ELSE 0
    END                                             AS specialty_encoded,

    -- Day-of-week / month features (cyclical-friendly integers)
    EXTRACT(DOW   FROM c.date_of_service)::int      AS dos_day_of_week,
    EXTRACT(MONTH FROM c.date_of_service)::int      AS dos_month

FROM claims c
LEFT JOIN payer_master pm    ON pm.payer_id    = c.payer_id
LEFT JOIN providers prov     ON prov.provider_id = c.provider_id
LEFT JOIN prior_auth pa      ON pa.claim_id    = c.claim_id
LEFT JOIN LATERAL (
    SELECT
        e2.subscriber_status
    FROM eligibility_271 e2
    WHERE e2.patient_id = c.patient_id
      AND e2.payer_id   = c.payer_id
    ORDER BY e2.elig_id DESC
    LIMIT 1
) e ON true
LEFT JOIN LATERAL (
    SELECT
        COUNT(*)::int              AS claim_line_count,
        MAX(CASE WHEN cl.modifier IS NOT NULL AND cl.modifier != '' THEN 1 ELSE 0 END) AS has_modifier,
        COALESCE(SUM(cl.charge_amount), 0) AS total_line_charges,
        COUNT(DISTINCT cl.cpt_code)::int   AS distinct_cpt_count
    FROM claim_lines cl
    WHERE cl.claim_id = c.claim_id
) cl_agg ON true
LEFT JOIN LATERAL (
    SELECT
        CASE WHEN total.cnt = 0 THEN 0
             ELSE denied.cnt::float / total.cnt
        END AS provider_denial_rate_90d
    FROM (
        SELECT COUNT(*)::float AS cnt
        FROM claims c2
        WHERE c2.provider_id = c.provider_id
          AND c2.submission_date >= c.submission_date - INTERVAL '90 days'
          AND c2.submission_date <  c.submission_date
    ) total,
    (
        SELECT COUNT(*)::float AS cnt
        FROM claims c3
        JOIN denials d3 ON d3.claim_id = c3.claim_id
        WHERE c3.provider_id = c.provider_id
          AND c3.submission_date >= c.submission_date - INTERVAL '90 days'
          AND c3.submission_date <  c.submission_date
    ) denied
) prov_90 ON true
LEFT JOIN denials d             ON d.claim_id   = c.claim_id
LEFT JOIN root_cause_analysis rca ON rca.claim_id = c.claim_id
WHERE c.claim_id = ANY(:claim_ids)
""")


_PAYMENT_FEATURES_SQL = text("""
SELECT
    c.claim_id,

    -- Core claim attributes
    c.total_charges,
    c.crs_score,
    CASE WHEN c.crs_passed THEN 1 ELSE 0 END       AS crs_passed_flag,

    -- Payer behaviour
    pm.denial_rate                                  AS payer_denial_rate,
    pm.adtp_days                                    AS payer_adtp_days,

    -- Payment info
    COALESCE(ep.payment_amount, 0)                  AS payment_amount,
    CASE WHEN ep.payment_amount IS NOT NULL THEN 1 ELSE 0 END AS has_payment,
    EXTRACT(EPOCH FROM (ep.payment_date - c.submission_date)) / 86400
                                                    AS days_submission_to_payment,

    -- Denial history for this claim
    CASE WHEN d.denial_id IS NOT NULL THEN 1 ELSE 0 END AS was_denied,
    COALESCE(d.denial_amount, 0)                    AS denial_amount,

    -- Claim-line complexity
    cl_agg.claim_line_count,
    cl_agg.has_modifier,
    cl_agg.total_line_charges,
    cl_agg.distinct_cpt_count,

    -- Timing
    EXTRACT(EPOCH FROM (c.submission_date - c.date_of_service)) / 86400
                                                    AS days_to_submit,

    -- Provider
    CASE
        WHEN prov.specialty = 'cardiology'       THEN 1
        WHEN prov.specialty = 'orthopedics'      THEN 2
        WHEN prov.specialty = 'oncology'         THEN 3
        WHEN prov.specialty = 'radiology'        THEN 4
        WHEN prov.specialty = 'general_practice' THEN 5
        ELSE 0
    END                                             AS specialty_encoded,

    -- Date features
    EXTRACT(DOW   FROM c.date_of_service)::int      AS dos_day_of_week,
    EXTRACT(MONTH FROM c.date_of_service)::int      AS dos_month

FROM claims c
LEFT JOIN payer_master pm   ON pm.payer_id      = c.payer_id
LEFT JOIN providers prov    ON prov.provider_id  = c.provider_id
LEFT JOIN era_payments ep   ON ep.claim_id       = c.claim_id
LEFT JOIN denials d         ON d.claim_id        = c.claim_id
LEFT JOIN LATERAL (
    SELECT
        COUNT(*)::int              AS claim_line_count,
        MAX(CASE WHEN cl.modifier IS NOT NULL AND cl.modifier != '' THEN 1 ELSE 0 END) AS has_modifier,
        COALESCE(SUM(cl.charge_amount), 0) AS total_line_charges,
        COUNT(DISTINCT cl.cpt_code)::int   AS distinct_cpt_count
    FROM claim_lines cl
    WHERE cl.claim_id = c.claim_id
) cl_agg ON true
WHERE c.claim_id = ANY(:claim_ids)
""")


_APPEAL_FEATURES_SQL = text("""
SELECT
    a.appeal_id,
    a.denial_id,

    -- Denial context
    d.denial_amount,
    CASE
        WHEN d.denial_category = 'clinical'      THEN 1
        WHEN d.denial_category = 'administrative' THEN 2
        WHEN d.denial_category = 'eligibility'   THEN 3
        WHEN d.denial_category = 'authorization' THEN 4
        WHEN d.denial_category = 'coding'        THEN 5
        ELSE 0
    END                                             AS denial_category_encoded,

    -- Claim context
    c.total_charges,
    c.crs_score,
    CASE WHEN c.crs_passed THEN 1 ELSE 0 END       AS crs_passed_flag,

    -- Payer
    pm.denial_rate                                  AS payer_denial_rate,
    pm.adtp_days                                    AS payer_adtp_days,

    -- Root-cause
    COALESCE(rca.confidence_score, 0)               AS rca_confidence_score,
    COALESCE(rca.financial_impact, 0)               AS rca_financial_impact,
    CASE
        WHEN rca.primary_root_cause = 'missing_info'      THEN 1
        WHEN rca.primary_root_cause = 'coding_error'      THEN 2
        WHEN rca.primary_root_cause = 'eligibility_issue'  THEN 3
        WHEN rca.primary_root_cause = 'auth_missing'       THEN 4
        WHEN rca.primary_root_cause = 'timely_filing'      THEN 5
        ELSE 0
    END                                             AS root_cause_encoded,

    -- Prior auth
    CASE WHEN pa.auth_id IS NOT NULL THEN 1 ELSE 0 END AS has_prior_auth,
    CASE
        WHEN pa.status = 'approved'  THEN 1
        WHEN pa.status = 'denied'    THEN 2
        WHEN pa.status = 'pending'   THEN 3
        WHEN pa.status = 'expired'   THEN 4
        ELSE 0
    END                                             AS prior_auth_status_encoded,

    -- Provider
    CASE
        WHEN prov.specialty = 'cardiology'       THEN 1
        WHEN prov.specialty = 'orthopedics'      THEN 2
        WHEN prov.specialty = 'oncology'         THEN 3
        WHEN prov.specialty = 'radiology'        THEN 4
        WHEN prov.specialty = 'general_practice' THEN 5
        ELSE 0
    END                                             AS specialty_encoded,

    -- Claim-line complexity
    cl_agg.claim_line_count,
    cl_agg.has_modifier,

    -- Timing: days between denial and appeal
    EXTRACT(EPOCH FROM (a.status::timestamp - d.denial_date)) / 86400
                                                    AS days_denial_to_appeal,

    -- Historical appeal success for this payer
    COALESCE(payer_appeal.payer_appeal_success_rate, 0) AS payer_appeal_success_rate,

    -- Appeal outcome (target)
    COALESCE(a.recovered_amount, 0)                 AS recovered_amount,
    CASE WHEN a.status = 'successful' THEN 1 ELSE 0 END AS appeal_successful

FROM appeals a
JOIN denials d              ON d.denial_id      = a.denial_id
JOIN claims c               ON c.claim_id       = d.claim_id
LEFT JOIN payer_master pm   ON pm.payer_id      = c.payer_id
LEFT JOIN providers prov    ON prov.provider_id  = c.provider_id
LEFT JOIN root_cause_analysis rca ON rca.denial_id = d.denial_id
LEFT JOIN prior_auth pa     ON pa.claim_id      = c.claim_id
LEFT JOIN LATERAL (
    SELECT
        COUNT(*)::int AS claim_line_count,
        MAX(CASE WHEN cl.modifier IS NOT NULL AND cl.modifier != '' THEN 1 ELSE 0 END) AS has_modifier
    FROM claim_lines cl
    WHERE cl.claim_id = c.claim_id
) cl_agg ON true
LEFT JOIN LATERAL (
    SELECT
        CASE WHEN COUNT(*) = 0 THEN 0
             ELSE SUM(CASE WHEN a2.status = 'successful' THEN 1 ELSE 0 END)::float / COUNT(*)
        END AS payer_appeal_success_rate
    FROM appeals a2
    JOIN denials d2 ON d2.denial_id = a2.denial_id
    JOIN claims c2  ON c2.claim_id  = d2.claim_id
    WHERE c2.payer_id = c.payer_id
      AND a2.appeal_id != a.appeal_id
) payer_appeal ON true
WHERE a.denial_id = ANY(:denial_ids)
""")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_denial_features(
    db: AsyncSession,
    claim_ids: Sequence[int],
) -> pd.DataFrame:
    """Extract denial-prediction features for a batch of claim IDs.

    Returns a DataFrame with 20+ numeric / encoded features aligned to
    ``claim_id``.  Missing values are forward-filled with 0 where
    semantically appropriate.
    """
    if not claim_ids:
        logger.warning("get_denial_features called with empty claim_ids")
        return pd.DataFrame()

    result = await db.execute(_DENIAL_FEATURES_SQL, {"claim_ids": list(claim_ids)})
    rows = result.mappings().all()

    if not rows:
        logger.warning("No denial features found for %d claim_ids", len(claim_ids))
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.fillna(0)
    logger.info("Extracted denial features: %d rows x %d cols", *df.shape)
    return df


async def get_payment_features(
    db: AsyncSession,
    claim_ids: Sequence[int],
) -> pd.DataFrame:
    """Extract payment-delay prediction features for a batch of claim IDs."""
    if not claim_ids:
        logger.warning("get_payment_features called with empty claim_ids")
        return pd.DataFrame()

    result = await db.execute(_PAYMENT_FEATURES_SQL, {"claim_ids": list(claim_ids)})
    rows = result.mappings().all()

    if not rows:
        logger.warning("No payment features found for %d claim_ids", len(claim_ids))
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.fillna(0)
    logger.info("Extracted payment features: %d rows x %d cols", *df.shape)
    return df


async def get_appeal_features(
    db: AsyncSession,
    denial_ids: Sequence[int],
) -> pd.DataFrame:
    """Extract appeal-success prediction features for a batch of denial IDs."""
    if not denial_ids:
        logger.warning("get_appeal_features called with empty denial_ids")
        return pd.DataFrame()

    result = await db.execute(_APPEAL_FEATURES_SQL, {"denial_ids": list(denial_ids)})
    rows = result.mappings().all()

    if not rows:
        logger.warning("No appeal features found for %d denial_ids", len(denial_ids))
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.fillna(0)
    logger.info("Extracted appeal features: %d rows x %d cols", *df.shape)
    return df
