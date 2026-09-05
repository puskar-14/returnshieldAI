export default function StatCard({ title, value, icon: Icon, change, type = 'neutral' }) {
  const colors = {
    neutral: 'border-sky-200 bg-white shadow-sm text-sky-700',
    danger: 'border-red-200 bg-white shadow-sm text-red-600',
    success: 'border-emerald-200 bg-white shadow-sm text-emerald-600',
    warning: 'border-amber-200 bg-white shadow-sm text-amber-600',
  };
  
  return (
    <div className={`p-5 rounded-xl border transition-all hover:shadow-md ${colors[type]}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-slate-600 text-xs font-bold uppercase tracking-wider">{title}</h3>
        {Icon && (
          <div className="p-2 rounded-lg bg-sky-50 border border-sky-100">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-[#002b49] mb-1">{value}</div>
      {change && (
        <div className={`text-xs font-semibold ${change.startsWith('+') ? 'text-emerald-700' : 'text-slate-500'}`}>
          {change} from last period
        </div>
      )}
    </div>
  );
}
