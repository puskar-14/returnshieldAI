import React from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ModelMonitoring() {
  const performanceOverTime = [
    { week: 'W1', precision: 92, recall: 86 },
    { week: 'W2', precision: 91.5, recall: 85.5 },
    { week: 'W3', precision: 91, recall: 85 },
    { week: 'W4', precision: 91.2, recall: 84.8 },
    { week: 'W5', precision: 89, recall: 85 },
    { week: 'W6', precision: 87, recall: 86 },
    { week: 'W7', precision: 84, recall: 88 },
    { week: 'W8', precision: 82, recall: 89 },
  ];

  const distributionData = [
    { week: 'W1', low: 400, medium: 120, high: 50 },
    { week: 'W2', low: 420, medium: 130, high: 55 },
    { week: 'W3', low: 390, medium: 125, high: 48 },
    { week: 'W4', low: 410, medium: 135, high: 52 },
    { week: 'W5', low: 430, medium: 150, high: 70 },
    { week: 'W6', low: 450, medium: 180, high: 95 },
    { week: 'W7', low: 440, medium: 210, high: 120 },
    { week: 'W8', low: 460, medium: 230, high: 150 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#002b49]">Model Performance Monitoring</h1>

      <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-red-800">ALERT: Potential Concept Drift Detected</h4>
          <p className="text-sm mt-1 text-slate-700">Return volume increased significantly in the Fashion category over the last 3 weeks. Precision has degraded from 91% to 82%. Model retraining is recommended.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#002b49]">Performance Over Time (8 Weeks)</h3>
            <div className="flex items-center gap-1 text-red-600 text-sm font-bold">
              <TrendingDown className="w-4 h-4" /> Precision Drop
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceOverTime}>
                <defs>
                  <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" />
                <XAxis dataKey="week" stroke="#002b49" />
                <YAxis domain={[70, 100]} stroke="#002b49" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', color: '#002b49' }} />
                <Area type="monotone" dataKey="precision" stroke="#0284c7" fillOpacity={1} fill="url(#colorP)" name="Precision" />
                <Area type="monotone" dataKey="recall" stroke="#ec4899" fill="transparent" name="Recall" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm">
          <h3 className="text-lg font-bold text-[#002b49] mb-4">Return Volume & Risk Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" />
                <XAxis dataKey="week" stroke="#002b49" />
                <YAxis stroke="#002b49" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', color: '#002b49' }} />
                <Bar dataKey="high" stackId="a" fill="#ef4444" name="High Risk" />
                <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium Risk" />
                <Bar dataKey="low" stackId="a" fill="#10b981" name="Low Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-sky-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-sky-100">
          <h3 className="text-lg font-bold text-[#002b49]">Category Drift Analysis</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50 text-sky-900 font-bold border-b border-sky-200">
            <tr>
              <th className="p-4 font-bold text-sky-950">Category</th>
              <th className="p-4 font-bold text-sky-950">Baseline Return Rate</th>
              <th className="p-4 font-bold text-sky-950">Current Return Rate</th>
              <th className="p-4 font-bold text-sky-950">Drift</th>
              <th className="p-4 font-bold text-sky-950">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-100">
            <tr className="hover:bg-sky-50/50">
              <td className="p-4 font-medium text-[#002b49]">Electronics</td>
              <td className="p-4 text-slate-700">9.8%</td>
              <td className="p-4 text-slate-700">11.2%</td>
              <td className="p-4 text-amber-700 font-semibold">+1.4%</td>
              <td className="p-4"><span className="px-2 py-1 bg-sky-50 text-sky-800 rounded text-xs font-semibold border border-sky-200">Normal</span></td>
            </tr>
            <tr className="bg-red-50/50 hover:bg-red-50/80">
              <td className="p-4 font-bold text-[#002b49]">Fashion</td>
              <td className="p-4 text-slate-700">18.4%</td>
              <td className="p-4 text-red-700 font-bold">24.1%</td>
              <td className="p-4 text-red-700 font-bold">+5.7%</td>
              <td className="p-4"><span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-bold">ALERT</span></td>
            </tr>
            <tr className="hover:bg-sky-50/50">
              <td className="p-4 font-medium text-[#002b49]">Home & Garden</td>
              <td className="p-4 text-slate-700">5.2%</td>
              <td className="p-4 text-slate-700">4.9%</td>
              <td className="p-4 text-emerald-700 font-semibold">-0.3%</td>
              <td className="p-4"><span className="px-2 py-1 bg-sky-50 text-sky-800 rounded text-xs font-semibold border border-sky-200">Normal</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
