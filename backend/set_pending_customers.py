import sqlite3

conn = sqlite3.connect("returnshield.db")
cur = conn.cursor()

# Set status = 'PENDING' for customers who have any pending return request and are not rejected
cur.execute("""
UPDATE customers 
SET status = 'PENDING' 
WHERE id IN (
    SELECT DISTINCT customer_id 
    FROM return_requests 
    WHERE status = 'PENDING'
) AND (status IS NULL OR status != 'REJECTED')
""")

conn.commit()

cur.execute("SELECT status, COUNT(*) FROM customers GROUP BY status")
print("Updated customer status counts:", cur.fetchall())
conn.close()
