import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, CreditCard, RotateCcw } from 'lucide-react';
import { returnsAPI } from '../api/client';

const PRESETS = [
  {
    name: '🛡️ Normal Customer',
    subtitle: 'Healthy payment/refund ratio',
    badge: 'LOW RISK',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    data: {
      customer_name: 'Sneha Reddy (Normal Profile)',
      category: 'Home',
      payment_amount: 3200,
      return_amount: 1150,
      payment_method: 'UPI',
      reason: 'Wrong item size received',
      days_since_payment: 11,
      payments_last_30d: 3,
      refunds_last_30d: 0,
      total_payments: 24,
      total_refunds: 2,
      account_age_days: 620,
      verified_abuse_history: 0,
    }
  },
  {
    name: '⚡ Refund Burst',
    subtitle: 'Multiple claims in 7 days',
    badge: 'HIGH RISK',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    data: {
      customer_name: 'Priya Patel (Refund Burst)',
      category: 'Fashion',
      payment_amount: 8500,
      return_amount: 7900,
      payment_method: 'Card',
      reason: 'Product defective',
      days_since_payment: 2,
      payments_last_30d: 5,
      refunds_last_30d: 4,
      total_payments: 7,
      total_refunds: 5,
      account_age_days: 95,
      verified_abuse_history: 0,
    }
  },
  {
    name: '🚨 Behavioral Drift',
    subtitle: 'Sudden surge from 5% to 65%',
    badge: 'HIGH RISK',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    data: {
      customer_name: 'Raj Sharma (Drift Anomaly)',
      category: 'Electronics',
      payment_amount: 12500,
      return_amount: 11800,
      payment_method: 'UPI',
      reason: 'Missing parts inside parcel',
      days_since_payment: 4,
      payments_last_30d: 4,
      refunds_last_30d: 3,
      total_payments: 22,
      total_refunds: 6,
      account_age_days: 340,
      verified_abuse_history: 0,
    }
  },
  {
    name: '💎 High-Value Refund',
    subtitle: 'Disproportionate claim value',
    badge: 'HIGH RISK',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    data: {
      customer_name: 'Vikram Malhotra (High-Value)',
      category: 'Electronics',
      payment_amount: 28000,
      return_amount: 26500,
      payment_method: 'NetBanking',
      reason: 'Item defective on arrival',
      days_since_payment: 3,
      payments_last_30d: 2,
      refunds_last_30d: 1,
      total_payments: 6,
      total_refunds: 2,
      account_age_days: 120,
      verified_abuse_history: 0,
    }
  },
  {
    name: '⚖️ Borderline Customer',
    subtitle: 'Mixed trust & risk signals',
    badge: 'MEDIUM RISK',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    data: {
      customer_name: 'Amitabh Joshi (Borderline)',
      category: 'Sports',
      payment_amount: 4500,
      return_amount: 3400,
      payment_method: 'UPI',
      reason: 'Changed mind after inspection',
      days_since_payment: 8,
      payments_last_30d: 3,
      refunds_last_30d: 1,
      total_payments: 12,
      total_refunds: 3,
      account_age_days: 210,
      verified_abuse_history: 0,
    }
  }
];

