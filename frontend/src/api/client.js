import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Set USE_MOCK_DATA = false when backend is running
// Set USE_MOCK_DATA = true for offline demo
const USE_MOCK_DATA = false;

// ─── Rich mock data ─────────────────────────────────────────────────────────

const MOCK_RECENT_RETURNS = [
  { id: 1, customer_name: 'Raj Sharma', customer_id: 1, amount: 4200, category: 'Electronics', risk_score: 87, risk_level: 'HIGH', recommended_action: 'ENHANCED_VERIFICATION', status: 'UNDER_REVIEW', reason: 'Product defective', created_at: new Date(Date.now() - 2*3600000).toISOString() },
  { id: 2, customer_name: 'Priya Patel', customer_id: 2, amount: 3800, category: 'Fashion', risk_score: 91, risk_level: 'HIGH', recommended_action: 'ENHANCED_VERIFICATION', status: 'UNDER_REVIEW', reason: 'Wrong item', created_at: new Date(Date.now() - 4*3600000).toISOString() },
  { id: 3, customer_name: 'Amit Verma', customer_id: 3, amount: 12000, category: 'Electronics', risk_score: 94, risk_level: 'HIGH', recommended_action: 'ENHANCED_VERIFICATION', status: 'UNDER_REVIEW', reason: 'Changed my mind', created_at: new Date(Date.now() - 6*3600000).toISOString() },
  { id: 4, customer_name: 'Sneha Reddy', customer_id: 4, amount: 1200, category: 'Books', risk_score: 12, risk_level: 'LOW', recommended_action: 'ALLOW', status: 'APPROVED', reason: 'Wrong item received', created_at: new Date(Date.now() - 8*3600000).toISOString() },
  { id: 5, customer_name: 'Karan Mehta', customer_id: 5, amount: 2800, category: 'Home', risk_score: 18, risk_level: 'LOW', recommended_action: 'ALLOW', status: 'APPROVED', reason: 'Product defective', created_at: new Date(Date.now() - 10*3600000).toISOString() },
  { id: 6, customer_name: 'Divya Singh', customer_id: 6, amount: 8500, category: 'Electronics', risk_score: 79, risk_level: 'HIGH', recommended_action: 'ENHANCED_VERIFICATION', status: 'PENDING', reason: 'Size doesn\'t fit', created_at: new Date(Date.now() - 12*3600000).toISOString() },
  { id: 7, customer_name: 'Rahul Gupta', customer_id: 7, amount: 3200, category: 'Sports', risk_score: 52, risk_level: 'MEDIUM', recommended_action: 'MANUAL_REVIEW', status: 'UNDER_REVIEW', reason: 'Not as described', created_at: new Date(Date.now() - 14*3600000).toISOString() },
  { id: 8, customer_name: 'Ananya Nair', customer_id: 8, amount: 1800, category: 'Beauty', risk_score: 28, risk_level: 'LOW', recommended_action: 'ALLOW', status: 'APPROVED', reason: 'Changed my mind', created_at: new Date(Date.now() - 18*3600000).toISOString() },
  { id: 9, customer_name: 'Vikram Joshi', customer_id: 9, amount: 22000, category: 'Furniture', risk_score: 83, risk_level: 'HIGH', recommended_action: 'ENHANCED_VERIFICATION', status: 'UNDER_REVIEW', reason: 'Damaged in delivery', created_at: new Date(Date.now() - 22*3600000).toISOString() },
  { id: 10, customer_name: 'Pooja Iyer', customer_id: 10, amount: 950, category: 'Books', risk_score: 9, risk_level: 'LOW', recommended_action: 'ALLOW', status: 'APPROVED', reason: 'Wrong item received', created_at: new Date(Date.now() - 26*3600000).toISOString() },
];

const MOCK_LOSS_TREND = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (13 - i));
  const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const loss = 15000 + Math.sin(i * 0.7) * 8000 + Math.random() * 5000;
  return { date: label, potential_loss: Math.round(loss), loss_prevented: Math.round(loss * 0.72), high_risk_count: Math.floor(Math.random() * 8) + 1 };
});

