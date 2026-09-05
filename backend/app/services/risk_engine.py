"""
ReturnShield AI — Risk Engine (Razorpay Merchant Risk Engine)
Orchestrates: feature extraction → model inference → score calibration
→ SHAP explanation → dynamic decision summary → financial impact.
"""
import json
from datetime import datetime
from typing import Optional

from app.ml import model_inference, explainability, feature_engineering
from app.services.financial_engine import calculate_financial_impact


def score_return_request(
    customer_data: dict,
    return_request: dict,
    db=None,
) -> dict:
    """
    Full pipeline for scoring a new refund/return request.
    Returns a complete risk assessment dict ready for storage and API response.
    """
    category = return_request.get("category", "Home")
    refund_amount = float(return_request.get("amount", return_request.get("refund_amount", 0.0)))
    payment_amount = float(return_request.get("payment_amount", refund_amount * 1.15))

    # 1. Extract behavioral features (both core 22 model features and extended payment signals)
    features = feature_engineering.extract_features(customer_data, return_request, db)

    # 2. Compute personal baseline
    baseline = {}
    if db is not None:
        baseline = feature_engineering.compute_personal_baseline(
            customer_data.get("id", 0), db
        )

    # 3. Compute drift score & baseline deviation
    drift_score = features.get("drift_score", 0.0)
    baseline_deviation = features.get("baseline_deviation", 0.0)

    # 4. Run Calibrated ML model
    prediction = model_inference.predict(features)
    abuse_probability = prediction["abuse_probability"]
    risk_score = prediction["risk_score"]
    risk_level = prediction["risk_level"]
    recommended_action = prediction["recommended_action"]

    # 5. Generate SHAP-based explanations & plain-English decision summary
    model_artifacts = model_inference.load_model()
    explanations = explainability.explain_prediction(
        features, model_artifacts, risk_score, top_n=7
    )
    summary_text = explainability.generate_summary_text(
        explanations, risk_level, drift_score
    )
    decision_summary = explainability.generate_decision_summary(
        features, risk_score, drift_score, baseline_deviation, explanations
    )

    # 6. Detect interpretable patterns
    patterns = detect_patterns(features, drift_score, baseline_deviation)

    # 7. Financial impact (Expected Loss / Financial Exposure)
    avg_order_value = features.get("avg_order_value", payment_amount)
    avg_order_frequency = max(1.0, features.get("order_frequency", 2.0))
    orders_per_year = avg_order_frequency * 12
    financial = calculate_financial_impact(
        abuse_probability=abuse_probability,
        return_amount=refund_amount,
        category=category,
        avg_order_value=avg_order_value,
        orders_per_year=orders_per_year,
    )

    # 8. Build behavioral comparison for display
    behavioral_comparison = _build_behavioral_comparison(features, baseline, category)

    return {
        # Core prediction
        "risk_score": risk_score,
        "risk_level": risk_level,
        "abuse_probability": round(abuse_probability, 4),
        "recommended_action": recommended_action,
        "threshold_used": prediction.get("threshold_used", 0.65),
        # Payment context
        "payment_amount": payment_amount,
        "refund_amount": refund_amount,
        # Features
        "features": features,
        # Explainability & Decision Summary
        "explanation": explanations,
        "explanation_json": json.dumps(explanations),
        "summary_text": summary_text,
        "decision_summary": decision_summary,
        # Behavioral baseline & drift
        "drift_score": drift_score,
        "baseline_deviation": baseline_deviation,
        "baseline": baseline,
        "behavioral_comparison": behavioral_comparison,
        # Patterns
        "detected_patterns": patterns,
        # Financial exposure
        "financial_impact": financial,
        "expected_loss": financial["expected_loss"],
        # Timestamp
        "scored_at": datetime.utcnow().isoformat(),
    }


def detect_patterns(features: dict, drift_score: float, baseline_deviation: float) -> list:
    """Identify interpretable refund/return abuse patterns."""
    patterns = []

    # Return/Refund Burst
    if features.get("return_burst_flag", 0) or features.get("refund_count_7d", 0) >= 2:
        patterns.append({
            "name": "Refund Burst Anomaly",
            "description": "Multiple refund requests initiated within a 7-day window",
            "severity": "HIGH",
        })

    # High-Value Concentration
    if features.get("high_value_concentration", 0) > 0.35:
        patterns.append({
            "name": "High-Value Refund Concentration",
            "description": "Disproportionately high concentration of high-ticket refunds",
            "severity": "HIGH",
        })

    # Behavioral Drift Anomaly
    if drift_score >= 60:
        patterns.append({
            "name": "Severe Behavioral Drift",
            "description": f"Customer behavior deviates +{baseline_deviation:.1f}σ from personal baseline",
            "severity": "HIGH",
        })
    elif drift_score >= 35:
        patterns.append({
            "name": "Moderate Behavioral Drift",
            "description": f"Recent transaction habits deviate from normal historical baseline",
            "severity": "MEDIUM",
        })

    # Verified abuse history
    if features.get("verified_abuse_history", 0):
        patterns.append({
            "name": "Known Refund Abuse Record",
            "description": "Customer has a previously verified refund or chargeback abuse on record",
            "severity": "HIGH",
        })

    # New account risk
    if features.get("account_age_risk", 0):
        patterns.append({
            "name": "New Account Refund Risk",
            "description": "Account is less than 30 days old with immediate high-value refund request",
            "severity": "HIGH",
        })

    # High refund to payment ratio
    if features.get("refund_to_payment_ratio", 0) >= 0.5:
        patterns.append({
            "name": "Elevated Refund-to-Payment Ratio",
            "description": "Lifetime refunds represent over 50% of total payment volume",
            "severity": "MEDIUM",
        })

    return patterns


