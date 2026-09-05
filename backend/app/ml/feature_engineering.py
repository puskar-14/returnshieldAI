"""
ReturnShield AI — Feature Engineering Module (Razorpay Merchant Risk Engine)
Computes payment, order, and refund/return behavioral features,
customer personal behavioral baselines, and behavioral drift metrics.
"""
import math
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

# Category baseline return/refund rates (global averages for legitimate customers)
CATEGORY_BASELINES = {
    "Electronics": 0.10,
    "Fashion": 0.20,
    "Furniture": 0.05,
    "Home": 0.07,
    "Books": 0.03,
    "Sports": 0.08,
    "Beauty": 0.12,
}

# High-value threshold per category (INR)
HIGH_VALUE_THRESHOLDS = {
    "Electronics": 8000,
    "Fashion": 3000,
    "Furniture": 15000,
    "Home": 4000,
    "Books": 500,
    "Sports": 2500,
    "Beauty": 1500,
}


def compute_personal_baseline(customer_id: int, db) -> dict:
    """
    Computes customer's personal historical behavioral baseline across the
    Payment → Order → Refund/Return lifecycle using all their historical activity.
    Returns statistical summary of normal baseline behavior.
    """
    from app.models.order import Order
    from app.models.return_request import ReturnRequest

    now = datetime.utcnow()
    cutoff_recent = now - timedelta(days=30)
    cutoff_historical = now - timedelta(days=90)

    # All historical orders/payments
    all_orders = db.query(Order).filter(Order.customer_id == customer_id).all()
    total_orders = len(all_orders)
    if total_orders == 0:
        return _empty_baseline()

    # All historical refund/return requests
    all_returns = db.query(ReturnRequest).filter(
        ReturnRequest.customer_id == customer_id
    ).all()

    old_returns = [r for r in all_returns if r.created_at < cutoff_recent]
    old_orders = [o for o in all_orders if o.created_at < cutoff_recent]

    if len(old_orders) == 0:
        return _empty_baseline()

    # Historical refund/return rate (refunds per order)
    hist_return_rate = len(old_returns) / len(old_orders)

    # Historical payment values
    hist_order_values = [o.amount for o in old_orders if o.amount]
    hist_avg_payment_value = sum(hist_order_values) / len(hist_order_values) if hist_order_values else 0.0
    hist_total_payment_value = sum(hist_order_values)

    # Historical refund values
    hist_return_values = [r.amount for r in old_returns if r.amount]
    hist_avg_refund_value = sum(hist_return_values) / len(hist_return_values) if hist_return_values else 0.0
    hist_total_refund_value = sum(hist_return_values)

    # Historical refund-to-payment value ratio
    hist_refund_to_payment_ratio = (
        hist_total_refund_value / hist_total_payment_value
        if hist_total_payment_value > 0 else 0.0
    )

    # Historical period in months
    earliest_order_dt = min(o.created_at for o in old_orders) if old_orders else now - timedelta(days=90)
    hist_period_months = max(1.0, (now - timedelta(days=30) - earliest_order_dt).days / 30.0)

    # Historical frequencies
    hist_payment_frequency = len(old_orders) / hist_period_months
    hist_refund_frequency = len(old_returns) / hist_period_months
    hist_transaction_velocity = len(old_orders) / max(1.0, hist_period_months * 4.33)  # per week

    # Standard deviation of refund amounts
    if len(hist_return_values) > 1:
        mean_val = hist_avg_refund_value
        variance = sum((v - mean_val) ** 2 for v in hist_return_values) / len(hist_return_values)
        std_refund_value = math.sqrt(variance)
    else:
        std_refund_value = hist_avg_refund_value * 0.3

    return {
        # Refund/return baselines
        "historical_return_rate": hist_return_rate,
        "historical_refund_rate": hist_return_rate,
        "historical_return_frequency": hist_refund_frequency,
        "historical_refund_frequency": hist_refund_frequency,
        "historical_avg_return_value": hist_avg_refund_value,
        "historical_avg_refund_value": hist_avg_refund_value,
        "historical_std_return_value": std_refund_value,
        "historical_return_count": len(old_returns),
        "historical_refund_count": len(old_returns),
        # Payment/order baselines
        "historical_order_frequency": hist_payment_frequency,
        "historical_payment_frequency": hist_payment_frequency,
        "historical_avg_order_value": hist_avg_payment_value,
        "historical_avg_payment_value": hist_avg_payment_value,
        "historical_order_count": len(old_orders),
        "historical_payment_count": len(old_orders),
        "historical_transaction_velocity": round(hist_transaction_velocity, 2),
        "historical_refund_to_payment_ratio": round(hist_refund_to_payment_ratio, 4),
        "historical_categories": list(set(r.category for r in old_returns if getattr(r, 'category', None))),
        "has_sufficient_history": len(old_orders) >= 3,
    }


