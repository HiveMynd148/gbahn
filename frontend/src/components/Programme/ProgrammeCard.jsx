import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../UI/Badge';
import { Building2, MapPin, CreditCard, CheckCircle2, Banknote, ArrowRight, Star, CheckCircle } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

const ProgrammeCard = ({ programme, onAdd, onRemove, isTracked }) => {
  const { selectedCurrency, rates } = useCurrency();
  
  const getCostString = () => {
    if (!programme.application_fee_eur) return 'Free';
    const rate = rates.find(r => r.target_currency === selectedCurrency)?.rate || 1;
    
    const isUniAssist = programme.application_route?.toLowerCase().includes('uni-assist') || programme.application_route?.toLowerCase().includes('vpd');
    if (isUniAssist) {
      const first = selectedCurrency === 'EUR' ? 75 : 75 * rate;
      const next = selectedCurrency === 'EUR' ? 30 : 30 * rate;
      return `${first.toFixed(selectedCurrency === 'EUR' ? 0 : 2)}/${next.toFixed(selectedCurrency === 'EUR' ? 0 : 2)} ${selectedCurrency}`;
    }

    const converted = selectedCurrency === 'EUR' ? programme.application_fee_eur : programme.application_fee_eur * rate;
    return `${converted.toFixed(selectedCurrency === 'EUR' ? 0 : 2)} ${selectedCurrency}`;
  };

  const isNCFree = programme.nc_status === 'NC_FREE';

  return (
    <div className="glass group relative p-6 rounded-2xl flex flex-col h-full hover:scale-[1.01] transition-all duration-300 border-slate-200/50 dark:border-slate-700/30 overflow-hidden">
      
      {/* Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${isNCFree ? 'bg-emerald-500' : 'bg-gold-500'}`}></div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 pr-4 min-w-0">
          <h3 
            className="text-xl font-bold text-slate-900 dark:text-white font-outfit leading-tight mb-2 group-hover:text-sapphire-500 transition-colors line-clamp-2"
            title={programme.name}
          >
            {programme.name}
          </h3>
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-sm">
            <Building2 className="w-4 h-4 text-sapphire-500 shrink-0" />
            <span className="font-medium truncate" title={programme.university?.name}>{programme.university?.name}</span>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2 shrink-0">
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isNCFree ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400'}`}>
            {programme.nc_status === 'LOCAL_NC' ? 'NC' : programme.nc_status.replace('_', ' ')}
          </div>
          {programme.data_source === 'FALLBACK_GENERATED' && (
            <div className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-450 text-[9px] font-extrabold uppercase tracking-wide flex items-center space-x-1 shadow-sm">
              <span>⚠️ Fallback</span>
            </div>
          )}
          {programme.data_source === 'UNVERIFIED' && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-450 text-[9px] font-extrabold uppercase tracking-wide flex items-center space-x-1 shadow-sm">
              <span>⚠️ Unverified</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-8 flex-1">
        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-3">
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <span className="truncate" title={programme.university?.location && programme.university?.federal_state ? `${programme.university.location}, ${programme.university.federal_state}` : (programme.university?.location || programme.university?.federal_state || 'Germany')}>
            {programme.university?.location && programme.university?.federal_state
              ? `${programme.university.location}, ${programme.university.federal_state}`
              : programme.university?.location || programme.university?.federal_state || 'Germany'}
          </span>
        </div>

        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-3">
            <Banknote className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white">{getCostString()}</span>
            <span className="text-[10px] text-slate-400 uppercase">
              {programme.application_route?.toLowerCase().includes('uni-assist') || programme.application_route?.toLowerCase().includes('vpd') ? 'Fee (1st/Next)' : 'Application Fee'}
            </span>
          </div>
        </div>

        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-3">
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white">{programme.application_route}</span>
            <span className="text-[10px] text-slate-400 uppercase">Route</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-6 border-t border-slate-200/50 dark:border-slate-700/30">
        <Link 
          to={`/programmes/${programme.id}`}
          className="flex-1 text-center py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sapphire-500 transition-colors"
        >
          Details
        </Link>
        <button
          onClick={() => isTracked ? (onRemove && onRemove(programme.id)) : onAdd(programme.id)}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 group/btn ${
            isTracked
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-sapphire-500 hover:bg-sapphire-600 text-white shadow-sapphire-500/20'
          }`}
        >
          <span>{isTracked ? 'Tracked' : 'Track'}</span>
          {isTracked ? (
            <CheckCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          ) : (
            <Star className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ProgrammeCard;
