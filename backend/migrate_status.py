import sqlite3

conn = sqlite3.connect("returnshield.db")
cur = conn.cursor()

# Set verified abusers to REJECTED
cur.execute("UPDATE customers SET status = 'REJECTED' WHERE verified_abuse_history = 1")

# Set customers with high risk pending/under_review returns to HOLD
cur.execute("""
UPDATE customers 
SET status = 'HOLD' 
WHERE id IN (
    SELECT DISTINCT customer_id 
    FROM return_requests 
    WHERE risk_level = 'HIGH' AND status IN ('UNDER_REVIEW', 'PENDING', 'HOLD')
) AND status != 'REJECTED'
""")

# Others are ACTIVE
cur.execute("UPDATE customers SET status = 'ACTIVE' WHERE status IS NULL OR status NOT IN ('REJECTED', 'HOLD')")

conn.commit()

cur.execute("SELECT status, COUNT(*) FROM customers GROUP BY status")
print("Customer status breakdown:", cur.fetchall())
conn.close()