def _empty_baseline() -> dict:
    return {
        "historical_return_rate": 0.0,
        "historical_refund_rate": 0.0,
        "historical_return_frequency": 0.0,
        "historical_refund_frequency": 0.0,
        "historical_avg_return_value": 0.0,
        "historical_avg_refund_value": 0.0,
        "historical_std_return_value": 0.0,
        "historical_return_count": 0,
        "historical_refund_count": 0,
        "historical_order_frequency": 0.0,
        "historical_payment_frequency": 0.0,
        "historical_avg_order_value": 0.0,
        "historical_avg_payment_value": 0.0,
        "historical_order_count": 0,
        "historical_payment_count": 0,
        "historical_transaction_velocity": 0.0,
        "historical_refund_to_payment_ratio": 0.0,
        "historical_categories": [],
        "has_sufficient_history": False,
    }


def compute_drift_score(current_features: dict, baseline: dict) -> float:
    """
    Compute Behavior Drift Score (0-100).
    Measures how much customer's current payment and refund behavior deviates from
    their personal historical baseline across 6 dimensions.
    """
    if not baseline.get("has_sufficient_history"):
        return _heuristic_drift(current_features)

    drift_dimensions = []

    # 1. Refund/return frequency drift
    hist_freq = baseline.get("historical_refund_frequency", baseline.get("historical_return_frequency", 0.0))
    curr_freq = current_features.get("refund_frequency", current_features.get("return_frequency", 0.0))
    if hist_freq > 0:
        freq_drift = abs(curr_freq - hist_freq) / (hist_freq + 0.01)
        drift_dimensions.append(min(1.0, freq_drift))
    else:
        drift_dimensions.append(min(1.0, curr_freq / 2.0))

    # 2. Refund/return value drift
    hist_val = baseline.get("historical_avg_refund_value", baseline.get("historical_avg_return_value", 0.0))
    curr_val = current_features.get("refund_amount", current_features.get("return_value_ratio", 1.0) * current_features.get("avg_order_value", 1000.0))
    if hist_val > 0:
        val_drift = abs(curr_val - hist_val) / (hist_val + 1.0)
        drift_dimensions.append(min(1.0, val_drift))
    else:
        drift_dimensions.append(0.0)

    # 3. Refund-to-payment / return-to-order rate drift
    hist_rate = baseline.get("historical_refund_rate", baseline.get("historical_return_rate", 0.0))
    curr_rate = current_features.get("current_refund_rate", current_features.get("return_to_order_ratio", 0.0))
    if hist_rate > 0:
        rate_drift = abs(curr_rate - hist_rate) / (hist_rate + 0.01)
        drift_dimensions.append(min(1.0, rate_drift))
    else:
        drift_dimensions.append(min(1.0, curr_rate * 3))

    # 4. Payment/order frequency drift
    hist_order_freq = baseline.get("historical_payment_frequency", baseline.get("historical_order_frequency", 1.0))
    curr_order_freq = current_features.get("payment_frequency", current_features.get("order_frequency", 1.0))
    if hist_order_freq > 0:
        order_freq_drift = abs(curr_order_freq - hist_order_freq) / (hist_order_freq + 0.1)
        drift_dimensions.append(min(1.0, order_freq_drift * 0.5))
    else:
        drift_dimensions.append(0.0)

    # 5. Refund count burst (last 7-30 days)
    recent_burst = current_features.get("refund_count_30d", current_features.get("recent_return_count", 0))
    hist_monthly = baseline.get("historical_refund_frequency", baseline.get("historical_return_frequency", 0.5))
    if hist_monthly > 0:
        burst_ratio = recent_burst / (hist_monthly + 0.1)
        drift_dimensions.append(min(1.0, (burst_ratio - 1.0) * 0.5) if burst_ratio > 1 else 0.0)
    else:
        drift_dimensions.append(min(1.0, recent_burst / 5.0))

    # 6. Refund-to-payment ratio drift
    hist_ratio = baseline.get("historical_refund_to_payment_ratio", 0.1)
    curr_ratio = current_features.get("refund_to_payment_ratio", 0.2)
    if hist_ratio > 0:
        ratio_drift = abs(curr_ratio - hist_ratio) / (hist_ratio + 0.05)
        drift_dimensions.append(min(1.0, ratio_drift * 0.8))
    else:
        drift_dimensions.append(min(1.0, curr_ratio))

    # Weighted average
    weights = [3.0, 2.5, 3.0, 1.0, 2.0, 2.0]
    total_weight = sum(weights)
    weighted_drift = sum(d * w for d, w in zip(drift_dimensions, weights)) / total_weight

    return round(min(100.0, weighted_drift * 100.0), 1)