def _build_behavioral_comparison(features: dict, baseline: dict, category: str) -> list:
    """
    Build structured comparison of historical baseline vs. current behavior
    across payment, order, and refund dimensions for BehaviorDriftCard.
    """
    comparisons = []

    # 1. Refund / Return Rate
    hist_rate = baseline.get("historical_refund_rate", baseline.get("historical_return_rate", 0.0))
    curr_rate = features.get("current_refund_rate", features.get("return_to_order_ratio", 0.0))
    ratio = curr_rate / hist_rate if hist_rate > 0 else None
    pct_change = ((curr_rate - hist_rate) / hist_rate * 100) if hist_rate > 0 else None
    comparisons.append({
        "metric": "Refund Rate",
        "historical": f"{hist_rate*100:.1f}%",
        "current": f"{curr_rate*100:.1f}%",
        "change": f"{ratio:.1f}×" if ratio else "N/A",
        "pct_change": f"{pct_change:+.0f}%" if pct_change is not None else "N/A",
        "status": _rate_status(curr_rate, hist_rate, threshold_high=2.5),
    })

    # 2. Refund Frequency
    hist_freq = baseline.get("historical_refund_frequency", baseline.get("historical_return_frequency", 0.0))
    curr_freq = features.get("refund_frequency", features.get("return_frequency", 0.0))
    freq_ratio = curr_freq / hist_freq if hist_freq > 0 else None
    comparisons.append({
        "metric": "Refund Frequency",
        "historical": f"{hist_freq:.1f}/month",
        "current": f"{curr_freq:.1f}/month",
        "change": f"{freq_ratio:.1f}×" if freq_ratio else "N/A",
        "status": _rate_status(curr_freq, hist_freq, threshold_high=2.5),
    })

    # 3. Average Refund Value
    hist_val = baseline.get("historical_avg_refund_value", baseline.get("historical_avg_return_value", 0.0))
    curr_val = features.get("refund_amount", features.get("avg_return_value", 0.0))
    val_ratio = curr_val / hist_val if hist_val > 0 else None
    comparisons.append({
        "metric": "Refund Value",
        "historical": f"₹{hist_val:,.0f}",
        "current": f"₹{curr_val:,.0f}",
        "change": f"{val_ratio:.1f}×" if val_ratio else "N/A",
        "status": _rate_status(curr_val, hist_val, threshold_high=2.0),
    })

    # 4. Payment Frequency
    hist_order_freq = baseline.get("historical_payment_frequency", baseline.get("historical_order_frequency", 1.0))
    curr_order_freq = features.get("payment_frequency", features.get("order_frequency", 1.0))
    order_ratio = curr_order_freq / hist_order_freq if hist_order_freq > 0 else None
    comparisons.append({
        "metric": "Payment Frequency",
        "historical": f"{hist_order_freq:.1f}/month",
        "current": f"{curr_order_freq:.1f}/month",
        "change": f"{order_ratio:.2f}×" if order_ratio else "N/A",
        "status": "NORMAL",
    })

    # 5. Refund-to-Payment Ratio
    hist_rtp = baseline.get("historical_refund_to_payment_ratio", 0.08)
    curr_rtp = features.get("refund_to_payment_ratio", 0.15)
    rtp_ratio = curr_rtp / hist_rtp if hist_rtp > 0 else None
    comparisons.append({
        "metric": "Refund/Payment Ratio",
        "historical": f"{hist_rtp*100:.1f}%",
        "current": f"{curr_rtp*100:.1f}%",
        "change": f"{rtp_ratio:.1f}×" if rtp_ratio else "N/A",
        "status": _rate_status(curr_rtp, hist_rtp, threshold_high=2.0),
    })

    # 6. Category Benchmark
    cat_rate = features.get("category_return_rate", 0.0)
    cat_baseline_rate = features.get("category_baseline_return_rate", 0.10)
    cat_ratio = cat_rate / cat_baseline_rate if cat_baseline_rate > 0 else None
    comparisons.append({
        "metric": f"{category} Refund Rate",
        "historical": f"{cat_baseline_rate*100:.1f}% (category norm)",
        "current": f"{cat_rate*100:.1f}%",
        "change": f"{cat_ratio:.1f}×" if cat_ratio else "N/A",
        "status": _rate_status(cat_rate, cat_baseline_rate, threshold_high=2.5),
    })

    return comparisons


def _rate_status(current: float, historical: float, threshold_high: float = 3.0) -> str:
    if historical <= 0:
        return "UNKNOWN"
    ratio = current / historical
    if ratio >= threshold_high:
        return "ANOMALY"
    elif ratio >= 1.7:
        return "HIGH"
    return "NORMAL"
