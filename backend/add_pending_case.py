import sqlite3
import json
from datetime import datetime, timedelta

conn = sqlite3.connect("returnshield.db")
cur = conn.cursor()

now = datetime.utcnow()

# 1. Create or get Customer "Kavita Nair"
cur.execute("SELECT id FROM customers WHERE email = 'kavita.nair@email.com'")
row = cur.fetchone()
if row:
    cust_id = row[0]
    cur.execute("UPDATE customers SET status = 'HOLD', total_orders = 9, total_returns = 4 WHERE id = ?", (cust_id,))
else:
    cur.execute("""
        INSERT INTO customers (name, email, account_age_days, total_orders, total_returns, verified_abuse_history, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, ("Kavita Nair", "kavita.nair@email.com", 310, 9, 4, 0, "HOLD", (now - timedelta(days=310)).strftime("%Y-%m-%d %H:%M:%S")))
    cust_id = cur.lastrowid

# 2. Add Recent High-Value Order
cur.execute("""
    INSERT INTO orders (customer_id, product_id, amount, category, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
""", (cust_id, 1, 26990.0, "Electronics", "COMPLETED", (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")))
order_id = cur.lastrowid

# Also add 2 past historical orders if customer is new
cur.execute("SELECT COUNT(*) FROM orders WHERE customer_id = ?", (cust_id,))
if cur.fetchone()[0] <= 1:
    cur.execute("INSERT INTO orders (customer_id, product_id, amount, category, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (cust_id, 2, 4500.0, "Fashion", "COMPLETED", (now - timedelta(days=90)).strftime("%Y-%m-%d %H:%M:%S")))
    cur.execute("INSERT INTO orders (customer_id, product_id, amount, category, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (cust_id, 3, 7800.0, "Home", "COMPLETED", (now - timedelta(days=45)).strftime("%Y-%m-%d %H:%M:%S")))

# 3. Create the New Pending Return Request
cur.execute("""
    INSERT INTO return_requests (customer_id, order_id, amount, category, reason, status, risk_score, risk_level, recommended_action, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    cust_id,
    order_id,
    26990.0,
    "Electronics",
    "Screen flickering & rapid battery drain after 48 hours of delivery",
    "PENDING",
    86,
    "HIGH",
    "ENHANCED_VERIFICATION",
    now.strftime("%Y-%m-%d %H:%M:%S")
))
return_id = cur.lastrowid

# 4. Create Risk Assessment for this return
explanation = [
    {
        "signal": "High-value return concentration (₹26,990 vs ₹5,200 avg order)",
        "feature": "high_value_concentration",
        "contribution": 31,
        "direction": "risk",
        "value": 26990,
        "value_formatted": "₹26,990"
    },
    {
        "signal": "Return frequency accelerated 3.8× in last 30 days",
        "feature": "return_frequency",
        "contribution": 24,
        "direction": "risk",
        "value": 3.8,
        "value_formatted": "3.8× jump"
    },
    {
        "signal": "Electronics category return anomaly (62.5% vs 10% baseline)",
        "feature": "category_return_rate",
        "contribution": 18,
        "direction": "risk",
        "value": 0.625,
        "value_formatted": "62.5%"
    },
    {
        "signal": "Return burst pattern (2 returns within 72 hours)",
        "feature": "return_burst_flag",
        "contribution": 15,
        "direction": "risk",
        "value": 1,
        "value_formatted": "Yes"
    },
    {
        "signal": "Established account age (310 days) trust signal",
        "feature": "account_age_days",
        "contribution": -9,
        "direction": "safe",
        "value": 310,
        "value_formatted": "310 days"
    }
]

cur.execute("""
    INSERT INTO risk_assessments (
        return_request_id, customer_id, risk_score, risk_level, abuse_probability,
        expected_loss, drift_score, baseline_deviation, explanation_json, features_json, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    return_id,
    cust_id,
    86,
    "HIGH",
    0.864,
    23319.36,
    74.2,
    3.8,
    json.dumps(explanation),
    json.dumps({"return_amount": 26990, "account_age_days": 310}),
    now.strftime("%Y-%m-%d %H:%M:%S")
))

conn.commit()

print(f"SUCCESS: Created new pending case #{return_id} for customer '{cust_id}' (Kavita Nair) with status 'PENDING'!")
conn.close()