def _heuristic_drift(current_features: dict) -> float:
    """Heuristic drift score when insufficient baseline history exists."""
    score = 0.0
    rate = current_features.get("current_refund_rate", current_features.get("return_to_order_ratio", 0))
    if rate > 0.4:
        score += 30
    if current_features.get("return_burst_flag", 0) or current_features.get("refund_count_7d", 0) >= 2:
        score += 25
    if current_features.get("baseline_deviation", 0) > 2:
        score += 20
    if current_features.get("recent_return_count", 0) >= 3 or current_features.get("refund_count_30d", 0) >= 3:
        score += 15
    if current_features.get("refund_to_payment_ratio", 0) > 0.6:
        score += 10
    return min(100.0, score)


def compute_baseline_deviation(current_features: dict, baseline: dict) -> float:
    """
    Z-score deviation of current refund/return rate from personal historical baseline.
    Positive value = higher refund volume than normal (risk).
    """
    if not baseline.get("has_sufficient_history"):
        return 0.0

    hist_rate = baseline.get("historical_refund_rate", baseline.get("historical_return_rate", 0.0))
    curr_rate = current_features.get("current_refund_rate", current_features.get("return_to_order_ratio", 0.0))

    std = max(0.05, hist_rate * 0.5)
    z_score = (curr_rate - hist_rate) / std

    return round(z_score, 3)


def extract_features(customer_data: dict, return_request: dict, db=None) -> dict:
    """
    Extract comprehensive behavioral features for an incoming refund/return request.
    Produces both:
    1. Extended payment and refund lifecycle signals.
    2. The 22 ML-ready features required by the calibrated model.
    """
    now = datetime.utcnow()
    customer_id = customer_data.get("id", 0)
    category = return_request.get("category", "Home")
    refund_amount = float(return_request.get("amount", return_request.get("refund_amount", 0.0)))
    payment_amount = float(return_request.get("payment_amount", refund_amount * 1.15))
    days_since_payment = int(return_request.get("days_since_payment", return_request.get("days_since_purchase", 7)))

    if db is not None:
        return _extract_from_db(customer_data, return_request, db, now)

    # In-memory / Sandbox extraction
    account_age_days = max(1, customer_data.get("account_age_days", 240))
    total_orders = max(1, customer_data.get("total_orders", customer_data.get("total_payments", 6)))
    total_returns = customer_data.get("total_returns", customer_data.get("total_refunds", 1))
    recent_returns = customer_data.get("recent_returns", customer_data.get("refund_count_30d", 1))
    recent_payments = customer_data.get("payment_count_30d", total_orders)
    payment_count_7d = customer_data.get("payment_count_7d", 1)
    refund_count_7d = customer_data.get("refund_count_7d", 1 if recent_returns > 2 else 0)

    avg_order_value = float(customer_data.get("avg_order_value", payment_amount))
    avg_return_value = float(customer_data.get("avg_return_value", refund_amount))

    hist_return_rate = total_returns / total_orders
    return_frequency = float(recent_returns)
    return_to_order_ratio = hist_return_rate
    return_value_ratio = refund_amount / avg_order_value if avg_order_value > 0 else 1.0
    order_frequency = total_orders / (account_age_days / 30.0)
    payment_frequency = order_frequency
    transaction_velocity = round(order_frequency / 4.33, 2)

    refund_to_payment_ratio = (
        (refund_amount * total_returns) / (avg_order_value * total_orders)
        if (avg_order_value * total_orders) > 0 else 0.2
    )

    baseline_dev = (hist_return_rate - CATEGORY_BASELINES.get(category, 0.1)) / 0.1
    drift = min(100.0, max(0.0, abs(baseline_dev) * 22.0 + (15.0 if refund_count_7d >= 2 else 0.0)))

    high_val_thresh = HIGH_VALUE_THRESHOLDS.get(category, 3000)
    high_value_concentration = 0.5 if refund_amount > high_val_thresh else 0.1
    return_burst = 1 if (recent_returns >= 3 or refund_count_7d >= 2) else 0

    return {
        # Core 22 Model Features (Exact model compatibility)
        "return_frequency": round(return_frequency, 3),
        "return_to_order_ratio": round(return_to_order_ratio, 4),
        "recent_return_count": int(recent_returns),
        "return_value_ratio": round(return_value_ratio, 3),
        "avg_order_value": round(avg_order_value, 2),
        "avg_return_value": round(avg_return_value, 2),
        "account_age_days": int(account_age_days),
        "order_frequency": round(order_frequency, 3),
        "days_since_purchase": days_since_payment,
        "historical_return_rate": round(hist_return_rate, 4),
        "category_return_rate": round(hist_return_rate, 4),
        "category_baseline_return_rate": CATEGORY_BASELINES.get(category, 0.10),
        "verified_abuse_history": int(customer_data.get("verified_abuse_history", 0)),
        "baseline_deviation": round(baseline_dev, 3),
        "drift_score": round(drift, 1),
        "return_burst_flag": return_burst,
        "high_value_concentration": round(high_value_concentration, 3),
        "abnormal_timing_flag": 0,
        "cross_category_flag": 0,
        "account_age_risk": 1 if account_age_days < 30 else 0,
        "recent_order_frequency_change": 1.0,
        "refund_amount_last_30_days": round(recent_returns * avg_return_value, 2),
        # Extended Payment & Refund Signals
        "payment_amount": round(payment_amount, 2),
        "refund_amount": round(refund_amount, 2),
        "payment_count_7d": int(payment_count_7d),
        "payment_count_30d": int(recent_payments),
        "refund_count_7d": int(refund_count_7d),
        "refund_count_30d": int(recent_returns),
        "payment_frequency": round(payment_frequency, 2),
        "refund_frequency": round(return_frequency, 2),
        "transaction_velocity": transaction_velocity,
        "historical_refund_rate": round(hist_return_rate, 4),
        "current_refund_rate": round(recent_returns / max(1, recent_payments), 4),
        "refund_to_payment_ratio": round(refund_to_payment_ratio, 4),
        "avg_historical_refund_amount": round(avg_return_value, 2),
        "time_between_payment_and_refund": days_since_payment,
        "days_since_payment": days_since_payment,
    }