const MOCK_CASE_DETAIL = {
  id: 1, customer_id: 1, customer_name: 'Raj Sharma', customer_email: 'raj.sharma@email.com',
  amount: 4200, category: 'Electronics', reason: 'Product defective',
  status: 'UNDER_REVIEW', risk_score: 87, risk_level: 'HIGH',
  recommended_action: 'ENHANCED_VERIFICATION',
  abuse_probability: 0.87, expected_loss: 3479, drift_score: 78.4,
  baseline_deviation: 3.8, created_at: new Date(Date.now() - 2*3600000).toISOString(),
  explanation: [
    { signal: 'Return frequency increased 4.1×', feature: 'return_frequency', contribution: 32, direction: 'risk', value: 3.2, value_formatted: '3.2 returns/month' },
    { signal: 'Multiple high-value returns recently', feature: 'high_value_concentration', contribution: 21, direction: 'risk', value: 0.72, value_formatted: '72%' },
    { signal: 'Deviation from personal behavioral baseline', feature: 'baseline_deviation', contribution: 16, direction: 'risk', value: 3.8, value_formatted: '+3.80σ' },
    { signal: 'Abnormal return timing pattern', feature: 'abnormal_timing_flag', contribution: 10, direction: 'risk', value: 1, value_formatted: 'Yes' },
    { signal: 'Category return behavior anomaly', feature: 'category_return_rate', contribution: 8, direction: 'risk', value: 0.61, value_formatted: '61.4%' },
    { signal: 'Return burst detected (3+ returns in 7 days)', feature: 'return_burst_flag', contribution: 8, direction: 'risk', value: 1, value_formatted: 'Yes' },
    { signal: 'Account age', feature: 'account_age_days', contribution: -8, direction: 'safe', value: 480, value_formatted: '480 days' },
  ],
  detected_patterns: [
    { name: 'Return Burst', description: '3 or more returns detected within 7 days', severity: 'HIGH' },
    { name: 'Behavioral Drift', description: 'Drift score 78/100 — significant deviation from historical norm', severity: 'HIGH' },
    { name: 'High-Value Return Concentration', description: 'Majority of returns are high-value items', severity: 'HIGH' },
    { name: 'Category Return Anomaly', description: 'Electronics return rate (61.4%) is 6.1× above category baseline', severity: 'MEDIUM' },
  ],
  behavioral_comparison: [
    { metric: 'Return Rate', historical: '8.2%', current: '61.4%', change: '7.5×', status: 'ANOMALY' },
    { metric: 'Return Frequency', historical: '0.4/month', current: '3.1/month', change: '7.8×', status: 'ANOMALY' },
    { metric: 'Return Value', historical: '₹1,200', current: '₹3,800', change: '3.2×', status: 'HIGH' },
    { metric: 'Order Frequency', historical: '2.1/month', current: '0.8/month', change: '0.4×', status: 'NORMAL' },
    { metric: 'Electronics Return Rate', historical: '8.5%', current: '48.0%', change: '5.6×', status: 'ANOMALY' },
  ],
  financial_impact: {
    return_value: 4200, abuse_probability: 0.87, expected_loss: 3479,
    potential_merchant_loss: 3990, false_positive_cost: 1296, review_cost: 250,
    net_savings_if_blocked: 2233,
    loss_breakdown: { return_amount: 4200, category_loss_factor: 0.95, merchant_loss_if_abuse: 3990, p_abuse: 0.87, expected_loss: 3479, customer_ltv: 9000, churn_risk: 0.18, fp_cost: 1296 }
  },
  summary_text: 'This return request has been flagged as HIGH RISK. The customer\'s behavior has significantly deviated from their historical baseline (drift score: 78/100, baseline deviation: +3.8σ). Return burst and behavioral drift patterns detected. Enhanced verification recommended.',
};

