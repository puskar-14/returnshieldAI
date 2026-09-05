import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, demoAPI } from '../api/client';
import StatCard from '../components/StatCard';
import TestReturnModal from '../components/TestReturnModal';
import { 
  ShieldAlert, IndianRupee, Activity, Target, Zap, Sliders, ArrowRight, 
  CreditCard, RotateCcw, AlertTriangle, CheckCircle2, ChevronRight, Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSummary = () => {
    dashboardAPI.summary().then(res => setStats(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const triggerDemo = async () => {
    try {
      const res = await demoAPI.triggerReturn();
      setToast(`New refund request from ${res.data.customer_name || res.data.customer} — Risk: ${res.data.risk_level || res.data.riskLevel} (${res.data.risk_score || res.data.score}/100)`);
      fetchSummary();
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const pieData = [
    { name: 'Low Risk', value: stats?.risk_distribution?.LOW || 180, color: '#10b981' },
    { name: 'Medium Risk', value: stats?.risk_distribution?.MEDIUM || 32, color: '#f59e0b' },
    { name: 'High Risk', value: stats?.risk_distribution?.HIGH || 38, color: '#ef4444' },
  ];

  const lineData = stats?.loss_trend && stats.loss_trend.length > 0 ? stats.loss_trend : [
    { date: 'Day 1', potential_loss: 4000, loss_prevented: 2400 },
    { date: 'Day 3', potential_loss: 7000, loss_prevented: 4800 },
    { date: 'Day 5', potential_loss: 12000, loss_prevented: 8900 },
    { date: 'Day 7', potential_loss: 15000, loss_prevented: 11200 },
    { date: 'Day 9', potential_loss: 18000, loss_prevented: 13500 },
    { date: 'Day 11', potential_loss: 22000, loss_prevented: 16800 },
    { date: 'Day 14', potential_loss: 26000, loss_prevented: 19800 },
  ];

  const funnelData = stats?.payment_refund_funnel || [
    { stage: 'Payments Captured', count: stats?.total_payments || 524, amount: stats?.total_payment_volume || 1450000, pct: 100, description: 'Total payments processed via Razorpay' },
    { stage: 'Refund Requests', count: stats?.total_returns || 142, amount: stats?.total_refund_volume || 380000, pct: 27.1, description: 'Claims initiated by customers' },
    { stage: 'High-Risk Flagged', count: stats?.high_risk_returns || 38, amount: 185000, pct: 26.8, description: 'AI Risk Score >= 70 threshold' },
    { stage: 'Held for Review', count: stats?.under_review || 12, amount: 98000, pct: 31.6, description: 'Merchant manual review queue' },
    { stage: 'Prevented Loss', count: 28, amount: stats?.estimated_loss_prevented || 89000, pct: 73.7, description: 'Abusive payouts successfully blocked' },
  ];

  const recentReturns = stats?.recent_returns && stats.recent_returns.length > 0 ? stats.recent_returns.slice(0, 8) : [
    { id: 1, customer_name: 'Raj Sharma', amount: 4200, category: 'Electronics', risk_score: 87, risk_level: 'HIGH', recommended_action: 'ENHANCED_VERIFICATION', payment_id: 'pay_synth_00142', payment_method: 'UPI' },
    { id: 2, customer_name: 'Priya Patel', amount: 3800, category: 'Fashion', risk_score: 91, risk_level: 'HIGH', recommended_action: 'ENHANCED_VERIFICATION', payment_id: 'pay_synth_00141', payment_method: 'Card' },
    { id: 3, customer_name: 'Amit Verma', amount: 12000, category: 'Electronics', risk_score: 94, risk_level: 'HIGH', recommended_action: 'ENHANCED_VERIFICATION', payment_id: 'pay_synth_00140', payment_method: 'NetBanking' },
    { id: 4, customer_name: 'Sneha Reddy', amount: 1200, category: 'Books', risk_score: 12, risk_level: 'LOW', recommended_action: 'ALLOW', payment_id: 'pay_synth_00139', payment_method: 'UPI' },
    { id: 5, customer_name: 'Karan Mehta', amount: 2800, category: 'Home', risk_score: 18, risk_level: 'LOW', recommended_action: 'ALLOW', payment_id: 'pay_synth_00138', payment_method: 'UPI' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#002b49]">Razorpay Merchant Risk Overview</h1>
            <span className="text-[11px] font-semibold bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full border border-sky-200">
              Payment &rarr; Refund Engine
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-0.5">
            AI-Powered Refund & Return Abuse Prevention across the Transaction Lifecycle
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-sky-50 border border-sky-300 text-sky-900 px-4 py-2 rounded-lg font-semibold transition-colors text-sm shadow-sm"
          >
            <Sliders className="w-4 h-4 text-sky-600" />
            <span>Simulate Return Presets</span>
          </button>

          <button 
            onClick={triggerDemo}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm shadow-lg shadow-sky-600/20 active:scale-[0.98]"
          >
            <Zap className="w-4 h-4" />
            <span>Generate Live Claim</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="bg-sky-600 text-white p-4 rounded-xl shadow-xl border border-sky-400 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="font-medium text-sm">{toast}</span>
          </div>
          <button 
            onClick={() => navigate('/returns/1')}
            className="text-xs bg-white text-sky-950 font-bold px-3 py-1.5 rounded-lg hover:bg-sky-50 transition-colors shrink-0"
          >
            View Evidence
          </button>
        </div>
      )}

      {/* Top Financial & Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Captured Payments" 
          value={(stats?.total_payments || 524).toLocaleString()} 
          icon={CreditCard} 
          change={`₹${Math.round((stats?.total_payment_volume || 1450000) / 100000).toFixed(1)}L processed`}
        />
        <StatCard 
          title="Refund Requests" 
          value={(stats?.total_returns || stats?.totalReturns || 142).toLocaleString()} 
          icon={RotateCcw} 
          change={`₹${Math.round((stats?.total_refund_volume || 380000) / 1000).toLocaleString()}k claim volume`}
        />
        <StatCard 
          title="High Risk Intercepted" 
          value={(stats?.high_risk_returns || stats?.highRiskReturns || 38).toLocaleString()} 
          icon={ShieldAlert} 
          type="danger" 
          change={`${stats?.under_review || 12} held in review`}
        />
        <StatCard 
          title="Expected Loss Prevented" 
          value={`₹${Math.round(stats?.estimated_loss_prevented || stats?.lossPrevented || 89000).toLocaleString()}`} 
          icon={IndianRupee} 
          type="success" 
          change={`Net of ₹${Math.round(stats?.false_positive_cost || 12400).toLocaleString()} FP cost`}
        />
      </div>

      {/* Charts Section */}
      {/* Payment → Refund Risk Funnel */}
      <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5 pb-3 border-b border-sky-100">
          <div>
            <h3 className="text-base font-bold text-[#002b49] flex items-center gap-2">
              <Filter className="w-4 h-4 text-sky-600" />
              <span>Payment &rarr; Order &rarr; Refund Risk Funnel</span>
            </h3>
            <p className="text-xs text-slate-500">
              End-to-end transaction pipeline from payment gateway capture to economic loss prevention
            </p>
          </div>
          <span className="text-xs text-sky-900 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 font-medium">
            Last 30 Days Cumulative
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {funnelData.map((stage, idx) => {
            const colors = [
              { bg: 'from-sky-50 to-white', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700', icon: CreditCard },
              { bg: 'from-indigo-50 to-white', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', icon: RotateCcw },
              { bg: 'from-red-50 to-white', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: AlertTriangle },
              { bg: 'from-amber-50 to-white', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', icon: ShieldAlert },
              { bg: 'from-emerald-50 to-white', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
            ][idx % 5];
            const IconComp = colors.icon;

            return (
              <div 
                key={idx} 
                className={`bg-gradient-to-b ${colors.bg} border ${colors.border} rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-sky-400 transition-all shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      Stage {idx + 1}
                    </span>
                    <div className={`p-1.5 rounded-md ${colors.badge}`}>
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-[#002b49] mb-1">{stage.stage}</h4>
                  <div className="text-xl font-extrabold text-[#002b49] mt-1">
                    {(stage.count || 0).toLocaleString()}
                    <span className="text-xs font-normal text-slate-500 ml-1">cases</span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                    ₹{Math.round(stage.amount || 0).toLocaleString()}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-sky-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">{stage.description}</span>
                  <span className="font-bold text-slate-700 ml-1">{stage.pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-xl border border-sky-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#002b49] mb-1">Risk Triage Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Calibrated 0-100 severity tier breakdown</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={55} outerRadius={78} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', color: '#002b49' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-xs mt-2 pt-3 border-t border-sky-100">
            {pieData.map(d => (
              <div key={d.name} className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-slate-600 font-medium">{d.name}</span>
                </div>
                <span className="text-[#002b49] font-bold mt-0.5">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loss Trend Line */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-sky-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#002b49]">Refund Risk & Loss Prevention Economics</h3>
              <p className="text-xs text-slate-500">14-day cumulative expected financial exposure vs. merchant loss prevented</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> Loss Prevented
              </span>
              <span className="flex items-center gap-1.5 text-red-600 font-semibold">
                <span className="w-3 h-0.5 bg-red-500 inline-block"></span> Expected Financial Exposure
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" />
                <XAxis dataKey="date" stroke="#002b49" tick={{ fontSize: 11 }} />
                <YAxis stroke="#002b49" tick={{ fontSize: 11 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', color: '#002b49' }} />
                <Line type="monotone" dataKey="loss_prevented" stroke="#10b981" strokeWidth={2.5} name="Loss Prevented (₹)" />
                <Line type="monotone" dataKey="potential_loss" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" name="Expected Exposure (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Returns Table */}
      <div className="bg-white rounded-xl border border-sky-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-sky-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-[#002b49]">Recent Refund Requests</h3>
            <p className="text-xs text-slate-500">Live feed of refund claims scored across the payment-to-refund lifecycle</p>
          </div>
          <button 
            onClick={() => navigate('/returns')} 
            className="text-sky-600 text-xs font-bold hover:text-sky-800 flex items-center gap-1 hover:underline"
          >
            <span>View All Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sky-50 text-sky-900 text-xs font-bold uppercase tracking-wider border-b border-sky-200">
                <th className="p-4">Customer</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Refund Amount</th>
                <th className="p-4">Category</th>
                <th className="p-4">Risk Score</th>
                <th className="p-4">Recommended Action</th>
                <th className="p-4 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-sky-100">
              {recentReturns.map((ret) => {
                const isHigh = ret.risk_level === 'HIGH' || ret.risk_score >= 70;
                const isMed = ret.risk_level === 'MEDIUM' || (ret.risk_score >= 40 && ret.risk_score < 70);
                return (
                  <tr 
                    key={ret.id} 
                    className="hover:bg-sky-50/60 cursor-pointer transition-colors"
                    onClick={() => navigate(`/returns/${ret.id}`)}
                  >
                    <td className="p-4">
                      <div className="font-semibold text-[#002b49]">{ret.customer_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{ret.payment_id || `pay_synth_${ret.id}`}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-sky-900 font-medium">
                        {ret.payment_method || 'UPI'}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-[#002b49]">₹{(ret.amount || 0).toLocaleString()}</td>
                    <td className="p-4 text-slate-700 text-xs">{ret.category || 'Electronics'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        isHigh ? 'bg-red-50 text-red-700 border-red-200' :
                        isMed ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {ret.risk_score}/100 {ret.risk_level || (isHigh ? 'HIGH' : isMed ? 'MED' : 'LOW')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-700 font-medium bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                        {ret.recommended_action || (isHigh ? 'ENHANCED_VERIFICATION' : isMed ? 'MANUAL_REVIEW' : 'ALLOW')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-sky-600 hover:text-sky-800 text-xs font-bold hover:underline">
                        Investigate &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Test Return Modal */}
      <TestReturnModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReturnCreated={() => fetchSummary()}
      />
    </div>
  );
}