def _extract_from_db(customer_data: dict, return_request: dict, db, now: datetime) -> dict:
    """Extract real features from database records with payment & refund intelligence."""
    from app.models.order import Order
    from app.models.return_request import ReturnRequest

    customer_id = customer_data.get("id", 0)
    category = return_request.get("category", "Home")
    refund_amount = float(return_request.get("amount", return_request.get("refund_amount", 0.0)))

    cutoff_30d = now - timedelta(days=30)
    cutoff_7d = now - timedelta(days=7)

    # Orders / Payments
    all_orders = db.query(Order).filter(Order.customer_id == customer_id).all()
    total_orders = max(1, len(all_orders))
    recent_orders_30d = [o for o in all_orders if o.created_at >= cutoff_30d]
    recent_orders_7d = [o for o in all_orders if o.created_at >= cutoff_7d]

    # Associated order for payment amount
    order_id = return_request.get("order_id")
    current_order = db.query(Order).filter(Order.id == order_id).first() if order_id else None
    payment_amount = current_order.amount if current_order and current_order.amount else refund_amount

    # Returns / Refunds
    all_returns = db.query(ReturnRequest).filter(
        ReturnRequest.customer_id == customer_id
    ).all()
    recent_returns_30d = [r for r in all_returns if r.created_at >= cutoff_30d]
    recent_returns_7d = [r for r in all_returns if r.created_at >= cutoff_7d]
    cat_returns = [r for r in all_returns if getattr(r, "category", None) == category]

    account_age_days = max(1, customer_data.get("account_age_days", 365))
    order_frequency = total_orders / (account_age_days / 30.0)
    payment_frequency = order_frequency
    transaction_velocity = round(order_frequency / 4.33, 2)

    order_amounts = [o.amount for o in all_orders if o.amount]
    avg_order_value = sum(order_amounts) / len(order_amounts) if order_amounts else 1500.0

    return_amounts = [r.amount for r in all_returns if r.amount]
    avg_return_value = sum(return_amounts) / len(return_amounts) if return_amounts else avg_order_value

    hist_return_rate = len(all_returns) / total_orders
    return_frequency = len(recent_returns_30d) / 1.0
    return_to_order_ratio = hist_return_rate
    return_value_ratio = refund_amount / avg_order_value if avg_order_value > 0 else 1.0

    total_refund_val = sum(return_amounts)
    total_order_val = sum(order_amounts)
    refund_to_payment_ratio = total_refund_val / total_order_val if total_order_val > 0 else 0.1

    cat_orders = [o for o in all_orders if getattr(o, "category", None) == category]
    category_return_rate = len(cat_returns) / max(1, len(cat_orders))

    # Days since payment
    days_since_payment = int(return_request.get("days_since_payment", return_request.get("days_since_purchase", 7)))
    if current_order and current_order.created_at:
        days_since_payment = max(1, (now - current_order.created_at).days)

    # Baseline deviation & drift
    baseline = compute_personal_baseline(customer_id, db)
    current_features_partial = {
        "return_frequency": return_frequency,
        "refund_frequency": return_frequency,
        "return_to_order_ratio": return_to_order_ratio,
        "current_refund_rate": len(recent_returns_30d) / max(1, len(recent_orders_30d)),
        "return_value_ratio": return_value_ratio,
        "refund_amount": refund_amount,
        "avg_order_value": avg_order_value,
        "recent_return_count": len(recent_returns_30d),
        "refund_count_30d": len(recent_returns_30d),
        "refund_count_7d": len(recent_returns_7d),
        "refund_to_payment_ratio": refund_to_payment_ratio,
        "cross_category_flag": 0,
        "order_frequency": order_frequency,
        "payment_frequency": payment_frequency,
    }
    baseline_dev = compute_baseline_deviation(current_features_partial, baseline)
    drift = compute_drift_score(current_features_partial, baseline)

    return_burst_flag = 1 if len(recent_returns_7d) >= 2 else 0

    high_val_thresh = HIGH_VALUE_THRESHOLDS.get(category, 3000)
    high_val_returns = [r for r in all_returns if r.amount and r.amount > high_val_thresh]
    high_value_concentration = len(high_val_returns) / max(1, len(all_returns))

    recent_cats = set()
    for r in recent_returns_30d:
        if hasattr(r, "category") and r.category:
            recent_cats.add(r.category)
    recent_cats.add(category)
    cross_category_flag = 1 if len(recent_cats) >= 4 else 0

    refund_last_30d = sum(r.amount for r in recent_returns_30d if r.amount)

    old_orders = [o for o in all_orders if o.created_at < cutoff_30d]
    old_period_months = max(1.0, (account_age_days - 30) / 30.0)
    hist_order_freq = len(old_orders) / old_period_months
    recent_order_frequency_change = (
        len(recent_orders_30d) / max(0.1, hist_order_freq)
    ) if hist_order_freq > 0 else 1.0

    return {
        # Core 22 Features for ML model
        "return_frequency": round(return_frequency, 3),
        "return_to_order_ratio": round(return_to_order_ratio, 4),
        "recent_return_count": len(recent_returns_30d),
        "return_value_ratio": round(return_value_ratio, 3),
        "avg_order_value": round(avg_order_value, 2),
        "avg_return_value": round(avg_return_value, 2),
        "account_age_days": int(account_age_days),
        "order_frequency": round(order_frequency, 3),
        "days_since_purchase": days_since_payment,
        "historical_return_rate": round(hist_return_rate, 4),
        "category_return_rate": round(category_return_rate, 4),
        "category_baseline_return_rate": CATEGORY_BASELINES.get(category, 0.10),
        "verified_abuse_history": int(customer_data.get("verified_abuse_history", 0)),
        "baseline_deviation": round(baseline_dev, 3),
        "drift_score": round(drift, 1),
        "return_burst_flag": return_burst_flag,
        "high_value_concentration": round(high_value_concentration, 3),
        "abnormal_timing_flag": 0,
        "cross_category_flag": cross_category_flag,
        "account_age_risk": 1 if int(account_age_days) < 30 else 0,
        "recent_order_frequency_change": round(recent_order_frequency_change, 3),
        "refund_amount_last_30_days": round(refund_last_30d, 2),
        # Payment & Refund Signals
        "payment_amount": round(payment_amount, 2),
        "refund_amount": round(refund_amount, 2),
        "payment_count_7d": len(recent_orders_7d),
        "payment_count_30d": len(recent_orders_30d),
        "refund_count_7d": len(recent_returns_7d),
        "refund_count_30d": len(recent_returns_30d),
        "payment_frequency": round(payment_frequency, 2),
        "refund_frequency": round(return_frequency, 2),
        "transaction_velocity": transaction_velocity,
        "historical_refund_rate": round(hist_return_rate, 4),
        "current_refund_rate": round(len(recent_returns_30d) / max(1, len(recent_orders_30d)), 4),
        "refund_to_payment_ratio": round(refund_to_payment_ratio, 4),
        "avg_historical_refund_amount": round(avg_return_value, 2),
        "time_between_payment_and_refund": days_since_payment,
        "days_since_payment": days_since_payment,
    }
