import React from 'react';

export default function ExplainableAICard({ score, factors = [] }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#002b49]">Explainable AI — Risk Factors</h3>
        <span className="text-xs font-semibold text-slate-500">SHAP Attributions</span>
      </div>
      
      <div className="flex-1 space-y-4">
        {factors && factors.length > 0 ? (
          factors.map((f, i) => {
            const label = f.label || f.signal;
            const rawVal = f.value !== undefined ? f.value : (f.contribution !== undefined ? f.contribution : 0);
            const value = Math.round(rawVal);
            const isRisk = f.direction === 'risk' || value > 0;
            const width = `${Math.min(Math.abs(value) * 3, 100)}%`;

            return (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">{label}</span>
                  <span className={`font-bold ${isRisk ? 'text-red-600' : 'text-emerald-700'}`}>
                    {isRisk && value > 0 ? '+' : ''}{value}
                  </span>
                </div>
                <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isRisk ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-slate-500 text-sm py-4 text-center">No explicit risk factors detected.</div>
        )}
      </div>

      <div className="mt-6 p-3 bg-[#f0f7fc] rounded-lg text-xs text-slate-600 border border-sky-200">
        Factors with positive (+) values increase predicted return abuse probability, while negative (-) values represent stabilizing account trust signals.
      </div>
    </div>
  );
}
