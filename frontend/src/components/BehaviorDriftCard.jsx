import React from 'react';
import { AlertCircle, ArrowUp, ArrowDown, ShieldCheck } from 'lucide-react';

export default function BehaviorDriftCard({ metrics = [], driftScore = 78, baselineDeviation = 3.5 }) {
  const isHighDrift = driftScore >= 60;
  const isMedDrift = driftScore >= 35 && driftScore < 60;

  return (
    <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#002b49]">Personal Behavioral Drift</h3>
          <p className="text-xs text-slate-500 mt-0.5">Customer baseline vs. current transaction & refund behavior</p>
        </div>
        <div className="text-right">
          <span className={`px-2.5 py-1 text-xs font-bold rounded border ${
            isHighDrift ? 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-200' :
            isMedDrift ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {isHighDrift ? 'HIGH DRIFT' : isMedDrift ? 'MODERATE DRIFT' : 'BASELINE NORMAL'} ({Math.round(driftScore)}/100)
          </span>
          {typeof baselineDeviation === 'number' && (
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              Deviation: <strong className={isHighDrift ? 'text-red-700' : 'text-slate-700'}>{baselineDeviation > 0 ? '+' : ''}{baselineDeviation.toFixed(1)}σ</strong>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-600 border-b border-sky-200 text-xs">
              <th className="pb-2 text-left font-semibold">Dimension</th>
              <th className="pb-2 text-left font-semibold">Personal Baseline</th>
              <th className="pb-2 text-left font-semibold">Current Pattern</th>
              <th className="pb-2 text-right font-semibold">Deviation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-100 text-xs">
            {metrics.map((m, i) => {
              const name = m.metric || m.name;
              const baseline = m.historical || m.baseline;
              const current = m.current;
              const change = m.change || 'N/A';
              const pctChange = m.pct_change;
              const status = m.status || 'NORMAL';

              return (
                <tr key={i} className="hover:bg-sky-50/50 transition-colors">
                  <td className="py-2.5 text-slate-800 font-medium">{name}</td>
                  <td className="py-2.5 text-slate-500">{baseline}</td>
                  <td className="py-2.5 text-slate-900 font-bold">{current}</td>
                  <td className="py-2.5 text-right">
                    {status === 'ANOMALY' && (
                      <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <ArrowUp className="w-3 h-3" /> {change} {pctChange && `(${pctChange})`}
                      </span>
                    )}
                    {status === 'HIGH' && (
                      <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <ArrowUp className="w-3 h-3" /> {change} {pctChange && `(${pctChange})`}
                      </span>
                    )}
                    {status === 'ELEVATED' && (
                      <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {change}
                      </span>
                    )}
                    {status === 'NORMAL' && (
                      <span className="text-emerald-700 font-medium flex items-center justify-end gap-1">
                        <ShieldCheck className="w-3 h-3" /> NORMAL
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={`mt-4 flex gap-2.5 p-3 rounded-lg border text-xs leading-relaxed ${
        isHighDrift ? 'bg-red-50 border-red-200 text-red-800' : 'bg-[#f0f7fc] border-sky-200 text-slate-700'
      }`}>
        <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isHighDrift ? 'text-red-600' : 'text-sky-600'}`} />
        <p>
          {isHighDrift 
            ? "This customer is high risk primarily because their recent refund behavior has deviated significantly from their personal historical baseline."
            : isMedDrift
            ? "Moderate behavioral deviation detected. Transaction frequency or refund amount exceeds recent personal norms."
            : "Customer behavior aligns with historical payment and refund baseline norms."}
        </p>
      </div>
    </div>
  );
}
