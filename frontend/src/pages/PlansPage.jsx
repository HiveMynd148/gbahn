import React from 'react';
import { CreditCard, Check, ShieldCheck, Zap, Download, RefreshCw, Star, Info } from 'lucide-react';

const PlansPage = () => {
  const currentPlan = {
    name: 'Gradbahn Pro',
    status: 'Active',
    renewalDate: 'Oct 15, 2024',
    amount: '€12.99',
    billingCycle: 'monthly'
  };

  const plans = [
    {
      name: 'Basic',
      price: '€0',
      description: 'Perfect for exploring your options.',
      features: ['Browse 500+ programmes', 'Basic grade conversion', 'Community support'],
      buttonText: 'Current Plan',
      isCurrent: false,
      isPro: false
    },
    {
      name: 'Pro',
      price: '€12.99',
      description: 'Precision tools for serious candidates.',
      features: ['Unlimited programme access', 'Advanced ECTS matching', 'Live fee tracking', 'Direct university contact'],
      buttonText: 'Renew Now',
      isCurrent: true,
      isPro: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Dedicated support for consultants.',
      features: ['Multi-student dashboards', 'Bulk data export', 'Dedicated success manager', 'API access'],
      buttonText: 'Contact Sales',
      isCurrent: false,
      isPro: false
    }
  ];

  const billingHistory = [
    { date: 'Aug 15, 2024', amount: '€12.99', status: 'Paid' },
    { date: 'Jul 15, 2024', amount: '€12.99', status: 'Paid' },
    { date: 'Jun 15, 2024', amount: '€12.99', status: 'Paid' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Subscription & Billing</h1>
          <p className="text-slate-500 dark:text-slate-400 font-inter">Manage your premium academic experience.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left/Center) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Current Plan Overview */}
            <div className="glass p-8 rounded-3xl border border-white/20 dark:border-slate-800 shadow-xl bg-white/40 dark:bg-slate-900/40 animate-slide-up">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-sapphire-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sapphire-500/20">
                    <Zap className="text-white w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-sapphire-500 uppercase tracking-widest mb-1">Your current plan</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit">{currentPlan.name}</h2>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{currentPlan.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-y border-slate-100 dark:border-slate-800 py-6">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Renewal Date</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{currentPlan.renewalDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Billing Amount</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{currentPlan.amount}<span className="text-sm font-normal text-slate-500">/{currentPlan.billingCycle}</span></p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Payment Method</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"></div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">•••• 4242</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button className="flex-1 bg-sapphire-500 hover:bg-sapphire-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-sapphire-500/25 flex items-center justify-center space-x-2">
                  <RefreshCw size={18} />
                  <span>Renew Now</span>
                </button>
                <button className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                  Change Plan
                </button>
              </div>
            </div>

            {/* Plan Comparison */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 font-outfit">Explore Other Tiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div 
                    key={plan.name}
                    className={`relative p-6 rounded-3xl border transition-all ${
                      plan.isPro 
                        ? 'bg-white dark:bg-slate-900 border-gold-500 shadow-2xl scale-105 z-10 ring-4 ring-gold-500/10' 
                        : 'bg-white/40 dark:bg-slate-900/40 border-white/20 dark:border-slate-800'
                    }`}
                  >
                    {plan.isPro && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                        Recommended
                      </div>
                    )}
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1 font-outfit">{plan.name}</h4>
                    <div className="flex items-baseline space-x-1 mb-4">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-slate-500 text-sm">/mo</span>}
                    </div>
                    <p className="text-sm text-slate-500 mb-6 font-inter leading-relaxed">{plan.description}</p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.isPro ? 'text-gold-500' : 'text-sapphire-500'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button className={`w-full py-3 rounded-2xl font-bold transition-all ${
                      plan.isCurrent 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                        : (plan.isPro ? 'bg-gold-500 hover:bg-gold-600 text-white shadow-lg shadow-gold-500/20' : 'bg-sapphire-500/10 text-sapphire-600 hover:bg-sapphire-500 hover:text-white')
                    }`}>
                      {plan.buttonText}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar (Right) */}
          <div className="space-y-8 animate-slide-up delay-100">
            
            {/* Security Notice */}
            <div className="bg-sapphire-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
              <div className="relative z-10">
                <ShieldCheck className="w-8 h-8 text-gold-500 mb-4" />
                <h4 className="font-bold mb-2 font-outfit">Secure Billing</h4>
                <p className="text-sm text-white/70 font-inter leading-relaxed">
                  All transactions are encrypted with 256-bit SSL security and processed by Grade-A payment providers.
                </p>
              </div>
            </div>

            {/* Billing History */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-slate-800 shadow-xl bg-white/40 dark:bg-slate-900/40">
              <h4 className="font-bold text-slate-900 dark:text-white mb-6 font-outfit">Billing History</h4>
              <div className="space-y-4">
                {billingHistory.map((invoice, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                        <Download className="w-5 h-5 text-slate-400 group-hover:text-sapphire-500 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{invoice.date}</p>
                        <p className="text-xs text-slate-400">{invoice.status}</p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">{invoice.amount}</p>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 text-sm font-bold text-sapphire-500 hover:text-sapphire-600 transition-colors">
                View All Statements
              </button>
            </div>

            {/* Help Section */}
            <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 mb-4">
                <Info size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Support</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Have questions about your billing or plan? Our team is here to help.</p>
              <button className="text-sm font-bold text-slate-900 dark:text-white hover:underline">
                Contact Support
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default PlansPage;
