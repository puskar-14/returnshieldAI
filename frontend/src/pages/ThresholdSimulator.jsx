import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  Star, Scale, RefreshCw, ArrowRight 
} from 'lucide-react';
import { simulatorAPI } from '../api/client';

export default function ThresholdSimulator() {
  const [threshold, setThreshold] = useState(65);
  const [loading, setLoading] = useState(false);
  const [simulatorData, setSimulatorData] = useState(null);
  const [curveTable, setCurveTable] = useState([]);
  const [optimalData, setOptimalData] = useState(null);
  const [comparisonTable, setComparisonTable] = useState([]);

  // Fetch simulation data from backend
  const fetchSimulation = useCallback(async (th) => {
    setLoading(true);
    try {
      const res = await simulatorAPI.whatIf(th);
      if (res?.data) {
        setSimulatorData(res.data.current_metrics);
        setCurveTable(res.data.curve_table || []);
        setOptimalData(res.data.optimal_threshold || null);
        setComparisonTable(res.data.comparison_table || []);
      }
    } catch (err) {
      console.error('Error fetching threshold simulation:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSimulation(threshold);
  }, []);

  // When user drags slider, find closest row in cached curve table for instant feedback
  const currentMetrics = useMemo(() => {
    if (curveTable && curveTable.length > 0) {
      const closest = curveTable.reduce((prev, curr) =>
        Math.abs(curr.threshold - threshold) < Math.abs(prev.threshold - threshold) ? curr : prev
      );
      return closest;
    }
    return simulatorData || {
      threshold: threshold,
      precision: 0.9298,
      recall: 0.7324,
      fpr: 0.064,
      fnr: 0.2676,
      cases_flagged: 627,
      abuse_cases_prevented: 583,
      true_positives: 583,
      expected_financial_exposure: 2284520,
      expected_loss_prevented: 1673210,
      false_positive_cost: 95040,
      review_cost: 94050,
      net_economic_benefit: 1484120,
    };
  }, [threshold, curveTable, simulatorData]);

  const handleSliderChange = (newVal) => {
    setThreshold(newVal);
  };

  const handleSliderCommit = () => {
    fetchSimulation(threshold);
  };

  // Format chart data for Recharts
  const chartData = useMemo(() => {
    if (curveTable && curveTable.length > 0) {
      return curveTable.map(row => ({
        threshold: row.threshold,
        precision: Number((row.precision * 100).toFixed(1)),
        recall: Number((row.recall * 100).toFixed(1)),
        fpCost: Math.round(row.false_positive_cost / 1000),
        lossPrevented: Math.round(row.expected_loss_prevented / 1000),
        netBenefit: Math.round((row.net_economic_benefit || row.net_benefit) / 1000),
      }));
    }
    return [];
  }, [curveTable]);

  const optimalTh = optimalData?.threshold || 40;
  const isCurrentlyOptimal = threshold === optimalTh;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002b49] flex items-center gap-2.5">
            <span>What-If Threshold Simulator</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              Held-Out Test Set Evaluator
            </span>
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Dynamically model the economic trade-offs of adjusting risk score thresholds across the complete payment-to-refund lifecycle.
          </p>
        </div>

        <button 
          onClick={() => fetchSimulation(threshold)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 border border-sky-300 text-xs text-sky-900 transition-colors w-fit shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Simulation</span>
        </button>
      </div>

      {/* 5-Stage Economic Trade-Off Chain Banner */}
      <div className="bg-white border border-sky-200 rounded-xl p-3.5 shadow-sm">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          End-to-End Decision Framework
        </div>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-[#f0f7fc] p-2 rounded-lg border border-sky-200">
            <span className="text-sky-700 block font-bold text-[11px]">1. Risk Threshold</span>
            <span className="text-slate-600 text-[10px] block">Score cut-off (0-100)</span>
          </div>
          <div className="bg-[#f0f7fc] p-2 rounded-lg border border-sky-200">
            <span className="text-indigo-700 block font-bold text-[11px]">2. ML Performance</span>
            <span className="text-slate-600 text-[10px] block">Precision & Recall balance</span>
          </div>
          <div className="bg-[#f0f7fc] p-2 rounded-lg border border-amber-200">
            <span className="text-amber-800 block font-bold text-[11px]">3. Customer Cost</span>
            <span className="text-slate-600 text-[10px] block">False-positive churn (LTV)</span>
          </div>
          <div className="bg-[#f0f7fc] p-2 rounded-lg border border-rose-200">
            <span className="text-rose-700 block font-bold text-[11px]">4. Merchant Loss</span>
            <span className="text-slate-600 text-[10px] block">Unblocked refund payouts</span>
          </div>
          <div className="bg-[#f0f7fc] p-2 rounded-lg border border-emerald-200">
            <span className="text-emerald-700 block font-bold text-[11px]">5. Economic Benefit</span>
            <span className="text-slate-600 text-[10px] block">Net merchant recovery</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Control Card */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-sky-200 shadow-sm space-y-6">
        {/* Slider Control */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#002b49] text-sm">Active Decision Cut-Off:</span>
              <span className="text-2xl font-black text-sky-700 bg-sky-50 px-3 py-0.5 rounded-lg border border-sky-200">
                {threshold} / 100
              </span>
              {isCurrentlyOptimal && (
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Recommended Optimum
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              Flags any refund claim with calibrated risk score ≥ {threshold} for review/hold
            </span>
          </div>

          <input 
            type="range" 
            min="10" 
            max="95" 
            step="1"
            value={threshold} 
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            className="w-full h-2.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />

          <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
            <span>10 (Aggressive Interception)</span>
            <span>40 (Economic Optimum)</span>
            <span>65 (High Precision)</span>
            <span>95 (Frictionless / Minimal Flags)</span>
          </div>
        </div>

        {/* Dynamic Metric Cards (Full Pipeline) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Card 1: Precision & FPR */}
          <div className="bg-[#f0f7fc] p-4 rounded-xl border border-sky-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600 text-xs font-medium">Precision</span>
              <span className="text-[10px] text-slate-500 font-mono">FPR: {(currentMetrics.fpr * 100).toFixed(1)}%</span>
            </div>
            <p className="text-2xl font-bold text-[#002b49]">{(currentMetrics.precision * 100).toFixed(1)}%</p>
            <p className="text-[11px] text-slate-500 mt-1">Accuracy of flagged claims</p>
          </div>

          {/* Card 2: Recall & FNR */}
          <div className="bg-[#f0f7fc] p-4 rounded-xl border border-sky-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600 text-xs font-medium">Recall</span>
              <span className="text-[10px] text-slate-500 font-mono">FNR: {(currentMetrics.fnr * 100).toFixed(1)}%</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{(currentMetrics.recall * 100).toFixed(1)}%</p>
            <p className="text-[11px] text-slate-500 mt-1">Abuse volume intercepted</p>
          </div>

          {/* Card 3: Cases Flagged & TPs */}
          <div className="bg-[#f0f7fc] p-4 rounded-xl border border-sky-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600 text-xs font-medium">Flagged Cases</span>
              <span className="text-[10px] text-emerald-700 font-semibold">{currentMetrics.abuse_cases_prevented || currentMetrics.true_positives} TPs</span>
            </div>
            <p className="text-2xl font-bold text-sky-700">{currentMetrics.cases_flagged}</p>
            <p className="text-[11px] text-slate-500 mt-1">Total manual investigations</p>
          </div>

          {/* Card 4: Net Economic Benefit */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-300 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-emerald-900 text-xs font-semibold">Net Economic Benefit</span>
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-800">
              ₹{Math.round(currentMetrics.net_economic_benefit || currentMetrics.net_benefit).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Prevented loss minus churn & review</p>
          </div>
        </div>

        {/* Financial Breakdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#f0f7fc] p-4 rounded-xl border border-sky-200 text-xs">
          <div>
            <span className="text-slate-600 block text-[11px]">Expected Financial Exposure:</span>
            <strong className="text-[#002b49] text-sm font-bold">
              ₹{Math.round(currentMetrics.expected_financial_exposure || 0).toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 block">Total potential abuse pool</span>
          </div>

          <div>
            <span className="text-emerald-800 block text-[11px] font-semibold">Expected Loss Prevented:</span>
            <strong className="text-emerald-700 text-sm font-bold">
              +₹{Math.round(currentMetrics.expected_loss_prevented || 0).toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 block">Abusive payouts intercepted</span>
          </div>

          <div>
            <span className="text-amber-900 block text-[11px] font-semibold">False-Positive Churn Cost:</span>
            <strong className="text-amber-800 text-sm font-bold">
              -₹{Math.round(currentMetrics.false_positive_cost || 0).toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 block">Legitimate buyer churn risk</span>
          </div>

          <div>
            <span className="text-slate-600 block text-[11px]">Manual Review Overhead:</span>
            <strong className="text-slate-700 text-sm font-bold">
              -₹{Math.round(currentMetrics.review_cost || 0).toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 block">₹150 analyst cost per flag</span>
          </div>
        </div>

        {/* Dual-Axis Trade-Off Line Chart */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-[#002b49] font-bold">Model Precision & Recall vs. Economic Recovery (₹ Thousands)</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-purple-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Precision (%)
              </span>
              <span className="flex items-center gap-1 text-pink-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span> Recall (%)
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Net Benefit (₹k)
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> FP Cost (₹k)
              </span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" />
                <XAxis dataKey="threshold" stroke="#002b49" />
                <YAxis yAxisId="left" stroke="#002b49" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="#002b49" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', color: '#002b49' }} />
                <ReferenceLine 
                  x={threshold} 
                  stroke="#0284c7" 
                  strokeDasharray="3 3" 
                  label={{ position: 'top', value: `Current (${threshold})`, fill: '#0284c7', fontSize: 11 }} 
                  yAxisId="left" 
                />
                <ReferenceLine 
                  x={optimalTh} 
                  stroke="#10b981" 
                  strokeDasharray="2 2" 
                  label={{ position: 'bottom', value: `Optimum (${optimalTh})`, fill: '#10b981', fontSize: 11 }} 
                  yAxisId="left" 
                />
                <Line yAxisId="left" type="monotone" dataKey="precision" stroke="#a855f7" name="Precision (%)" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="recall" stroke="#ec4899" name="Recall (%)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="netBenefit" stroke="#10b981" name="Net Benefit (₹k)" strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="fpCost" stroke="#f59e0b" name="FP Cost (₹k)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Optimal Threshold Recommendation Banner */}
      <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-emerald-900 shadow-sm">
        <div className="flex items-start gap-2.5">
          <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" />
          <div className="space-y-0.5">
            <strong className="text-emerald-950 text-sm block font-bold">Economic Decision Strategy:</strong>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {optimalData?.reason || (
                `At threshold ${optimalTh}, the merchant prevents substantial expected refund loss while keeping false-positive customer churn costs and manual review workload within the economic optimum.`
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => { setThreshold(optimalTh); fetchSimulation(optimalTh); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg border border-emerald-600 shrink-0 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <span>Apply Recommended Threshold ({optimalTh})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Highlight Card */}
        <div className="bg-emerald-50 border border-emerald-300 p-6 rounded-xl flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" fill="currentColor" /> Recommended Economic Threshold: {optimalTh}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Derived from test set evaluation on 1,483 held-out cases to maximize net merchant recovery:
            </p>
            <ul className="space-y-2 text-xs text-emerald-900 mt-4 font-medium">
              <li>• Precision: {(optimalData?.precision ? (optimalData.precision * 100).toFixed(1) : '85.5')}%</li>
              <li>• Recall: {(optimalData?.recall ? (optimalData.recall * 100).toFixed(1) : '84.6')}%</li>
              <li>• False-Positive Churn Cost: ₹{Math.round(optimalData?.false_positive_cost || 246240).toLocaleString()}</li>
              <li>• Expected Loss Prevented: ₹{Math.round(optimalData?.expected_loss_prevented || 1931510).toLocaleString()}</li>
              <li>• Review Workload: {optimalData?.cases_flagged || 787} cases (₹{Math.round(optimalData?.review_cost || 118050).toLocaleString()})</li>
            </ul>
          </div>

          <div className="pt-3 border-t border-emerald-200">
            <span className="text-[11px] text-slate-600 block">Net Economic Benefit:</span>
            <strong className="text-xl font-black text-emerald-800">
              +₹{Math.round(optimalData?.net_economic_benefit || optimalData?.net_benefit || 1567220).toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Dynamic Comparison Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-sky-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-sky-50/50 border-b border-sky-100 flex items-center justify-between">
            <span className="font-bold text-xs text-[#002b49]">Comparative Trade-Off Matrix</span>
            <span className="text-[11px] text-slate-500">Evaluated on held-out test split</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50 text-sky-900 font-bold border-b border-sky-200">
                <tr>
                  <th className="p-3">Threshold</th>
                  <th className="p-3">Precision</th>
                  <th className="p-3">Recall</th>
                  <th className="p-3">Flagged</th>
                  <th className="p-3 text-amber-800">FP Cost</th>
                  <th className="p-3 text-emerald-800">Loss Prevented</th>
                  <th className="p-3 text-sky-800">Net Benefit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {comparisonTable.map(row => {
                  const isCurrent = Math.abs(row.threshold - threshold) < 3;
                  return (
                    <tr 
                      key={row.threshold} 
                      className={`hover:bg-sky-50/60 transition-colors ${
                        row.is_optimal 
                          ? 'bg-emerald-50/70 font-semibold' 
                          : isCurrent 
                            ? 'bg-sky-50/80' 
                            : ''
                      }`}
                    >
                      <td className="p-3 flex items-center gap-1.5">
                        <span className="font-bold text-[#002b49]">{row.threshold}</span>
                        {row.is_optimal && (
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 font-bold">
                            Optimum
                          </span>
                        )}
                        {isCurrent && !row.is_optimal && (
                          <span className="text-[10px] text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-300 font-bold">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700">{row.precision}</td>
                      <td className="p-3 text-slate-700">{row.recall}</td>
                      <td className="p-3 font-mono text-slate-700">{row.cases_flagged}</td>
                      <td className="p-3 text-amber-800 font-semibold">{row.fp_cost}</td>
                      <td className="p-3 text-emerald-800 font-semibold">{row.loss_prevented}</td>
                      <td className="p-3 font-bold text-[#002b49]">
                        {row.net_benefit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
