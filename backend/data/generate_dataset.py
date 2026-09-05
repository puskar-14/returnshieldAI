import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

def generate_dataset():
    num_customers = 5000
    np.random.seed(42)
    random.seed(42)

    categories = ['Electronics', 'Fashion', 'Furniture', 'Home', 'Books', 'Sports', 'Beauty']
    cat_legit_rates = {'Electronics': 0.10, 'Fashion': 0.20, 'Furniture': 0.05, 'Home': 0.07, 'Books': 0.03, 'Sports': 0.08, 'Beauty': 0.12}
    cat_abuser_rates = {'Electronics': 0.60, 'Fashion': 0.70, 'Furniture': 0.45, 'Home': 0.50, 'Books': 0.30, 'Sports': 0.40, 'Beauty': 0.50}

    # Customers
    # 18% abusers
    abuser_flags = np.random.choice([0, 1], size=num_customers, p=[0.82, 0.18])
    customers = []
    
    returns = []
    return_id_counter = 1
    
    for i in range(num_customers):
        is_abuser = abuser_flags[i]
        num_orders = random.randint(3, 15)
        
        # Account age
        account_age_days = random.randint(10, 1000)
        verified_abuse_history = 1 if is_abuser and random.random() < 0.3 else 0
        
        # Generating orders for this customer
        customer_orders = []
        for _ in range(num_orders):
            cat = random.choice(categories)
            amount = round(random.uniform(20.0, 500.0), 2)
            days_ago = random.randint(1, account_age_days)
            customer_orders.append({'cat': cat, 'amount': amount, 'days_ago': days_ago})
            
        # Calculate historical stats
        avg_order_value = np.mean([o['amount'] for o in customer_orders])
        order_frequency = num_orders / (account_age_days / 30.0) if account_age_days > 0 else 0
        
        recent_order_count = sum(1 for o in customer_orders if o['days_ago'] <= 30)
        historical_order_frequency = (num_orders - recent_order_count) / (max(1, account_age_days - 30) / 30.0)
        recent_order_frequency = recent_order_count / 1.0
        recent_order_frequency_change = recent_order_frequency / historical_order_frequency if historical_order_frequency > 0 else 1.0
        
        customer_returns = []
        
        # Generate returns
        for o in customer_orders:
            rate = cat_abuser_rates[o['cat']] if is_abuser else cat_legit_rates[o['cat']]
            if random.random() < rate:
                return_days_after = random.randint(1, 30)
                return_days_ago = o['days_ago'] - return_days_after
                if return_days_ago < 0:
                    return_days_ago = 0
                
                customer_returns.append({'cat': o['cat'], 'amount': o['amount'], 'days_ago': return_days_ago, 'order_days_ago': o['days_ago']})
                
        # Generate features for each return based on history AT THAT TIME
        customer_returns.sort(key=lambda x: x['days_ago'], reverse=True) # Oldest first
        
        for idx, r in enumerate(customer_returns):
            # history before this return
            past_returns = customer_returns[:idx]
            
            return_frequency = len([pr for pr in past_returns if r['days_ago'] <= pr['days_ago'] <= r['days_ago'] + 90]) / 3.0
            
            past_orders = [o for o in customer_orders if o['days_ago'] >= r['days_ago']]
            return_to_order_ratio = len(past_returns) / len(past_orders) if len(past_orders) > 0 else 0
            
            recent_return_count = len([pr for pr in past_returns if r['days_ago'] <= pr['days_ago'] <= r['days_ago'] + 30])
            
            avg_order_value_at_time = np.mean([o['amount'] for o in past_orders]) if past_orders else r['amount']
            return_value_ratio = r['amount'] / avg_order_value_at_time if avg_order_value_at_time > 0 else 0
            
            avg_return_value = np.mean([pr['amount'] for pr in past_returns]) if past_returns else 0
            
            days_since_purchase = r['order_days_ago'] - r['days_ago']
            historical_return_rate = len(past_returns) / len(past_orders) if len(past_orders) > 0 else 0
            
            cat_past_orders = [o for o in past_orders if o['cat'] == r['cat']]
            cat_past_returns = [pr for pr in past_returns if pr['cat'] == r['cat']]
            category_return_rate = len(cat_past_returns) / len(cat_past_orders) if len(cat_past_orders) > 0 else 0
            category_baseline_return_rate = cat_legit_rates[r['cat']]
            
            # Baseline deviation (mock)
            baseline_deviation = (return_frequency - historical_return_rate) / 0.1 if historical_return_rate > 0 else 0
            
            # Drift score
            drift_score = min(100, max(0, baseline_deviation * 20 + 10))
            
            # Return burst flag
            burst_returns = [pr for pr in past_returns if r['days_ago'] <= pr['days_ago'] <= r['days_ago'] + 7]
            return_burst_flag = 1 if len(burst_returns) >= 2 else 0 # 2 past + current = 3
            
            # High value concentration
            high_value_count = sum(1 for pr in past_returns if pr['amount'] > 200)
            high_value_concentration = high_value_count / len(past_returns) if past_returns else 0
            
            abnormal_timing_flag = 1 if random.random() < 0.1 else 0
            
            # Cross category
            recent_cats = set([pr['cat'] for pr in past_returns if r['days_ago'] <= pr['days_ago'] <= r['days_ago'] + 30])
            recent_cats.add(r['cat'])
            cross_category_flag = 1 if len(recent_cats) >= 4 else 0
            
            account_age_risk = 1 if (account_age_days - r['days_ago']) < 30 else 0
            
            refund_amount_last_30_days = sum(pr['amount'] for pr in past_returns if r['days_ago'] <= pr['days_ago'] <= r['days_ago'] + 30)
            
            # Payment & Refund Lifecycle signals
            payment_amount = r['amount']
            refund_amount = r['amount']
            days_since_payment = days_since_purchase
            payment_count_7d = len([o for o in past_orders if r['days_ago'] <= o['days_ago'] <= r['days_ago'] + 7])
            payment_count_30d = len([o for o in past_orders if r['days_ago'] <= o['days_ago'] <= r['days_ago'] + 30])
            refund_count_7d = len([pr for pr in past_returns if r['days_ago'] <= pr['days_ago'] <= r['days_ago'] + 7])
            refund_count_30d = recent_return_count
            effective_age_days = max(1, account_age_days - r['days_ago'])
            payment_frequency = len(past_orders) / (effective_age_days / 30.0)
            refund_frequency = return_frequency
            transaction_velocity = round(payment_frequency / 4.33, 2)
            
            total_past_payments = sum(o['amount'] for o in past_orders)
            total_past_refunds = sum(pr['amount'] for pr in past_returns) + refund_amount
            refund_to_payment_ratio = total_past_refunds / total_past_payments if total_past_payments > 0 else 0.2
            current_refund_rate = refund_count_30d / max(1, payment_count_30d)
            avg_historical_refund_amount = avg_return_value
            time_between_payment_and_refund = days_since_payment

            features = {
                # Core behavioral & lifecycle features
                'return_frequency': round(return_frequency, 3),
                'return_to_order_ratio': round(return_to_order_ratio, 4),
                'recent_return_count': int(recent_return_count),
                'return_value_ratio': round(return_value_ratio, 3),
                'avg_order_value': round(avg_order_value_at_time, 2),
                'avg_return_value': round(avg_return_value, 2),
                'account_age_days': int(effective_age_days),
                'order_frequency': round(order_frequency, 3),
                'days_since_purchase': int(days_since_purchase),
                'historical_return_rate': round(historical_return_rate, 4),
                'category_return_rate': round(category_return_rate, 4),
                'category_baseline_return_rate': category_baseline_return_rate,
                'verified_abuse_history': int(verified_abuse_history),
                'baseline_deviation': round(baseline_deviation, 3),
                'drift_score': round(drift_score, 1),
                'return_burst_flag': int(return_burst_flag),
                'high_value_concentration': round(high_value_concentration, 3),
                'abnormal_timing_flag': int(abnormal_timing_flag),
                'cross_category_flag': int(cross_category_flag),
                'account_age_risk': int(account_age_risk),
                'recent_order_frequency_change': round(recent_order_frequency_change, 3),
                'refund_amount_last_30_days': round(refund_amount_last_30_days, 2),
                # Extended Payment & Refund Signals
                'payment_amount': round(payment_amount, 2),
                'refund_amount': round(refund_amount, 2),
                'payment_count_7d': int(payment_count_7d),
                'payment_count_30d': int(payment_count_30d),
                'refund_count_7d': int(refund_count_7d),
                'refund_count_30d': int(refund_count_30d),
                'payment_frequency': round(payment_frequency, 2),
                'refund_frequency': round(refund_frequency, 2),
                'transaction_velocity': transaction_velocity,
                'historical_refund_rate': round(historical_return_rate, 4),
                'current_refund_rate': round(current_refund_rate, 4),
                'refund_to_payment_ratio': round(refund_to_payment_ratio, 4),
                'avg_historical_refund_amount': round(avg_historical_refund_amount, 2),
                'time_between_payment_and_refund': int(time_between_payment_and_refund),
                'days_since_payment': int(days_since_payment),
                'is_abuse': int(is_abuser)
            }
            returns.append(features)

    df = pd.DataFrame(returns)
    out_dirs = ['data']
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    if os.path.basename(parent_dir) == 'backend':
        out_dirs.append(script_dir)
        root_data = os.path.join(os.path.dirname(parent_dir), 'data')
        out_dirs.append(root_data)
    else:
        out_dirs.append(os.path.join(parent_dir, 'backend', 'data'))
        out_dirs.append(os.path.join(parent_dir, 'data'))

    # Train test split
    from sklearn.model_selection import train_test_split
    train_val, test = train_test_split(df, test_size=0.2, stratify=df['is_abuse'], random_state=42)
    train, val = train_test_split(train_val, test_size=0.25, stratify=train_val['is_abuse'], random_state=42) # 0.25 * 0.8 = 0.2

    for d in set(out_dirs):
        try:
            os.makedirs(d, exist_ok=True)
            df.to_csv(os.path.join(d, 'dataset.csv'), index=False)
            train.to_csv(os.path.join(d, 'train.csv'), index=False)
            val.to_csv(os.path.join(d, 'val.csv'), index=False)
            test.to_csv(os.path.join(d, 'test.csv'), index=False)
        except Exception as e:
            pass

    print(f"Generated {len(df)} returns total. Abuse rate: {df['is_abuse'].mean():.2%}")
    print(f"Train: {len(train)}, Val: {len(val)}, Test: {len(test)}")

if __name__ == '__main__':
    generate_dataset()
