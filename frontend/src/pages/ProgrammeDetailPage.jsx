import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProgramme } from '../hooks/useProgrammes';
import { useCurrency } from '../hooks/useCurrency';
import RequirementsPanel from '../components/Programme/RequirementsPanel';
import Spinner from '../components/UI/Spinner';
import { ArrowLeft, Building2, ExternalLink, Calendar, FileText, Globe, GraduationCap, Banknote, ShieldCheck, Star, CheckCircle } from 'lucide-react';
import { programmeService } from '../services/programmeService';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

const ProgrammeDetailPage = () => {
  const { id } = useParams();
  const { programme, loading, error } = useProgramme(id);
  const { selectedCurrency, rates } = useCurrency();
  const [costData, setCostData] = useState(null);
  const { isAuthenticated } = useAuth();
  const { addProgramme, removeProgramme, dashboard } = useDashboard();
  const navigate = useNavigate();

  const isTracked = dashboard?.dashboard_programmes?.some(p => p.programme_id === programme?.id);

  const handleTrackToggle = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to manage your dashboard");
      navigate('/login');
      return;
    }
    try {
      if (isTracked) {
        await removeProgramme(programme.id);
        toast.success("Removed from your dashboard");
      } else {
        await addProgramme(programme.id);
        toast.success("Added to your dashboard");
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  useEffect(() => {
    if (id && selectedCurrency) {
      programmeService.getCost(id, selectedCurrency)
        .then(data => setCostData(data))
        .catch(err => {
          console.error(err);
          setCostData({ fee_eur: programme?.application_fee_eur || 0, fee_converted: programme?.application_fee_eur || 0, currency: 'EUR' });
        });
    }
  }, [id, selectedCurrency, programme?.application_fee_eur]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Spinner size={48} className="text-sapphire-500" />
    </div>
  );

  if (error || !programme) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{error || 'Programme not found'}</h2>
      <Link to="/programmes" className="btn-primary">Back to Search</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      {/* Header / Hero Area */}
      <div className="relative bg-sapphire-900 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sapphire-800 to-slate-900 opacity-90"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gold-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/programmes" className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors text-sm font-bold tracking-widest uppercase">
            <ArrowLeft size={16} className="mr-2" /> Back to Catalog
          </Link>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-gold-500/20 border border-gold-500/30 rounded-full text-gold-400 text-[10px] font-black tracking-[0.2em] uppercase mb-4">
                {programme.degree_type}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white font-outfit tracking-tight mb-4 leading-tight">
                {programme.name}
              </h1>
              <div className="flex flex-wrap items-center text-white/70 gap-y-2">
                <div className="flex items-center mr-6">
                  <Building2 size={18} className="mr-2 text-gold-500" />
                  <span className="font-bold">{programme.university?.name}</span>
                </div>
                <div className="flex items-center">
                  <Globe size={18} className="mr-2 text-gold-500" />
                  <span>
                    {programme.university?.location && programme.university?.federal_state
                      ? `${programme.university.location}, ${programme.university.federal_state}`
                      : programme.university?.location || programme.university?.federal_state || 'Germany'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <button
                onClick={handleTrackToggle}
                className={`w-full sm:w-auto whitespace-nowrap px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${isTracked
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-sapphire-500 hover:bg-sapphire-600 text-white shadow-lg shadow-sapphire-500/20'
                  }`}
              >
                <span>{isTracked ? 'Tracked' : 'Track'}</span>
                {isTracked ? <CheckCircle size={18} className="ml-1" /> : <Star size={18} className="ml-1" />}
              </button>
              <a
                href={programme.programme_website_url || "#"}
                target={programme.programme_website_url ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={`flex items-center justify-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all w-full sm:w-auto ${programme.programme_website_url
                    ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                    : 'bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-700/30'
                  }`}
                onClick={(e) => {
                  if (!programme.programme_website_url) {
                    e.preventDefault();
                  }
                }}
              >
                <span>Program Website</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-20 relative z-20">

        {/* Unverified / Fallback Data Warning Banner */}
        {programme.data_source === 'FALLBACK_GENERATED' && (
          <div className="mb-8 p-5 bg-rose-50/90 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-3xl flex items-start space-x-3 text-rose-800 dark:text-rose-300 shadow-lg backdrop-blur-md">
            <span className="text-2xl shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-extrabold text-sm uppercase tracking-wider font-outfit mb-1 text-rose-700 dark:text-rose-400">Placeholder / Fallback Data</p>
              <p className="text-xs text-rose-600/90 dark:text-rose-300/80 leading-relaxed">
                The extraction for this program failed or was skipped due to API limitations. The requirements shown below are realistic fallback placeholders and might not reflect the actual regulations. Please verify with the official website.
              </p>
            </div>
          </div>
        )}
        {programme.data_source === 'UNVERIFIED' && (
          <div className="mb-8 p-5 bg-amber-50/90 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 rounded-3xl flex items-start space-x-3 text-amber-800 dark:text-amber-350 shadow-lg backdrop-blur-md">
            <span className="text-2xl shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-extrabold text-sm uppercase tracking-wider font-outfit mb-1 text-amber-700 dark:text-amber-400">Unverified Data</p>
              <p className="text-xs text-amber-600/90 dark:text-amber-300/80 leading-relaxed">
                The data for this program has not been verified against the latest official regulations yet. Please consult the program website to double-check these requirements.
              </p>
            </div>
          </div>
        )}

        {/* Core Stats Bar */}
        <div className="glass p-6 sm:p-8 rounded-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-sapphire-50 dark:bg-sapphire-900/30 rounded-2xl flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-sapphire-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission</p>
              <p className="font-bold text-slate-900 dark:text-white">{programme.nc_status === 'LOCAL_NC' ? 'NC' : programme.nc_status.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Route</p>
              <p className="font-bold text-slate-900 dark:text-white">{programme.application_route}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gold-50 dark:bg-gold-900/30 rounded-2xl flex items-center justify-center shrink-0">
              <Banknote className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {programme?.application_route?.toLowerCase().includes('uni-assist') || programme?.application_route?.toLowerCase().includes('vpd') ? 'Fee (1st/Next)' : 'Application Fee'}
              </p>
              <div className="flex items-baseline space-x-1 font-bold text-slate-900 dark:text-white">
                {costData ? (
                  programme?.application_route?.toLowerCase().includes('uni-assist') || programme?.application_route?.toLowerCase().includes('vpd') ? (
                    <>
                      <span>
                        {selectedCurrency === 'EUR' ? '75/30' : `${(75 * (rates.find(r => r.target_currency === selectedCurrency)?.rate || 1)).toFixed(0)}/${(30 * (rates.find(r => r.target_currency === selectedCurrency)?.rate || 1)).toFixed(0)}`}
                      </span>
                      <span className="text-xs text-gold-500">{selectedCurrency}</span>
                    </>
                  ) : (
                    <>
                      <span>{costData.fee_converted}</span>
                      <span className="text-xs text-gold-500">{costData.currency}</span>
                    </>
                  )
                ) : <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GRE</p>
              <p className="font-bold text-slate-900 dark:text-white">{programme.gre_required}</p>
            </div>
          </div>
        </div>

        {/* Requirements Visualization */}
        <div className="mb-12">
          <RequirementsPanel programme={programme} />
        </div>

        {/* Bottom Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Deadlines */}
          <div className="glass p-8 rounded-3xl">
            <div className="flex items-center space-x-3 mb-8">
              <Calendar className="w-6 h-6 text-sapphire-500" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight">Application Deadlines</h3>
            </div>
            <div className="space-y-4">
              {programme.deadlines.map(d => (
                <div key={d.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-sapphire-200 dark:hover:border-sapphire-800 transition-all">
                  <div>
                    <p className="text-xs font-black text-sapphire-500 uppercase tracking-[0.2em] mb-1">{d.semester} Intake</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Portal Opens: {d.portal_opens ? new Date(d.portal_opens).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Closes On</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {d.application_deadline ? new Date(d.application_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
                    </p>
                  </div>
                </div>
              ))}
              {programme.deadlines.length === 0 && <p className="text-slate-500 italic py-4">No specific deadlines recorded.</p>}
            </div>
          </div>

          {/* Checklist */}
          <div className="glass p-8 rounded-3xl">
            <div className="flex items-center space-x-3 mb-8">
              <FileText className="w-6 h-6 text-sapphire-500" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight">Required Documents</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {programme.required_documents.map(doc => (
                <div key={doc.id} className="flex items-center p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/20">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mr-3">
                    <span className="text-white text-[10px] font-black">✓</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">{doc.document_name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProgrammeDetailPage;
