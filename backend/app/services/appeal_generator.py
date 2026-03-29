"""
Appeal Letter Generator — Sprint 2: Layer 2 Detection
======================================================
Generates AI-style appeal letters keyed by denial_category + CARC code.
Provides CARC/RARC lookup, auto-triage routing, and letter quality scoring.
"""

from datetime import date
from typing import Optional

# ── CARC Code Lookup ─────────────────────────────────────────────────────────
CARC_CODES = {
    "1":   {"label": "Deductible",           "description": "Deductible amount",                                         "prefix": "PR"},
    "2":   {"label": "Coinsurance",          "description": "Coinsurance amount",                                        "prefix": "PR"},
    "3":   {"label": "Co-payment",           "description": "Co-payment amount",                                         "prefix": "PR"},
    "4":   {"label": "Coding/Modifier",      "description": "The service/procedure/revenue code is inconsistent with the modifier submitted", "prefix": "CO"},
    "5":   {"label": "Coding/Modifier",      "description": "The procedure code/modifier combination is inconsistent with the place of service", "prefix": "CO"},
    "6":   {"label": "Duplicate",            "description": "The procedure/revenue code is inconsistent with the patient's age", "prefix": "CO"},
    "15":  {"label": "Authorization",        "description": "The authorization number is missing, invalid, or does not apply to the billed services", "prefix": "CO"},
    "16":  {"label": "Missing Info",         "description": "Claim/service lacks information or has submission/billing error(s)", "prefix": "CO"},
    "18":  {"label": "Duplicate",            "description": "Exact duplicate claim/service",                             "prefix": "OA"},
    "22":  {"label": "COB",                  "description": "This care may be covered by another payer per coordination of benefits", "prefix": "OA"},
    "27":  {"label": "Eligibility",          "description": "Expenses incurred after coverage terminated",               "prefix": "PR"},
    "29":  {"label": "Timely Filing",        "description": "The time limit for filing has expired",                     "prefix": "CO"},
    "45":  {"label": "Contractual",          "description": "Charge exceeds fee schedule/maximum allowable",             "prefix": "CO"},
    "50":  {"label": "Medical Necessity",    "description": "These are non-covered services because this is not deemed a medical necessity", "prefix": "CO"},
    "57":  {"label": "Authorization",        "description": "Prior authorization or approval not obtained",              "prefix": "CO"},
    "96":  {"label": "Non-Covered",          "description": "Non-covered charge(s)",                                    "prefix": "CO"},
    "97":  {"label": "Coding/Modifier",      "description": "The benefit for this service is included in the payment/allowance for another service", "prefix": "CO"},
    "167": {"label": "Non-Covered",          "description": "This (these) diagnosis(es) is (are) not covered",          "prefix": "CO"},
    "197": {"label": "Authorization",        "description": "Precertification/authorization/notification/pre-treatment absent", "prefix": "CO"},
    "200": {"label": "Eligibility",          "description": "Expenses incurred during lapse in coverage",               "prefix": "CO"},
    "236": {"label": "COB",                  "description": "This procedure or procedure/modifier combination is not compatible with another procedure on the same day", "prefix": "CO"},
}

RARC_CODES = {
    "N30":  "Patient ineligible for this service.",
    "N115": "This decision was based on a Local Coverage Determination (LCD).",
    "N130": "Consult plan benefit documents/guidelines for information about restrictions for this service.",
    "N386": "This decision was based on a National Coverage Determination.",
    "N522": "Duplicate of a claim processed, or to be processed, as a crossover claim.",
    "M76":  "Missing/incomplete/invalid diagnosis or condition.",
    "MA04": "Secondary payment cannot be considered without the identity of or payment information from the primary payer.",
    "MA130":"Your claim contains incomplete and/or invalid information, and no appeal rights are afforded because the claim is unprocessable.",
    "N340": "Claim lacks the name, strength and dosage of the drug furnished.",
}

