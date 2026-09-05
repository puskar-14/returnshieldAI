import React from 'react';
import { 
  CreditCard, Package, Truck, RotateCcw, AlertTriangle, 
  BrainCircuit, ShieldAlert, UserCheck, DollarSign, Zap 
} from 'lucide-react';

export default function CustomerTimeline({ events = [] }) {
  const icons = {
    PAYMENT: <CreditCard className="w-4 h-4 text-emerald-400" />,
    ORDER: <Package className="w-4 h-4 text-blue-400" />,
    DELIVERY: <Truck className="w-4 h-4 text-cyan-400" />,
    REFUND_REQUEST: <RotateCcw className="w-4 h-4 text-amber-400" />,
    RETURN: <RotateCcw className="w-4 h-4 text-amber-400" />,
    CURRENT_RETURN: <Zap className="w-4 h-4 text-red-400 animate-pulse" />,
    AI_ASSESSMENT: <BrainCircuit className="w-4 h-4 text-purple-400" />,
    RECOMMENDED_ACTION: <ShieldAlert className="w-4 h-4 text-amber-400" />,
    REVIEWER_DECISION: <UserCheck className="w-4 h-4 text-emerald-300" />,
    BEHAVIOR_DRIFT: <AlertTriangle className="w-4 h-4 text-purple-400" />,
    RISK_FLAG: <AlertTriangle className="w-4 h-4 text-red-400" />,
  };
  
  const colors = {
    PAYMENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ORDER: 'bg-sky-50 text-sky-700 border-sky-200',
    DELIVERY: 'bg-blue-50 text-blue-700 border-blue-200',
    REFUND_REQUEST: 'bg-amber-50 text-amber-700 border-amber-200',
    RETURN: 'bg-amber-50 text-amber-700 border-amber-200',
    CURRENT_RETURN: 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-200',
    AI_ASSESSMENT: 'bg-purple-50 text-purple-700 border-purple-200',
    RECOMMENDED_ACTION: 'bg-amber-50 text-amber-700 border-amber-200',
    REVIEWER_DECISION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    BEHAVIOR_DRIFT: 'bg-purple-50 text-purple-700 border-purple-200',
    RISK_FLAG: 'bg-red-50 text-red-700 border-red-200',
  };

  const formatDate = (dateStr) => {
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

  if (!events || events.length === 0) {
    return <div className="text-slate-500 text-sm py-4 text-center">No customer lifecycle activity recorded yet.</div>;
  }

  return (
    <div className="relative pl-6 border-l-2 border-sky-200 space-y-6 my-4 ml-4">
      {events.map((e, i) => {
        const type = e.type || 'ORDER';
        const title = e.title || e.description || 'Event';
        const desc = e.desc || (e.title && e.description !== e.title ? e.description : null);
        const icon = icons[type] || <Package className="w-4 h-4" />;
        const colorClass = colors[type] || 'bg-sky-50 text-slate-700 border-sky-200';

        return (
          <div key={i} className="relative group">
            <div className={`absolute -left-[35px] p-1.5 rounded-full border ${colorClass} bg-white shadow-sm transition-transform group-hover:scale-110`}>
              {icon}
            </div>
            <div>
              <div className="flex gap-2.5 items-baseline flex-wrap">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colorClass}`}>
                  {type.replace('_', ' ')}
                </span>
                <span className={`text-sm font-bold ${e.is_current ? 'text-amber-800' : 'text-slate-900'}`}>
                  {title}
                </span>
                <span className="text-[11px] text-slate-400">{formatDate(e.date)}</span>
              </div>
              {desc && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{desc}</p>}
              {e.amount !== null && e.amount !== undefined && (
                <p className="text-xs font-medium text-slate-700 mt-0.5">
                  Amount: <strong className="text-slate-900 font-bold">₹{Number(e.amount).toLocaleString()}</strong>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
