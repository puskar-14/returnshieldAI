import React from 'react';
import { CheckCircle2, XCircle, TrendingUp, ShieldAlert, AlertTriangle, Check } from 'lucide-react';

export default function FinancialImpactCard({ amount = 4200, prob = 82, expectedLoss = 3444, financialImpact }) {
  const refundAmount = financialImpact?.return_value || amount;
  const probability = financialImpact?.abuse_probability !== undefined 
    ? Math.round(financialImpact.abuse_probability * 100) 
    : prob;
  const loss = Math.round(financialImpact?.expected_loss || expectedLoss);
  const fpCost = Math.round(financialImpact?.false_positive_cost || 1200);
  const reviewCost = financialImpact?.review_cost || 250;
  const netBenefit = Math.round(financialImpact?.net_savings_if_blocked || (loss - fpCost - reviewCost));

  const recommendedAction = probability >= 70 ? 'HOLD' : probability >= 40 ? 'ADDITIONAL REVIEW' : 'APPROVE';

  return (
    <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#002b49]">Expected Financial Exposure</h3>
            <p className="text-xs text-slate-500 mt-0.5">Quantified merchant financial risk vs. customer churn cost</p>
          </div>
          <span className="text-xs bg-sky-50 border border-sky-200 px-2 py-1 rounded text-sky-800 font-semibold">
            Razorpay Risk Engine
          </span>
        </div>
        
        <div className="space-y-2.5 mb-5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Potential Refund Exposure:</span>
            <span className="text-slate-900 font-bold">₹{refundAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Abuse Probability:</span>
            <span className="text-amber-700 font-bold">{probability}%</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-sky-200">
            <span className="text-slate-700 font-medium">Expected Loss:</span>
            <span className="text-red-600 font-bold text-base">₹{loss.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[#f0f7fc] rounded-xl p-4 border border-sky-200 space-y-2.5 text-xs">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Economic Trade-Off If Action Taken:
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Loss prevented if abusive:</span>
              </span>
              <span className="font-semibold">+₹{loss.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-amber-700">
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>False-positive customer cost:</span>
              </span>
              <span className="font-semibold">-₹{fpCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Manual review analyst cost:</span>
              </span>
              <span className="font-semibold">-₹{reviewCost.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pt-2.5 border-t border-sky-200 flex justify-between items-center text-sm">
            <span className="text-slate-700 font-semibold">Expected Net Benefit:</span>
            <span className={`font-bold ${netBenefit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {netBenefit >= 0 ? '+' : ''}₹{netBenefit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className={`mt-5 p-3 text-center rounded-xl text-xs font-bold border flex items-center justify-center gap-2 ${
        probability >= 70 ? 'bg-red-50 text-red-700 border-red-200' :
        probability >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
        'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}>
        {probability >= 70 ? <ShieldAlert className="w-4 h-4" /> : probability >= 40 ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
        <span>Recommended Action: {recommendedAction}</span>
      </div>
    </div>
  );
}
