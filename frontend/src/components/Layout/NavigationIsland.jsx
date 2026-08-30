import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, Compass, Calculator, LayoutDashboard, User as UserIcon, LogOut, ChevronUp, CreditCard, Wallet } from 'lucide-react';

const NavigationIsland = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Browser', path: '/programmes', icon: Compass },
    { name: 'Budget', path: '/budget', icon: Wallet },
    { name: 'Calculator', path: '/calculator', icon: Calculator },
    ...(isAuthenticated ? [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
  ];

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="relative flex items-center pointer-events-auto">

        {/* Navigation Island */}
        <nav className="glass py-2 px-3 rounded-full flex items-center space-x-1 shadow-2xl border border-white/20 dark:border-slate-700/30 backdrop-blur-2xl ring-1 ring-black/5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all group ${isActive
                    ? 'text-white bg-sapphire-500 shadow-lg shadow-sapphire-500/40'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Icon size={20} className={isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                <span className={`absolute -top-10 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl`}>
                  {link.name}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}

          <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>

          {/* User Anchor & Profile Menu Wrapper */}
          <div className="relative">
            {userMenuOpen && isAuthenticated && (
              <div className="absolute bottom-full mb-3 right-0 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-[20px] rounded-[20px_20px_4px_20px] shadow-2xl shadow-[0_10px_40px_-10px_rgba(59,91,219,0.22)] border border-slate-200/40 dark:border-slate-800/40 p-2 animate-[emerge_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both] origin-bottom-right">
                <div className="px-4 py-3 border-b border-slate-100/30 dark:border-slate-800/30 mb-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Account</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.username}</p>
                </div>
                <div className="py-1">
                  <Link 
                    to="/plans" 
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all text-sm font-bold"
                  >
                    <CreditCard size={16} />
                    <span>Subscription</span>
                  </Link>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all text-sm font-bold border-t border-slate-100/10 dark:border-slate-800/10 mt-1"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all group ${userMenuOpen
                  ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              <UserIcon size={20} />
              <span className="absolute -top-10 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                Profile
              </span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default NavigationIsland;
