#!/usr/bin/env python3
"""
Nexus RCM Intelligence Platform — Synthetic Data Generator
Sprint 0 / Track B — Data & ML Foundation
Version: 1.0 | March 2026

Generates 14 datasets covering the full RCM lifecycle.
ADTP-driven payment dates ensure ERA payments follow real payer cadence.
Bank reconciliation closes the loop: forecast vs actual every week.

Run: python3 generate_synthetic_data.py
Output: /data/synthetic/*.csv  (14 files, ~3.5M rows total)
"""

import os
import csv
import random
import math
from datetime import date, timedelta, datetime
from collections import defaultdict

random.seed(42)

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
START_DATE   = date(2023, 1, 1)
END_DATE     = date(2025, 12, 31)
N_PATIENTS   = 50_000
N_CLAIMS     = 500_000
N_EVV_VISITS = 80_000
OUT_DIR      = os.path.join(os.path.dirname(__file__), "synthetic")
os.makedirs(OUT_DIR, exist_ok=True)

TOTAL_DAYS   = (END_DATE - START_DATE).days

def out(name):
    return os.path.join(OUT_DIR, name)

def rand_date(start=START_DATE, end=END_DATE):
    return start + timedelta(days=random.randint(0, (end - start).days))

def week_start(d):
    """Return the Monday of the week containing date d."""
    return d - timedelta(days=d.weekday())

def fmt(d):
    return d.isoformat() if d else ""

def fmtf(v, dp=2):
    return f"{v:.{dp}f}" if v is not None else ""


