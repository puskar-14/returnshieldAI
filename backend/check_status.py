import sqlite3

conn = sqlite3.connect("returnshield.db")
cur = conn.cursor()
cur.execute("SELECT id, name, status, account_age_days, total_orders, total_returns, created_at FROM customers WHERE name IN ('Raj Sharma', 'Uma Devi', 'Dilip Nair')")
print(cur.fetchall())
conn.close()
