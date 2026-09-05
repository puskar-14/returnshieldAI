import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, List, Users, BrainCircuit, SlidersHorizontal, Activity, LogOut, Shield 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Refund & Return Cases', path: '/returns', icon: List },
    { name: 'Clients Directory', path: '/clients', icon: Users },
    { name: 'Model Evaluation', path: '/evaluation', icon: BrainCircuit },
    { name: 'Threshold Simulator', path: '/simulator', icon: SlidersHorizontal },
    { name: 'Model Monitoring', path: '/monitoring', icon: Activity },
  ];

  return (
    <div className="w-64 ocean-sidebar flex flex-col shrink-0 shadow-lg">
      <div className="p-6 flex items-center gap-3">
        <div className="p-2 bg-sky-500/20 rounded-xl border border-sky-400/30">
          <Shield className="w-7 h-7 text-sky-300" />
        </div>
        <div>
          <span className="text-xl font-bold text-white tracking-tight block">ReturnShield</span>
          <span className="text-[10px] text-sky-300 font-bold tracking-wider uppercase">Razorpay Merchant Risk</span>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive 
                  ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-900/40 border border-sky-400/40' 
                  : 'text-sky-100/80 hover:bg-sky-700/30 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 sidebar-footer">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-xs">
            <p className="text-white font-semibold">Demo Risk Officer</p>
            <p className="text-sky-300 text-[11px]">merchant@demo.com</p>
          </div>
          <button 
            onClick={logout} 
            className="p-1.5 text-sky-200 hover:text-white rounded-lg hover:bg-sky-800/40 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
