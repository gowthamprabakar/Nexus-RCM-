# RCM Pulse — AI Engine

## Overview
The AI engine powers the intelligent features of the RCM platform including:
- **Denial Prediction** — ML model to predict claim denials before submission
- **Auto-Fix Engine** — Automated correction of claim errors (modifier, coding)
- **Revenue Forecasting** — Predictive cash flow modeling
- **Payer Behavior Analysis** — Pattern detection from payer adjudication history
- **Propensity Scoring** — Patient payment likelihood scoring for collections
- **LIDA Chat** — LLM-powered conversational analytics assistant

---

## Planned Stack
| Component | Technology |
|---|---|
| ML Framework | scikit-learn, XGBoost, PyTorch |
| LLM Integration | OpenAI GPT-4 / Google Gemini |
| Model Serving | FastAPI + ONNX Runtime |
| Experiment Tracking | MLflow |
| Feature Store | Feast |
| Orchestration | Prefect / Airflow |

---

## Folder Structure (Planned)
```
ai/
├── models/
│   ├── denial_prediction/     # Training + inference
│   ├── auto_fix/              # Claim correction model
│   ├── revenue_forecast/      # Time-series forecasting
│   └── propensity_score/      # Patient payment likelihood
├── pipelines/                 # Data pipelines (ETL → Feature → Train)
├── serving/                   # Model API endpoints
├── notebooks/                 # Exploratory analysis
├── tests/
└── requirements.txt
```

---

## Key Models
| Model | Type | Target Metric |
|---|---|---|
| Denial Predictor | XGBoost Classifier | AUC > 0.92 |
| Auto-Fix | Rule + ML Hybrid | Accuracy > 98% |
| Revenue Forecast | LSTM / Prophet | MAPE < 5% |
| Propensity Score | Logistic Regression | AUC > 0.85 |

---

## Getting Started (Once Implemented)
```bash
cd ai
pip install -r requirements.txt
python serving/server.py
# AI API available at http://localhost:8001
```
