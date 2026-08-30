import React, { useState, useEffect } from 'react';
import { useProgrammes } from '../hooks/useProgrammes';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { programmeService } from '../services/programmeService';
import ProgrammeCard from '../components/Programme/ProgrammeCard';
import Spinner from '../components/UI/Spinner';
import CustomDropdown from '../components/UI/CustomDropdown';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, MapPin, GraduationCap, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProgrammesPage = () => {
  const [search, setSearch] = useState('');
  const [ncStatus, setNcStatus] = useState('');
  const [greRequired, setGreRequired] = useState([]);

  const handleGreClick = (value) => {
    if (value === '') {
      setGreRequired([]);
      return;
    }
    
    if (greRequired.includes(value)) {
      setGreRequired(prev => prev.filter(v => v !== value));
    } else {
      if (greRequired.length >= 3) {
        toast.error("Selecting all requirements is equivalent to selecting 'All'");
        return;
      }
      setGreRequired(prev => [...prev, value]);
    }
  };
  const [federalState, setFederalState] = useState('');
  const [federalStates, setFederalStates] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { programmes, loading, fetchProgrammes } = useProgrammes();
  const { isAuthenticated } = useAuth();
  const { addProgramme, removeProgramme, dashboard } = useDashboard();
  const navigate = useNavigate();

  useEffect(() => {
    programmeService.getFederalStates()
      .then(data => setFederalStates(data))
      .catch(err => console.error('Failed to load federal states:', err));
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (ncStatus) params.nc_status = ncStatus;
    if (greRequired.length > 0) params.gre_required = greRequired.join(',');
    if (federalState) params.federal_state = federalState;
    fetchProgrammes(params);
    if (window.innerWidth < 1024) setFiltersOpen(false);
  };

  const handleAdd = async (id) => {
    if (!isAuthenticated) {
      toast.error("Please log in to add programmes to your dashboard");
      navigate('/login');
      return;
    }
    try {
      await addProgramme(id);
      toast.success("Added to your dashboard");
    } catch (err) {
      toast.error("Could not add programme");
    }
  };

  const handleRemove = async (id) => {
    if (!isAuthenticated) return;
    try {
      await removeProgramme(id);
      toast.success("Removed from your dashboard");
    } catch (err) {
      toast.error("Could not remove programme");
    }
  };

  const isTracked = (id) => dashboard?.dashboard_programmes?.some(p => p.programme_id === id);

  const activeFilterCount = [ncStatus, greRequired.length > 0 ? 'yes' : '', federalState].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header Section */}
        <div className="mb-12 text-center lg:text-left">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 font-outfit tracking-tight">
            Explore Master's <span className="text-sapphire-500">Programmes</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
            Discover 20+ specialized Computer Science and AI programmes in Germany. Filter by requirements, state, and NC status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Sidebar Filters */}
          <aside className="lg:col-span-3 sticky top-24">
            <div className="glass rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-5 h-5 text-sapphire-500" />
                  <h2 className="font-bold text-slate-900 dark:text-white font-outfit">Filters</h2>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setNcStatus('');
                      setGreRequired([]);
                      setFederalState('');
                      setSearch('');
                      fetchProgrammes({});
                    }}
                    className="text-xs text-sapphire-500 hover:text-sapphire-600 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="p-6 space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSearch()}
                      placeholder="University or Subject..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-sapphire-500 text-slate-900 dark:text-white transition-all"
                    />
                  </div>
                </div>

                {/* State */}
                <CustomDropdown
                  label="Federal State"
                  icon={MapPin}
                  value={federalState}
                  onChange={e => setFederalState(e.target.value)}
                  options={[
                    { value: '', label: 'All States' },
                    ...federalStates.map(state => ({ value: state, label: state }))
                  ]}
                />

                {/* NC Status */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" /> Admission (NC)
                  </label>
                  <div className="w-full bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-md p-1 rounded-2xl border border-slate-200/30 dark:border-slate-700/30">
                    <div className="relative flex w-full isolate">
                      <div
                        className="absolute top-1 bottom-1 w-[calc(33.3333%-6px)] bg-white/80 dark:bg-slate-700/80 shadow-[0_4px_16px_-4px_rgba(59,91,219,0.15)] border border-slate-200/50 dark:border-slate-600/40 rounded-xl transition-all duration-300 ease-out -z-10"
                        style={{
                          left: ncStatus === 'LOCAL_NC' ? 'calc(66.6666% + 2px)' : ncStatus === 'NC_FREE' ? 'calc(33.3333% + 3px)' : '4px'
                        }}
                      ></div>
                      {[
                        { value: '', label: 'Any' },
                        { value: 'NC_FREE', label: 'NC Free' },
                        { value: 'LOCAL_NC', label: 'NC' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setNcStatus(opt.value)}
                          className={`flex-1 text-center py-2.5 text-xs font-bold transition-all duration-300 ${ncStatus === opt.value
                              ? 'text-sapphire-600 dark:text-sapphire-400 font-extrabold tracking-wide scale-[1.02]'
                              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* GRE */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">GRE Requirement</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: '', label: 'All' },
                      { value: 'Not Required', label: 'None' },
                      { value: 'Advisable', label: 'Advisable' },
                      { value: 'Recommended', label: 'Recommended' },
                      { value: 'Mandatory', label: 'Mandatory' }
                    ].map((opt) => {
                      const isActive = opt.value === '' ? greRequired.length === 0 : greRequired.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleGreClick(opt.value)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${isActive
                              ? 'bg-sapphire-50 border-sapphire-200 text-sapphire-700 dark:bg-sapphire-900/30 dark:border-sapphire-700 dark:text-sapphire-300 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-750'
                            }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  className="btn-primary w-full py-3 flex items-center justify-center space-x-2 group"
                >
                  <span>Apply Filters</span>
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <main className="lg:col-span-9">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Spinner size={48} className="text-sapphire-500" />
                <p className="text-slate-500 animate-pulse font-medium">Curating programs for you...</p>
              </div>
            ) : programmes.length === 0 ? (
              <div className="glass p-16 rounded-2xl text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No matching programmes</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">We couldn't find any programmes matching your current filters. Try adjusting your search criteria.</p>
                <button
                  onClick={() => {
                    setNcStatus('');
                    setGreRequired([]);
                    setFederalState('');
                    setSearch('');
                    fetchProgrammes({});
                  }}
                  className="text-sapphire-500 font-bold hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {programmes.map((prog, index) => (
                  <div key={prog.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <ProgrammeCard
                      programme={prog}
                      onAdd={handleAdd}
                      onRemove={handleRemove}
                      isTracked={isTracked(prog.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
};

export default ProgrammesPage;
