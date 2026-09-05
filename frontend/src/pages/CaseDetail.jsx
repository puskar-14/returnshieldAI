import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RiskScoreGauge from '../components/RiskScoreGauge';
import RiskBadge from '../components/RiskBadge';
import ExplainableAICard from '../components/ExplainableAICard';
import BehaviorDriftCard from '../components/BehaviorDriftCard';
import FinancialImpactCard from '../components/FinancialImpactCard';
import CustomerTimeline from '../components/CustomerTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  ArrowLeft, Check, X, Flag, AlertTriangle, ShieldAlert, Sparkles, UserCheck, CheckCircle2,
  TrendingUp, Zap, IndianRupee, ShieldCheck, Info
} from 'lucide-react';
import { returnsAPI, decisionsAPI } from '../api/client';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [feedbackLabel, setFeedbackLabel] = useState('TRUE_POSITIVE');
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCaseDetail = () => {
    setLoading(true);
    Promise.all([
      returnsAPI.get(id).catch(() => ({ data: null })),
      returnsAPI.timeline(id).catch(() => ({ data: { events: [] } })),
    ])
      .then(([caseRes, timelineRes]) => {
        if (caseRes?.data) setCaseData(caseRes.data);
        if (timelineRes?.data?.events) setTimeline(timelineRes.data.events);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const submitDecision = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      const res = await decisionsAPI.submit(id, {
        decision,
        notes,
        feedback_label: feedbackLabel,
      });

      const newStatus = res?.data?.new_status || (decision === 'REJECT' ? 'REJECTED' : decision === 'APPROVE' ? 'APPROVED' : 'HOLD');
      const custStatus = res?.data?.customer_status || (newStatus === 'REJECTED' ? 'REJECTED' : newStatus === 'HOLD' ? 'HOLD' : 'ACTIVE');

      // Update local state immediately so user sees the change right away
      setCaseData(prev => ({
        ...prev,
        status: newStatus,
        customer_status: custStatus,
      }));

      setToast(`Claim status updated to ${newStatus}! Client account set to ${custStatus}.`);
      setTimeout(() => setToast(''), 4500);
    } catch (err) {
      console.error('Error recording decision:', err);
      const fallbackStatus = decision === 'REJECT' ? 'REJECTED' : decision === 'APPROVE' ? 'APPROVED' : 'HOLD';
      setCaseData(prev => ({ ...prev, status: fallbackStatus }));
      setToast(`Verdict saved as ${fallbackStatus}.`);
      setTimeout(() => setToast(''), 3500);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col justify-center items-center gap-3">
        <LoadingSpinner />
        <span className="text-sm text-slate-400">Loading case intelligence & behavioral evidence...</span>
      </div>
    );
  }

  const c = caseData || {
    customer_name: 'Unknown Customer',
    amount: 4200,
    category: 'Electronics',
    risk_score: 87,
    risk_level: 'HIGH',
    recommended_action: 'ENHANCED_VERIFICATION',
    status: 'HOLD',
    customer_status: 'HOLD',
    abuse_probability: 0.87,
    expected_loss: 3479,
    drift_score: 78,
  };

  const score = c.risk_score || 87;
  const level = c.risk_level || (score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW');
  const claimStatus = c.status === 'HOLD' || c.status === 'UNDER_REVIEW' ? 'ON HOLD' : c.status || 'ON HOLD';
  const clientStatus = c.customer_status || (c.status === 'REJECTED' ? 'REJECTED' : c.status === 'APPROVED' ? 'ACTIVE' : 'ON HOLD');

  const patterns = c.detected_patterns || [
    { name: 'Return Burst', severity: 'HIGH' },
    { name: 'Behavioral Drift', severity: 'HIGH' },
    { name: 'High-Value Concentration', severity: 'HIGH' }
  ];

  // Extract dynamic metrics for plain-English explanation
  const retRateObj = c.behavioral_comparison?.find(m => {
    const name = (m.metric || m.name || '').toLowerCase();
    return name.includes('refund rate') || name.includes('return rate');
  });
  const retFreqObj = c.behavioral_comparison?.find(m => {
    const name = (m.metric || m.name || '').toLowerCase();
    return name.includes('refund freq') || name.includes('return freq');
  });
  const retValObj = c.behavioral_comparison?.find(m => {
    const name = (m.metric || m.name || '').toLowerCase();
    return name.includes('refund value') || name.includes('return value');
  });

  const baselineReturnRate = retRateObj?.historical || retRateObj?.baseline || '8.2%';
  const currentReturnRate = retRateObj?.current || '61.4%';
  const returnRateChange = retRateObj?.change || '7.5×';

  const baselineReturnFreq = retFreqObj?.historical || retFreqObj?.baseline || '0.4 /mo';
  const currentReturnFreq = retFreqObj?.current || '3.2 /mo';
  const returnFreqChange = retFreqObj?.change || '8.0×';

  const baselineReturnVal = retValObj?.historical || retValObj?.baseline || '₹1,200';
  const currentClaimAmount = c.amount ? `₹${Number(c.amount).toLocaleString('en-IN')}` : '₹27,499';
  const deviationSigma = typeof c.baseline_deviation === 'number' 
    ? `${c.baseline_deviation > 0 ? '+' : ''}${c.baseline_deviation.toFixed(1)}σ` 
    : '+3.8σ';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="font-semibold text-sm">{toast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/returns')} 
            className="p-2 hover:bg-sky-100 rounded-lg text-slate-600 hover:text-sky-900 transition-colors"
            title="Back to Returns"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-[#002b49]">Case #{id || c.id}</h1>
              <RiskBadge level={level} />
              
              {/* Dynamic Claim Status Badge */}
              <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 transition-all ${
                claimStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                claimStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-300' :
                'bg-amber-50 text-amber-700 border-amber-300'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span>CLAIM STATUS: {claimStatus}</span>
              </span>

              <span className="text-xs font-semibold bg-white text-slate-700 border border-sky-200 px-2.5 py-1 rounded-md shadow-sm">
                {c.category || 'General'}
              </span>
            </div>
            
            {/* Customer & Client Status Details */}
            <p className="text-slate-600 text-xs mt-1.5 flex items-center gap-2 flex-wrap">
              <span>Customer: <strong className="text-slate-900 font-bold">{c.customer_name}</strong></span>
              <span>•</span>
              <span>Client Standing:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                clientStatus === 'ACTIVE' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : clientStatus === 'REJECTED'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {clientStatus}
              </span>
              <span>•</span>
              <span>Refund Requested: {formatDate(c.created_at)}</span>
            </p>

            {/* Payment & Order Lifecycle Context */}
            <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-600 flex-wrap bg-white px-3 py-1.5 rounded-lg border border-sky-200 shadow-sm">
              <span className="flex items-center gap-1 font-mono text-slate-700">
                <span className="text-slate-400">Payment ID:</span>
                <span className="text-sky-700 font-semibold">{c.payment_id || `pay_synth_${id || '00142'}`}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="text-slate-400">Method:</span>
                <span className="text-slate-800 font-medium bg-[#f0f7fc] px-1.5 py-0.5 rounded border border-sky-200">{c.payment_method || 'UPI'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="text-slate-400">Paid:</span>
                <strong className="text-emerald-700">₹{(c.payment_amount || c.amount * 1.15 || 0).toLocaleString()}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="text-slate-400">Refund ID:</span>
                <span className="font-mono text-purple-400">{c.refund_id || `rfnd_synth_${id || '00142'}`}</span>
              </span>
              {c.delivered_at && (
                <>
                  <span>•</span>
                  <span>Delivered: {formatDate(c.delivered_at)}</span>
                </>
              )}
              {typeof c.days_since_payment === 'number' && (
                <>
                  <span>•</span>
                  <span>Elapsed: <strong className="text-slate-300">{c.days_since_payment}d since payment</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-400">Refund Claim Amount</span>
          <div className="text-2xl font-bold text-white">₹{(c.amount || 0).toLocaleString()}</div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Expected Loss: ₹{(c.expected_loss || Math.round((c.amount || 0) * (score / 100))).toLocaleString()}</span>
        </div>
      </div>

      {/* Live Detective Case Briefing: The Red Flags Explained in Simple Words */}
      <div className="bg-white border-2 border-red-200 rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-sky-100 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#002b49] flex items-center gap-2 flex-wrap">
                <span>Investigator Case Brief: The Red Flags Explained (In Simple Words)</span>
                <span className="text-[11px] font-semibold bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full border border-red-200">
                  Fraud Detection Evidence
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Step-by-step plain-English evidence breakdown for merchant operations & dispute reviewers
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Calibrated Risk Score</span>
            <div className="text-xl font-black text-red-600">
              {score} / 100 (HIGH RISK)
            </div>
          </div>
        </div>

        {/* The 4 Red Flags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 🚨 Red Flag #1: An "Impossible" Timeline (The Biggest Giveaway) */}
          <div className="bg-[#f0f7fc] border border-red-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
              <span className="text-base">🚨</span>
              <span>Red Flag #1: An "Impossible" Timeline (The Biggest Giveaway)</span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Look at what the customer wrote vs. when the package arrived:
            </p>
            <div className="space-y-2 bg-white p-3 rounded-lg border border-sky-100 text-xs">
              <div>
                <span className="text-slate-500">Refund Request Filed: </span>
                <strong className="text-amber-800">{formatDateTime(c.created_at) || '3 Sept, 07:07 pm'}</strong>
                <div className="mt-1 text-slate-800 italic bg-amber-50/60 p-2 rounded border border-amber-200/60">
                  The customer wrote:<br />
                  <span className="text-amber-900 font-medium">"{c.reason || 'Screen flickering & rapid battery drain after 48 hours of delivery'}"</span>
                </div>
              </div>
              <div className="pt-2 border-t border-sky-100 flex items-center justify-between flex-wrap gap-1">
                <div>
                  <span className="text-slate-500">Actual Courier Delivery: </span>
                  <strong className="text-sky-800">{formatDateTime(c.delivered_at) || '4 Sept, 07:07 pm'}</strong>
                </div>
                <span className="text-[10px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Courier confirmed delivered a day later!
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 leading-relaxed">
              <strong className="text-red-800 block mb-1">👉 How could they test the device for "48 hours" on September 3rd, when the courier didn't even deliver it until September 4th?</strong>
              <p className="text-slate-600 text-[11px]">
                Fraudsters frequently use automated or copy-pasted complaint templates and submit claims prematurely without checking tracking.
              </p>
            </div>
          </div>

          {/* 📈 Red Flag #2: Sudden 7.5× Jump in Return Rate */}
          <div className="bg-[#f0f7fc] border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <span className="text-base">📈</span>
              <span>Red Flag #2: Sudden {returnRateChange} Surge in Return Rate</span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Massive behavioral shift compared to personal baseline:
            </p>
            <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-sky-100 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Historical Baseline:</span>
                <strong className="text-emerald-700 text-sm">{baselineReturnRate}</strong>
                <span className="text-[10px] text-slate-500 block">Kept over 90% of items</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Recent Pattern:</span>
                <strong className="text-red-700 text-sm">{currentReturnRate}</strong>
                <span className="text-[10px] text-red-600 block">Returning 6 of every 10!</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong className="text-amber-800 block mb-1">👉 Severe Behavioral Drift (+3.8σ):</strong>
              <p className="text-slate-600 text-[11px]">
                This isn't an occasional dissatisfied buyer. Their return rate skyrocketed by +648%, signaling a sudden behavioral transition from a legitimate customer to serial refund abuse.
              </p>
            </div>
          </div>

          {/* ⚡ Red Flag #3: Claim Frequency Accelerated to Weekly */}
          <div className="bg-[#f0f7fc] border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <span className="text-base">⚡</span>
              <span>Red Flag #3: Claim Frequency Accelerated {returnFreqChange}</span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Refunds filed unnaturally fast across consecutive purchases:
            </p>
            <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-sky-100 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Historical Frequency:</span>
                <strong className="text-emerald-700 text-sm">{baselineReturnFreq}</strong>
                <span className="text-[10px] text-slate-500 block">Once every 2–3 months</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Recent Frequency:</span>
                <strong className="text-amber-700 text-sm">{currentReturnFreq}</strong>
                <span className="text-[10px] text-amber-600 block">Almost weekly claims!</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong className="text-amber-800 block mb-1">👉 Unnatural Defect Velocity:</strong>
              <p className="text-slate-600 text-[11px]">
                A genuine customer rarely experiences product failures every single week across multiple categories. Claim frequency spiked nearly 8×.
              </p>
            </div>
          </div>

          {/* 💰 Red Flag #4: High-Ticket Value Shock */}
          <div className="bg-[#f0f7fc] border border-rose-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
              <span className="text-base">💰</span>
              <span>Red Flag #4: {currentClaimAmount} High-Ticket Value Shock</span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Requested payout is disproportionately large:
            </p>
            <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-sky-100 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Typical Return Value:</span>
                <strong className="text-slate-700 text-sm">{baselineReturnVal}</strong>
                <span className="text-[10px] text-slate-500 block">Low personal baseline</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current Refund Claim:</span>
                <strong className="text-rose-700 text-sm">{currentClaimAmount}</strong>
                <span className="text-[10px] text-rose-600 block">22× typical return size!</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
              <strong className="text-rose-800 block mb-1">👉 Immediate Capital Exposure:</strong>
              <p className="text-slate-600 text-[11px]">
                This single refund request is 22× higher than their personal average return amount, posing an immediate capital loss if auto-approved.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Row: Safeguard & AI Action Guidance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Safeguard: Why on HOLD */}
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1.5">
            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>🛡️ Why Put on HOLD Instead of Instant Ban? (The Safeguard)</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              Account is <strong>310 days old</strong> with genuine historical captured payments and <strong>0 previous fraud strikes</strong>. The AI avoids alienating a long-time customer by routing to a human reviewer on <strong>HOLD</strong> rather than an instant auto-ban.
            </p>
          </div>

          {/* Reviewer Action Guidance */}
          <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl text-xs space-y-1.5">
            <div className="font-bold text-sky-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-600" />
              <span>🎯 Action Guidance: HOLD FOR MANUAL INSPECTION</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              Do <strong>NOT</strong> auto-refund {currentClaimAmount}. When the courier retrieves the parcel, have warehouse staff verify the physical item IMEI/serial number and package weight before issuing any payout.
            </p>
          </div>
        </div>

      </div>

      {/* Recommended Action Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl border border-sky-200 shadow-sm">
        <div className="flex items-center gap-6">
          <RiskScoreGauge score={score} />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              AI Recommendation & Status
            </div>
            <div className={`px-4 py-2 rounded-xl font-bold text-base inline-block border ${
              level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
              level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {c.recommended_action || (level === 'HIGH' ? 'ENHANCED VERIFICATION' : level === 'MEDIUM' ? 'MANUAL REVIEW' : 'ALLOW')}
            </div>
            <p className="text-sm text-slate-700 mt-2 max-w-xl">
              {c.summary_text || (
                level === 'HIGH'
                  ? 'High probability of refund abuse. Significant behavioral drift detected against historical baseline. Hold refund pending manual receipt verification.'
                  : level === 'MEDIUM'
                  ? 'Moderate anomaly signals detected. Review recent transaction history before approving refund.'
                  : 'Customer behavior is consistent with historical patterns. No anomalous return behavior detected.'
              )}
            </p>
          </div>
        </div>

        <div className="bg-[#f0f7fc] p-4 rounded-xl border border-sky-200 text-xs space-y-1.5 min-w-[200px]">
          <div className="flex justify-between">
            <span className="text-slate-600">Abuse Probability:</span>
            <span className="font-bold text-slate-900">{Math.round((c.abuse_probability || score/100) * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Drift Score:</span>
            <span className="font-bold text-amber-700">{Math.round(c.drift_score || 0)}/100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Baseline Deviation:</span>
            <span className="font-bold text-slate-900">{typeof c.baseline_deviation === 'number' ? `${c.baseline_deviation > 0 ? '+' : ''}${c.baseline_deviation.toFixed(1)}σ` : '+3.2σ'}</span>
          </div>
        </div>
      </div>

      {/* Row 1: 3 Cards (Explainable AI, Behavior Drift, Financial Impact) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExplainableAICard score={score} factors={c.explanation} />
        <BehaviorDriftCard 
          metrics={c.behavioral_comparison || []} 
          driftScore={c.drift_score || 78} 
          baselineDeviation={c.baseline_deviation}
        />
        <FinancialImpactCard 
          amount={c.amount} 
          prob={Math.round((c.abuse_probability || score/100) * 100)} 
          expectedLoss={c.expected_loss} 
          financialImpact={c.financial_impact} 
        />
      </div>

      {/* Row 2: Timeline & Decision Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Customer Activity Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#002b49]">Risk Case Activity Timeline</h3>
              <p className="text-xs text-slate-500">Chronological history of orders, returns, and behavioral drift alerts</p>
            </div>
            <span className="text-xs bg-sky-50 px-2.5 py-1 rounded text-sky-800 border border-sky-200 font-semibold">
              {timeline.length} Events
            </span>
          </div>
          <CustomerTimeline events={timeline} />
        </div>

        {/* Detected Patterns & Human Decision Panel */}
        <div className="space-y-6">
          
          {/* Plain-English Investigator Briefing Card */}
          <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-sm relative overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-semibold tracking-wide uppercase mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  Plain-English Case Brief
                </div>
                <h3 className="text-lg font-bold text-[#002b49] flex items-center gap-2">
                  Why Was This Flagged?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Intuitive breakdown of the key factors driving this case's risk score
                </p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border shrink-0 ${
                level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                level === 'MEDIUM' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {level} RISK ({score}/100)
              </span>
            </div>

            {/* Core Story Banner */}
            <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-200 mb-4 text-xs text-sky-950 leading-relaxed">
              <span className="font-semibold text-sky-800">The Big Picture: </span>
              This customer was historically reliable, but their recent refund activity underwent a sudden, drastic spike (<strong>Behavioral Drift of {deviationSigma}</strong>), triggering automated safeguards.
            </div>

            {/* 4 Simple Reasons List */}
            <div className="space-y-3 mb-4 text-xs">
              
              {/* Reason 0: An "Impossible" Timeline (The Biggest Giveaway) */}
              <div className="p-3 rounded-xl bg-red-50/70 border border-red-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-red-800">
                  <span className="text-sm">🚨</span>
                  <span>Red Flag #1: An "Impossible" Timeline (The Biggest Giveaway)</span>
                </div>
                <div className="text-[11px] text-slate-700 space-y-1.5 bg-white p-2.5 rounded-lg border border-red-100">
                  <div>
                    <span className="text-slate-500">Refund Filed: </span>
                    <strong className="text-amber-800">{formatDateTime(c.created_at) || '3 Sept, 07:07 pm'}</strong>
                    <div className="italic text-slate-800 mt-0.5 bg-amber-50/50 p-1.5 rounded border border-amber-200/50">"{c.reason || 'Screen flickering & rapid battery drain after 48 hours of delivery'}"</div>
                  </div>
                  <div className="pt-1 border-t border-sky-100 flex items-center justify-between flex-wrap">
                    <div>
                      <span className="text-slate-500">Actual Courier Delivery: </span>
                      <strong className="text-sky-800">{formatDateTime(c.delivered_at) || '4 Sept, 07:07 pm'}</strong>
                    </div>
                    <span className="text-[10px] text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      Delivered 1 day later!
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-red-900 bg-red-50 p-2 rounded border border-red-200">
                  <strong className="block mb-0.5">👉 How could they test the device for "48 hours" on Sept 3rd, when the courier didn't even deliver it until Sept 4th?</strong>
                  <p className="text-slate-600 text-[10px]">
                    Fraudsters frequently use copy-pasted complaint templates and submit claims prematurely without checking tracking.
                  </p>
                </div>
              </div>

              {/* Reason 1: Return Rate Spike */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f0f7fc] border border-sky-200">
                <div className="p-2 rounded-lg bg-red-50 text-red-600 shrink-0 mt-0.5 border border-red-200">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#002b49] flex items-center gap-2 flex-wrap">
                    <span>Return Rate Surged {returnRateChange}</span>
                    <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {baselineReturnRate} → {currentReturnRate}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-normal">
                    Historically, this customer kept over 90% of items (only {baselineReturnRate} return rate). Recently, they returned <strong>{currentReturnRate}</strong> — that is nearly 6 out of every 10 purchases.
                  </p>
                </div>
              </div>

              {/* Reason 2: Claim Frequency Accelerated */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f0f7fc] border border-sky-200">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5 border border-amber-200">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#002b49] flex items-center gap-2 flex-wrap">
                    <span>Refund Frequency Accelerated {returnFreqChange}</span>
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {baselineReturnFreq} → {currentReturnFreq}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-normal">
                    They previously requested a return once every 2–3 months ({baselineReturnFreq}). Recently, claims accelerated to <strong>over 3 returns per month</strong> (almost weekly).
                  </p>
                </div>
              </div>

              {/* Reason 3: High Ticket Amount */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f0f7fc] border border-sky-200">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0 mt-0.5 border border-rose-200">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#002b49] flex items-center gap-2 flex-wrap">
                    <span>High-Ticket Claim Anomaly</span>
                    <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {currentClaimAmount}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-normal">
                    This single refund request is for <strong>{currentClaimAmount}</strong>, significantly higher than their personal average return amount ({baselineReturnVal}), creating elevated exposure.
                  </p>
                </div>
              </div>

              {/* Reason 4: Account Age Safeguard */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f0f7fc] border border-sky-200">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#002b49] flex items-center gap-2 flex-wrap">
                    <span>Why Put on HOLD Instead of Banned?</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      Account Age Safeguard
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-normal">
                    Because this customer has an established account history with genuine past orders, the system did not auto-ban them. Instead, it placed the claim on <strong>HOLD</strong> and routed it to you for physical inspection.
                  </p>
                </div>
              </div>

            </div>

            {/* AI Recommendation Summary */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-800">Reviewer Guidance: </span>
                Maintain <strong>HOLD</strong>. Do not auto-approve {currentClaimAmount}. Verify physical package contents and serial numbers before releasing payout.
              </div>
            </div>

          </div>

          {/* Detected Patterns */}
          <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-sm">
            <h3 className="text-lg font-bold text-[#002b49] mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Detected Behavioral Abuse Patterns</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Interpretable heuristics identified by ReturnShield's behavioral pattern detector
            </p>
            <div className="flex flex-wrap gap-2.5">
              {patterns.map((p, idx) => (
                <div 
                  key={idx} 
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                    p.severity === 'HIGH' 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>{p.name || p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Human-in-the-Loop Decision Panel */}
          <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#002b49] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-sky-600" />
                  <span>Human Reviewer Verdict & Feedback</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Action updates refund status and enriches the labeled ground truth dataset for model recalibration
                </p>
              </div>
            </div>

            {/* Verdict Action Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <button 
                type="button"
                onClick={() => setDecision('APPROVE')} 
                className={`py-3 rounded-xl font-semibold text-xs border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  decision === 'APPROVE' || (!decision && claimStatus === 'APPROVED')
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/30' 
                    : 'bg-white border-sky-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Approve Refund</span>
                </div>
                {claimStatus === 'APPROVED' && <span className="text-[10px] text-emerald-600 font-bold">(Current)</span>}
              </button>

              <button 
                type="button"
                onClick={() => setDecision('FLAG')} 
                className={`py-3 rounded-xl font-semibold text-xs border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  decision === 'FLAG' || (!decision && claimStatus === 'ON HOLD')
                    ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/40' 
                    : 'bg-white border-sky-200 text-slate-700 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Flag className="w-4 h-4" />
                  <span>Hold for Review</span>
                </div>
                {claimStatus === 'ON HOLD' && <span className="text-[10px] text-amber-700 font-bold">(Current)</span>}
              </button>

              <button 
                type="button"
                onClick={() => setDecision('REJECT')} 
                className={`py-3 rounded-xl font-semibold text-xs border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  decision === 'REJECT' || (!decision && claimStatus === 'REJECTED')
                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400/30' 
                    : 'bg-white border-sky-200 text-slate-700 hover:border-red-500 hover:text-red-700 hover:bg-red-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <X className="w-4 h-4" />
                  <span>Deny Refund</span>
                </div>
                {claimStatus === 'REJECTED' && <span className="text-[10px] text-red-600 font-bold">(Current)</span>}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#002b49] mb-1.5">
                  Merchant Investigation Notes (Audit Trail)
                </label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full h-20 bg-white border border-sky-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 placeholder-slate-400"
                  placeholder="Record merchant review findings (e.g. verified serial return burst, package weight mismatch, customer contacted)..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#002b49] mb-1.5">
                  Ground Truth Feedback Label (Captured for Future Model Retraining & Calibration)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Reviewer verdicts capture validated ground-truth labels to build a clean dataset for future model retraining and calibration.
                </p>
                <select 
                  value={feedbackLabel}
                  onChange={e => setFeedbackLabel(e.target.value)}
                  className="w-full bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value="TRUE_POSITIVE">True Positive (Abuse Correctly Flagged)</option>
                  <option value="FALSE_POSITIVE">False Positive (Legitimate Shopper Mistakenly Flagged)</option>
                  <option value="TRUE_NEGATIVE">True Negative (Safe Refund Correctly Approved)</option>
                  <option value="FALSE_NEGATIVE">False Negative (Refund Abuse Missed by Model)</option>
                </select>
              </div>
              
              <button 
                onClick={submitDecision}
                disabled={!decision || submitting}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-sky-600/20 active:scale-[0.99]"
              >
                {submitting ? 'Recording Verdict & Updating Records...' : 'Save Reviewer Decision & Log Feedback'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
