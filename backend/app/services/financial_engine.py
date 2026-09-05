"""
ReturnShield AI — Financial Impact Engine
Converts ML predictions into business impact (INR).
"""

# Category-specific merchant loss multipliers (some products have restocking fees, etc.)
CATEGORY_LOSS_FACTORS = {
    "Electronics": 0.95,
    "Fashion": 0.70,
    "Furniture": 0.85,
    "Home": 0.80,
    "Books": 0.60,
    "Sports": 0.75,
    "Beauty": 0.65,
}

# Average customer lifetime value by order size (INR)
BASE_CUSTOMER_LTV = 12000  # Annual LTV for avg customer
CHURN_PROBABILITY_IF_FALSELY_FLAGGED = 0.18  # 18% churn risk on wrong flag
REVIEW_COST_INR = 150       # Fixed cost per manual review (analyst time)
CATEGORY_REVIEW_COST = {
    "Electronics": 250,
    "Furniture": 200,
    "Fashion": 120,
    "Home": 150,
    "Books": 80,
    "Sports": 130,
    "Beauty": 110,
}


def calculate_financial_impact(
    abuse_probability: float,
    return_amount: float,
    category: str,
    avg_order_value: float = 2000.0,
    orders_per_year: float = 6.0,
) -> dict:
    """
    Compute the full financial impact of a return request decision.

    Args:
        abuse_probability: Model's P(abuse), range [0, 1]
        return_amount:     Return request value in INR
        category:          Product category string
        avg_order_value:   Customer's average order value in INR
        orders_per_year:   Customer's estimated orders per year

    Returns dict with:
        return_value, abuse_probability, expected_loss,
        potential_merchant_loss, false_positive_cost,
        review_cost, net_savings_if_blocked,
        recommended_threshold, loss_breakdown
    """
    # Merchant's actual loss if abuse succeeds (accounts for restocking etc.)
    loss_factor = CATEGORY_LOSS_FACTORS.get(category, 0.80)
    potential_merchant_loss = return_amount * loss_factor

    # Expected loss = P(abuse) * potential loss
    expected_loss = abuse_probability * potential_merchant_loss

    # False-positive cost: if we flag a LEGITIMATE customer
    # = churn_probability × estimated LTV
    estimated_ltv = avg_order_value * orders_per_year
    false_positive_cost = (1 - abuse_probability) * CHURN_PROBABILITY_IF_FALSELY_FLAGGED * estimated_ltv

    # Review cost for manual investigation
    review_cost = CATEGORY_REVIEW_COST.get(category, REVIEW_COST_INR)

    # Net savings if we block/verify vs. doing nothing:
    # Benefit = expected_loss_prevented - fp_cost_risk - review_cost
    net_savings_if_blocked = expected_loss - false_positive_cost - review_cost

    # Economically optimal threshold (where marginal benefit = marginal cost)
    # Simple heuristic: threshold = fp_cost / (fp_cost + avg_loss_per_case)
    if (false_positive_cost + potential_merchant_loss) > 0:
        optimal_threshold = false_positive_cost / (false_positive_cost + potential_merchant_loss)
        optimal_threshold = round(min(0.95, max(0.20, optimal_threshold)), 2)
    else:
        optimal_threshold = 0.50

    return {
        "return_value": round(return_amount, 2),
        "abuse_probability": round(abuse_probability, 4),
        "expected_loss": round(expected_loss, 2),
        "potential_merchant_loss": round(potential_merchant_loss, 2),
        "false_positive_cost": round(false_positive_cost, 2),
        "review_cost": review_cost,
        "net_savings_if_blocked": round(net_savings_if_blocked, 2),
        "recommended_threshold": optimal_threshold,
        "loss_breakdown": {
            "return_amount": round(return_amount, 2),
            "category_loss_factor": loss_factor,
            "merchant_loss_if_abuse": round(potential_merchant_loss, 2),
            "p_abuse": round(abuse_probability, 4),
            "expected_loss": round(expected_loss, 2),
            "customer_ltv": round(estimated_ltv, 2),
            "churn_risk": CHURN_PROBABILITY_IF_FALSELY_FLAGGED,
            "fp_cost": round(false_positive_cost, 2),
        },
    }


def calculate_threshold_tradeoff(
    threshold: float,
    test_probs: list,
    test_labels: list,
    avg_case_value: float = 3500.0,
    avg_ltv: float = 12000.0,
) -> dict:
    """
    For a given threshold, compute precision, recall, FPR, FNR, cases flagged,
    true positives, expected exposure, loss prevented, FP cost, review cost, and net benefit.
    Used by the What-If Simulator.
    """
    import numpy as np

    probs = np.array(test_probs)
    labels = np.array(test_labels)
    preds = (probs >= threshold / 100.0).astype(int)

    tp = int(np.sum((preds == 1) & (labels == 1)))
    fp = int(np.sum((preds == 1) & (labels == 0)))
    fn = int(np.sum((preds == 0) & (labels == 1)))
    tn = int(np.sum((preds == 0) & (labels == 0)))

    total_abusive = tp + fn
    total_legit = fp + tn

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    # Economic & financial impact
    cases_flagged = tp + fp
    abuse_cases_prevented = tp

    # Total potential abuse loss exposure in held-out test evaluation
    avg_loss_multiplier = 0.82
    expected_financial_exposure = total_abusive * avg_case_value * avg_loss_multiplier
    expected_loss_prevented = tp * avg_case_value * avg_loss_multiplier

    # False-positive cost (churn probability * customer LTV)
    fp_cost_per_case = CHURN_PROBABILITY_IF_FALSELY_FLAGGED * avg_ltv
    total_fp_cost = fp * fp_cost_per_case

    # Manual review cost for all flagged cases
    review_cost = cases_flagged * REVIEW_COST_INR

    # Net Economic Benefit / Net Merchant Savings
    net_economic_benefit = expected_loss_prevented - total_fp_cost - review_cost

    return {
        "threshold": threshold,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "fpr": round(fpr, 4),
        "fnr": round(fnr, 4),
        "true_positives": tp,
        "abuse_cases_prevented": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "true_negatives": tn,
        "cases_flagged": cases_flagged,
        "review_workload": cases_flagged,
        "expected_financial_exposure": round(expected_financial_exposure, 2),
        "expected_loss_prevented": round(expected_loss_prevented, 2),
        "false_positive_cost": round(total_fp_cost, 2),
        "review_cost": round(review_cost, 2),
        "net_economic_benefit": round(net_economic_benefit, 2),
        "net_benefit": round(net_economic_benefit, 2),
    }
