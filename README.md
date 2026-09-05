# ReturnShield AI 🛡️
### AI-Powered Refund & Return Risk Management Engine for Razorpay Merchants

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?style=flat-square&logo=scikit-learn)](https://scikit-learn.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> **Notice:** *ReturnShield AI is an independent, developer-built demonstration platform designed around the payment → order → delivery → refund lifecycle of merchants using the Razorpay payment gateway. It operates on realistic synthetic transaction datasets (`pay_synth_...`, `rfnd_synth_...`) and does not claim official endorsement or direct integration by Razorpay.*

---

## 🎯 Core Value Proposition

> *"ReturnShield AI bridges the gap between payment gateway intelligence and post-purchase refund risk management. Rather than evaluating refund claims in isolation, it analyzes the entire **Payment → Order → Delivery → Refund lifecycle**. By establishing an individualized behavioral baseline for every customer, spotting behavioral drift, explaining decisions via plain-English forensic briefings and SHAP attributions, and optimizing approval thresholds on an economic trade-off basis, ReturnShield protects merchants from serial refund fraud while preserving a frictionless experience for legitimate shoppers."*

---

## 📑 Table of Contents

- [Core Value Proposition](#-core-value-proposition)
- [Comprehensive Feature Tour](#-comprehensive-feature-tour)
  - [1. Plain-English Forensic Case Briefing ("The Red Flags Explained")](#1-plain-english-forensic-case-briefing-the-red-flags-explained)
  - [2. Complete 7-Stage Transaction Lifecycle Timeline](#2-complete-7-stage-transaction-lifecycle-timeline)
  - [3. Razorpay Merchant Risk Overview Dashboard & Funnel](#3-razorpay-merchant-risk-overview-dashboard--funnel)
  - [4. Interactive Live Risk Sandbox (5 Scenario Presets)](#4-interactive-live-risk-sandbox-5-scenario-presets)
  - [5. Refund & Return Cases Triage](#5-refund--return-cases-triage)
  - [6. Client Risk Directory & Synchronized Standing](#6-client-risk-directory--synchronized-standing)
  - [7. What-If Threshold Simulator (Economic Trade-Offs)](#7-what-if-threshold-simulator-economic-trade-offs)
  - [8. Rigorous Model Evaluation (Held-Out Test Set)](#8-rigorous-model-evaluation-held-out-test-set)
  - [9. Continuous Monitoring & Active Learning Feedback Loop](#9-continuous-monitoring--active-learning-feedback-loop)
- [Model Architecture & Performance](#-model-architecture--performance)
- [Six Core Technical Innovations](#-six-core-technical-innovations)
- [Project Architecture & File Tree](#-project-architecture--file-tree)
- [Quick Start Guide](#-quick-start-guide)
- [API Reference](#-api-reference)
- [Curated Demo Walkthrough (Spotlight: Case #142)](#-curated-demo-walkthrough-spotlight-case-142)
- [Defense-Only Ethical Guarantee](#-defense-only-ethical-guarantee)

---

## 🌟 Comprehensive Feature Tour

### 1. Plain-English Forensic Case Briefing ("The Red Flags Explained")
Located prominently at the top of the **Case Detail** page (`/returns/:id`) and beside the **Human Reviewer Panel**, this card translates complex machine learning outputs into a gripping, plain-English detective breakdown:

* **🚨 Red Flag #1: An "Impossible" Timeline (The Biggest Giveaway):**
  * Detects synthetic anomaly conflicts between customer claims and carrier delivery tracking.
  * Look at what the customer wrote vs. when the package arrived:
    > **Refund Request Filed:** 3 Sept, 07:07 pm  
    > **Customer Claimed:** *"Screen flickering & rapid battery drain after 48 hours of delivery"*  
    > **Actual Courier Delivery:** 4 Sept, 07:07 pm *(Courier confirmed package delivered a full day later!)*  
    > 
    > *How could the customer test the device for "48 hours" on September 3rd when the courier didn't even deliver the package until September 4th? Fraudsters frequently use automated or copy-pasted dispute templates and submit claims prematurely without checking carrier tracking.*
* **📈 Red Flag #2: Sudden 7.5× Surge in Return Rate (Severe Behavioral Drift):**
  * Compares historical baseline (8.2% return rate) against recent activity (61.4% return rate). Explains in simple terms that the buyer is now returning nearly 6 out of every 10 purchases (+648% increase, $+3.8\sigma$ deviation).
* **⚡ Red Flag #3: Claim Frequency Accelerated to Weekly:**
  * Compares baseline return frequency (once every 2–3 months) against current velocity (3+ claims per month, nearly weekly returns).
* **💰 Red Flag #4: High-Ticket Claim Anomaly:**
  * Flags claims (₹26,990) that are over $20\times$ higher than the customer's typical historical return size (₹1,200).
* **🛡️ Account Tenure Safeguard (Why on HOLD instead of Banned?):**
  * Transparently explains why the account wasn't auto-terminated: established account age (310 days) and zero prior verified fraud strikes trigger a protective **HOLD** routing to human verification rather than an aggressive auto-ban.
* **🎯 Reviewer Action Guidance:**
  * Provides actionable next steps: *"HOLD FOR MANUAL INSPECTION (DO NOT AUTO-REFUND) — Verify physical device serial number/IMEI and package weight upon retrieval before releasing payout."*

---

### 2. Complete 7-Stage Transaction Lifecycle Timeline (`CustomerTimeline.jsx`)
Chronologically connects every refund request back to its authorized payment gateway capture:
1. `PAYMENT` — Authorization & capture via UPI, NetBanking, or Credit Card on Razorpay network (`pay_synth_...`).
2. `ORDER` — Order placement and fulfillment routing to warehouse.
3. `DELIVERY` — Courier transit confirmation with electronic proof-of-delivery timestamp.
4. `REFUND_REQUEST` — Buyer claim initiation with stated reason and claim amount.
5. `AI_ASSESSMENT` — Calibrated risk score ($0\text{--}100$), SHAP feature contributions, and plain-English summary.
6. `RECOMMENDED_ACTION` — System recommendation: `ALLOW`, `MANUAL REVIEW`, or `ENHANCED VERIFICATION`.
7. `REVIEWER_DECISION` — Human investigator verdict (`APPROVE`, `HOLD`, `REJECT`) with ground-truth feedback recorded for future model retraining and calibration.

---

### 3. Razorpay Merchant Risk Overview Dashboard & Funnel (`Dashboard.jsx`)
- **Operational & Financial KPIs:** Real-time tracking of Total Captured Payments, Refund Requests, High-Risk Flagged Claims, Held for Review, Expected Financial Exposure (₹), Loss Prevented (₹), and False-Positive Churn Cost (₹).
- **Payment &rarr; Refund Risk Funnel:** 5-stage conversion pipeline:
  $$\text{Captured Payments (₹14.5L)} \longrightarrow \text{Refund Requests (₹3.8L)} \longrightarrow \text{High-Risk Flagged (₹1.85L)} \longrightarrow \text{Held for Review (₹98k)} \longrightarrow \text{Prevented Loss (₹89k)}$$
- **Risk Severity Breakdown:** Donut chart breakdown across `LOW` ($0\text{--}39$), `MEDIUM` ($40\text{--}69$), and `HIGH` ($70\text{--}100$) risk tiers.
- **14-Day Cumulative Loss Trajectory:** Recharts trajectory of Expected Financial Exposure vs. Merchant Loss Prevented.

---

### 4. Interactive Live Risk Sandbox (`TestReturnModal.jsx`)
Allows risk officers, developers, and demo evaluators to score custom transaction combinations in real time without altering database records. Includes **5 Curated Scenario Presets**:
- 🛡️ **Normal Customer:** Healthy payment-to-refund ratio, low return frequency ($12/100$ Low Risk).
- ⚡ **Refund Burst:** 4 refund claims filed within 7 days across recent purchases ($98/100$ High Risk).
- 🚨 **Behavioral Drift:** Long-standing customer with lifetime 5% return rate suddenly requesting ₹11,800 refund on multiple orders ($91/100$ High Risk).
- 💎 **High-Value Refund:** Large-ticket claim (₹26,500) disproportionate to previous account history ($89/100$ High Risk).
- ⚖️ **Borderline Customer:** Mixed trust signals, 12 lifetime payments, 3 returns ($58/100$ Medium Risk).

---

### 5. Refund & Return Cases Triage (`ReturnCases.jsx`)
- **Interactive Status Tabs:**
  - `All Claims (142)`
  - `⚡ Pending Decision (42)` — with live pulse beacon for claims awaiting merchant action.
  - `On Hold (38)` — claims held for receipt inspection or package weighing.
  - `Approved (27)` — verified legitimate refunds authorized for payout.
  - `Rejected (35)` — confirmed abuse blocked.
- **Rich Table Grid:** Displays customer name, linked Payment ID (`pay_synth_...`), payment method badge, claim amount, category, calibrated risk gauge, and recommended action.

---

### 6. Client Risk Directory & Synchronized Standing (`ClientsDirectory.jsx`)
- **Centralized Customer Roster:** Displays lifetime payments, refund counts, total transaction values, and account standing.
- **5 Standing Filter Tabs:** `All`, `Pending`, `Accept`, `Hold`, and `Reject`.
- **Bidirectional Status Sync:** Submitting a reviewer decision on a case (e.g. `REJECT` or `HOLD`) automatically updates and synchronizes that customer's standing across the entire directory.

---

### 7. What-If Threshold Simulator (Economic Trade-Offs) (`ThresholdSimulator.jsx`)
- **Economic Trade-Off Optimization:** Demonstrates why risk thresholds must be chosen on **economic trade-offs rather than classification accuracy alone**:
  > *"A false positive costs customer lifetime value (LTV churn), while a false negative costs the full unrecovered refund payout."*
- **5-Stage Conceptual Decision Chain:** Evaluates the complete economic progression dynamically across all 1,483 held-out test transactions:
  $$\text{Risk Threshold} \longrightarrow \text{ML Performance} \longrightarrow \text{Customer Cost} \longrightarrow \text{Merchant Loss} \longrightarrow \text{Economic Benefit}$$
- **Real-Time Dynamic Calculations:**
  * **Threshold:** Continuous slider ($0\text{--}100$)
  * **ML Performance:** Precision, Recall, False Positive Rate (FPR), False Negative Rate (FNR)
  * **Interception Volume:** Cases Flagged, Abuse Cases Prevented (True Positives)
  * **Financial Impact:** Expected Financial Exposure (₹), Expected Loss Prevented (₹), False-Positive Churn Cost (₹), Reviewer Cost (₹), and Net Economic Benefit (₹)
- **Optimal Economic Threshold (40/100):** Maximizes Net Economic Benefit ($+\text{₹}1,567,220$) by intercepting 673 fraudulent refunds (preventing ₹1,931,510 in direct losses) while keeping customer churn friction (₹246,240) and manual review expenses (₹118,050) economically balanced.
- **Dynamic Trade-Off Matrix:**

| Threshold | Precision | Recall | FPR | FNR | Cases Flagged | Abuse Prevented | FP Cost | Review Cost | Loss Prevented | Net Benefit |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **40** (Optimal) | **85.5%** | **84.6%** | **16.6%** | **15.5%** | **787** | **673** | **₹246,240** | **₹118,050** | **₹1,931,510** | **+₹1,567,220** ⭐ |
| **50** | 88.0% | 80.2% | 12.7% | 19.9% | 725 | 638 | ₹187,920 | ₹108,750 | ₹1,831,060 | +₹1,534,390 |
| **60** | 91.9% | 75.2% | 7.7% | 24.8% | 652 | 599 | ₹114,480 | ₹97,800 | ₹1,719,130 | +₹1,506,850 |
| **65** | 93.0% | 73.2% | 6.4% | 26.8% | 627 | 583 | ₹95,040 | ₹94,050 | ₹1,673,210 | +₹1,484,120 |
| **70** | 94.2% | 71.5% | 5.1% | 28.5% | 604 | 569 | ₹75,600 | ₹90,600 | ₹1,633,030 | +₹1,466,830 |
| **80** | 96.7% | 66.6% | 2.6% | 33.4% | 548 | 530 | ₹38,880 | ₹82,200 | ₹1,521,100 | +₹1,400,020 |

---

### 8. Rigorous Model Evaluation (`ModelEvaluation.jsx`)
- **Held-Out Test Set Verification:** Evaluated exclusively on 1,483 held-out test samples (20% stratified split of 7,413 synthetic refund cases evaluated with payment/order history, never seen during training).
- **Confusion Matrix:** True Negatives ($509$), False Positives ($178$), False Negatives ($95$), True Positives ($701$).
- **ROC (0.9248) & PR (0.9409) Curves:** High precision and strong discrimination across recall bands on imbalanced fraud distributions with 37 behavioral features.

---

### 9. Continuous Monitoring & Active Learning Feedback Loop (`ModelMonitoring.jsx`)
- **Ground-Truth Label Collection (Batch Retraining Design):** Human reviewer verdicts log validated feedback labels (`TRUE_POSITIVE`, `FALSE_POSITIVE`, `TRUE_NEGATIVE`, `FALSE_NEGATIVE`) to establish an authenticated ground-truth dataset. To preserve statistical stability and prevent feedback loops, model weights are **never** mutated automatically on single clicks; model retraining and probability recalibration are executed via explicit scheduled batch runs or CLI invocations (`python data/train_model.py`).
- **Category Drift Anomaly Tracking:** Monitors deviations in baseline return rates across product categories (Electronics, Fashion, Home, Furniture, Books, Sports, Beauty) against established historical tolerances.
- **Precision & Recall Stability:** Tracks running performance curves over 8-week monitoring horizons to proactively alert risk operations teams before model degradation affects merchants.

---

## 📊 Model Architecture & Performance

The core machine learning engine uses a **Gradient Boosting Classifier** calibrated with **Isotonic Regression** (`CalibratedClassifierCV`) trained across **37 behavioral features** (22 order/return baseline features + 15 payment and refund lifecycle signals).

### Performance on Held-Out Test Set (1,483 Samples)

| Metric | Value | Business Meaning |
|:---|:---|:---|
| **Precision** | **79.75%** | When ReturnShield flags abuse, it is correct in ~80% of cases. |
| **Recall** | **88.07%** | Successfully catches over 88% of all abusive refund requests. |
| **F1 Score** | **83.70%** | Balanced harmonic mean of precision and recall. |
| **Accuracy** | **81.59%** | Overall classification accuracy across held-out transactions. |
| **ROC-AUC** | **0.9248** | Superior discrimination between legitimate shoppers and serial abusers. |
| **PR-AUC** | **0.9409** | High precision maintained across the recall curve on imbalanced data. |
| **False Positive Rate** | **25.91%** | Controlled rate of routing legitimate transactions to manual verification. |
| **False Negative Rate** | **11.93%** | Low rate of missed abuse (under 12%). |

```
Confusion Matrix (Held-Out Test Set: 1,483 Samples):
                   Predicted Legit    Predicted Abuse
  Actual Legit         TN: 509            FP: 178
  Actual Abuse         FN:  95            TP: 701
```

### Expanded 37-Feature Behavioral Space

The retrained model incorporates **15 concrete payment & refund lifecycle features** alongside the 22 order/return baseline features, bridging payment gateway transactions directly to post-purchase risk:

| Signal Category | Feature Name | Business & Forensic Significance |
|:---|:---|:---|
| **Payment Lifecycle** | `payment_amount` | Authorized & captured transaction value in INR. |
| **Refund Lifecycle** | `refund_amount` | Direct financial exposure requested by the customer. |
| **Velocity (7-Day)** | `payment_count_7d`, `refund_count_7d` | High-frequency bursts indicating coordinated or automated card testing/dispute rings. |
| **Velocity (30-Day)** | `payment_count_30d`, `refund_count_30d` | Rolling monthly velocity establishing immediate acceleration trends. |
| **Cadence & Ratios** | `payment_frequency`, `refund_frequency` | Claims filed per month vs. purchase cadence. |
| **Dispute Acceleration** | `transaction_velocity` | Proportion of 30-day activity occurring within the last 7 days. |
| **Dispute Ratios** | `refund_to_payment_ratio` | Cumulative refund volume divided by lifetime captured payments. |
| **Refund Depth** | `historical_refund_rate`, `current_refund_rate` | Lifetime customer dispute percentage vs. 30-day recent dispute percentage. |
| **Timing Delta** | `time_between_payment_and_refund`, `days_since_payment` | Elapsed days from gateway capture to claim submission. |
| **Personal Norms** | `baseline_deviation`, `drift_score` | Standard deviations ($\sigma$) and exponential drift away from personal baseline. |
| **Integrity Flags** | `verified_abuse_history`, `return_burst_flag` | Confirmed prior merchant strikes and multi-claim clustering. |

#### Top 10 Feature Importances (From Retrained Model)

| Rank | Feature | Importance | Category |
|:---:|:---|:---:|:---|
| 1 | `historical_refund_rate` | **21.23%** | Refund Lifecycle |
| 2 | `historical_return_rate` | **20.94%** | Return Baseline |
| 3 | `verified_abuse_history` | **16.37%** | Integrity History |
| 4 | `return_to_order_ratio` | **11.09%** | Customer Behavioral Baseline |
| 5 | `refund_to_payment_ratio` | **6.36%** | Payment/Refund Ratio |
| 6 | `drift_score` | **4.51%** | Behavioral Drift |
| 7 | `baseline_deviation` | **3.82%** | Behavioral Drift ($\sigma$) |
| 8 | `category_return_rate` | **3.10%** | Category Risk |
| 9 | `payment_frequency` | **2.45%** | Payment Cadence |
| 10 | `transaction_velocity` | **2.01%** | Lifecycle Velocity |

---

## 🧠 Six Core Technical Innovations

1. **Personal Customer Behavioral Baseline:** Instead of relying on rigid universal thresholds, the system computes $\mu \pm \sigma$ for each customer's historical order frequency, return rate, and average claim value.
2. **Exponential Behavior Drift Scoring:** A $0\text{--}100$ score capturing sudden behavioral shifts (e.g. a customer with an 8.2% return rate over 10 months suddenly returning 61.4% of orders, $+3.8\sigma$ deviation).
3. **Forensic Timeline Anomaly Detection:** Flags premature or impossible claim submissions (e.g. refund filed claiming "48 hours of use" before courier delivery confirmation).
4. **SHAP TreeExplainer Factor Decomposition:** Translates complex tree ensembles into human-readable signal bars showing both positive (risk) and negative (trust) contributions.
5. **Expected Financial Exposure Engine:** Quantifies the net economic impact of every decision:
   $$\text{Net Savings} = (\text{Abuse Probability} \times \text{Refund Amount}) - \text{False Positive Cost} - \text{Review Cost}$$
6. **Active Learning Feedback Pipeline:** Reviewer verdicts capture validated ground-truth labels (`TRUE_POSITIVE`, `FALSE_POSITIVE`, `TRUE_NEGATIVE`, `FALSE_NEGATIVE`) to establish an authenticated dataset for scheduled model retraining and probability calibration.

---

## 🗂️ Project Architecture & File Tree

```
ShieldApp/
├── start.ps1                        # One-click startup script (backend + frontend)
├── README.md                        # Platform documentation & user guide
├── backend/
│   ├── requirements.txt             # Python dependencies
│   ├── returnshield.db              # SQLite database
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint
│   │   ├── database.py              # SQLite + SQLAlchemy session setup
│   │   ├── auth.py                  # JWT creation & bcrypt validation
│   │   ├── config.py                # Environment configuration
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── customer.py          # Customer profile & account status
│   │   │   ├── order.py             # Order records & payment details
│   │   │   ├── return_request.py    # Return requests & risk scores
│   │   │   ├── product.py           # Catalog items & categories
│   │   │   ├── risk_assessment.py   # SHAP features & drift scores
│   │   │   └── reviewer_decision.py # Human reviewer verdict & feedback
│   │   ├── routers/                 # REST API endpoints
│   │   │   ├── auth.py              # Authentication endpoints
│   │   │   ├── dashboard.py         # Summary KPIs & loss trends
│   │   │   ├── returns.py           # Paginated returns & real-time scoring
│   │   │   ├── customers.py         # Clients directory & status overrides
│   │   │   ├── decisions.py         # Verdict submission & client synchronization
│   │   │   ├── simulator.py         # What-If threshold simulation
│   │   │   └── metrics.py           # Evaluation metrics & drift monitoring
│   │   ├── ml/
│   │   │   ├── feature_engineering.py  # 37 behavioral feature extractors (22 baseline + 15 payment/refund)
│   │   │   ├── model_inference.py      # Probability calibration & scoring
│   │   │   ├── explainability.py       # SHAP TreeExplainer & plain-English summaries
│   │   │   └── model_artifacts/        # Serialized model, scaler, & metrics JSON
│   │   └── services/
│   │       ├── risk_engine.py          # End-to-end risk scoring pipeline
│   │       ├── financial_engine.py     # Expected loss & FP cost calculations
│   │       └── seed_data.py            # Demo database seeder
│   └── data/
│       ├── generate_dataset.py      # Synthetic dataset generator (7,413 refund cases evaluated with payment/order history)
│       └── train_model.py           # Model training & held-out test evaluation
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                  # Protected routing setup
        ├── api/client.js            # Axios client with JWT interceptor
        ├── context/AuthContext.jsx  # Persistent authentication state
        ├── pages/
        │   ├── Login.jsx            # Secure login page with demo autofill
        │   ├── Dashboard.jsx        # Merchant executive overview & funnel
        │   ├── ReturnCases.jsx      # Return cases triage with status tabs
        │   ├── CaseDetail.jsx       # Deep-dive forensic case analysis & red flags
        │   ├── ClientsDirectory.jsx # Client directory with status filters & overrides
        │   ├── ThresholdSimulator.jsx# Interactive What-If threshold slider
        │   ├── ModelEvaluation.jsx  # Held-out test set metrics & curves
        │   └── ModelMonitoring.jsx  # Category drift & precision monitoring
        └── components/
            ├── Sidebar.jsx          # Collapsible navigation sidebar
            ├── RiskScoreGauge.jsx   # Animated circular 0-100 risk gauge
            ├── ExplainableAICard.jsx# SHAP attribution waterfall chart
            ├── BehaviorDriftCard.jsx# Personal baseline vs. current behavior
            ├── FinancialImpactCard.jsx # Business financial risk calculations
            ├── CustomerTimeline.jsx # 7-stage chronological event stream
            ├── ConfusionMatrix.jsx  # Color-coded 2x2 confusion matrix
            ├── TestReturnModal.jsx  # Interactive live sandbox modal
            └── RiskBadge.jsx        # Colored severity pill badges
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+** installed and available in PATH
- **Node.js 18+** installed

### Option A: One-Click Startup (Windows PowerShell)
From the root `ShieldApp` directory, simply run:
```powershell
.\start.ps1
```
This script will:
1. Verify Python and Node environments.
2. Train the ML model and create the database if not already present.
3. Install dependencies for backend and frontend.
4. Launch the FastAPI server (`http://127.0.0.1:8000`) and Vite dev server (`http://localhost:5173`).

---

### Option B: Manual Step-by-Step Setup

#### 1. Backend Setup
```powershell
cd backend

# Install dependencies
pip install -r requirements.txt

# Generate synthetic dataset (7,413 synthetic refund/return cases evaluated with payment/order history)
python data/generate_dataset.py

# Train ML model and evaluate on held-out test set
python data/train_model.py

# Start the FastAPI server with reload
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```powershell
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev -- --host
```

#### 3. Log In to Dashboard
Open **http://localhost:5173** in your browser:
- **Email:** `merchant@demo.com`
- **Password:** `demo123`
*(Or click "Use Demo Credentials" on the login page)*

---

## 🔌 API Reference

All backend API routes are prefixed with `/api/v1` and fully documented via interactive Swagger UI at **http://127.0.0.1:8000/docs**.

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/health` | Server health check and database status |
| `POST` | `/api/v1/auth/login` | Authenticate merchant and issue JWT bearer token |
| `GET` | `/api/v1/auth/me` | Fetch currently authenticated user details |
| `GET` | `/api/v1/dashboard/summary` | Retrieve executive KPIs, funnel, risk distributions, and loss trends |
| `GET` | `/api/v1/returns` | List return requests with `status`, `risk_level`, and pagination filters |
| `POST` | `/api/v1/returns/score` | Score an incoming return request in real time |
| `GET` | `/api/v1/returns/{id}` | Retrieve complete case forensics, red flags, and SHAP explanations |
| `GET` | `/api/v1/returns/{id}/timeline` | Retrieve customer 7-stage chronological activity timeline |
| `POST` | `/api/v1/decisions/{id}` | Submit human reviewer verdict (`APPROVE`, `HOLD`, `REJECT`) |
| `GET` | `/api/v1/customers` | List all merchant clients with `status` filter (`PENDING`, `ACCEPT`, `HOLD`, `REJECT`) |
| `GET` | `/api/v1/customers/{id}` | Customer profile and behavioral analytics |
| `PATCH` | `/api/v1/customers/{id}/status` | Admin override of client standing (`ACTIVE`, `HOLD`, `REJECTED`) |
| `POST` | `/api/v1/simulator/what-if` | Compute precision, recall, and economic benefit for a given threshold |
| `GET` | `/api/v1/metrics/evaluation` | Held-out test set metrics, confusion matrix, ROC/PR curves |
| `GET` | `/api/v1/metrics/drift` | Track weekly volume, category drift alerts, and precision history |
| `GET` | `/api/v1/demo/trigger-new-return` | Generate and score a synthetic incoming return request for demos |

---

## 🎭 Curated Demo Walkthrough (Spotlight: Case #142)

ReturnShield AI comes pre-seeded with distinct customer archetypes demonstrating each risk category. **Case #142** is the premier demo case:

### Spotlight: Case #142 (Kavita Nair — Electronics Claim)
Navigate to **`http://localhost:5173/returns/142`** to showcase the full engine in action:

1. **The Impossible Timeline Giveaway:**
   - Notice the refund request date (**3 Sept, 07:07 pm**) claiming *"Screen flickering after 48 hours of delivery"*, versus the actual carrier delivery date (**4 Sept, 07:07 pm**). Point out how serial abusers copy-paste boilerplates before tracking updates.
2. **Behavioral Drift Explosion:**
   - Show how Kavita had an established 8.2% return rate that suddenly spiked to 61.4% (returning 6 out of every 10 purchases, $+3.8\sigma$ deviation).
3. **Weekly Claim Acceleration:**
   - Point out refund frequency accelerating from once every 2–3 months to 3+ claims per month.
4. **Value Shock:**
   - Point out the claim amount of ₹26,990 vs. her typical average return size of ₹1,200.
5. **Human-in-the-Loop Verdict Submission:**
   - Click **`Hold for Review`**, enter notes (*"Package weight and serial number verified with logistics"*), select feedback label **`True Positive`**, and click **`Save Reviewer Decision`**.
   - Notice the immediate status update and automatic synchronization in the **Clients Directory** (`/clients`).

### Curated Demo Personas:

| Customer | Archetype / Case | Key Behavior Signals | What to Showcase |
|:---|:---|:---|:---|
| **Kavita Nair** (Case #142) | **Severe Behavioral Drift & Timeline Anomaly** | 8.2% baseline return rate surged to 61.4% (+3.8σ anomaly); premature claim filed 24h prior to courier delivery tracking. | Spotlight Case #142: Impossible timeline, drift comparison card, SHAP waterfall, and hold workflow. |
| **Raj Sharma** (Customer #1) | **Repeat High-Value Abuser** | Confirmed prior verified fraud strikes; repeated high-ticket electronics claims (₹1.16L total volume); account set to REJECTED. | Multi-claim history, verified abuse badge, and bidirectional client standing synchronization. |
| **Priya Patel** | **Serial Return Burst** | 5 returns requested within 72 hours across 3 categories. | Return burst flag, transaction velocity counters, and abnormal timing heuristics. |
| **Amit Verma** | **Verified Prior Abuser** | Confirmed prior refund fraud strike on record; new high-value electronics claim. | Immediate block recommendation, elevated expected loss, and verified abuse badge. |
| **Divya Singh** | **New Account Risk** | Account created 15 days ago; returns 25% of purchases on early orders. | How new account tenure and lack of baseline history elevate risk weightings. |
| **Uma Devi** | **Legitimate Safe Shopper** | 12 orders, 3 returns (25% return rate within normal category baseline bounds). | Negative (trust) SHAP signals driving risk score down into the green tier. |

---

## 🛡️ Defense-Only Ethical Guarantee

ReturnShield AI is built strictly as a **defensive security and loss prevention system**:
1. **No Exploitation Guidance:** The system strictly analyzes incoming signals and **never** generates advice or workflows on how to bypass fraud checks or manipulate return policies.
2. **Explainable Auditing:** All risk decisions are transparent, interpretable, and auditable by human compliance officers.
3. **Customer Protection:** The false-positive cost optimizer explicitly penalizes the system for falsely flagging innocent shoppers, ensuring legitimate customers are not wrongfully denied service.
4. **Human-in-the-Loop Safeguards:** High-risk actions on established accounts default to manual review or courier verification (`HOLD`) rather than arbitrary auto-banning.

---

## ⚖️ License

Distributed under the **MIT License**. See `LICENSE` for more information.