# ── Auto-Triage Routing ───────────────────────────────────────────────────────
def get_recommended_action(carc_code: str, denial_category: str) -> str:
    """Map CARC code to recommended action per BA triage matrix."""
    import re
    raw = str(carc_code).upper() if carc_code else ""
    # Strip group-code prefix e.g. "CO-50" → "50", "PR-1" → "1"
    carc = re.sub(r'^(CO|PR|OA|PI|CR)-?', '', raw).lstrip("0") or raw
    routes = {
        "4":   "Correct coding modifier and resubmit via clearinghouse",
        "5":   "Correct procedure/modifier combination and resubmit",
        "97":  "Correct and resubmit — unbundling issue identified",
        "50":  "Submit medical records with clinical justification for medical necessity",
        "167": "Submit clinical documentation supporting diagnosis coverage",
        "15":  "Obtain and submit valid authorization number from payer portal",
        "57":  "Obtain prior authorization retroactively or submit appeal with clinical records",
        "197": "Submit precertification documentation and appeal for retroactive authorization",
        "1":   "Patient responsibility — collect deductible from patient",
        "2":   "Patient responsibility — collect coinsurance from patient",
        "3":   "Patient responsibility — collect co-payment from patient",
        "27":  "Verify eligibility dates and resubmit with correct coverage period",
        "200": "Appeal with proof of continuous coverage — request gap exception",
        "29":  "Submit timely filing appeal with proof of original submission date",
        "22":  "Verify COB order and resubmit with primary payer EOB attached",
        "236": "Review procedure bundling rules and correct claim before resubmission",
        "18":  "Verify this is not a duplicate — if unique, appeal with supporting documentation",
        "16":  "Correct missing/invalid fields and resubmit corrected claim",
        "45":  "Review contracted rates — contractual adjustment, no appeal required",
        "96":  "Verify benefit coverage — if covered, appeal with policy documentation",
    }
    if carc in routes:
        return routes[carc]
    # Category fallback
    cat_routes = {
        "Medical Necessity":  "Submit medical records with clinical justification",
        "Authorization":      "Obtain retroactive authorization or submit clinical appeal",
        "Eligibility":        "Verify and correct coverage dates, resubmit or appeal",
        "Coding":             "Correct CPT/modifier combination and resubmit",
        "COB":                "Submit primary payer EOB and resubmit as secondary",
        "Timely Filing":      "Submit timely filing appeal with original submission proof",
        "Duplicate":          "Verify uniqueness — if unique, appeal with documentation",
        "Missing Info":       "Correct incomplete fields and resubmit corrected claim",
        "Non-Covered":        "Appeal with policy coverage documentation",
        "Contractual":        "Contractual adjustment — review contract terms",
    }
    for key in cat_routes:
        if key.lower() in denial_category.lower():
            return cat_routes[key]
    return "Review Required — consult billing specialist"


