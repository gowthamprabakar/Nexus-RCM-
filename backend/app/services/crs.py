"""
Claim Readiness Score (CRS) Engine — Layer 1: Prevention
=========================================================
Reads pre-computed CRS component points from the claims table and derives:
  - Human-readable issues list with auto-fix suggestions
  - CRS validation status: Passed | Review Required | Blocked
  - Batch readiness flag

Component breakdown (max 100 pts):
  Eligibility      25 pts  — patient coverage active, in-network
  Authorization    25 pts  — valid prior auth on file, not expired
  Coding           20 pts  — CPT/ICD-10 present, no modifier conflicts
  COB              10 pts  — primary coverage verified, COB order correct
  Documentation    10 pts  — required fields complete for claim type
  EVV              10 pts  — verified EVV visit (home health only)
"""
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Issue Rules Catalog
# ---------------------------------------------------------------------------
RULES = {
    "R-ELIG-001": {
        "category": "Eligibility",
        "message": "Patient coverage inactive or not verified for date of service",
        "suggested_fix": "Re-verify eligibility via 270/271 — check effective/term dates",
        "auto_fix_available": False,
        "confidence": 0.95,
    },
    "R-AUTH-001": {
        "category": "Authorization",
        "message": "No valid prior authorization found for this payer and service",
        "suggested_fix": "Obtain prior auth or verify auth number in payer portal",
        "auto_fix_available": False,
        "confidence": 0.93,
    },
    "R-CODE-001": {
        "category": "Coding",
        "message": "Missing CPT code or incompatible modifier on claim line",
        "suggested_fix": "Review claim lines — confirm CPT + modifier combination is valid",
        "auto_fix_available": True,
        "confidence": 0.88,
    },
    "R-COB-001": {
        "category": "COB",
        "message": "Primary coverage not on file or coordination of benefits order incorrect",
        "suggested_fix": "Verify COB order — update primary/secondary payer in patient record",
        "auto_fix_available": False,
        "confidence": 0.91,
    },
    "R-DOC-001": {
        "category": "Documentation",
        "message": "Required claim fields missing — DOS, place of service, or bill type",
        "suggested_fix": "Complete missing header fields before submission",
        "auto_fix_available": True,
        "confidence": 0.82,
    },
    "R-EVV-001": {
        "category": "EVV",
        "message": "No verified EVV visit found for this home health claim",
        "suggested_fix": "Confirm caregiver clock-in/out recorded in EVV aggregator",
        "auto_fix_available": False,
        "confidence": 0.97,
    },
}


@dataclass
class CRSIssue:
    issue_id:           str
    rule_id:            str
    category:           str
    message:            str
    suggested_fix:      str
    auto_fix_available: bool
    confidence_score:   float


@dataclass
class CRSResult:
    claim_id:           str
    crs_score:          int
    crs_passed:         bool
    status:             str          # Passed | Review Required | Blocked
    batch_ready:        bool
    issues:             List[CRSIssue] = field(default_factory=list)

    # Component scores
    eligibility_pts:    int = 0
    auth_pts:           int = 0
    coding_pts:         int = 0
    cob_pts:            int = 0
    documentation_pts:  int = 0
    evv_pts:            int = 0


# ---------------------------------------------------------------------------
# Status mapping
# ---------------------------------------------------------------------------
def _status_from_score(score: int) -> str:
    if score >= 80:
        return "Passed"
    if score >= 60:
        return "Review Required"
    return "Blocked"