const MOCK_TIMELINE = {
  customer_name: 'Raj Sharma',
  events: [
    { type: 'ORDER', date: new Date(Date.now() - 120*24*3600000).toISOString(), description: 'Order placed — Electronics', amount: 4500, is_current: false },
    { type: 'ORDER', date: new Date(Date.now() - 95*24*3600000).toISOString(), description: 'Order placed — Fashion', amount: 2800, is_current: false },
    { type: 'RETURN', date: new Date(Date.now() - 90*24*3600000).toISOString(), description: 'Return: Product defective — Fashion (₹2,800)', amount: 2800, risk_level: 'LOW', risk_score: 15, status: 'APPROVED', is_current: false },
    { type: 'ORDER', date: new Date(Date.now() - 60*24*3600000).toISOString(), description: 'Order placed — Electronics', amount: 12000, is_current: false },
    { type: 'RETURN', date: new Date(Date.now() - 55*24*3600000).toISOString(), description: 'Return: Changed mind — Electronics (₹12,000)', amount: 12000, risk_level: 'HIGH', risk_score: 82, status: 'REJECTED', is_current: false },
    { type: 'BEHAVIOR_DRIFT', date: new Date(Date.now() - 30*24*3600000).toISOString(), description: 'Behavior drift detected — Drift score: 62/100', drift_score: 62, is_current: false },
    { type: 'RETURN', date: new Date(Date.now() - 10*24*3600000).toISOString(), description: 'Return: Wrong item — Electronics (₹8,500)', amount: 8500, risk_level: 'HIGH', risk_score: 79, status: 'UNDER_REVIEW', is_current: false },
    { type: 'RISK_FLAG', date: new Date(Date.now() - 8*24*3600000).toISOString(), description: 'HIGH risk flag — Score: 79/100', risk_score: 79, is_current: false },
    { type: 'RETURN', date: new Date(Date.now() - 5*24*3600000).toISOString(), description: 'Return: Defective — Electronics (₹3,200)', amount: 3200, risk_level: 'HIGH', risk_score: 84, status: 'UNDER_REVIEW', is_current: false },
    { type: 'CURRENT_RETURN', date: new Date(Date.now() - 2*3600000).toISOString(), description: '⚠ CURRENT: Return request — Electronics (₹4,200)', amount: 4200, risk_level: 'HIGH', risk_score: 87, status: 'UNDER_REVIEW', is_current: true },
  ]
};

const MOCK_METRICS = {
  precision: 0.7975, recall: 0.8807, f1: 0.8370, accuracy: 0.8159,
  roc_auc: 0.9248, pr_auc: 0.9409, fpr: 0.2591, fnr: 0.1193,
  confusion_matrix: { tn: 509, fp: 178, fn: 95, tp: 701 },
  train_size: 4447, val_size: 1483, test_size: 1483, total_dataset: 7413,
  model_name: 'Gradient Boosting + Isotonic Calibration',
  threshold: 0.30, feature_count: 37,
  cost_analysis: { avg_fp_cost_inr: 2160, avg_fn_cost_inr: 3500, total_fp_cost_test: 384480, total_fn_cost_test: 332500, total_cost_test: 716980 },
  roc_curve: Array.from({ length: 21 }, (_, i) => ({ fpr: i/20, tpr: Math.min(1, 1-(1-(i/20))**(1/0.9213)) })),
  pr_curve: Array.from({ length: 21 }, (_, i) => ({ recall: i/20, precision: Math.max(0.6, 0.8205 * (1 - i * 0.012)) })),
  feature_importances: [
    { feature: 'drift_score', importance: 0.182 }, { feature: 'return_to_order_ratio', importance: 0.161 },
    { feature: 'baseline_deviation', importance: 0.143 }, { feature: 'recent_return_count', importance: 0.112 },
    { feature: 'verified_abuse_history', importance: 0.098 }, { feature: 'return_burst_flag', importance: 0.087 },
    { feature: 'return_value_ratio', importance: 0.072 }, { feature: 'high_value_concentration', importance: 0.058 },
    { feature: 'return_frequency', importance: 0.044 }, { feature: 'account_age_risk', importance: 0.022 },
    { feature: 'cross_category_flag', importance: 0.012 }, { feature: 'historical_return_rate', importance: 0.009 },
  ],
  evaluated_at: 'Held-out test set — never used during training',
  note: 'All metrics computed exclusively on 20% held-out test split',
};

