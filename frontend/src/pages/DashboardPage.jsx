import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { Link } from 'react-router-dom';
import Spinner from '../components/UI/Spinner';
import CustomDropdown from '../components/UI/CustomDropdown';
import { Trash2, ExternalLink, TrendingUp, DollarSign, Bookmark, PieChart, Bell, Settings, Search, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const { dashboard, loading, removeProgramme, updateStatus } = useDashboard();
  const { selectedCurrency, changeCurrency, currencies, rates } = useCurrency();

  const handleCurrencyChange = async (e) => {
    await changeCurrency(e.target.value, true);
    toast.success("Display currency updated");
  };

  const handleStatusChange = async (progId, status) => {
    try {
      await updateStatus(progId, status, undefined);
      toast.success("Application status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleRemove = async (progId) => {
    if (window.confirm("Remove this programme from your dashboard?")) {
      try {
        await removeProgramme(progId);
        toast.success("Programme removed");
      } catch (err) {
        toast.error("Failed to remove programme");
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center space-y-4">
        <Spinner size={48} className="text-sapphire-500 mx-auto" />
        <p className="text-slate-500 font-medium animate-pulse">Loading your academic portal...</p>
      </div>
    </div>
  );

  const progs = dashboard?.dashboard_programmes || [];
  const activeProgs = progs.filter(p => ['APPLYING', 'SUBMITTED'].includes(p.personal_status));
  const rate = rates.find(r => r.target_currency === selectedCurrency)?.rate || 1;
  
  const isUniAssist = (route) => route?.toLowerCase().includes('uni-assist') || route?.toLowerCase().includes('vpd');
  
  const uniAssistProgs = activeProgs.filter(p => isUniAssist(p.programme.application_route));
  const nonUniAssistProgs = activeProgs.filter(p => !isUniAssist(p.programme.application_route));
  
  let totalCostEur = nonUniAssistProgs.reduce((sum, p) => sum + (p.programme.application_fee_eur || 0), 0);
  if (uniAssistProgs.length > 0) {
    totalCostEur += 75 + (uniAssistProgs.length - 1) * 30;
  }
  
  const totalCost = selectedCurrency === 'EUR' ? totalCostEur : totalCostEur * rate;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Top Navigation / Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight">
              Welcome back, <span className="text-sapphire-500">{user?.username}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Your centralized application command center.</p>
          </div>
          
          <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center px-4 space-x-3">
              <DollarSign className="w-4 h-4 text-sapphire-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currency</span>
            </div>
            <CustomDropdown
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              options={currencies}
              size="sm"
              className="w-24 mb-0"
              triggerClass="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black py-2.5 px-4 rounded-xl border-none focus:ring-2 focus:ring-sapphire-500"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="glass p-6 rounded-2xl border-b-4 border-b-sapphire-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-sapphire-50 dark:bg-sapphire-900/30 rounded-lg">
                <Bookmark className="w-5 h-5 text-sapphire-500" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Saved</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{progs.length}</p>
          </div>

          <div className="glass p-6 rounded-2xl border-b-4 border-b-emerald-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <PieChart className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Active</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applying/Submitted</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{activeProgs.length}</p>
          </div>

          <div className="lg:col-span-2 glass p-6 rounded-2xl border-b-4 border-b-gold-500 bg-gradient-to-br from-white to-gold-50/20 dark:from-slate-800 dark:to-gold-900/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gold-50 dark:bg-gold-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-gold-500" />
              </div>
              <p className="text-[10px] font-bold text-gold-500">Live Rates Applied</p>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Investment</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-black text-slate-900 dark:text-white">{totalCost.toFixed(2)}</p>
              <p className="text-lg font-bold text-gold-500">{selectedCurrency}</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Tracked Programmes List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">Tracked Programmes</h2>
              <Link to="/programmes" className="text-sm font-bold text-sapphire-500 hover:underline flex items-center space-x-1">
                <span>Browse More</span>
                <Search className="w-3 h-3" />
              </Link>
            </div>

            {progs.length === 0 ? (
              <div className="glass p-16 rounded-3xl text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bookmark className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your list is empty</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">Start your journey by exploring and saving your favorite programmes.</p>
                <Link to="/programmes" className="btn-primary">Browse Programmes</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {progs.map((item) => (
                  <div key={item.id} className="glass p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:scale-[1.005] transition-all group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link 
                          to={`/programmes/${item.programme.id}`} 
                          className="text-lg font-bold text-slate-900 dark:text-white hover:text-sapphire-500 transition-colors truncate block font-outfit"
                          title={item.programme.name}
                        >
                          {item.programme.name}
                        </Link>
                        <ExternalLink className="w-4 h-4 text-slate-300 shrink-0" />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate" title={item.programme.university?.name}>
                        {item.programme.university?.name}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-none">
                        <CustomDropdown
                          value={item.personal_status}
                          onChange={(e) => handleStatusChange(item.programme_id, e.target.value)}
                          options={[
                            'CONSIDERING',
                            'APPLYING',
                            'SUBMITTED',
                            'ACCEPTED',
                            'REJECTED',
                            'WITHDRAWN'
                          ]}
                          size="sm"
                          className="w-full sm:w-44 mb-0"
                          triggerClass={`w-full sm:w-44 py-2.5 px-4 rounded-xl text-xs font-black border-none transition-all ${
                            item.personal_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            item.personal_status === 'REJECTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                          disableGlass={true}
                        />
                      </div>

                      <button 
                        onClick={() => handleRemove(item.programme_id)}
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Quick Actions & Help */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass p-8 rounded-3xl overflow-hidden relative group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-sapphire-500/10 rounded-full blur-3xl group-hover:bg-sapphire-500/20 transition-all"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-6 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-slate-400" />
                <span>Quick Actions</span>
              </h3>
              <div className="space-y-3 relative z-10">
                <Link to="/calculator" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-sapphire-50 dark:hover:bg-sapphire-900/20 transition-all group/action">
                  <div className="flex items-center space-x-3">
                    <PieChart className="w-4 h-4 text-sapphire-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Run ECTS Check</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover/action:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-sapphire-50 dark:hover:bg-sapphire-900/20 transition-all group/action cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-4 h-4 text-gold-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Deadline Alerts</span>
                  </div>
                  <div className="bg-emerald-500 w-2 h-2 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="glass p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-sapphire-600/20 to-transparent"></div>
              <h4 className="text-lg font-bold font-outfit mb-3 relative z-10">Need Assistance?</h4>
              <p className="text-slate-400 text-sm mb-6 relative z-10 leading-relaxed">Our premium guides help you navigate the Uni-Assist and APS processes with ease.</p>
              <Link to="/documentation" className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all relative z-10 flex items-center justify-center">
                View Documentation
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
