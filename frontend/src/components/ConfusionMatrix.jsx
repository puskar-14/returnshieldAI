export default function ConfusionMatrix({ matrix }) {
  const { tn, fp, fn, tp } = matrix;
  const total = tn + fp + fn + tp;
  
  return (
    <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm">
      <h3 className="text-lg font-bold text-[#002b49] mb-4">Confusion Matrix</h3>
      <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
        <div></div>
        <div className="text-slate-500 font-bold pb-2 text-xs uppercase">Predicted Legit</div>
        <div className="text-slate-500 font-bold pb-2 text-xs uppercase">Predicted Abuse</div>
        
        <div className="text-slate-600 font-bold text-xs uppercase flex items-center justify-end pr-4">Actual Legit</div>
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 flex flex-col justify-center shadow-sm">
          <span className="text-2xl font-bold text-emerald-800">{tn}</span>
          <span className="text-xs text-emerald-700 font-semibold mt-0.5">True Negatives (TN)</span>
        </div>
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex flex-col justify-center shadow-sm">
          <span className="text-2xl font-bold text-amber-800">{fp}</span>
          <span className="text-xs text-amber-700 font-semibold mt-0.5">False Positives (FP)</span>
        </div>

        <div className="text-slate-600 font-bold text-xs uppercase flex items-center justify-end pr-4">Actual Abuse</div>
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex flex-col justify-center shadow-sm">
          <span className="text-2xl font-bold text-red-800">{fn}</span>
          <span className="text-xs text-red-700 font-semibold mt-0.5">False Negatives (FN)</span>
        </div>
        <div className="bg-emerald-100 border border-emerald-400 rounded-lg p-4 flex flex-col justify-center shadow-sm">
          <span className="text-2xl font-bold text-emerald-900">{tp}</span>
          <span className="text-xs text-emerald-800 font-semibold mt-0.5">True Positives (TP)</span>
        </div>
      </div>
      
      <div className="flex justify-around pt-4 border-t border-sky-200 mt-4 text-sm">
        <div className="text-center">
          <p className="text-slate-600 font-medium">False Positive Rate</p>
          <p className="text-xl font-bold text-[#002b49] mt-1">{((fp / (tn + fp)) * 100).toFixed(2)}%</p>
        </div>
        <div className="text-center">
          <p className="text-slate-600 font-medium">False Negative Rate</p>
          <p className="text-xl font-bold text-[#002b49] mt-1">{((fn / (tp + fn)) * 100).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}
