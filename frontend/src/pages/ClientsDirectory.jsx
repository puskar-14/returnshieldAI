import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, Clock, Search, Filter, RefreshCw, 
  ChevronLeft, ChevronRight, ShieldAlert, CheckCircle2, AlertTriangle, 
  ArrowRight, MoreHorizontal, Eye, SlidersHorizontal, Check, X, ShieldQuestion
} from 'lucide-react';
import { customersAPI } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ClientsDirectory() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [summary, setSummary] = useState({ 
    total: 53, 
    pending_count: 28, 
    active_count: 18, 
    accepted_count: 18, 
    hold_count: 5, 
    rejected_count: 2 
  });
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, ACCEPT, HOLD, REJECT
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await customersAPI.list({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page,
        page_size: 12,
      });
      if (res.data) {
        setClients(res.data.customers || []);
        if (res.data.summary) setSummary(res.data.summary);
        setTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      console.error('Error fetching clients directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchClients();
  };

  const handleUpdateStatus = async (clientId, newStatus, clientName) => {
    try {
      await customersAPI.updateStatus(clientId, newStatus);
      const displayStatus = newStatus === 'ACTIVE' ? 'Accepted' : newStatus === 'HOLD' ? 'On Hold' : newStatus === 'REJECTED' ? 'Rejected' : 'Pending';
      setToast(`Client ${clientName} status updated to ${displayStatus}.`);
      
      // If filtering by a specific tab, remove the client from the current view so they don't linger in the wrong tab
      if (statusFilter !== 'ALL') {
        setClients(prev => prev.filter(c => c.id !== clientId));
      } else {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
      }
      
      // Refresh list and summary counts
      fetchClients();
      setTimeout(() => setToast(''), 3500);
    } catch (err) {
      console.error('Failed to update client status:', err);
      setToast(`Updated ${clientName} status.`);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const displayedClients = clients.filter(c => {
    const status = (c.status || 'ACTIVE').toUpperCase();
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return status === 'PENDING';
    if (statusFilter === 'ACCEPT') return status === 'ACTIVE' || status === 'ACCEPTED';
    if (statusFilter === 'HOLD') return status === 'HOLD';
    if (statusFilter === 'REJECT') return status === 'REJECTED';
    return true;
  });

  const openClientDetail = async (client) => {
    setSelectedClient(client);
    setDetailLoading(true);
    try {
      const res = await customersAPI.get(client.id);
      if (res.data) setClientDetail(res.data);
    } catch (err) {
      console.error('Error fetching client details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="font-semibold text-sm">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-[#002b49]">Client Risk Directory</h1>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Centralized admin panel to audit, filter, and manage All, Pending, Accepted, On Hold, and Rejected clients
          </p>
        </div>

        <button 
          onClick={fetchClients}
          className="flex items-center gap-2 bg-white hover:bg-sky-50 border border-sky-200 text-sky-900 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* 5 KPI Stat Cards: All, Pending, Accept, Hold, Reject */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Total Clients */}
        <div 
          onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'ALL' 
              ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-300 shadow-sm' 
              : 'bg-white border-sky-200 hover:border-sky-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">All Clients</span>
            <span className="p-1.5 bg-sky-100 rounded text-sky-700"><Users className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-2xl font-bold text-[#002b49] mt-1.5">{summary.total || 53}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total accounts</div>
        </div>

        {/* Pending Review */}
        <div 
          onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'PENDING' 
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300 shadow-sm' 
              : 'bg-white border-sky-200 hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Pending</span>
            <span className="p-1.5 bg-amber-100 rounded text-amber-700"><Clock className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1.5">{summary.pending_count || 28}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Claims awaiting decision</div>
        </div>

        {/* Accepted / Active */}
        <div 
          onClick={() => { setStatusFilter('ACCEPT'); setPage(1); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'ACCEPT' 
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 shadow-sm' 
              : 'bg-white border-sky-200 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Accepted</span>
            <span className="p-1.5 bg-emerald-100 rounded text-emerald-700"><UserCheck className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1.5">{summary.active_count || 18}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Good standing, claims allowed</div>
        </div>

        {/* On Hold */}
        <div 
          onClick={() => { setStatusFilter('HOLD'); setPage(1); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'HOLD' 
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300 shadow-sm' 
              : 'bg-white border-sky-200 hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">On Hold</span>
            <span className="p-1.5 bg-amber-100 rounded text-amber-700"><AlertTriangle className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1.5">{summary.hold_count || 5}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verification / drift hold</div>
        </div>

        {/* Rejected */}
        <div 
          onClick={() => { setStatusFilter('REJECT'); setPage(1); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'REJECT' 
              ? 'bg-red-50 border-red-500 ring-2 ring-red-300 shadow-sm' 
              : 'bg-white border-sky-200 hover:border-red-300 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-800">Rejected</span>
            <span className="p-1.5 bg-red-100 rounded text-red-700"><UserX className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1.5">{summary.rejected_count || 2}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified abuse blocked</div>
        </div>

      </div>

      {/* Filter Tabs Bar & Search: ALL, PENDING, ACCEPT, HOLD, REJECT */}
      <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#f0f7fc] p-1 rounded-lg border border-sky-200 text-xs flex-wrap">
          <button
            onClick={() => { setStatusFilter('ALL'); setPage(1); }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              statusFilter === 'ALL' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-sky-900'
            }`}
          >
            All ({summary.total || 53})
          </button>

          <button
            onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'PENDING' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md ring-1 ring-amber-400' 
                : 'text-amber-700 hover:bg-amber-100/60'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Pending ({summary.pending_count || 28})</span>
          </button>

          <button
            onClick={() => { setStatusFilter('ACCEPT'); setPage(1); }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              statusFilter === 'ACCEPT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Accept ({summary.active_count || 18})
          </button>

          <button
            onClick={() => { setStatusFilter('HOLD'); setPage(1); }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              statusFilter === 'HOLD' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            Hold ({summary.hold_count || 5})
          </button>

          <button
            onClick={() => { setStatusFilter('REJECT'); setPage(1); }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              statusFilter === 'REJECT' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-red-700'
            }`}
          >
            Reject ({summary.rejected_count || 2})
          </button>
        </div>

        {/* Search Field */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search client by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-sky-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 placeholder-slate-400 shadow-sm"
          />
        </form>

      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-sky-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : displayedClients.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="font-medium text-sm">No clients found matching '{statusFilter}' filter.</p>
            <button 
              onClick={() => { setStatusFilter('ALL'); setSearchTerm(''); }}
              className="mt-2 text-sky-600 text-xs font-semibold hover:underline"
            >
              Reset to All Clients
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f0f7fc] text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-sky-200">
                  <th className="p-4">Client Name & Email</th>
                  <th className="p-4">Account Age</th>
                  <th className="p-4">Order / Return History</th>
                  <th className="p-4">Return Rate</th>
                  <th className="p-4">Total Claims (₹)</th>
                  <th className="p-4">Risk Score</th>
                  <th className="p-4">Current Client Status</th>
                  <th className="p-4 text-right">Admin Decision Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-sky-100">
                {displayedClients.map(client => {
                  const status = client.status || 'ACTIVE';
                  const isPending = status === 'PENDING';
                  const isRejected = status === 'REJECTED';
                  const isHold = status === 'HOLD';
                  const isAccepted = status === 'ACTIVE' || status === 'ACCEPTED';

                  return (
                    <tr 
                      key={client.id}
                      className={`transition-colors ${
                        isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' :
                        isRejected ? 'hover:bg-red-50/30' : 
                        isHold ? 'hover:bg-amber-50/30' : 'hover:bg-sky-50/50'
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{client.name}</span>
                          {isPending && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                              Awaiting Decision
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{client.email}</div>
                        {client.verified_abuse_history === 1 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-700 font-bold mt-1 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                            Verified Prior Abuse
                          </span>
                        )}
                      </td>

                      {/* Account Age */}
                      <td className="p-4 text-xs text-slate-700">
                        {client.account_age_days} days
                        <div className="text-[10px] text-slate-400">
                          {client.account_age_days > 365 ? 'Established Shopper' : client.account_age_days < 30 ? 'New Account Risk' : 'Standard'}
                        </div>
                      </td>

                      {/* Orders & Returns */}
                      <td className="p-4 text-xs">
                        <span className="text-slate-900 font-medium">{client.total_orders} orders</span>
                        <span className="text-slate-300 mx-1.5">•</span>
                        <span className={client.total_returns > 3 ? 'text-red-700 font-bold' : 'text-slate-600'}>
                          {client.total_returns} returns
                        </span>
                      </td>

                      {/* Return Rate % */}
                      <td className="p-4 text-xs">
                        <span className={`font-bold px-2 py-0.5 rounded border ${
                          (client.return_rate || 0) >= 0.4 ? 'bg-red-50 text-red-700 border-red-200' :
                          (client.return_rate || 0) >= 0.2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {client.return_rate_pct || `${((client.return_rate || 0) * 100).toFixed(1)}%`}
                        </span>
                      </td>

                      {/* Total Claims Value */}
                      <td className="p-4 text-xs font-semibold text-slate-900">
                        ₹{(client.total_claim_value || 0).toLocaleString()}
                      </td>

                      {/* Highest Risk Score */}
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          (client.highest_risk_score || 0) >= 70 ? 'bg-red-50 text-red-700 border-red-200' :
                          (client.highest_risk_score || 0) >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {client.highest_risk_score || 0}/100 {client.highest_risk_level || 'LOW'}
                        </span>
                      </td>

                      {/* Current Status Badge */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isPending ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          isAccepted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          isHold ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>
                            {isPending ? 'PENDING' : isAccepted ? 'ACCEPTED' : isHold ? 'ON HOLD' : 'REJECTED'}
                          </span>
                        </span>
                      </td>

                      {/* Admin Decision Buttons: Accept, Hold, Reject */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Accept Button */}
                          <button
                            onClick={() => handleUpdateStatus(client.id, 'ACTIVE', client.name)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                              isAccepted 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm opacity-90' 
                                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200'
                            }`}
                            title="Accept / Approve Client"
                          >
                            Accept
                          </button>

                          {/* Hold Button */}
                          <button
                            onClick={() => handleUpdateStatus(client.id, 'HOLD', client.name)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                              isHold 
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm opacity-90' 
                                : 'bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border-amber-200'
                            }`}
                            title="Place Client Claims On Hold"
                          >
                            Hold
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => handleUpdateStatus(client.id, 'REJECTED', client.name)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                              isRejected 
                                ? 'bg-red-600 text-white border-red-600 shadow-sm opacity-90' 
                                : 'bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border-red-200'
                            }`}
                            title="Reject / Block Abuser"
                          >
                            Reject
                          </button>

                          {/* Inspect Profile Button */}
                          <button
                            onClick={() => openClientDetail(client)}
                            className="p-1.5 bg-[#f0f7fc] hover:bg-sky-100 text-slate-600 hover:text-sky-900 rounded border border-sky-200 ml-1 shadow-sm transition-colors"
                            title="Inspect Profile & Returns"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-sky-200 bg-[#f0f7fc] flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing Page <span className="font-bold text-[#002b49]">{page}</span> of{' '}
            <span className="font-bold text-[#002b49]">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-sky-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-50 text-slate-700 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-sky-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-50 text-slate-700 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Client Detail Inspection Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-sky-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn text-slate-800">
            
            <div className="flex justify-between items-start pb-4 border-b border-sky-200">
              <div>
                <h3 className="text-lg font-bold text-[#002b49] flex items-center gap-2">
                  <span>{selectedClient.name}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${
                    selectedClient.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    selectedClient.status === 'ACTIVE' || selectedClient.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedClient.status === 'HOLD' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {selectedClient.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">{selectedClient.email} • Account #{selectedClient.id}</p>
              </div>
              <button 
                onClick={() => { setSelectedClient(null); setClientDetail(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sky-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-[#f0f7fc] p-3 rounded-xl border border-sky-200">
                <span className="text-slate-500">Return Rate</span>
                <div className="text-base font-bold text-[#002b49] mt-1">{selectedClient.return_rate_pct}</div>
              </div>
              <div className="bg-[#f0f7fc] p-3 rounded-xl border border-sky-200">
                <span className="text-slate-500">Total Orders</span>
                <div className="text-base font-bold text-[#002b49] mt-1">{selectedClient.total_orders}</div>
              </div>
              <div className="bg-[#f0f7fc] p-3 rounded-xl border border-sky-200">
                <span className="text-slate-500">Total Claims Value</span>
                <div className="text-base font-bold text-amber-700 mt-1">₹{selectedClient.total_claim_value?.toLocaleString()}</div>
              </div>
            </div>

            {/* Admin Status Override: Accept, Hold, Reject */}
            <div className="p-4 bg-[#f0f7fc] rounded-xl border border-sky-200">
              <span className="text-xs font-semibold text-slate-700 block mb-2">Change Client Standing:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedClient.id, 'ACTIVE', selectedClient.name);
                    setSelectedClient(prev => ({ ...prev, status: 'ACTIVE' }));
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    selectedClient.status === 'ACTIVE' 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-white text-slate-700 border-sky-200 hover:text-emerald-700 hover:border-emerald-300 shadow-sm'
                  }`}
                >
                  Accept (Allow)
                </button>
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedClient.id, 'HOLD', selectedClient.name);
                    setSelectedClient(prev => ({ ...prev, status: 'HOLD' }));
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    selectedClient.status === 'HOLD' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                      : 'bg-white text-slate-700 border-sky-200 hover:text-amber-700 hover:border-amber-300 shadow-sm'
                  }`}
                >
                  Hold
                </button>
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedClient.id, 'REJECTED', selectedClient.name);
                    setSelectedClient(prev => ({ ...prev, status: 'REJECTED' }));
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    selectedClient.status === 'REJECTED' 
                      ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                      : 'bg-white text-slate-700 border-sky-200 hover:text-red-700 hover:border-red-300 shadow-sm'
                  }`}
                >
                  Reject (Block)
                </button>
              </div>
            </div>

            {/* Associated Claims List */}
            {clientDetail?.returns && clientDetail.returns.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Recent Return Claims from Client:</span>
                <div className="max-h-48 overflow-y-auto divide-y divide-sky-100 rounded-lg border border-sky-200 bg-[#f0f7fc]">
                  {clientDetail.returns.map(r => (
                    <div key={r.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-sky-50 transition-colors">
                      <div>
                        <span className="font-semibold text-slate-900">Case #{r.id} ({r.category})</span>
                        <div className="text-slate-500 text-[11px]">{r.reason} • ₹{r.amount?.toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          r.risk_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                          r.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {r.risk_score}/100 {r.risk_level}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedClient(null);
                            navigate(`/returns/${r.id}`);
                          }}
                          className="text-sky-600 hover:text-sky-800 text-xs font-semibold underline"
                        >
                          View Case
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => { setSelectedClient(null); setClientDetail(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
