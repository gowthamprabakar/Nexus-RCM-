# RCM Pulse — Connectors & Integrations

## Overview
The connectors layer handles all external integrations — payer clearinghouses, EHR/EMR systems, payment processors, EVV platforms, and government APIs.

---

## Integration Categories

### 1. Payer Clearinghouses
| Connector | Protocol | Status |
|---|---|---|
| Availity | REST API | Planned |
| Change Healthcare | EDI 837/835 | Planned |
| Waystar | REST API | Planned |
| Office Ally | SFTP + EDI | Planned |

### 2. EHR / EMR Systems
| System | Protocol | Status |
|---|---|---|
| Epic | FHIR R4 | Planned |
| Cerner / Oracle Health | FHIR R4 | Planned |
| AdvancedMD | REST API | Planned |

### 3. EVV Platforms
| System | Protocol | Status |
|---|---|---|
| Sandata | REST API | Planned |
| HHAeXchange | REST API | Planned |
| CareBridge | REST API | Planned |

### 4. Payment Processors
| System | Protocol | Status |
|---|---|---|
| Stripe | REST API | Planned |
| InstaMed | REST API | Planned |

### 5. Government / Compliance APIs
| API | Purpose | Status |
|---|---|---|
| CMS Medicare API | Eligibility, Claims | Planned |
| Medicaid State APIs | EVV, Claims | Planned |
| NPI Registry | Provider Validation | Planned |

---

## Folder Structure (Planned)
```
connectors/
├── clearinghouse/
│   ├── availity/
│   ├── change_healthcare/
│   └── waystar/
├── ehr/
│   ├── epic_fhir/
│   └── cerner_fhir/
├── evv/
│   ├── sandata/
│   └── hhaexchange/
├── payments/
│   └── stripe/
├── government/
│   └── cms/
├── shared/              # Shared auth, retry logic, base client
└── README.md
```

---

## Getting Started (Once Implemented)
```bash
cd connectors
pip install -r requirements.txt
# Configure credentials in .env
cp .env.example .env
python shared/test_connection.py
```