# ── Letter Templates ──────────────────────────────────────────────────────────
LETTER_TEMPLATES = {
    "Medical Necessity": {
        "subject": "Formal Appeal — Medical Necessity Denial",
        "opening": "This letter serves as a formal appeal of the denial based on lack of medical necessity.",
        "justification": (
            "The clinical evidence provided demonstrates that the procedure performed was medically necessary "
            "per standard of care guidelines and your payer policy. The patient's documented clinical history, "
            "including failure of conservative treatment options, directly supports the medical necessity of "
            "the services rendered. Attached clinical documentation includes the History & Physical, "
            "diagnostic imaging reports, and progress notes confirming the clinical indication."
        ),
        "request": "We respectfully request an immediate review and overturn of this denial based on the clinical evidence provided.",
        "docs_required": ["History & Physical Report", "Diagnostic Imaging Reports", "Progress Notes", "Operative Report (if surgical)"],
    },
    "Authorization": {
        "subject": "Formal Appeal — Authorization Denial",
        "opening": "This letter serves as a formal appeal of the denial due to missing or invalid prior authorization.",
        "justification": (
            "The services rendered were medically necessary and urgent in nature. The treating physician "
            "determined that delaying care to obtain prior authorization would have resulted in adverse patient "
            "outcomes. We are submitting this appeal for retroactive authorization with supporting clinical "
            "documentation demonstrating the urgency and medical necessity of the services provided."
        ),
        "request": "We request retroactive authorization approval and reversal of the denial.",
        "docs_required": ["Authorization Request Form", "Clinical Urgency Documentation", "Physician Letter of Medical Necessity", "Patient Medical Records"],
    },
    "Eligibility": {
        "subject": "Formal Appeal — Eligibility Denial",
        "opening": "This letter serves as a formal appeal of the denial based on eligibility or coverage termination.",
        "justification": (
            "We have verified that the patient maintained active coverage at the time services were rendered. "
            "Enclosed please find the eligibility verification confirmation obtained prior to service, "
            "along with documentation confirming the patient's continuous enrollment. We respectfully request "
            "that you review the attached eligibility records and reconsider this denial."
        ),
        "request": "We request reversal of this denial and processing of the claim per the patient's active coverage benefits.",
        "docs_required": ["Eligibility Verification (270/271)", "Insurance Card Copy", "Patient Enrollment Documentation"],
    },
    "Coding": {
        "subject": "Formal Appeal — Coding Denial",
        "opening": "This letter serves as a formal appeal of the denial related to procedure code or modifier inconsistency.",
        "justification": (
            "The procedure codes and modifiers submitted accurately reflect the services performed. "
            "The treating provider has reviewed the claim and confirms that the coding is consistent "
            "with the clinical documentation and the scope of services rendered. We are submitting "
            "this corrected claim appeal with the operative report and clinical notes as supporting documentation."
        ),
        "request": "We request reconsideration of this claim with corrected coding as noted.",
        "docs_required": ["Operative/Procedure Report", "Clinical Documentation", "Corrected Claim (CMS-1500 or UB-04)"],
    },
    "COB": {
        "subject": "Formal Appeal — Coordination of Benefits",
        "opening": "This letter serves as a formal appeal related to coordination of benefits.",
        "justification": (
            "We have verified the patient's coordination of benefits order and confirm the correct "
            "payer sequencing. The primary payer's Explanation of Benefits (EOB) is enclosed, "
            "demonstrating that this claim has been processed correctly as a secondary claim. "
            "Please process this claim accordingly based on the attached primary payer payment information."
        ),
        "request": "We request processing of this claim as secondary per the attached primary payer EOB.",
        "docs_required": ["Primary Payer EOB", "COB Order Verification", "Patient Insurance Documentation"],
    },
    "Timely Filing": {
        "subject": "Formal Appeal — Timely Filing Denial",
        "opening": "This letter serves as a formal appeal of the denial due to timely filing.",
        "justification": (
            "The claim was submitted within the required timely filing window. Enclosed is proof of "
            "original claim submission including the electronic claim acknowledgment and batch confirmation "
            "from our clearinghouse. The denial is in error as the claim was received by the payer "
            "within the contractually required timeframe."
        ),
        "request": "We request reversal of this denial with reference to the enclosed original submission proof.",
        "docs_required": ["Clearinghouse Batch Confirmation", "Electronic Acknowledgment (999/TA1)", "Original Submission Date Record"],
    },
}

def _get_template(denial_category: str) -> dict:
    """Find the best matching template for a denial category."""
    for key, tmpl in LETTER_TEMPLATES.items():
        if key.lower() in denial_category.lower():
            return tmpl
    # Default fallback
    return {
        "subject": f"Formal Appeal — {denial_category} Denial",
        "opening": f"This letter serves as a formal appeal of the denial categorized as {denial_category}.",
        "justification": (
            "The services rendered were medically necessary and properly documented. We respectfully request "
            "a thorough review of the attached clinical and administrative documentation in support of this appeal."
        ),
        "request": "We request reconsideration and reversal of this denial.",
        "docs_required": ["Medical Records", "Clinical Documentation", "Supporting Administrative Records"],
    }