function buildSimulatorCurve() {
  const table = [];
  const basePrecision = 0.8205;
  const baseRecall = 0.8844;
  for (let th = 10; th <= 95; th += 5) {
    const norm = (th - 50) / 50;
    const precision = Math.min(0.99, Math.max(0.60, basePrecision + norm * 0.16));
    const recall = Math.min(0.99, Math.max(0.30, baseRecall - norm * 0.18));
    const f1 = 2 * precision * recall / (precision + recall);
    const maxCases = 900, minCases = 50;
    const casesFlagged = Math.round(maxCases - (th / 100) * (maxCases - minCases));
    const fpCount = Math.round(casesFlagged * (1 - precision));
    const tpCount = casesFlagged - fpCount;
    const fpCost = fpCount * 0.18 * 12000;
    const lossPrevented = tpCount * 3200 * 0.82;
    const netBenefit = lossPrevented - fpCost;
    table.push({ threshold: th, precision: +precision.toFixed(4), recall: +recall.toFixed(4), f1: +f1.toFixed(4), fpr: +(1-precision).toFixed(4), fnr: +(1-recall).toFixed(4), cases_flagged: casesFlagged, true_positives: tpCount, false_positives: fpCount, false_negatives: 800 - tpCount, true_negatives: 500, review_workload: casesFlagged, false_positive_cost: Math.round(fpCost), expected_loss_prevented: Math.round(lossPrevented), net_benefit: Math.round(netBenefit) });
  }
  return table;
}

const MOCK_SIMULATOR_CURVE = buildSimulatorCurve();
const MOCK_OPTIMAL_THRESHOLD = MOCK_SIMULATOR_CURVE.reduce((best, r) => r.net_benefit > best.net_benefit ? r : best, MOCK_SIMULATOR_CURVE[0]);

// ─── API Functions ───────────────────────────────────────────────────────────

async function safeCall(mockData, apiCall) {
  if (USE_MOCK_DATA) return { data: mockData };
  try { return await apiCall(); }
  catch (e) { console.warn('Backend unavailable, using mock data:', e.message); return { data: mockData }; }
}

export const authAPI = {
  login: async (username, password) => {
    const mockUser = { id: 1, name: 'Demo Merchant', email: username || 'merchant@demo.com', role: 'MERCHANT' };
    const mockRes = { access_token: 'mock-token-123', token: 'mock-token-123', token_type: 'bearer', user: mockUser };
    if (USE_MOCK_DATA) return { data: mockRes };
    try {
      return await client.post('/auth/login', { username, password });
    } catch (err) {
      console.warn('Backend login request error:', err);
      // If network or server error, provide fallback for seamless demo continuity
      if (!err.response || err.response.status >= 500) {
        return { data: mockRes };
      }
      throw err;
    }
  },
  me: async () => safeCall({ id: 1, email: 'merchant@demo.com', name: 'Demo Merchant' }, () => client.get('/auth/me')),
};

export const dashboardAPI = {
  summary: async () => safeCall({
    total_returns: 1245, high_risk_returns: 52, medium_risk_returns: 145, low_risk_returns: 1048,
    under_review: 18, approved_today: 45, estimated_potential_loss: 450000, estimated_loss_prevented: 320000,
    false_positive_cost: 15000, review_workload: 18, current_precision: 0.8205, current_recall: 0.8844, current_f1: 0.8513,
    risk_distribution: { LOW: 1048, MEDIUM: 145, HIGH: 52 },
    recent_returns: MOCK_RECENT_RETURNS, loss_trend: MOCK_LOSS_TREND, total_customers: 53,
  }, () => client.get('/dashboard/summary')),
};

