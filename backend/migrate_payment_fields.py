import sqlite3
import random
from datetime import datetime, timedelta

conn = sqlite3.connect("returnshield.db")
cur = conn.cursor()

def add_column_if_not_exists(table, column, col_type):
    cur.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cur.fetchall()]
    if column not in columns:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
        print(f"Added column {column} ({col_type}) to table {table}")
    else:
        print(f"Column {column} already exists in {table}")

# 1. Update orders table
add_column_if_not_exists("orders", "payment_id", "VARCHAR")
add_column_if_not_exists("orders", "payment_method", "VARCHAR DEFAULT 'UPI'")
add_column_if_not_exists("orders", "payment_status", "VARCHAR DEFAULT 'CAPTURED'")
add_column_if_not_exists("orders", "delivered_at", "DATETIME")

# 2. Update return_requests table
add_column_if_not_exists("return_requests", "refund_id", "VARCHAR")
add_column_if_not_exists("return_requests", "payment_id", "VARCHAR")
add_column_if_not_exists("return_requests", "days_since_payment", "INTEGER DEFAULT 7")
add_column_if_not_exists("return_requests", "refund_status", "VARCHAR DEFAULT 'PENDING'")

# 3. Update customers table
add_column_if_not_exists("customers", "total_payments", "INTEGER DEFAULT 0")
add_column_if_not_exists("customers", "total_refunds", "INTEGER DEFAULT 0")
add_column_if_not_exists("customers", "total_payment_value", "FLOAT DEFAULT 0.0")
add_column_if_not_exists("customers", "total_refund_value", "FLOAT DEFAULT 0.0")

conn.commit()

# Populate synthetic payment metadata for orders
payment_methods = ["UPI", "NetBanking", "Credit Card", "Debit Card"]
cur.execute("SELECT id, amount, created_at FROM orders")
orders = cur.fetchall()

for o_id, amount, created_at_str in orders:
    pay_id = f"pay_synth_{o_id:05d}{random.randint(100, 999)}"
    pay_method = random.choice(payment_methods)
    
    # Delivery typically 2-3 days after order
    try:
        order_dt = datetime.strptime(created_at_str[:19], "%Y-%m-%d %H:%M:%S")
    except Exception:
        order_dt = datetime.utcnow() - timedelta(days=15)
    
    delivered_dt = order_dt + timedelta(days=random.randint(2, 4))
    delivered_str = delivered_dt.strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        UPDATE orders 
        SET payment_id = ?, payment_method = ?, payment_status = 'CAPTURED', delivered_at = ?
        WHERE id = ? AND (payment_id IS NULL OR payment_id = '')
    """, (pay_id, pay_method, delivered_str, o_id))

# Link return requests with payment_id and refund_id
cur.execute("SELECT id, order_id, created_at FROM return_requests")
returns = cur.fetchall()

for r_id, o_id, created_at_str in returns:
    rfnd_id = f"rfnd_synth_{r_id:05d}{random.randint(100, 999)}"
    cur.execute("SELECT payment_id, created_at FROM orders WHERE id = ?", (o_id,))
    o_row = cur.fetchone()
    pay_id = o_row[0] if o_row and o_row[0] else f"pay_synth_{random.randint(10000, 99999)}"
    
    days_since_payment = 5
    if o_row and o_row[1] and created_at_str:
        try:
            odt = datetime.strptime(o_row[1][:19], "%Y-%m-%d %H:%M:%S")
            rdt = datetime.strptime(created_at_str[:19], "%Y-%m-%d %H:%M:%S")
            days_since_payment = max(1, (rdt - odt).days)
        except Exception:
            days_since_payment = random.randint(3, 14)

    cur.execute("""
        UPDATE return_requests
        SET refund_id = ?, payment_id = ?, days_since_payment = ?, refund_status = status
        WHERE id = ? AND (refund_id IS NULL OR refund_id = '')
    """, (rfnd_id, pay_id, days_since_payment, r_id))

# Update customer payment totals
cur.execute("SELECT id FROM customers")
cust_ids = [row[0] for row in cur.fetchall()]

for c_id in cust_ids:
    cur.execute("SELECT COUNT(*), SUM(amount) FROM orders WHERE customer_id = ?", (c_id,))
    o_count, o_sum = cur.fetchone()
    cur.execute("SELECT COUNT(*), SUM(amount) FROM return_requests WHERE customer_id = ?", (c_id,))
    r_count, r_sum = cur.fetchone()

    cur.execute("""
        UPDATE customers
        SET total_payments = ?, total_payment_value = ?,
            total_refunds = ?, total_refund_value = ?
        WHERE id = ?
    """, (o_count or 0, float(o_sum or 0.0), r_count or 0, float(r_sum or 0.0), c_id))

conn.commit()
print("Successfully migrated returnshield.db with payment and refund intelligence fields!")
conn.close()
