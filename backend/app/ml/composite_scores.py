"""
Composite Score Engine
========================
Calculates multi-signal composite scores from individual model outputs.
No training required — pure calculation logic.

Usage:
    from app.ml.composite_scores import CompositeScoreEngine
    engine = CompositeScoreEngine()
    value = engine.claim_expected_net_revenue(0.15, 5000, 30)
    health = engine.payer_health_score(...)
"""

from __future__ import annotations

import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


class CompositeScoreEngine:
    """Calculate composite scores from multiple model outputs."""

    @staticmethod
    def claim_expected_net_revenue(
        denial_probability: float,
        expected_payment: float,
        adtp_days: float,
    ) -> dict:
        """PR-X01: Claim-level expected net revenue."""
        acceptance_prob = 1.0 - denial_probability
        expected_revenue = acceptance_prob * expected_payment
        from datetime import date, timedelta
        expected_date = date.today() + timedelta(days=int(adtp_days))

        if denial_probability >= 0.70:
            risk = "CRITICAL"
        elif denial_probability >= 0.40:
            risk = "HIGH"
        elif denial_probability >= 0.20:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        return {
            "expected_revenue": round(expected_revenue, 2),
            "expected_payment_date": str(expected_date),
            "acceptance_probability": round(acceptance_prob, 4),
            "denial_probability": round(denial_probability, 4),
            "risk_level": risk,
            "billed_amount": expected_payment,
            "revenue_at_risk": round(denial_probability * expected_payment, 2),
        }

    @staticmethod
    def payer_health_score(
        adtp_trend: float = 0,
        denial_trend: float = 0,
        payment_consistency: float = 1.0,
        underpayment_rate: float = 0,
        denial_rate: float = 0.10,
    ) -> dict:
        """PR-X02: Payer health score (0-100)."""
        # Higher is healthier
        adtp_component = max(0, min(100, 80 - adtp_trend * 200))       # 25%
        denial_component = max(0, min(100, 100 - denial_rate * 300))   # 25%
        consistency_component = payment_consistency * 100                # 20%
        underpay_component = max(0, min(100, 100 - underpayment_rate * 500))  # 15%
        trend_component = max(0, min(100, 80 - denial_trend * 500))    # 15%

        score = (
            adtp_component * 0.25
            + denial_component * 0.25
            + consistency_component * 0.20
            + underpay_component * 0.15
            + trend_component * 0.15
        )

        if score >= 80:
            status = "GREEN"
        elif score >= 50:
            status = "YELLOW"
        else:
            status = "RED"

        return {
            "score": round(score, 1),
            "status": status,
            "components": {
                "adtp_health": round(adtp_component, 1),
                "denial_health": round(denial_component, 1),
                "payment_consistency": round(consistency_component, 1),
                "underpayment_health": round(underpay_component, 1),
                "trend_health": round(trend_component, 1),
            },
        }

    @staticmethod
    def collections_priority_score(
        propensity_to_pay: float,
        balance: float,
        aging_days: int,
        effort_estimate: float = 1.0,
    ) -> dict:
        """PR-X04: Collections priority score."""
        expected_value = propensity_to_pay * balance
        urgency = min(1.0, aging_days / 180)
        efficiency = expected_value / max(effort_estimate, 0.1)
        score = min(100, max(0, (expected_value / 100) * (1 + urgency) / max(effort_estimate, 0.1)))

        if score >= 75:
            priority = "CRITICAL"
        elif score >= 50:
            priority = "HIGH"
        elif score >= 25:
            priority = "MEDIUM"
        else:
            priority = "LOW"

        return {
            "score": round(score, 1),
            "priority": priority,
            "expected_value": round(expected_value, 2),
            "urgency_factor": round(urgency, 2),
            "efficiency_ratio": round(efficiency, 2),
        }

    @staticmethod
    def org_revenue_health_score(
        ncr: float = 0.95,
        denial_rate: float = 0.10,
        days_in_ar: float = 35,
        cost_to_collect: float = 0.05,
        first_pass_rate: float = 0.90,
    ) -> dict:
        """PR-X07: Organizational revenue health score (0-100)."""
        ncr_component = min(100, ncr * 110)                           # 25%
        denial_component = max(0, min(100, 100 - denial_rate * 400))  # 20%
        ar_component = max(0, min(100, 100 - (days_in_ar - 25) * 3)) # 20%
        cost_component = max(0, min(100, 100 - cost_to_collect * 1000))  # 15%
        fpr_component = first_pass_rate * 100                          # 10%
        margin = 100 - (denial_rate * 200 + cost_to_collect * 500)    # 10%

        score = (
            ncr_component * 0.25
            + denial_component * 0.20
            + ar_component * 0.20
            + cost_component * 0.15
            + fpr_component * 0.10
            + max(0, min(100, margin)) * 0.10
        )

        if score >= 80:
            grade = "A"
        elif score >= 70:
            grade = "B"
        elif score >= 60:
            grade = "C"
        elif score >= 50:
            grade = "D"
        else:
            grade = "F"

        return {
            "score": round(score, 1),
            "grade": grade,
            "components": {
                "net_collection_rate": round(ncr_component, 1),
                "denial_management": round(denial_component, 1),
                "ar_efficiency": round(ar_component, 1),
                "cost_efficiency": round(cost_component, 1),
                "first_pass_rate": round(fpr_component, 1),
            },
        }