export const returnsAPI = {
  list: async (params) => safeCall({ total: MOCK_RECENT_RETURNS.length, page: 1, page_size: 20, total_pages: 1, returns: MOCK_RECENT_RETURNS }, () => client.get('/returns', { params })),
  score: async (data) => safeCall({ risk_score: 85, risk_level: 'HIGH', abuse_probability: 0.85, recommended_action: 'ENHANCED_VERIFICATION', expected_loss: 3570 }, () => client.post('/returns/score', data)),
  get: async (id) => safeCall(MOCK_CASE_DETAIL, () => client.get(`/returns/${id}`)),
  timeline: async (id) => safeCall(MOCK_TIMELINE, () => client.get(`/returns/${id}/timeline`)),
};

export const metricsAPI = {
  evaluation: async () => safeCall(MOCK_METRICS, () => client.get('/metrics/evaluation')),
  drift: async () => safeCall({
    performance_history: Array.from({ length: 8 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (7 - i) * 7);
      return { date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), precision: +(0.82 - i * 0.003 + (Math.random() - 0.5) * 0.01).toFixed(4), recall: +(0.88 - i * 0.004 + (Math.random() - 0.5) * 0.01).toFixed(4) };
    }),
    category_drift: [
      { category: 'Electronics', baseline_rate: 9.8, current_rate: 11.2, drift: 1.4, status: 'NORMAL' },
      { category: 'Fashion', baseline_rate: 18.4, current_rate: 24.1, drift: 5.7, status: 'ALERT' },
      { category: 'Furniture', baseline_rate: 4.8, current_rate: 5.2, drift: 0.4, status: 'NORMAL' },
      { category: 'Home', baseline_rate: 6.9, current_rate: 7.8, drift: 0.9, status: 'NORMAL' },
      { category: 'Books', baseline_rate: 2.8, current_rate: 3.1, drift: 0.3, status: 'NORMAL' },
      { category: 'Sports', baseline_rate: 7.5, current_rate: 9.2, drift: 1.7, status: 'WATCH' },
      { category: 'Beauty', baseline_rate: 11.5, current_rate: 12.1, drift: 0.6, status: 'NORMAL' },
    ],
    weekly_volume: Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (7-i)*7); const total = 80 + Math.round(Math.random()*40); return { week: d.toLocaleDateString('en-IN', {month:'short',day:'numeric'}), total, low: Math.round(total*0.6), medium: Math.round(total*0.25), high: Math.round(total*0.15) }; }),
    alerts: [
      { severity: 'HIGH', type: 'CATEGORY_DRIFT', message: 'Fashion return rate increased 31% above baseline. Model precision may degrade for this category.', created_at: new Date(Date.now() - 3*3600000).toISOString() },
    ],
    model_health: 'DEGRADING',
  }, () => client.get('/metrics/drift')),
};

export const simulatorAPI = {
  whatIf: async (threshold) => {
    const closest = MOCK_SIMULATOR_CURVE.reduce((best, r) => Math.abs(r.threshold - threshold) < Math.abs(best.threshold - threshold) ? r : best, MOCK_SIMULATOR_CURVE[0]);
    const mock = {
      current_threshold: threshold, current_metrics: closest, curve_table: MOCK_SIMULATOR_CURVE,
      optimal_threshold: { threshold: MOCK_OPTIMAL_THRESHOLD.threshold, precision: MOCK_OPTIMAL_THRESHOLD.precision, recall: MOCK_OPTIMAL_THRESHOLD.recall, net_benefit: MOCK_OPTIMAL_THRESHOLD.net_benefit, false_positive_cost: MOCK_OPTIMAL_THRESHOLD.false_positive_cost, expected_loss_prevented: MOCK_OPTIMAL_THRESHOLD.expected_loss_prevented, reason: `Maximizes net economic benefit (₹${MOCK_OPTIMAL_THRESHOLD.net_benefit.toLocaleString()})` },
      comparison_table: [50, 60, 65, 70, 80].map(th => { const r = MOCK_SIMULATOR_CURVE.find(x => x.threshold === th) || MOCK_SIMULATOR_CURVE[0]; return { threshold: th, precision: `${(r.precision*100).toFixed(1)}%`, recall: `${(r.recall*100).toFixed(1)}%`, fp_cost: `₹${r.false_positive_cost.toLocaleString()}`, loss_prevented: `₹${r.expected_loss_prevented.toLocaleString()}`, net_benefit: `₹${r.net_benefit.toLocaleString()}`, is_optimal: th === MOCK_OPTIMAL_THRESHOLD.threshold }; }),
    };
    return safeCall(mock, () => client.post('/simulator/what-if', { threshold }));
  },
};

