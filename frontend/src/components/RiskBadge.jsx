export default function RiskBadge({ level }) {
  const colors = {
    LOW: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    MEDIUM: 'bg-amber-50 text-amber-900 border-amber-300',
    HIGH: 'bg-red-50 text-red-800 border-red-300',
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colors[level]}`}>
      {level === 'HIGH' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>}
      {level}
    </span>
  );
}
