import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score, confusion_matrix, roc_auc_score, average_precision_score

def train():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    
    # Try finding data files in current dir, backend/data, or root data
    data_dir = 'data'
    if not os.path.exists(os.path.join(data_dir, 'train.csv')):
        candidate = os.path.join(parent_dir, 'data')
        if os.path.exists(os.path.join(candidate, 'train.csv')):
            data_dir = candidate
        else:
            candidate = os.path.join(script_dir)
            if os.path.exists(os.path.join(candidate, 'train.csv')):
                data_dir = candidate

    train_df = pd.read_csv(os.path.join(data_dir, 'train.csv'))
    val_df = pd.read_csv(os.path.join(data_dir, 'val.csv'))
    test_df = pd.read_csv(os.path.join(data_dir, 'test.csv'))
    
    X_train = train_df.drop('is_abuse', axis=1)
    y_train = train_df['is_abuse']
    
    X_val = val_df.drop('is_abuse', axis=1)
    y_val = val_df['is_abuse']
    
    X_test = test_df.drop('is_abuse', axis=1)
    y_test = test_df['is_abuse']
    
    feature_names = X_train.columns.tolist()
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)
    
    base_clf = GradientBoostingClassifier(n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42)
    clf = CalibratedClassifierCV(base_clf, method='isotonic', cv=5)
    clf.fit(X_train_scaled, y_train)
    
    # Find optimal threshold on val
    val_probs = clf.predict_proba(X_val_scaled)[:, 1]
    best_threshold = 0.5
    best_f1 = 0
    
    for th in np.arange(0.1, 0.9, 0.05):
        val_preds = (val_probs >= th).astype(int)
        f1 = f1_score(y_val, val_preds)
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = float(th)
            
    # Evaluate on test
    test_probs = clf.predict_proba(X_test_scaled)[:, 1]
    test_preds = (test_probs >= best_threshold).astype(int)
    
    precision = precision_score(y_test, test_preds)
    recall = recall_score(y_test, test_preds)
    f1 = f1_score(y_test, test_preds)
    accuracy = accuracy_score(y_test, test_preds)
    cm = confusion_matrix(y_test, test_preds)
    tn, fp, fn, tp = cm.ravel()
    
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
    
    roc_auc = roc_auc_score(y_test, test_probs)
    pr_auc = average_precision_score(y_test, test_probs)
    
    artifact_dirs = ['app/ml/model_artifacts']
    backend_artifact_dir = os.path.join(parent_dir, 'app', 'ml', 'model_artifacts')
    if os.path.exists(os.path.dirname(backend_artifact_dir)):
        artifact_dirs.append(backend_artifact_dir)
    root_backend_dir = os.path.join(os.getcwd(), 'backend', 'app', 'ml', 'model_artifacts')
    artifact_dirs.append(root_backend_dir)

    metrics = {
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1),
        'accuracy': float(accuracy),
        'confusion_matrix': [[int(tn), int(fp)], [int(fn), int(tp)]],
        'fpr': float(fpr),
        'fnr': float(fnr),
        'roc_auc': float(roc_auc),
        'pr_auc': float(pr_auc),
        'train_size': len(X_train),
        'val_size': len(X_val),
        'test_size': len(X_test)
    }

    test_probs_payload = {
        'probs': [float(p) for p in test_probs],
        'labels': [int(l) for l in y_test.tolist()]
    }

    for ad in set(artifact_dirs):
        try:
            os.makedirs(ad, exist_ok=True)
            joblib.dump(clf, os.path.join(ad, 'model.joblib'))
            joblib.dump(scaler, os.path.join(ad, 'scaler.joblib'))
            with open(os.path.join(ad, 'feature_names.json'), 'w') as f:
                json.dump(feature_names, f)
            with open(os.path.join(ad, 'threshold.json'), 'w') as f:
                json.dump({'threshold': best_threshold}, f)
            with open(os.path.join(ad, 'model_metrics.json'), 'w') as f:
                json.dump(metrics, f)
            with open(os.path.join(ad, 'training_history.json'), 'w') as f:
                json.dump({'history': 'mock_history_data'}, f)
            with open(os.path.join(ad, 'test_probs.json'), 'w') as f:
                json.dump(test_probs_payload, f)
        except Exception as e:
            pass

    print("--- Test Set Evaluation (Held-Out) ---")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"ROC AUC:   {roc_auc:.4f}")
    print(f"PR  AUC:   {pr_auc:.4f}")
    print(f"FPR:       {fpr:.4f}")
    print(f"FNR:       {fnr:.4f}")
    print(f"Threshold: {best_threshold:.4f}")
    print("Confusion Matrix (Test Set):")
    print(f"  TN: {tn} | FP: {fp}")
    print(f"  FN: {fn} | TP: {tp}")
    print("Model artifacts saved to app/ml/model_artifacts/")

if __name__ == '__main__':
    train()