export const decisionsAPI = {
  submit: async (returnId, data) => safeCall({ success: true, return_id: returnId, decision: data.decision, new_status: data.decision === 'REJECT' ? 'REJECTED' : data.decision === 'HOLD' || data.decision === 'FLAG' ? 'HOLD' : 'APPROVED', customer_status: data.decision === 'REJECT' ? 'REJECTED' : 'ACTIVE', message: `Decision recorded.` }, () => client.post(`/decisions/${returnId}`, data)),
};

export const customersAPI = {
  list: async (params) => safeCall({
    summary: { total: 52, active_count: 32, hold_count: 18, rejected_count: 2 },
    customers: [
      { id: 1, name: 'Raj Sharma', email: 'raj.sharma@email.com', account_age_days: 480, status: 'HOLD', verified_abuse_history: 0, total_orders: 8, total_returns: 5, return_rate: 0.625, return_rate_pct: '62.5%', total_claim_value: 50400, highest_risk_score: 99, highest_risk_level: 'HIGH' },
      { id: 4, name: 'Sneha Reddy', email: 'sneha.reddy@email.com', account_age_days: 750, status: 'ACTIVE', verified_abuse_history: 0, total_orders: 22, total_returns: 1, return_rate: 0.045, return_rate_pct: '4.5%', total_claim_value: 1200, highest_risk_score: 22, highest_risk_level: 'LOW' },
      { id: 3, name: 'Amit Verma', email: 'amit.verma@email.com', account_age_days: 650, status: 'REJECTED', verified_abuse_history: 1, total_orders: 14, total_returns: 7, return_rate: 0.50, return_rate_pct: '50.0%', total_claim_value: 48000, highest_risk_score: 94, highest_risk_level: 'HIGH' },
    ]
  }, () => client.get('/customers', { params })),
  get: async (id) => safeCall({}, () => client.get(`/customers/${id}`)),
  updateStatus: async (id, status) => safeCall({ success: true, customer_id: id, new_status: status }, () => client.patch(`/customers/${id}/status`, { status })),
};

export const demoAPI = {
  triggerReturn: async () => {
    const names = ['Suresh Kumar', 'Meera Krishnan', 'Arjun Nanda', 'Lakshmi Rao', 'Sid Malhotra'];
    const categories = ['Electronics', 'Fashion', 'Furniture', 'Home', 'Sports'];
    const name = names[Math.floor(Math.random() * names.length)];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const score = Math.floor(Math.random() * 60) + 35;
    const level = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    const mock = { customer_name: name, customer_id: Math.floor(Math.random()*50)+1, return_amount: Math.round(Math.random()*8000+500), category: cat, risk_score: score, risk_level: level, recommended_action: level === 'HIGH' ? 'ENHANCED_VERIFICATION' : level === 'MEDIUM' ? 'MANUAL_REVIEW' : 'ALLOW', abuse_probability: score/100, expected_loss: Math.round(score * 35), drift_score: Math.round(Math.random()*80), top_signal: ['Return burst detected', 'Deviation from baseline', 'High-value returns', 'Cross-category anomaly'][Math.floor(Math.random()*4)], detected_patterns: score >= 70 ? ['Return Burst', 'Behavioral Drift'] : ['Elevated Return Rate'] };
    return safeCall(mock, () => client.get('/demo/trigger-new-return'));
  },
};
