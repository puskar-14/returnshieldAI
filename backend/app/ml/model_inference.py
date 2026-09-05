import os
import json
import joblib
import numpy as np

_model_cache = {}

def load_model() -> dict:
    if 'model' in _model_cache:
        return _model_cache
        
    model_dir = 'app/ml/model_artifacts'
    if not os.path.exists(os.path.join(model_dir, 'model.joblib')):
        return {}
        
    _model_cache['model'] = joblib.load(os.path.join(model_dir, 'model.joblib'))
    _model_cache['scaler'] = joblib.load(os.path.join(model_dir, 'scaler.joblib'))
    with open(os.path.join(model_dir, 'feature_names.json'), 'r') as f:
        _model_cache['feature_names'] = json.load(f)
    with open(os.path.join(model_dir, 'threshold.json'), 'r') as f:
        _model_cache['threshold'] = json.load(f)['threshold']
        
    return _model_cache

def predict(features: dict) -> dict:
    artifacts = load_model()
    if not artifacts:
        return {'abuse_probability': 0.0, 'risk_score': 0, 'risk_level': 'LOW', 'recommended_action': 'ALLOW', 'threshold_used': 0.5}
        
    feature_names = artifacts['feature_names']
    X = np.array([[features.get(f, 0.0) for f in feature_names]])
    X_scaled = artifacts['scaler'].transform(X)
    
    prob = float(artifacts['model'].predict_proba(X_scaled)[0, 1])
    risk_score = int(prob * 100)
    
    if risk_score < 40:
        risk_level = "LOW"
        recommended_action = "ALLOW"
    elif risk_score < 70:
        risk_level = "MEDIUM"
        recommended_action = "MANUAL_REVIEW"
    else:
        risk_level = "HIGH"
        recommended_action = "ENHANCED_VERIFICATION"
        
    return {
        'abuse_probability': prob,
        'risk_score': risk_score,
        'risk_level': risk_level,
        'recommended_action': recommended_action,
        'threshold_used': artifacts['threshold']
    }