# ---------------------------------------------------------------------------
# 1. PAYER MASTER  (50 payers)
#    adtp_days = payment cadence — WHEN they pay (core of forecasting)
# ---------------------------------------------------------------------------
PAYERS = [
    # G1 — Federal FFS
    {"payer_id":"P001","payer_name":"Medicare FFS (CMS)","payer_group":"G1_FEDERAL_FFS",
     "adtp_days":14,"adtp_anchor_day":1,"payment_method":"EFT",
     "avg_payment_rate":0.85,"denial_rate":0.08,"first_pass_rate":0.92,"avg_appeal_win_rate":0.61},
    {"payer_id":"P002","payer_name":"Tricare / CHAMPVA","payer_group":"G1_FEDERAL_FFS",
     "adtp_days":14,"adtp_anchor_day":3,"payment_method":"EFT",
     "avg_payment_rate":0.82,"denial_rate":0.09,"first_pass_rate":0.90,"avg_appeal_win_rate":0.58},

    # G2 — Medicare Advantage
    {"payer_id":"P003","payer_name":"UHC Medicare Advantage","payer_group":"G2_MEDICARE_ADVANTAGE",
     "adtp_days":21,"adtp_anchor_day":1,"payment_method":"EFT",
     "avg_payment_rate":0.83,"denial_rate":0.11,"first_pass_rate":0.88,"avg_appeal_win_rate":0.55},
    {"payer_id":"P004","payer_name":"Humana Medicare Advantage","payer_group":"G2_MEDICARE_ADVANTAGE",
     "adtp_days":21,"adtp_anchor_day":2,"payment_method":"EFT",
     "avg_payment_rate":0.81,"denial_rate":0.12,"first_pass_rate":0.87,"avg_appeal_win_rate":0.53},
    {"payer_id":"P005","payer_name":"Aetna Medicare Advantage","payer_group":"G2_MEDICARE_ADVANTAGE",
     "adtp_days":14,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.82,"denial_rate":0.11,"first_pass_rate":0.88,"avg_appeal_win_rate":0.54},
    {"payer_id":"P006","payer_name":"BCBS Medicare Advantage","payer_group":"G2_MEDICARE_ADVANTAGE",
     "adtp_days":21,"adtp_anchor_day":4,"payment_method":"EFT",
     "avg_payment_rate":0.80,"denial_rate":0.13,"first_pass_rate":0.86,"avg_appeal_win_rate":0.52},

    # G3 — Commercial National
    {"payer_id":"P007","payer_name":"UnitedHealthcare (UHC)","payer_group":"G3_COMMERCIAL_NATIONAL",
     "adtp_days":21,"adtp_anchor_day":1,"payment_method":"EFT",
     "avg_payment_rate":0.78,"denial_rate":0.14,"first_pass_rate":0.85,"avg_appeal_win_rate":0.48},
    {"payer_id":"P008","payer_name":"Aetna / CVS Health","payer_group":"G3_COMMERCIAL_NATIONAL",
     "adtp_days":14,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.77,"denial_rate":0.13,"first_pass_rate":0.86,"avg_appeal_win_rate":0.50},
    {"payer_id":"P009","payer_name":"Cigna / Evernorth","payer_group":"G3_COMMERCIAL_NATIONAL",
     "adtp_days":14,"adtp_anchor_day":3,"payment_method":"EFT",
     "avg_payment_rate":0.76,"denial_rate":0.14,"first_pass_rate":0.85,"avg_appeal_win_rate":0.47},
    {"payer_id":"P010","payer_name":"Humana Commercial","payer_group":"G3_COMMERCIAL_NATIONAL",
     "adtp_days":21,"adtp_anchor_day":2,"payment_method":"EFT",
     "avg_payment_rate":0.75,"denial_rate":0.15,"first_pass_rate":0.84,"avg_appeal_win_rate":0.46},
    {"payer_id":"P011","payer_name":"Anthem / Elevance Health","payer_group":"G3_COMMERCIAL_NATIONAL",
     "adtp_days":14,"adtp_anchor_day":1,"payment_method":"EFT",
     "avg_payment_rate":0.76,"denial_rate":0.13,"first_pass_rate":0.86,"avg_appeal_win_rate":0.49},
    {"payer_id":"P012","payer_name":"CVS / Caremark","payer_group":"G3_COMMERCIAL_NATIONAL",
     "adtp_days":21,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.74,"denial_rate":0.15,"first_pass_rate":0.84,"avg_appeal_win_rate":0.46},

    # G4 — Commercial Regional / Blues
    {"payer_id":"P013","payer_name":"BCBS Texas","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.74,"denial_rate":0.16,"first_pass_rate":0.83,"avg_appeal_win_rate":0.45},
    {"payer_id":"P014","payer_name":"BCBS Illinois","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.73,"denial_rate":0.16,"first_pass_rate":0.83,"avg_appeal_win_rate":0.44},
    {"payer_id":"P015","payer_name":"BCBS Florida","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":21,"adtp_anchor_day":1,"payment_method":"EFT",
     "avg_payment_rate":0.75,"denial_rate":0.15,"first_pass_rate":0.84,"avg_appeal_win_rate":0.46},
    {"payer_id":"P016","payer_name":"BCBS California","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":21,"adtp_anchor_day":2,"payment_method":"EFT",
     "avg_payment_rate":0.74,"denial_rate":0.16,"first_pass_rate":0.83,"avg_appeal_win_rate":0.45},
    {"payer_id":"P017","payer_name":"BCBS New York","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.72,"denial_rate":0.17,"first_pass_rate":0.82,"avg_appeal_win_rate":0.43},
    {"payer_id":"P018","payer_name":"Kaiser Permanente","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":14,"adtp_anchor_day":3,"payment_method":"EFT",
     "avg_payment_rate":0.78,"denial_rate":0.10,"first_pass_rate":0.90,"avg_appeal_win_rate":0.55},
    {"payer_id":"P019","payer_name":"Oscar Health","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":21,"adtp_anchor_day":1,"payment_method":"EFT",
     "avg_payment_rate":0.72,"denial_rate":0.17,"first_pass_rate":0.82,"avg_appeal_win_rate":0.42},
    {"payer_id":"P020","payer_name":"Highmark BCBS","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"CHECK",
     "avg_payment_rate":0.73,"denial_rate":0.16,"first_pass_rate":0.83,"avg_appeal_win_rate":0.44},

    # G5 — Managed Medicaid
    {"payer_id":"P021","payer_name":"Centene / WellCare","payer_group":"G5_MANAGED_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.72,"denial_rate":0.18,"first_pass_rate":0.81,"avg_appeal_win_rate":0.42},
    {"payer_id":"P022","payer_name":"Molina Healthcare","payer_group":"G5_MANAGED_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.71,"denial_rate":0.19,"first_pass_rate":0.80,"avg_appeal_win_rate":0.41},
    {"payer_id":"P023","payer_name":"Amerigroup / Elevance Medicaid","payer_group":"G5_MANAGED_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":4,"payment_method":"EFT",
     "avg_payment_rate":0.70,"denial_rate":0.20,"first_pass_rate":0.79,"avg_appeal_win_rate":0.40},
    {"payer_id":"P024","payer_name":"Meridian Health Plan","payer_group":"G5_MANAGED_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.69,"denial_rate":0.21,"first_pass_rate":0.78,"avg_appeal_win_rate":0.39},
    {"payer_id":"P025","payer_name":"UHC Community Plan (Medicaid)","payer_group":"G5_MANAGED_MEDICAID",
     "adtp_days":21,"adtp_anchor_day":1,"payment_method":"EFT",
     "avg_payment_rate":0.71,"denial_rate":0.19,"first_pass_rate":0.80,"avg_appeal_win_rate":0.41},

    # G6 — State Medicaid FFS
    {"payer_id":"P026","payer_name":"Texas Medicaid (TMHP)","payer_group":"G6_STATE_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":4,"payment_method":"EFT",
     "avg_payment_rate":0.68,"denial_rate":0.22,"first_pass_rate":0.77,"avg_appeal_win_rate":0.38},
    {"payer_id":"P027","payer_name":"Illinois Medicaid (IMPACT)","payer_group":"G6_STATE_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.67,"denial_rate":0.23,"first_pass_rate":0.76,"avg_appeal_win_rate":0.37},
    {"payer_id":"P028","payer_name":"Florida Medicaid (AHCA)","payer_group":"G6_STATE_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":4,"payment_method":"EFT",
     "avg_payment_rate":0.68,"denial_rate":0.22,"first_pass_rate":0.77,"avg_appeal_win_rate":0.38},
    {"payer_id":"P029","payer_name":"California Medi-Cal","payer_group":"G6_STATE_MEDICAID",
     "adtp_days":45,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.66,"denial_rate":0.24,"first_pass_rate":0.75,"avg_appeal_win_rate":0.36},
    {"payer_id":"P030","payer_name":"New York Medicaid (eMedNY)","payer_group":"G6_STATE_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":4,"payment_method":"EFT",
     "avg_payment_rate":0.67,"denial_rate":0.23,"first_pass_rate":0.76,"avg_appeal_win_rate":0.37},
    {"payer_id":"P031","payer_name":"Ohio Medicaid","payer_group":"G6_STATE_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.68,"denial_rate":0.22,"first_pass_rate":0.77,"avg_appeal_win_rate":0.38},

    # G7 — Workers Comp / Auto
    {"payer_id":"P032","payer_name":"Sedgwick Workers Comp","payer_group":"G7_WORKERS_COMP_AUTO",
     "adtp_days":45,"adtp_anchor_day":0,"payment_method":"CHECK",
     "avg_payment_rate":0.70,"denial_rate":0.25,"first_pass_rate":0.74,"avg_appeal_win_rate":0.35},
    {"payer_id":"P033","payer_name":"Broadspire WC","payer_group":"G7_WORKERS_COMP_AUTO",
     "adtp_days":60,"adtp_anchor_day":0,"payment_method":"CHECK",
     "avg_payment_rate":0.68,"denial_rate":0.27,"first_pass_rate":0.72,"avg_appeal_win_rate":0.33},
    {"payer_id":"P034","payer_name":"Travelers Auto Insurance","payer_group":"G7_WORKERS_COMP_AUTO",
     "adtp_days":60,"adtp_anchor_day":0,"payment_method":"CHECK",
     "avg_payment_rate":0.65,"denial_rate":0.28,"first_pass_rate":0.71,"avg_appeal_win_rate":0.32},
    {"payer_id":"P035","payer_name":"State Farm Auto","payer_group":"G7_WORKERS_COMP_AUTO",
     "adtp_days":90,"adtp_anchor_day":0,"payment_method":"CHECK",
     "avg_payment_rate":0.63,"denial_rate":0.30,"first_pass_rate":0.69,"avg_appeal_win_rate":0.30},

    # G8 — Self Pay / Secondary
    {"payer_id":"P036","payer_name":"Self Pay / Uninsured","payer_group":"G8_SELF_PAY_SECONDARY",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"CHECK",
     "avg_payment_rate":0.35,"denial_rate":0.00,"first_pass_rate":0.40,"avg_appeal_win_rate":0.00},
    {"payer_id":"P037","payer_name":"AARP Medigap Supplement","payer_group":"G8_SELF_PAY_SECONDARY",
     "adtp_days":21,"adtp_anchor_day":2,"payment_method":"EFT",
     "avg_payment_rate":0.90,"denial_rate":0.05,"first_pass_rate":0.94,"avg_appeal_win_rate":0.70},
    {"payer_id":"P038","payer_name":"United American Medigap","payer_group":"G8_SELF_PAY_SECONDARY",
     "adtp_days":21,"adtp_anchor_day":2,"payment_method":"EFT",
     "avg_payment_rate":0.88,"denial_rate":0.06,"first_pass_rate":0.93,"avg_appeal_win_rate":0.68},
    {"payer_id":"P039","payer_name":"Mutual of Omaha Supplement","payer_group":"G8_SELF_PAY_SECONDARY",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"CHECK",
     "avg_payment_rate":0.87,"denial_rate":0.07,"first_pass_rate":0.92,"avg_appeal_win_rate":0.66},
    {"payer_id":"P040","payer_name":"VA Community Care","payer_group":"G1_FEDERAL_FFS",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.80,"denial_rate":0.10,"first_pass_rate":0.89,"avg_appeal_win_rate":0.57},
    {"payer_id":"P041","payer_name":"CHIP (Children's Health)","payer_group":"G6_STATE_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":4,"payment_method":"EFT",
     "avg_payment_rate":0.70,"denial_rate":0.18,"first_pass_rate":0.81,"avg_appeal_win_rate":0.42},
    {"payer_id":"P042","payer_name":"Bright Health","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":21,"adtp_anchor_day":1,"payment_method":"EFT",
     "avg_payment_rate":0.73,"denial_rate":0.16,"first_pass_rate":0.83,"avg_appeal_win_rate":0.44},
    {"payer_id":"P043","payer_name":"Friday Health Plans","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":30,"adtp_anchor_day":4,"payment_method":"EFT",
     "avg_payment_rate":0.72,"denial_rate":0.17,"first_pass_rate":0.82,"avg_appeal_win_rate":0.43},
    {"payer_id":"P044","payer_name":"Clover Health","payer_group":"G2_MEDICARE_ADVANTAGE",
     "adtp_days":21,"adtp_anchor_day":2,"payment_method":"EFT",
     "avg_payment_rate":0.80,"denial_rate":0.13,"first_pass_rate":0.86,"avg_appeal_win_rate":0.52},
    {"payer_id":"P045","payer_name":"Devoted Health","payer_group":"G2_MEDICARE_ADVANTAGE",
     "adtp_days":14,"adtp_anchor_day":1,"payment_method":"EFT",
     "avg_payment_rate":0.81,"denial_rate":0.12,"first_pass_rate":0.87,"avg_appeal_win_rate":0.53},
    {"payer_id":"P046","payer_name":"Priority Health","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":21,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.74,"denial_rate":0.15,"first_pass_rate":0.84,"avg_appeal_win_rate":0.46},
    {"payer_id":"P047","payer_name":"Health Net","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":21,"adtp_anchor_day":3,"payment_method":"EFT",
     "avg_payment_rate":0.73,"denial_rate":0.16,"first_pass_rate":0.83,"avg_appeal_win_rate":0.44},
    {"payer_id":"P048","payer_name":"Sutter Health Plus","payer_group":"G4_COMMERCIAL_REGIONAL",
     "adtp_days":14,"adtp_anchor_day":2,"payment_method":"EFT",
     "avg_payment_rate":0.75,"denial_rate":0.14,"first_pass_rate":0.85,"avg_appeal_win_rate":0.47},
    {"payer_id":"P049","payer_name":"CareSource","payer_group":"G5_MANAGED_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":0,"payment_method":"EFT",
     "avg_payment_rate":0.70,"denial_rate":0.20,"first_pass_rate":0.79,"avg_appeal_win_rate":0.40},
    {"payer_id":"P050","payer_name":"WellPoint Medicaid","payer_group":"G5_MANAGED_MEDICAID",
     "adtp_days":30,"adtp_anchor_day":4,"payment_method":"EFT",
     "avg_payment_rate":0.69,"denial_rate":0.21,"first_pass_rate":0.78,"avg_appeal_win_rate":0.39},
]

PAYER_MAP = {p["payer_id"]: p for p in PAYERS}
PAYER_IDS = [p["payer_id"] for p in PAYERS]

# Weighted payer distribution (commercial + Medicare dominate volume)
PAYER_WEIGHTS = []
for p in PAYERS:
    if p["payer_group"] == "G1_FEDERAL_FFS":            PAYER_WEIGHTS.append(18)
    elif p["payer_group"] == "G2_MEDICARE_ADVANTAGE":   PAYER_WEIGHTS.append(12)
    elif p["payer_group"] == "G3_COMMERCIAL_NATIONAL":  PAYER_WEIGHTS.append(14)
    elif p["payer_group"] == "G4_COMMERCIAL_REGIONAL":  PAYER_WEIGHTS.append(8)
    elif p["payer_group"] == "G5_MANAGED_MEDICAID":     PAYER_WEIGHTS.append(7)
    elif p["payer_group"] == "G6_STATE_MEDICAID":       PAYER_WEIGHTS.append(6)
    elif p["payer_group"] == "G7_WORKERS_COMP_AUTO":    PAYER_WEIGHTS.append(3)
    else:                                                PAYER_WEIGHTS.append(2)


# ---------------------------------------------------------------------------
# REFERENCE DATA
# ---------------------------------------------------------------------------
SPECIALTIES = [
    "Primary Care","Internal Medicine","Cardiology","Orthopedic Surgery",
    "Behavioral Health","Physical Therapy","Home Health","Radiology",
    "Gastroenterology","Oncology","Neurology","Dermatology","Urology","DME"
]

CPT_BY_SPECIALTY = {
    "Primary Care":        [("99213",120),("99214",160),("99215",210),("99203",150),("99204",200)],
    "Internal Medicine":   [("99213",130),("99214",175),("99232",220),("99233",290),("99291",800)],
    "Cardiology":          [("93000",95),("93306",1800),("93017",450),("99213",130),("93224",850)],
    "Orthopedic Surgery":  [("27447",8500),("27130",9200),("29881",3200),("99213",130),("20610",180)],
    "Behavioral Health":   [("90837",180),("90834",140),("90792",250),("99213",130),("90853",90)],
    "Physical Therapy":    [("97110",80),("97140",75),("97035",60),("97010",40),("97530",85)],
    "Home Health":         [("G0179",120),("G0180",200),("G0156",95),("T1019",75),("S5125",85)],
    "Radiology":           [("71046",350),("73721",900),("70553",1800),("74177",1200),("72148",1500)],
    "Gastroenterology":    [("45378",800),("45380",1200),("43239",2200),("99213",130),("91034",450)],
    "Oncology":            [("96413",800),("99214",175),("96415",450),("99215",210),("96372",85)],
    "Neurology":           [("95816",400),("99213",130),("64483",1200),("99214",175),("95913",600)],
    "Dermatology":         [("11102",180),("17000",350),("99213",130),("17004",800),("11305",220)],
    "Urology":             [("52000",600),("55873",8500),("99213",130),("52310",750),("99214",175)],
    "DME":                 [("E0601",850),("E1399",400),("K0001",1200),("A4556",80),("E0260",600)],
}

ICD10_BY_SPECIALTY = {
    "Primary Care":       ["Z00.00","I10","E11.9","J06.9","M54.5","E78.5","F41.1","J45.901"],
    "Internal Medicine":  ["I10","E11.9","I25.10","J18.9","N18.3","I50.9","E87.6","K21.0"],
    "Cardiology":         ["I25.10","I10","I48.91","I50.9","I21.3","I35.0","Z95.1","R00.0"],
    "Orthopedic Surgery": ["M17.11","M16.11","M51.16","S82.001A","M75.100","M23.200","M47.816"],
    "Behavioral Health":  ["F32.1","F41.1","F33.1","F31.81","F40.10","F43.10","F90.0","F20.9"],
    "Physical Therapy":   ["M54.5","M17.11","M25.511","S13.4XXA","M79.3","G89.29","M62.838"],
    "Home Health":        ["I69.354","G20","M17.11","I25.10","E11.9","J44.1","I50.9","N18.5"],
    "Radiology":          ["J18.9","R91.8","M17.11","I25.10","R06.00","C34.11","N20.0","K80.20"],
    "Gastroenterology":   ["K57.30","K92.1","K21.0","K86.1","K56.609","C18.9","K50.90","K74.60"],
    "Oncology":           ["C34.11","C50.912","C61","C18.9","C25.9","C91.00","C79.51","Z85.118"],
    "Neurology":          ["G43.909","G20","G40.909","G35","G89.29","R51","G62.9","G89.21"],
    "Dermatology":        ["L40.0","C44.711","L03.011","L30.9","L20.9","B07.8","L82.1","L85.3"],
    "Urology":            ["N40.1","N20.0","C67.9","N13.30","N39.0","R33.9","N18.3","N43.3"],
    "DME":                ["Z99.11","E11.9","M17.11","G20","J96.10","Z79.01","I50.9","M62.50"],
}

MODIFIERS = [None, None, None, "25", "59", "LT", "RT", "TC", "26", "GP", "GT"]

CARC_CODES = [
    ("CO-4",  "Late filing — claim not filed timely","TIMELY_FILING","CO"),
    ("CO-11", "Diagnosis inconsistent with procedure","CODING","CO"),
    ("CO-16", "Claim lacks information needed for adjudication","CODING","CO"),
    ("CO-22", "Coordination of Benefits — payment made by other carrier","COB","CO"),
    ("CO-29", "Time limit for filing has expired","TIMELY_FILING","CO"),
    ("CO-45", "Charges exceed contracted rate","CODING","CO"),
    ("CO-96", "Non-covered charge","NON_COVERED","CO"),
    ("CO-97", "Benefit included in allowance for another service","CODING","CO"),
    ("CO-109","Claim not covered by payer — send to correct payer","ELIGIBILITY","CO"),
    ("CO-119","Benefit maximum has been reached","NON_COVERED","CO"),
    ("CO-167","Diagnosis not covered","CODING","CO"),
    ("CO-170","Payment denied — claim submitted to incorrect payer","ELIGIBILITY","CO"),
    ("CO-197","Authorization/Referral absent","AUTHORIZATION","CO"),
    ("CO-242","Services not authorized by plan","AUTHORIZATION","CO"),
    ("PR-1",  "Deductible amount","ELIGIBILITY","PR"),
    ("PR-2",  "Coinsurance amount","ELIGIBILITY","PR"),
    ("PR-3",  "Co-payment amount","ELIGIBILITY","PR"),
    ("PR-96", "Non-covered charge — patient responsibility","NON_COVERED","PR"),
    ("OA-23", "Payment adjusted — payer deems information submitted incomplete","CODING","OA"),
    ("PI-4",  "Late filing — administrative","TIMELY_FILING","PI"),
]

RARC_CODES = {
    "CO-197": ("N58","Missing/invalid prior authorization number"),
    "CO-4":   ("N95","Duplicate claim"),
    "CO-11":  ("N115","Missing clinical documentation"),
    "CO-16":  ("N30","Patient not eligible for date of service"),
    "CO-22":  ("N25","Submission must be made by the patient or insured"),
    "CO-96":  ("M86","Service not covered"),
    "CO-242": ("MA13","No prior authorization on file"),
    "CO-109": ("M51","Missing/invalid provider number"),
}

STATES = ["TX","CA","FL","NY","IL","OH","PA","GA","NC","MI",
          "NJ","VA","WA","AZ","TN","MA","IN","MO","MD","WI"]

EVV_AGGREGATORS = ["SANDATA","HHAXCHANGE","AUTHENTICARE","NETSMART"]

EVV_DENIAL_CODES = [
    ("EVV-001","GPS location mismatch — caregiver >300ft from patient address at clock-in"),
    ("EVV-002","Time discrepancy — actual visit duration differs from scheduled by >15 minutes"),
    ("EVV-003","Caregiver identity not verified — biometric/telephony check failed"),
    ("EVV-004","Unauthorized service type — service code not on approved plan"),
    ("EVV-005","Visit not scheduled — no prior authorization for this visit date"),
    ("EVV-006","Caregiver-patient mismatch — assigned caregiver ID does not match visit record"),
]


# ---------------------------------------------------------------------------
# HELPER — next ADTP payment date for a payer after a given date
# ---------------------------------------------------------------------------
def next_adtp_date(payer, after_date):
    """Return the next payment batch date for this payer after after_date."""
    adtp = payer["adtp_days"]
    anchor_day = payer.get("adtp_anchor_day", 0)  # 0=Mon ... 6=Sun
    # Find the first date >= after_date that lands on anchor_day
    d = after_date + timedelta(days=1)
    for _ in range(adtp + 7):
        if d.weekday() == anchor_day:
            return d
        d += timedelta(days=1)
    return after_date + timedelta(days=adtp)


def adtp_payment_date(submission_date, payer):
    """Return the ADTP-driven ERA payment date for a submitted claim."""
    adtp = payer["adtp_days"]
    earliest = submission_date + timedelta(days=adtp - 3)
    return next_adtp_date(payer, earliest)


# ---------------------------------------------------------------------------
# SEASONAL multiplier (Jan deductible spike, Q4 slowdown, summer slump)
# ---------------------------------------------------------------------------
def seasonal_volume(d):
    m = d.month
    if m == 1:   return 0.82   # Jan — deductible reset, patients delay
    if m == 2:   return 0.90
    if m in [3,4,5]: return 1.05  # Spring — catch-up
    if m in [6,7,8]: return 0.93  # Summer slump
    if m in [9,10]:  return 1.08  # Fall — year-end push
    if m == 11:  return 0.95   # Thanksgiving slowdown
    if m == 12:  return 0.88   # Dec — holiday + deductible coast


# ===========================================================================
# GENERATE DATASETS
# ===========================================================================

print("=" * 60)
print("NEXUS RCM — Synthetic Data Generator")
print("=" * 60)


# ---------------------------------------------------------------------------
# Dataset 1: payer_master.csv
# ---------------------------------------------------------------------------
print("\n[1/14] payer_master.csv ...")
with open(out("payer_master.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=[
        "payer_id","payer_name","payer_group","adtp_days","adtp_anchor_day",
        "payment_method","avg_payment_rate","denial_rate","first_pass_rate",
        "avg_appeal_win_rate","electronic_payer_id","waystar_payer_id","era_enrolled"
    ])
    w.writeheader()
    for p in PAYERS:
        w.writerow({
            "payer_id": p["payer_id"],
            "payer_name": p["payer_name"],
            "payer_group": p["payer_group"],
            "adtp_days": p["adtp_days"],
            "adtp_anchor_day": p.get("adtp_anchor_day", 0),
            "payment_method": p["payment_method"],
            "avg_payment_rate": fmtf(p["avg_payment_rate"], 4),
            "denial_rate": fmtf(p["denial_rate"], 4),
            "first_pass_rate": fmtf(p["first_pass_rate"], 4),
            "avg_appeal_win_rate": fmtf(p["avg_appeal_win_rate"], 4),
            "electronic_payer_id": f"EL{p['payer_id'][1:]}",
            "waystar_payer_id": f"WS{p['payer_id'][1:]}",
            "era_enrolled": True if p["payer_group"] != "G8_SELF_PAY_SECONDARY" else False,
        })
print(f"   → {len(PAYERS)} payers written")


# ---------------------------------------------------------------------------
# Dataset 2: providers.csv
# ---------------------------------------------------------------------------
print("[2/14] providers.csv ...")
providers = []
first_names = ["James","Maria","David","Sarah","Michael","Linda","Robert","Jennifer","William","Patricia"]
last_names  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Moore",
               "Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Lee","Walker"]

for i in range(200):
    spec = random.choice(SPECIALTIES)
    pid  = f"PR{i+1:04d}"
    providers.append({
        "provider_id": pid,
        "npi": f"{random.randint(1000000000,9999999999)}",
        "provider_name": f"Dr. {random.choice(first_names)} {random.choice(last_names)}",
        "provider_type": "INDIVIDUAL",
        "specialty": spec,
        "facility_type": "HOME_HEALTH" if spec == "Home Health" else
                         "DME" if spec == "DME" else
                         "HOSPITAL" if spec in ["Radiology","Cardiology","Oncology"] else "CLINIC",
        "state": random.choice(STATES),
        "zip": f"{random.randint(10000,99999)}",
        "tax_id": f"{random.randint(10,99)}-{random.randint(1000000,9999999)}",
    })

with open(out("providers.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(providers[0].keys()))
    w.writeheader()
    w.writerows(providers)
print(f"   → {len(providers)} providers written")
PROVIDER_MAP = {p["provider_id"]: p for p in providers}
PROVIDER_IDS = [p["provider_id"] for p in providers]


# ---------------------------------------------------------------------------
# Dataset 3: patients.csv
# ---------------------------------------------------------------------------
print("[3/14] patients.csv ...")
patients = []
for i in range(N_PATIENTS):
    dob = date(random.randint(1935, 2010), random.randint(1, 12), random.randint(1, 28))
    patients.append({
        "patient_id": f"PT{i+1:06d}",
        "mrn":        f"MRN{i+1:07d}",
        "first_name": random.choice(first_names),
        "last_name":  random.choice(last_names),
        "dob":        fmt(dob),
        "gender":     random.choice(["MALE","FEMALE","MALE","FEMALE","OTHER"]),
        "zip":        f"{random.randint(10000,99999)}",
        "state":      random.choice(STATES),
    })

with open(out("patients.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(patients[0].keys()))
    w.writeheader()
    w.writerows(patients)
print(f"   → {len(patients)} patients written")


# ---------------------------------------------------------------------------
# Dataset 4: insurance_coverage.csv
# ---------------------------------------------------------------------------
print("[4/14] insurance_coverage.csv ...")
coverage_records = []
patient_primary_payer = {}  # patient_id → (coverage_id, payer_id)

for pt in patients:
    pid = pt["patient_id"]
    # Primary coverage — weighted payer selection
    payer = random.choices(PAYERS, weights=PAYER_WEIGHTS, k=1)[0]
    eff   = START_DATE - timedelta(days=random.randint(0, 730))
    cid   = f"COV{len(coverage_records)+1:07d}"

    ded = random.choice([0, 500, 1000, 1500, 2000, 3000, 5000])
    oop = ded * random.uniform(2, 4)
    met = min(ded, ded * random.uniform(0, 1.2))
    coverage_records.append({
        "coverage_id":            cid,
        "patient_id":             pid,
        "payer_id":               payer["payer_id"],
        "coverage_type":          "PRIMARY",
        "group_number":           f"GRP{random.randint(10000,99999)}",
        "member_id":              f"MEM{random.randint(1000000,9999999)}",
        "subscriber_id":          f"SUB{random.randint(1000000,9999999)}",
        "effective_date":         fmt(eff),
        "term_date":              "",
        "deductible_individual":  fmtf(ded),
        "deductible_met_ytd":     fmtf(met),
        "oop_max":                fmtf(round(oop, 2)),
        "oop_met_ytd":            fmtf(round(met * 1.5, 2)),
        "copay":                  fmtf(random.choice([0, 15, 20, 25, 30, 40, 50])),
        "coinsurance_pct":        fmtf(random.choice([0, 0.10, 0.20, 0.30]), 4),
    })
    patient_primary_payer[pid] = (cid, payer["payer_id"])

    # Secondary coverage — 25% of patients
    if random.random() < 0.25:
        sec_payers = [p for p in PAYERS if p["payer_id"] != payer["payer_id"]
                      and p["payer_group"] in ["G8_SELF_PAY_SECONDARY","G1_FEDERAL_FFS"]]
        if sec_payers:
            sp  = random.choice(sec_payers)
            cid2 = f"COV{len(coverage_records)+1:07d}"
            coverage_records.append({
                "coverage_id": cid2, "patient_id": pid,
                "payer_id": sp["payer_id"], "coverage_type": "SECONDARY",
                "group_number": f"GRP{random.randint(10000,99999)}",
                "member_id": f"MEM{random.randint(1000000,9999999)}",
                "subscriber_id": f"SUB{random.randint(1000000,9999999)}",
                "effective_date": fmt(eff), "term_date": "",
                "deductible_individual": "0", "deductible_met_ytd": "0",
                "oop_max": "0", "oop_met_ytd": "0", "copay": "0", "coinsurance_pct": "0",
            })

with open(out("insurance_coverage.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(coverage_records[0].keys()))
    w.writeheader()
    w.writerows(coverage_records)
print(f"   → {len(coverage_records)} coverage records written")


# ---------------------------------------------------------------------------
# Dataset 5: claims.csv  +  Dataset 6: claim_lines.csv
# ---------------------------------------------------------------------------
print("[5/14] claims.csv + [6/14] claim_lines.csv ...")

claims       = []
claim_lines  = []
line_counter = 0

# Volume distribution across 3 years (seasonal)
claim_dates = []
for _ in range(N_CLAIMS):
    d = rand_date()
    # Rejection re-draw for seasonal weighting
    while random.random() > seasonal_volume(d):
        d = rand_date()
    claim_dates.append(d)
claim_dates.sort()

for idx, dos in enumerate(claim_dates):
    pt      = patients[idx % N_PATIENTS]
    pid     = pt["patient_id"]
    cov_id, payer_id = patient_primary_payer[pid]
    payer   = PAYER_MAP[payer_id]
    prov    = providers[idx % len(providers)]
    spec    = prov["specialty"]
    claim_id = f"CLM{idx+1:07d}"

    # CRS scoring
    crs_elig  = 25 if random.random() < 0.88 else 0
    crs_auth  = 25 if random.random() < 0.85 else 0
    crs_code  = 20 if random.random() < 0.90 else 0
    crs_cob   = 10 if random.random() < 0.95 else 0
    crs_doc   = 10 if random.random() < 0.82 else 0
    crs_evv   = 10 if (spec == "Home Health" and random.random() < 0.80) else \
                (10 if spec != "Home Health" else 0)
    crs_score = crs_elig + crs_auth + crs_code + crs_cob + crs_doc + crs_evv
    crs_passed = crs_score >= 80

    # Only submitted claims have payment/denial data
    submitted = crs_passed or random.random() < 0.15  # some slip through
    sub_date  = dos + timedelta(days=random.randint(1, 7)) if submitted else None

    # ADTP-driven expected payment date
    exp_pay_date = adtp_payment_date(sub_date, payer) if sub_date else None
    exp_pay_week = week_start(exp_pay_date) if exp_pay_date else None

    # Financials
    cpt_pool = CPT_BY_SPECIALTY.get(spec, [("99213", 130)])
    lines_count = random.randint(1, min(4, len(cpt_pool)))
    total_charges = 0
    clines = []
    for ln in range(lines_count):
        cpt, base_charge = random.choice(cpt_pool)
        charge = round(base_charge * random.uniform(0.85, 1.25), 2)
        units  = random.randint(1, 3)
        total_charges += charge * units
        icd_pool = ICD10_BY_SPECIALTY.get(spec, ["Z00.00"])
        line_counter += 1
        allowed = round(charge * payer["avg_payment_rate"] * random.uniform(0.9, 1.1), 2)
        clines.append({
            "claim_line_id":       f"CL{line_counter:09d}",
            "claim_id":            claim_id,
            "line_number":         ln + 1,
            "cpt_code":            cpt,
            "hcpcs_code":          "",
            "revenue_code":        "",
            "icd10_primary":       random.choice(icd_pool),
            "icd10_secondary_1":   random.choice(icd_pool) if random.random() < 0.5 else "",
            "icd10_secondary_2":   "",
            "icd10_poa":           random.choice(["Y","N","U"]),
            "modifier_1":          random.choice(MODIFIERS) or "",
            "modifier_2":          "",
            "units":               units,
            "charge_amount":       fmtf(charge * units),
            "allowed_amount":      fmtf(allowed * units),
            "paid_amount":         "",   # filled after ERA
            "patient_responsibility": "",
            "rendering_npi":       prov["npi"],
        })

    total_charges = round(total_charges, 2)
    exp_allowed   = round(total_charges * payer["avg_payment_rate"], 2)

    # Status
    if not submitted:
        status = "DRAFT"
    elif exp_pay_date and exp_pay_date <= END_DATE:
        r = random.random()
        if r < payer["first_pass_rate"]:    status = "PAID"
        elif r < payer["first_pass_rate"] + payer["denial_rate"]: status = "DENIED"
        else:                               status = "ACKNOWLEDGED"
    else:
        status = "SUBMITTED"

    claims.append({
        "claim_id":                claim_id,
        "patient_id":              pid,
        "provider_id":             prov["provider_id"],
        "payer_id":                payer_id,
        "coverage_id":             cov_id,
        "claim_type":              "INSTITUTIONAL" if spec in ["Radiology","Cardiology","Oncology"] else "PROFESSIONAL",
        "date_of_service":         fmt(dos),
        "dos_through":             fmt(dos + timedelta(days=random.randint(0, 3))) if spec in ["Home Health","Behavioral Health"] else "",
        "place_of_service":        "21" if spec in ["Radiology","Cardiology","Oncology"] else "11",
        "bill_type":               "131" if spec in ["Radiology","Cardiology","Oncology"] else "",
        "total_charges":           fmtf(total_charges),
        "expected_allowed":        fmtf(exp_allowed),
        "expected_patient_liability": fmtf(round(total_charges * 0.10, 2)),
        "submission_date":         fmt(sub_date) if sub_date else "",
        "submission_method":       "EDI",
        "waystar_batch_id":        f"WB{sub_date.strftime('%Y%m%d') if sub_date else '00000000'}{random.randint(1000,9999)}",
        "crs_score":               crs_score,
        "crs_passed":              crs_passed,
        "crs_eligibility_pts":     crs_elig,
        "crs_auth_pts":            crs_auth,
        "crs_coding_pts":          crs_code,
        "crs_cob_pts":             crs_cob,
        "crs_documentation_pts":   crs_doc,
        "crs_evv_pts":             crs_evv,
        "adtp_days":               payer["adtp_days"] if sub_date else "",
        "expected_payment_date":   fmt(exp_pay_date) if exp_pay_date else "",
        "expected_payment_week":   fmt(exp_pay_week) if exp_pay_week else "",
        "status":                  status,
    })
    claim_lines.extend(clines)

    if (idx + 1) % 50000 == 0:
        print(f"   claims: {idx+1:,}/{N_CLAIMS:,} ...")

with open(out("claims.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(claims[0].keys()))
    w.writeheader()
    w.writerows(claims)

with open(out("claim_lines.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(claim_lines[0].keys()))
    w.writeheader()
    w.writerows(claim_lines)

print(f"   → {len(claims):,} claims | {len(claim_lines):,} lines written")

CLAIM_MAP = {c["claim_id"]: c for c in claims}


# ---------------------------------------------------------------------------
# Dataset 7: prior_auth.csv
# ---------------------------------------------------------------------------
print("[7/14] prior_auth.csv ...")
auth_records = []
auth_required_specs = ["Cardiology","Orthopedic Surgery","Radiology","Oncology","Behavioral Health","Home Health"]

for c in claims:
    prov = PROVIDER_MAP.get(c["provider_id"], {})
    if prov.get("specialty") not in auth_required_specs:
        continue
    if random.random() > 0.70:
        continue

    dos      = date.fromisoformat(c["date_of_service"])
    req_date = dos - timedelta(days=random.randint(3, 21))
    status   = random.choices(
        ["APPROVED","DENIED","PENDING","EXPIRED"],
        weights=[70, 10, 5, 15], k=1)[0]
    approved_date = req_date + timedelta(days=random.randint(1, 5)) if status == "APPROVED" else None
    expiry = approved_date + timedelta(days=random.randint(30, 180)) if approved_date else None

    auth_records.append({
        "auth_id":           f"AUTH{len(auth_records)+1:07d}",
        "claim_id":          c["claim_id"],
        "patient_id":        c["patient_id"],
        "payer_id":          c["payer_id"],
        "auth_number":       f"AUTH{random.randint(1000000,9999999)}" if status == "APPROVED" else "",
        "auth_type":         "PROSPECTIVE",
        "requested_date":    fmt(req_date),
        "approved_date":     fmt(approved_date) if approved_date else "",
        "expiry_date":       fmt(expiry) if expiry else "",
        "approved_cpt_codes":"",
        "approved_units":    random.randint(1, 20) if status == "APPROVED" else "",
        "status":            status,
        "denial_reason":     "Medical necessity not established" if status == "DENIED" else "",
    })

with open(out("prior_auth.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(auth_records[0].keys()))
    w.writeheader()
    w.writerows(auth_records)
print(f"   → {len(auth_records):,} auth records written")


# ---------------------------------------------------------------------------
# Dataset 8: eligibility_271.csv
# ---------------------------------------------------------------------------
print("[8/14] eligibility_271.csv ...")
elig_records = []
sampled_patients = random.sample(patients, min(N_PATIENTS, 40000))

for pt in sampled_patients:
    pid = pt["patient_id"]
    _, payer_id = patient_primary_payer[pid]
    payer = PAYER_MAP[payer_id]
    inq_date = rand_date()
    status   = random.choices(["ACTIVE","INACTIVE","TERMINATED"],[88,8,4],k=1)[0]
    elig_records.append({
        "elig_id":               f"EL{len(elig_records)+1:07d}",
        "patient_id":            pid,
        "payer_id":              payer_id,
        "inquiry_date":          fmt(inq_date),
        "subscriber_status":     status,
        "coverage_effective":    fmt(inq_date - timedelta(days=random.randint(30,730))),
        "coverage_term":         fmt(inq_date + timedelta(days=random.randint(30,365))) if status != "ACTIVE" else "",
        "deductible_remaining":  fmtf(random.uniform(0, 3000)),
        "oop_remaining":         fmtf(random.uniform(0, 6000)),
        "prior_auth_required":   random.random() < 0.45,
        "referral_required":     random.random() < 0.20,
        "network_status":        random.choices(["IN","OUT","UNKNOWN"],[80,12,8],k=1)[0],
        "plan_type":             random.choice(["PPO","HMO","EPO","POS","HDHP"]),
        "response_code":         "EB" if status == "ACTIVE" else "AAA",
        "response_message":      "Active coverage confirmed" if status == "ACTIVE" else "Coverage not found",
    })

with open(out("eligibility_271.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(elig_records[0].keys()))
    w.writeheader()
    w.writerows(elig_records)
print(f"   → {len(elig_records):,} eligibility records written")


# ---------------------------------------------------------------------------
# Dataset 9: denials.csv  (Waystar — CARC/RARC driven)
# ---------------------------------------------------------------------------
print("[9/14] denials.csv ...")
denied_claims = [c for c in claims if c["status"] == "DENIED"]
denial_records = []

for c in denied_claims:
    payer = PAYER_MAP[c["payer_id"]]
    dos   = date.fromisoformat(c["date_of_service"])

    # Weight CARC codes by payer group
    if payer["payer_group"] in ["G1_FEDERAL_FFS","G2_MEDICARE_ADVANTAGE"]:
        carc_weights = [5,8,10,4,6,4,6,4,4,3,5,3,15,12,8,6,4,3,4,3]
    elif payer["payer_group"] in ["G5_MANAGED_MEDICAID","G6_STATE_MEDICAID"]:
        carc_weights = [8,6,8,5,10,5,8,5,6,4,6,4,10,8,12,8,6,4,5,4]
    else:
        carc_weights = [6,8,9,7,5,5,7,5,5,4,5,4,12,10,10,8,5,4,4,4]

    carc_tuple = random.choices(CARC_CODES, weights=carc_weights, k=1)[0]
    carc_code, carc_desc, category, adj_type = carc_tuple
    rarc_code, rarc_desc = RARC_CODES.get(carc_code, ("",""))

    denial_date   = dos + timedelta(days=payer["adtp_days"] + random.randint(0, 7))
    appeal_ddl    = denial_date + timedelta(days=random.randint(30, 180))
    denial_amount = float(c["total_charges"]) * random.uniform(0.7, 1.0)

    denial_records.append({
        "denial_id":             f"DN{len(denial_records)+1:07d}",
        "claim_id":              c["claim_id"],
        "waystar_denial_id":     f"WD{random.randint(10000000,99999999)}",
        "denial_date":           fmt(denial_date),
        "denial_source":         "ERA_835",
        "carc_code":             carc_code,
        "carc_description":      carc_desc,
        "rarc_code":             rarc_code,
        "rarc_description":      rarc_desc,
        "denial_category":       category,
        "adjustment_type":       adj_type,
        "denial_amount":         fmtf(denial_amount),
        "appeal_deadline":       fmt(appeal_ddl),
        "similar_denial_30d":    random.randint(0, 15),
        "recommended_action":    f"Review {carc_code} — resubmit with corrected {category.lower()} information",
    })

with open(out("denials.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(denial_records[0].keys()))
    w.writeheader()
    w.writerows(denial_records)
print(f"   → {len(denial_records):,} denials written  ({len(denial_records)/len(claims)*100:.1f}% denial rate)")

DENIAL_MAP = {d["denial_id"]: d for d in denial_records}
DENIAL_BY_CLAIM = {d["claim_id"]: d["denial_id"] for d in denial_records}


# ---------------------------------------------------------------------------
# Dataset 10: appeals.csv
# ---------------------------------------------------------------------------
print("[10/14] appeals.csv ...")
appeal_records = []
# ~44% of denials get appealed
appealable = random.sample(denial_records, int(len(denial_records) * 0.44))

for dn in appealable:
    payer        = PAYER_MAP[CLAIM_MAP[dn["claim_id"]]["payer_id"]]
    denial_date  = date.fromisoformat(dn["denial_date"])
    sub_date     = denial_date + timedelta(days=random.randint(5, 45))
    won          = random.random() < payer["avg_appeal_win_rate"]
    outcome      = "WON" if won else random.choices(["LOST","PARTIAL"],[0.85,0.15],k=1)[0]
    outcome_date = sub_date + timedelta(days=random.randint(14, 90)) if sub_date <= END_DATE else None
    recovered    = float(dn["denial_amount"]) * random.uniform(0.7, 1.0) if won else \
                   (float(dn["denial_amount"]) * random.uniform(0.2, 0.5) if outcome == "PARTIAL" else 0)
    appeal_records.append({
        "appeal_id":           f"AP{len(appeal_records)+1:07d}",
        "denial_id":           dn["denial_id"],
        "claim_id":            dn["claim_id"],
        "appeal_type":         "FIRST_LEVEL",
        "submitted_date":      fmt(sub_date),
        "appeal_method":       random.choice(["PORTAL","FAX","CERTIFIED_MAIL"]),
        "ai_generated":        random.random() < 0.60,
        "approved_by_user_id": f"USR{random.randint(100,999)}",
        "outcome":             outcome if (outcome_date and outcome_date <= END_DATE) else "PENDING",
        "outcome_date":        fmt(outcome_date) if outcome_date and outcome_date <= END_DATE else "",
        "recovered_amount":    fmtf(recovered),
        "carc_overturned":     won,
        "appeal_quality_score":random.randint(5, 10) if won else random.randint(1, 7),
    })

with open(out("appeals.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(appeal_records[0].keys()))
    w.writeheader()
    w.writerows(appeal_records)
won_count = sum(1 for a in appeal_records if a["outcome"] == "WON")
print(f"   → {len(appeal_records):,} appeals  ({won_count/len(appeal_records)*100:.1f}% win rate)")


# ---------------------------------------------------------------------------
# Dataset 11: era_payments.csv  (ADTP-cycle driven dates)
# ---------------------------------------------------------------------------
print("[11/14] era_payments.csv ...")
paid_claims = [c for c in claims if c["status"] == "PAID"]
era_records = []

# Track ADTP cycle numbers per payer
payer_cycle_tracker = defaultdict(int)

for c in paid_claims:
    payer     = PAYER_MAP[c["payer_id"]]
    exp_date  = date.fromisoformat(c["expected_payment_date"]) if c["expected_payment_date"] else None
    if not exp_date:
        continue

    payer_cycle_tracker[c["payer_id"]] += 1
    cycle_num   = payer_cycle_tracker[c["payer_id"]]
    total_chg   = float(c["total_charges"])
    pay_amount  = round(total_chg * payer["avg_payment_rate"] * random.uniform(0.95, 1.05), 2)
    co_amount   = round(total_chg * (1 - payer["avg_payment_rate"]) * 0.70, 2)
    pr_amount   = round(total_chg * (1 - payer["avg_payment_rate"]) * 0.25, 2)
    oa_amount   = round(total_chg - pay_amount - co_amount - pr_amount, 2)

    era_records.append({
        "era_id":            f"ERA{len(era_records)+1:08d}",
        "claim_id":          c["claim_id"],
        "payer_id":          c["payer_id"],
        "waystar_era_id":    f"WE{random.randint(10000000,99999999)}",
        "payment_date":      c["expected_payment_date"],   # ADTP-driven
        "payment_week_start":c["expected_payment_week"],
        "adtp_cycle_number": cycle_num,
        "payment_amount":    fmtf(pay_amount),
        "payment_method":    payer["payment_method"],
        "eft_trace_number":  f"EFT{random.randint(100000000000000,999999999999999)}" if payer["payment_method"] == "EFT" else "",
        "check_number":      f"CHK{random.randint(100000,999999)}" if payer["payment_method"] == "CHECK" else "",
        "allowed_amount":    fmtf(round(total_chg * payer["avg_payment_rate"], 2)),
        "co_amount":         fmtf(co_amount),
        "pr_amount":         fmtf(pr_amount),
        "oa_amount":         fmtf(max(0, oa_amount)),
        "pi_amount":         "0.00",
    })

with open(out("era_payments.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(era_records[0].keys()))
    w.writeheader()
    w.writerows(era_records)
total_paid = sum(float(e["payment_amount"]) for e in era_records)
print(f"   → {len(era_records):,} ERA payments  |  Total: ${total_paid:,.0f}")


# ---------------------------------------------------------------------------
# Dataset 12: payment_forecast.csv  (weekly per payer)
#   WHO pays this week + HOW MUCH (historical avg × volume adjustment)
# ---------------------------------------------------------------------------
print("[12/14] payment_forecast.csv ...")

# Build historical ERA amounts per payer per week
payer_weekly_era = defaultdict(lambda: defaultdict(float))
for e in era_records:
    wk = e["payment_week_start"]
    payer_weekly_era[e["payer_id"]][wk] += float(e["payment_amount"])

forecast_records = []
current = week_start(START_DATE)
week_count = 0

while current <= END_DATE:
    week_end_d = current + timedelta(days=6)
    week_count += 1

    for payer in PAYERS:
        pid   = payer["payer_id"]
        adtp  = payer["adtp_days"]
        anchor= payer.get("adtp_anchor_day", 0)

        # Does this payer's ADTP cycle fall in this week?
        cycle_hits = False
        for d in range(7):
            day = current + timedelta(days=d)
            if day.weekday() == anchor:
                # Check if this is on a payment cycle boundary
                days_since_start = (day - START_DATE).days
                if days_since_start % adtp < 7:
                    cycle_hits = True
                    break

        # Historical avg for this payer (last 8 cycle weeks)
        payer_weeks = sorted(payer_weekly_era[pid].keys())
        recent_amounts = [payer_weekly_era[pid][w] for w in payer_weeks[-8:]] if payer_weeks else [0]
        hist_avg = sum(recent_amounts) / len(recent_amounts) if recent_amounts else 0

        if not cycle_hits or hist_avg == 0:
            # No cycle this week — small residual/straggler amount
            forecast_amt = hist_avg * random.uniform(0.02, 0.08) if hist_avg > 0 else 0
        else:
            # Cycle hits — forecast based on historical avg + seasonal volume
            seasonal = seasonal_volume(current)
            forecast_amt = hist_avg * seasonal * random.uniform(0.92, 1.08)

        forecast_amt = round(forecast_amt, 2)
        if forecast_amt < 1:
            continue

        confidence  = round(random.uniform(0.78, 0.96) if cycle_hits else random.uniform(0.55, 0.75), 4)
        claim_count = int(forecast_amt / 250) + random.randint(0, 5) if forecast_amt > 0 else 0

        forecast_records.append({
            "forecast_id":           f"FC{len(forecast_records)+1:08d}",
            "week_start_date":       fmt(current),
            "week_end_date":         fmt(week_end_d),
            "payer_id":              pid,
            "payer_name":            payer["payer_name"],
            "payer_group":           payer["payer_group"],
            "adtp_cycle_hits":       cycle_hits,
            "adtp_cycle_number":     week_count if cycle_hits else "",
            "forecasted_amount":     fmtf(forecast_amt),
            "claim_count_in_window": claim_count,
            "avg_historical_amount": fmtf(hist_avg),
            "model_confidence":      fmtf(confidence, 4),
            "forecast_range_low":    fmtf(round(forecast_amt * 0.85, 2)),
            "forecast_range_high":   fmtf(round(forecast_amt * 1.15, 2)),
            "model_version":         "prophet_lgbm_v1.0",
        })

    current += timedelta(weeks=1)

with open(out("payment_forecast.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(forecast_records[0].keys()))
    w.writeheader()
    w.writerows(forecast_records)
print(f"   → {len(forecast_records):,} forecast records  ({week_count} weeks × {len(PAYERS)} payers)")


# ---------------------------------------------------------------------------
# Dataset 13: bank_reconciliation.csv  — closes the cycle
#   Expected (forecast) vs Actual ERA received vs Bank deposit
# ---------------------------------------------------------------------------
print("[13/14] bank_reconciliation.csv ...")

# Aggregate actual ERA by payer + week
actual_by_payer_week = defaultdict(lambda: defaultdict(float))
for e in era_records:
    actual_by_payer_week[e["payer_id"]][e["payment_week_start"]] += float(e["payment_amount"])

# Build forecast lookup
forecast_lookup = {}
for f in forecast_records:
    forecast_lookup[(f["week_start_date"], f["payer_id"])] = float(f["forecasted_amount"])

recon_records = []
current = week_start(START_DATE)

while current <= END_DATE:
    week_end_d = current + timedelta(days=6)
    wk_str     = fmt(current)

    for payer in PAYERS:
        pid          = payer["payer_id"]
        forecasted   = forecast_lookup.get((wk_str, pid), 0.0)
        era_received = round(actual_by_payer_week[pid].get(wk_str, 0.0), 2)

        if forecasted < 1 and era_received < 1:
            current += timedelta(weeks=1) if pid == PAYERS[-1]["payer_id"] else timedelta(0)
            continue

        # Bank deposit = ERA ± small timing difference (ACH processing lag)
        bank_deposit = round(era_received * random.uniform(0.998, 1.002), 2) if era_received > 0 else 0.0

        fc_variance  = round(era_received - forecasted, 2)
        fc_var_pct   = round((fc_variance / forecasted * 100) if forecasted > 0 else 0, 4)
        era_bank_var = round(bank_deposit - era_received, 2)

        # Reconciliation status
        if era_received == 0 and forecasted > 0:
            status = "PENDING"
        elif abs(fc_var_pct) <= 5:
            status = "RECONCILED"
        elif abs(fc_var_pct) <= 15:
            status = "VARIANCE"
        else:
            status = "ESCALATED"

        reason = ""
        if status == "VARIANCE" and fc_variance < 0:
            reason = random.choice([
                f"{payer['payer_name']} claim volume lower than forecast window",
                f"Partial payment batch — COB adjustment pending",
                f"Holiday delay in {payer['payer_name']} processing",
            ])
        elif status == "VARIANCE" and fc_variance > 0:
            reason = random.choice([
                f"{payer['payer_name']} catch-up payment from prior cycle",
                f"Additional claims processed in batch",
            ])
        elif status == "ESCALATED":
            reason = f"Significant variance — requires manual review ({fc_var_pct:.1f}%)"

        recon_records.append({
            "recon_id":              f"RC{len(recon_records)+1:07d}",
            "week_start_date":       wk_str,
            "week_end_date":         fmt(week_end_d),
            "payer_id":              pid,
            "payer_name":            payer["payer_name"],
            "forecasted_amount":     fmtf(forecasted),
            "era_received_amount":   fmtf(era_received),
            "bank_deposit_amount":   fmtf(bank_deposit),
            "forecast_variance":     fmtf(fc_variance),
            "forecast_variance_pct": fmtf(fc_var_pct, 4),
            "era_bank_variance":     fmtf(era_bank_var),
            "reconciliation_status": status,
            "reconciled_date":       fmt(week_end_d + timedelta(days=2)) if status == "RECONCILED" else "",
            "reconciled_by":         f"USR{random.randint(100,999)}" if status == "RECONCILED" else "",
            "variance_reason":       reason,
            "fed_back_to_model":     status == "RECONCILED",
        })

    current += timedelta(weeks=1)

with open(out("bank_reconciliation.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(recon_records[0].keys()))
    w.writeheader()
    w.writerows(recon_records)

reconciled = sum(1 for r in recon_records if r["reconciliation_status"] == "RECONCILED")
print(f"   → {len(recon_records):,} recon records  ({reconciled/len(recon_records)*100:.1f}% reconciled)")


# ---------------------------------------------------------------------------
# Dataset 14: evv_visits.csv
# ---------------------------------------------------------------------------
print("[14/14] evv_visits.csv ...")
home_health_providers = [p for p in providers if p["specialty"] == "Home Health"]
hh_patients = random.sample(patients, min(N_EVV_VISITS // 3, N_PATIENTS))
evv_records = []
evv_service_codes = [("T1019","Personal Care Services"),("S5125","Attendant Care"),
                     ("G0156","Home Health Aide"),("G0162","Skilled Nursing Visit"),("S9123","Nursing Care")]

for i in range(N_EVV_VISITS):
    pt        = random.choice(hh_patients)
    visit_dt  = rand_date()
    scheduled_start_h = random.randint(7, 17)
    scheduled_dur     = random.choice([60, 90, 120, 180, 240])
    clock_in_offset   = random.randint(-10, 20)   # minutes early/late
    actual_dur        = scheduled_dur + random.randint(-30, 30)
    gps_dist          = random.randint(0, 800)    # feet from patient address
    gps_ok            = gps_dist <= 300
    time_ok           = abs(clock_in_offset) <= 15 and abs(actual_dur - scheduled_dur) <= 15
    caregiver_ok      = random.random() < 0.92
    service_code, service_desc = random.choice(evv_service_codes)
    aggregator  = random.choice(EVV_AGGREGATORS)

    # Determine status
    if gps_ok and time_ok and caregiver_ok:
        status = "VERIFIED"
        denial_code, denial_desc = "", ""
    elif not caregiver_ok:
        status = "DENIED"
        denial_code, denial_desc = random.choice(EVV_DENIAL_CODES[2:4])
    elif not gps_ok:
        status = "DENIED"
        denial_code, denial_desc = EVV_DENIAL_CODES[0]
    elif not time_ok:
        status = "EXCEPTION"
        denial_code, denial_desc = EVV_DENIAL_CODES[1]
    else:
        status = "EXCEPTION"
        denial_code, denial_desc = random.choice(EVV_DENIAL_CODES)

    billable = status == "VERIFIED"
    units    = round(actual_dur / 15, 1) if billable else 0

    evv_records.append({
        "evv_id":               f"EVV{i+1:07d}",
        "patient_id":           pt["patient_id"],
        "claim_id":             "",
        "caregiver_id":         f"CG{random.randint(1000,9999)}",
        "aggregator":           aggregator,
        "state_code":           pt["state"],
        "service_code":         service_code,
        "service_description":  service_desc,
        "visit_date":           fmt(visit_dt),
        "scheduled_start":      f"{scheduled_start_h:02d}:00:00",
        "scheduled_end":        f"{(scheduled_start_h + scheduled_dur//60):02d}:{(scheduled_dur%60):02d}:00",
        "actual_clock_in":      f"{scheduled_start_h:02d}:{clock_in_offset if clock_in_offset >= 0 else 60+clock_in_offset:02d}:00",
        "actual_clock_out":     f"{(scheduled_start_h + actual_dur//60):02d}:{(actual_dur%60):02d}:00",
        "scheduled_duration_min": scheduled_dur,
        "actual_duration_min":  actual_dur,
        "gps_verified":         gps_ok,
        "gps_distance_at_in_ft": gps_dist,
        "gps_distance_at_out_ft": random.randint(0, 500),
        "clock_in_method":      random.choice(["MOBILE_APP","MOBILE_APP","MOBILE_APP","TELEPHONY","FOB"]),
        "caregiver_signature":  caregiver_ok,
        "patient_signature":    random.random() < 0.85,
        "evv_status":           status,
        "evv_denial_code":      denial_code,
        "evv_denial_description": denial_desc,
        "billable":             billable,
        "billing_hold_reason":  denial_desc if not billable else "",
        "units_scheduled":      fmtf(scheduled_dur / 15, 1),
        "units_verified":       fmtf(units, 1),
    })

with open(out("evv_visits.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(evv_records[0].keys()))
    w.writeheader()
    w.writerows(evv_records)

verified = sum(1 for e in evv_records if e["evv_status"] == "VERIFIED")
print(f"   → {len(evv_records):,} EVV visits  ({verified/len(evv_records)*100:.1f}% verified)")


# ---------------------------------------------------------------------------
# SUMMARY REPORT
# ---------------------------------------------------------------------------
print("\n" + "=" * 60)
print("GENERATION COMPLETE")
print("=" * 60)
files = [f for f in os.listdir(OUT_DIR) if f.endswith(".csv")]
total_rows = 0
for fname in sorted(files):
    fpath = os.path.join(OUT_DIR, fname)
    with open(fpath) as f:
        rows = sum(1 for _ in f) - 1
    total_rows += rows
    size_kb = os.path.getsize(fpath) // 1024
    print(f"  {fname:<35}  {rows:>9,} rows  {size_kb:>6} KB")
print(f"\n  {'TOTAL':35}  {total_rows:>9,} rows")
print(f"\n  Output directory: {OUT_DIR}")
print("=" * 60)