# ---------------------------------------------------------------------------
# Core — derive issues from stored component pts
# ---------------------------------------------------------------------------
def derive_issues(
    claim_id: str,
    eligibility_pts: Optional[int],
    auth_pts: Optional[int],
    coding_pts: Optional[int],
    cob_pts: Optional[int],
    documentation_pts: Optional[int],
    evv_pts: Optional[int],
    claim_type: Optional[str] = None,
) -> List[CRSIssue]:
    """
    Given stored CRS component pts, return a list of CRSIssue objects
    for any component that scored 0.
    """
    issues: List[CRSIssue] = []

    if not eligibility_pts:
        r = RULES["R-ELIG-001"]
        issues.append(CRSIssue(
            issue_id=f"{claim_id}-ELIG",
            rule_id="R-ELIG-001",
            category=r["category"],
            message=r["message"],
            suggested_fix=r["suggested_fix"],
            auto_fix_available=r["auto_fix_available"],
            confidence_score=r["confidence"],
        ))

    if not auth_pts:
        r = RULES["R-AUTH-001"]
        issues.append(CRSIssue(
            issue_id=f"{claim_id}-AUTH",
            rule_id="R-AUTH-001",
            category=r["category"],
            message=r["message"],
            suggested_fix=r["suggested_fix"],
            auto_fix_available=r["auto_fix_available"],
            confidence_score=r["confidence"],
        ))

    if not coding_pts:
        r = RULES["R-CODE-001"]
        issues.append(CRSIssue(
            issue_id=f"{claim_id}-CODE",
            rule_id="R-CODE-001",
            category=r["category"],
            message=r["message"],
            suggested_fix=r["suggested_fix"],
            auto_fix_available=r["auto_fix_available"],
            confidence_score=r["confidence"],
        ))

    if not cob_pts:
        r = RULES["R-COB-001"]
        issues.append(CRSIssue(
            issue_id=f"{claim_id}-COB",
            rule_id="R-COB-001",
            category=r["category"],
            message=r["message"],
            suggested_fix=r["suggested_fix"],
            auto_fix_available=r["auto_fix_available"],
            confidence_score=r["confidence"],
        ))

    if not documentation_pts:
        r = RULES["R-DOC-001"]
        issues.append(CRSIssue(
            issue_id=f"{claim_id}-DOC",
            rule_id="R-DOC-001",
            category=r["category"],
            message=r["message"],
            suggested_fix=r["suggested_fix"],
            auto_fix_available=r["auto_fix_available"],
            confidence_score=r["confidence"],
        ))

    # EVV only applies to home health / INSTITUTIONAL claims
    if evv_pts is not None and not evv_pts and claim_type == "INSTITUTIONAL":
        r = RULES["R-EVV-001"]
        issues.append(CRSIssue(
            issue_id=f"{claim_id}-EVV",
            rule_id="R-EVV-001",
            category=r["category"],
            message=r["message"],
            suggested_fix=r["suggested_fix"],
            auto_fix_available=r["auto_fix_available"],
            confidence_score=r["confidence"],
        ))

    return issues


def build_crs_result(claim) -> CRSResult:
    """
    Build a CRSResult from a SQLAlchemy Claim ORM row.
    All component pts are pre-computed in the DB from the seed/ETL layer.
    """
    score    = claim.crs_score or 0
    passed   = bool(claim.crs_passed)
    status   = _status_from_score(score)

    issues = derive_issues(
        claim_id=claim.claim_id,
        eligibility_pts=claim.crs_eligibility_pts,
        auth_pts=claim.crs_auth_pts,
        coding_pts=claim.crs_coding_pts,
        cob_pts=claim.crs_cob_pts,
        documentation_pts=claim.crs_documentation_pts,
        evv_pts=claim.crs_evv_pts,
        claim_type=claim.claim_type,
    )

    return CRSResult(
        claim_id=claim.claim_id,
        crs_score=score,
        crs_passed=passed,
        status=status,
        batch_ready=passed,
        issues=issues,
        eligibility_pts=claim.crs_eligibility_pts or 0,
        auth_pts=claim.crs_auth_pts or 0,
        coding_pts=claim.crs_coding_pts or 0,
        cob_pts=claim.crs_cob_pts or 0,
        documentation_pts=claim.crs_documentation_pts or 0,
        evv_pts=claim.crs_evv_pts or 0,
    )
