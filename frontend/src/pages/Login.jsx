import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('merchant@demo.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please verify your email and password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('merchant@demo.com');
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002b49] via-[#0284c7] to-[#e0f2fe] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-sky-200">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-sky-50 p-3 rounded-full mb-3 border border-sky-200">
            <Shield className="w-10 h-10 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#002b49]">ReturnShield AI</h1>
          <p className="text-slate-500 mt-1 text-xs text-center max-w-xs font-medium">
            AI-Powered Refund & Return Risk Management Engine for Razorpay Merchants
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#002b49] mb-1.5">Merchant Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-lg px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#002b49] mb-1.5">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-lg px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all placeholder-slate-400"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-5 border-t border-sky-100 flex flex-col items-center gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-xs">Demo Credentials:</span>
            <span className="font-mono text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-xs font-semibold">
              merchant@demo.com / demo123
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleFillDemo}
            className="text-xs text-sky-600 hover:text-sky-800 font-semibold hover:underline transition-colors mt-1"
          >
            Auto-fill credentials
          </button>
        </div>
      </div>
    </div>
  );
}
