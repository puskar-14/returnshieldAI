import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Sliders, AlertCircle, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { returnsAPI } from '../api/client';
import TestReturnModal from '../components/TestReturnModal';

export default function ReturnCases() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, HOLD, APPROVED, REJECTED
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState({ total: 142, pending_count: 42, hold_count: 38, approved_count: 27, rejected_count: 35 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await returnsAPI.list({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        risk_level: riskFilter !== 'ALL' ? riskFilter : undefined,
        page,
        page_size: 15,
      });
      if (res.data?.returns) {
        setCases(res.data.returns);
        setTotalPages(res.data.total_pages || 1);
        setTotalCount(res.data.total || res.data.returns.length);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load return cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, riskFilter, page]);

  const filteredCases = cases.filter(c => {
    const cust = (c.customer_name || c.customer || '').toLowerCase();
    const cid = String(c.id || '').toLowerCase();
    const cat = (c.category || '').toLowerCase();
    const reason = (c.reason || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return !query || cust.includes(query) || cid.includes(query) || cat.includes(query) || reason.includes(query);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002b49]">Refund & Return Cases Triage</h1>
          <p className="text-slate-600 text-sm mt-0.5">
            Merchant review queue for refund requests across the Payment &rarr; Order &rarr; Refund lifecycle ({summary.pending_count} awaiting decision)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm shadow-lg shadow-sky-600/20"
          >
            <Sliders className="w-4 h-4" />
            <span>Simulate Refund Presets</span>
          </button>
          <button 
            onClick={fetchCases}
            className="p-2 bg-white hover:bg-sky-50 border border-sky-300 rounded-lg text-sky-900 hover:text-[#002b49] transition-colors shadow-sm"
            title="Refresh cases"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Claim Status Tabs Bar */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-sky-200 shadow-sm flex-wrap text-xs">
        <button
          onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-all ${
            statusFilter === 'ALL' 
              ? 'bg-sky-600 text-white shadow-sm' 
              : 'text-slate-600 hover:text-sky-900 hover:bg-sky-50'
          }`}
        >
          All Claims ({summary.total})
        </button>

        <button
          onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            statusFilter === 'PENDING' 
              ? 'bg-amber-500 text-white font-bold shadow-md ring-2 ring-amber-300' 
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Decision ({summary.pending_count})</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        </button>

        <button
          onClick={() => { setStatusFilter('HOLD'); setPage(1); }}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-all ${
            statusFilter === 'HOLD' 
              ? 'bg-amber-50 text-amber-800 border border-amber-300 font-bold' 
              : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50'
          }`}
        >
          On Hold ({summary.hold_count})
        </button>

        <button
          onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-all ${
            statusFilter === 'APPROVED' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Approved ({summary.approved_count})
        </button>

        <button
          onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
          className={`px-3.5 py-2 rounded-lg font-semibold transition-all ${
            statusFilter === 'REJECTED' 
              ? 'bg-red-600 text-white shadow-sm' 
              : 'text-slate-600 hover:text-red-700 hover:bg-red-50'
          }`}
        >
          Rejected ({summary.rejected_count})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 relative min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by customer name, case ID, reason, or product category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-sky-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-sky-700" />
          <span className="text-xs text-slate-600 font-medium">Risk Filter:</span>
          <select 
            value={riskFilter}
            onChange={e => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-sky-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Risk (70-100)</option>
            <option value="MEDIUM">Medium Risk (40-69)</option>
            <option value="LOW">Low Risk (0-39)</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-sky-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="font-medium">No return cases found matching current filters.</p>
            <button 
              onClick={() => { setStatusFilter('ALL'); setRiskFilter('ALL'); setSearchTerm(''); }}
              className="mt-2 text-sky-600 text-xs hover:underline font-bold"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sky-50 text-sky-900 text-xs font-bold uppercase tracking-wider border-b border-sky-200">
                  <th className="p-4">Case ID</th>
                  <th className="p-4">Customer & Payment</th>
                  <th className="p-4">Category & Reason</th>
                  <th className="p-4">Refund Amount</th>
                  <th className="p-4">Risk Score</th>
                  <th className="p-4">Recommendation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-700/50">
                {filteredCases.map(c => {
                  const score = c.risk_score || c.score || 0;
                  const level = c.risk_level || c.level || (score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW');
                  const isHigh = level === 'HIGH';
                  const isMed = level === 'MEDIUM';
                  const isPending = c.status === 'PENDING';
                  const isHold = c.status === 'HOLD' || c.status === 'UNDER_REVIEW';
                  const isApproved = c.status === 'APPROVED';
                  const isRejected = c.status === 'REJECTED';

                  return (
                    <tr 
                      key={c.id} 
                      className={`cursor-pointer transition-colors ${
                        isPending ? 'bg-amber-50/60 hover:bg-amber-100/60' :
                        isHigh ? 'hover:bg-red-50/60' : isMed ? 'hover:bg-amber-50/60' : 'hover:bg-sky-50/60'
                      }`}
                      onClick={() => navigate(`/returns/${c.id}`)}
                    >
                      <td className="p-4 font-mono text-xs text-sky-700 font-bold">
                        #{c.id}
                        {isPending && (
                          <span className="block text-[9px] text-amber-700 font-sans font-bold uppercase mt-0.5">
                            New Claim
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-[#002b49]">{c.customer_name || c.customer || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-sky-700">{c.payment_id || `pay_synth_${c.id}`}</span>
                          <span>•</span>
                          <span className="bg-sky-50 px-1.5 py-0.5 rounded text-[10px] text-sky-900 font-medium border border-sky-200">{c.payment_method || 'UPI'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs">
                        <span className="font-semibold text-[#002b49]">{c.category || 'General'}</span>
                        <div className="text-slate-600 truncate max-w-[200px] mt-0.5" title={c.reason}>
                          {c.reason || 'Not specified'}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-[#002b49] text-xs">
                        ₹{(c.amount || 0).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                          isHigh ? 'bg-red-50 text-red-700 border-red-200' :
                          isMed ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {score}/100 {level}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-700 font-medium bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                          {c.recommended_action || (isHigh ? 'ENHANCED_VERIFICATION' : isMed ? 'MANUAL_REVIEW' : 'ALLOW')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold border ${
                          isPending ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          isHold ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          isApproved ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{isPending ? 'PENDING' : isHold ? 'ON HOLD' : isApproved ? 'APPROVED' : 'REJECTED'}</span>
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {formatDate(c.created_at || c.date)}
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-sky-600 hover:text-sky-800 text-xs font-bold hover:underline flex items-center justify-end gap-1 ml-auto">
                          <span>Inspect & Decide</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-sky-100 bg-sky-50/50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing Page <span className="font-bold text-[#002b49]">{page}</span> of{' '}
            <span className="font-bold text-[#002b49]">{totalPages}</span> ({totalCount} matching cases)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-sky-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-50 text-sky-900 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-sky-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-50 text-sky-900 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Test Return Modal */}
      <TestReturnModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReturnCreated={() => fetchCases()}
      />
    </div>
  );
}