export default function TestReturnModal({ isOpen, onClose, onReturnCreated }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(PRESETS[0].data);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleApplyPreset = (presetData) => {
    setFormData({ ...presetData });
    setResult(null);
  };

  const handleScore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        customer_id: 0,
        override_db: true,
        customer_name: formData.customer_name,
        category: formData.category,
        payment_amount: Number(formData.payment_amount),
        return_amount: Number(formData.return_amount),
        amount: Number(formData.return_amount),
        payment_method: formData.payment_method,
        reason: formData.reason,
        days_since_payment: Number(formData.days_since_payment),
        days_since_purchase: Number(formData.days_since_payment),
        payments_last_30d: Number(formData.payments_last_30d),
        refunds_last_30d: Number(formData.refunds_last_30d),
        recent_returns: Number(formData.refunds_last_30d),
        total_payments: Number(formData.total_payments),
        total_orders: Number(formData.total_payments),
        total_refunds: Number(formData.total_refunds),
        total_returns: Number(formData.total_refunds),
        account_age_days: Number(formData.account_age_days),
        verified_abuse_history: formData.verified_abuse_history ? 1 : 0,
      };

      const res = await returnsAPI.score(payload);
      setResult(res.data);
      if (onReturnCreated) onReturnCreated(res.data);
    } catch (err) {
      console.error('Error scoring refund request:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    if (level === 'HIGH') return 'text-red-700 bg-red-50 border-red-200';
    if (level === 'MEDIUM') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  const refundToPaymentPct = formData.payment_amount > 0 
    ? Math.round((formData.return_amount / formData.payment_amount) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-sky-200 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-800">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-sky-200 flex justify-between items-center bg-[#f0f7fc]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-100 rounded-lg text-sky-700">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-[#002b49]">Payment &rarr; Refund Risk Sandbox</h2>
              <span className="text-[11px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200">
                Live Calibrated ML
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Test how the risk engine scores refund requests across 5 distinct merchant abuse patterns
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-sky-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* 5 Scenario Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              Select Demo Scenario Preset (5 Target Patterns)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p.data)}
                  className="p-3 rounded-xl border border-sky-200 bg-[#f0f7fc] hover:bg-sky-50 text-left transition-all group active:scale-[0.98] flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                    <div className="font-semibold text-xs text-slate-900 mt-2 truncate group-hover:text-sky-700">
                      {p.name}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {p.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Input Fields */}
          <form onSubmit={handleScore} className="space-y-4 bg-[#f0f7fc] p-4 rounded-xl border border-sky-200 shadow-sm">
            
            {/* Section 1: Customer & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                <input 
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-sm"
                >
                  <option value="Electronics">Electronics (10% Baseline)</option>
                  <option value="Fashion">Fashion (20% Baseline)</option>
                  <option value="Furniture">Furniture (5% Baseline)</option>
                  <option value="Home">Home (7% Baseline)</option>
                  <option value="Books">Books (3% Baseline)</option>
                  <option value="Sports">Sports (8% Baseline)</option>
                  <option value="Beauty">Beauty (12% Baseline)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select 
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-sm"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="NetBanking">NetBanking (HDFC, ICICI, SBI)</option>
                  <option value="Card">Credit/Debit Card (Visa, Mastercard)</option>
                </select>
              </div>
            </div>

            {/* Section 2: Financial Amounts & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (₹)</label>
                <input 
                  type="number"
                  min="50"
                  step="50"
                  value={formData.payment_amount}
                  onChange={(e) => setFormData({ ...formData, payment_amount: Number(e.target.value) })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-emerald-700 focus:ring-1 focus:ring-sky-500 focus:outline-none font-bold shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Refund Claim (₹)</label>
                <input 
                  type="number"
                  min="50"
                  step="50"
                  value={formData.return_amount}
                  onChange={(e) => setFormData({ ...formData, return_amount: Number(e.target.value) })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-red-700 focus:ring-1 focus:ring-sky-500 focus:outline-none font-bold shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Days Since Payment</label>
                <input 
                  type="number"
                  min="0"
                  max="90"
                  value={formData.days_since_payment}
                  onChange={(e) => setFormData({ ...formData, days_since_payment: Number(e.target.value) })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Claim Reason</label>
                <select 
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-sm"
                >
                  <option value="Product defective">Product defective</option>
                  <option value="Missing parts inside parcel">Missing parts inside parcel</option>
                  <option value="Wrong item size received">Wrong item size received</option>
                  <option value="Changed mind after inspection">Changed mind after inspection</option>
                  <option value="Item defective on arrival">Item defective on arrival</option>
                </select>
              </div>
            </div>

            {/* Section 3: 30-Day Velocity & Lifetime Aggregates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payments (30d)</label>
                <input 
                  type="number"
                  min="0"
                  max="50"
                  value={formData.payments_last_30d}
                  onChange={(e) => setFormData({ ...formData, payments_last_30d: Number(e.target.value) })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Refunds (30d)</label>
                <input 
                  type="number"
                  min="0"
                  max="30"
                  value={formData.refunds_last_30d}
                  onChange={(e) => setFormData({ ...formData, refunds_last_30d: Number(e.target.value) })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lifetime Payments</label>
                <input 
                  type="number"
                  min="1"
                  max="500"
                  value={formData.total_payments}
                  onChange={(e) => setFormData({ ...formData, total_payments: Number(e.target.value) })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lifetime Refunds</label>
                <input 
                  type="number"
                  min="0"
                  max="200"
                  value={formData.total_refunds}
                  onChange={(e) => setFormData({ ...formData, total_refunds: Number(e.target.value) })}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Calculated Ratio Badge & Submit */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-sky-200">
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <span className="bg-white px-2.5 py-1 rounded border border-sky-200 shadow-sm">
                  Refund-to-Payment Ratio: <strong className={refundToPaymentPct > 50 ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}>{refundToPaymentPct}%</strong>
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={Boolean(formData.verified_abuse_history)}
                    onChange={(e) => setFormData({ ...formData, verified_abuse_history: e.target.checked ? 1 : 0 })}
                    className="rounded border-sky-300 text-sky-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="font-medium">Prior Verified Abuse</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-xs flex items-center gap-2 transition-all shadow-md active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating ML Risk & Behavioral Drift...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Score Refund Request</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Result Card */}
          {result && (
            <div className="mt-4 p-5 bg-white rounded-2xl border border-sky-200 space-y-4 animate-fadeIn shadow-md">
              
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-sky-100">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">Risk Score</span>
                    <div className="text-3xl font-black text-[#002b49]">
                      {result.risk_score}<span className="text-slate-400 text-base">/100</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${getRiskColor(result.risk_level)}`}>
                    {result.risk_level} RISK
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Recommended Action</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg border inline-block mt-0.5 ${
                    result.risk_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                    result.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {result.recommended_action || 'MANUAL REVIEW'}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-[#f0f7fc] p-3 rounded-xl border border-sky-200">
                  <div className="text-[11px] text-slate-500">Abuse Probability</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {((result.abuse_probability || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-[#f0f7fc] p-3 rounded-xl border border-sky-200">
                  <div className="text-[11px] text-slate-500">Expected Financial Exposure</div>
                  <div className="text-lg font-bold text-red-700 mt-0.5">
                    ₹{Math.round(result.expected_loss || (result.financial_impact?.expected_loss || 0)).toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#f0f7fc] p-3 rounded-xl border border-sky-200">
                  <div className="text-[11px] text-slate-500">Behavior Drift Score</div>
                  <div className="text-lg font-bold text-amber-700 mt-0.5">
                    {Math.round(result.drift_score || 0)}/100
                  </div>
                </div>
                <div className="bg-[#f0f7fc] p-3 rounded-xl border border-sky-200">
                  <div className="text-[11px] text-slate-500">Expected Net Savings</div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">
                    ₹{Math.round(result.financial_impact?.net_savings_if_blocked || (result.expected_loss ? result.expected_loss * 0.75 : 1200)).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Plain-English Decision Intelligence */}
              {result.decision_summary && (
                <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 space-y-2 text-xs">
                  <div className="font-bold text-[#002b49] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                    <span>Executive AI Decision Summary</span>
                  </div>
                  {result.decision_summary.why_flagged && result.decision_summary.why_flagged.length > 0 && (
                    <ul className="space-y-1 text-slate-700">
                      {result.decision_summary.why_flagged.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-sky-900 font-semibold pt-1 border-t border-sky-200">
                    AI Guidance: {result.decision_summary.recommendation || result.recommended_action}
                  </p>
                </div>
              )}

              {/* Explainable Signals */}
              {result.explanation && result.explanation.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Top Contributing Risk Signals (SHAP Explainability):
                  </span>
                  <div className="space-y-1.5">
                    {result.explanation.slice(0, 3).map((exp, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-[#f0f7fc] px-3 py-2 rounded-lg border border-sky-200">
                        <span className="text-slate-800 font-medium">{exp.signal}</span>
                        <span className={`font-bold ${exp.direction === 'risk' ? 'text-red-700' : 'text-emerald-700'}`}>
                          {exp.direction === 'risk' ? '+' : ''}{Math.round(exp.contribution)} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Link to Full Case View if saved */}
              {result.return_request_id && (
                <div className="pt-2 border-t border-sky-100 flex justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/returns/${result.return_request_id}`);
                    }}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1.5 hover:underline"
                  >
                    <span>Inspect Saved Case #{result.return_request_id} &rarr;</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