def _score_letter(claim_id: str, patient: str, payer: str, denial_category: str,
                  carc_code: str, denial_amount: float) -> int:
    """Score letter quality 0-100 based on completeness of populated fields."""
    score = 60  # base
    if claim_id:          score += 5
    if patient:           score += 5
    if payer:             score += 5
    if denial_category:   score += 5
    if carc_code in CARC_CODES: score += 10  # known CARC
    if denial_amount and denial_amount > 0: score += 5
    # Penalize if denial_amount is very small (possibly erroneous)
    if denial_amount and denial_amount < 10: score -= 10
    return min(100, max(0, score))


def generate_appeal_letter(
    denial_id: str,
    claim_id: str,
    patient: str,
    payer: str,
    denial_category: str,
    carc_code: str,
    rarc_code: Optional[str],
    denial_amount: float,
    dos: Optional[str] = None,
    provider: str = "Metropolitan General Health",
) -> dict:
    """
    Generate an appeal letter and return structured response.

    Returns:
        {
          subject, letter_text, sections (dict),
          docs_required, letter_quality_score,
          recommended_action, carc_info, rarc_info,
          appeal_probability
        }
    """
    tmpl = _get_template(denial_category)
    carc_info = CARC_CODES.get(str(carc_code), {"label": carc_code, "description": "See CMS CARC code set", "prefix": "CO"})
    rarc_info = RARC_CODES.get(rarc_code or "", "")
    today = date.today().strftime("%B %d, %Y")
    dos_str = dos or "the date of service on record"

    carc_line = f"Claim Adjustment Reason Code (CARC) {carc_code} — {carc_info['description']}"
    if rarc_code and rarc_info:
        rarc_line = f"Remittance Advice Remark Code (RARC) {rarc_code} — {rarc_info}"
    else:
        rarc_line = ""

    letter_text = f"""Date: {today}

To: {payer} Appeals Department
Re: Formal Appeal for Claim {claim_id}
Patient: {patient}
Date of Service: {dos_str}
Denial Amount: ${denial_amount:,.2f}
Denial Code: {carc_line}
{"Remark Code: " + rarc_line if rarc_line else ""}

Dear Medical Director,

{tmpl["opening"]}

The denial was issued under {carc_line}.{"  " + rarc_line if rarc_line else ""}

{tmpl["justification"]}

{tmpl["request"]}

Please find the following supporting documentation enclosed:
{chr(10).join(f"  • {doc}" for doc in tmpl["docs_required"])}

We request a response within 30 days. Should you require additional information, please contact our billing department directly.

Sincerely,

_______________________________
Authorized Representative
{provider}
Appeals & Billing Department"""

    quality_score = _score_letter(claim_id, patient, payer, denial_category, carc_code, denial_amount)

    # Simple deterministic appeal probability based on category + CARC
    prob_map = {
        "Medical Necessity": 72, "Authorization": 68, "Coding": 81,
        "COB": 75, "Timely Filing": 64, "Eligibility": 59,
        "Duplicate": 55, "Non-Covered": 48, "Missing Info": 78, "Contractual": 35,
    }
    appeal_prob = prob_map.get(denial_category, 65)
    if carc_code in CARC_CODES:
        appeal_prob = min(95, appeal_prob + 5)

    return {
        "denial_id":           denial_id,
        "claim_id":            claim_id,
        "subject":             tmpl["subject"],
        "letter_text":         letter_text,
        "sections": {
            "opening":         tmpl["opening"],
            "justification":   tmpl["justification"],
            "request":         tmpl["request"],
        },
        "docs_required":       tmpl["docs_required"],
        "letter_quality_score": quality_score,
        "recommended_action":  get_recommended_action(carc_code, denial_category),
        "carc_info":           carc_info,
        "rarc_info":           rarc_info,
        "appeal_probability":  appeal_prob,
    }
