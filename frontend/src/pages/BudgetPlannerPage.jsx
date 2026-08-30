import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Utensils, 
  Bus, 
  HeartPulse, 
  Settings2, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Euro,
  Wallet,
  Plane,
  FileText,
  CreditCard,
  ShoppingBag,
  ChevronDown,
  Globe,
  Save,
  Trash2,
  List,
  Shirt,
  Briefcase,
  Plus
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/budgetService';
import CustomDropdown from '../components/UI/CustomDropdown';

const BLOCKED_ACCOUNT_MONTHLY = 992;

const MONTHLY_CATEGORIES = [
  { 
    id: 'rent', 
    label: 'Rent & Utilities', 
    icon: Building2, 
    bgColor: 'bg-blue-100 dark:bg-blue-900/20', 
    textColor: 'text-blue-600 dark:text-blue-400',
    description: 'Monthly rent, heating, water, electricity, and internet.'
  },
  { 
    id: 'food', 
    label: 'Food & Groceries', 
    icon: Utensils, 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/20', 
    textColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Food, groceries, household items, and basic dining.'
  },
  { 
    id: 'transport', 
    label: 'Transport', 
    icon: Bus, 
    bgColor: 'bg-gold-100 dark:bg-gold-500/20', 
    textColor: 'text-gold-600 dark:text-gold-400',
    description: 'Public transportation ticket, semester ticket, or bicycle maintenance.'
  },
  { 
    id: 'insurance', 
    label: 'Health Insurance', 
    icon: HeartPulse, 
    bgColor: 'bg-rose-100 dark:bg-rose-900/20', 
    textColor: 'text-rose-600 dark:text-rose-400',
    description: 'Compulsory health insurance for international students in Germany.'
  },
  { 
    id: 'misc', 
    label: 'Personal & Leisure', 
    icon: Settings2, 
    bgColor: 'bg-slate-100 dark:bg-slate-800/40', 
    textColor: 'text-slate-600 dark:text-slate-400',
    description: 'Mobile plan, clothing, gym, hobbies, and entertainment.'
  },
];

const ONETIME_CATEGORIES = [
  { 
    id: 'visa', 
    label: 'Visa Fees', 
    icon: FileText, 
    defaultValue: 75, 
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20', 
    textColor: 'text-indigo-600 dark:text-indigo-400',
    description: 'National visa application fee and residence permit charges.'
  },
  { 
    id: 'blocked_fee', 
    label: 'Blocked Account', 
    icon: CreditCard, 
    defaultValue: 11904, 
    bgColor: 'bg-amber-100 dark:bg-amber-900/20', 
    textColor: 'text-amber-600 dark:text-amber-400',
    description: 'Fees for opening and maintaining the mandatory German blocked account.'
  },
  { 
    id: 'flight', 
    label: 'Flight to Germany', 
    icon: Plane, 
    defaultValue: 0, 
    bgColor: 'bg-sky-100 dark:bg-sky-900/20', 
    textColor: 'text-sky-600 dark:text-sky-400',
    description: ''
  },
  { 
    id: 'deposit', 
    label: 'Rent Deposit', 
    icon: Building2, 
    defaultValue: 0, 
    bgColor: 'bg-purple-100 dark:bg-purple-900/20', 
    textColor: 'text-purple-600 dark:text-purple-400',
    description: ''
  },
  { 
    id: 'setup', 
    label: 'Initial Setup/Furniture', 
    icon: ShoppingBag, 
    defaultValue: 0, 
    bgColor: 'bg-pink-100 dark:bg-pink-900/20', 
    textColor: 'text-pink-600 dark:text-pink-400',
    description: ''
  },
  {
    id: 'clothing',
    label: 'Clothing',
    icon: Shirt,
    defaultValue: 0,
    bgColor: 'bg-teal-100 dark:bg-teal-900/20',
    textColor: 'text-teal-600 dark:text-teal-400',
    description: ''
  },
  {
    id: 'baggage',
    label: 'Baggage',
    icon: Briefcase,
    defaultValue: 0,
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    textColor: 'text-orange-600 dark:text-orange-400',
    description: ''
  }
];

const BudgetPlannerPage = () => {
  const { dashboard } = useDashboard();
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  
  const [savedBudgets, setSavedBudgets] = useState([]);
  const [currentBudgetId, setCurrentBudgetId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    inputValue: '',
    onConfirm: null,
    onCancel: null
  });

  // Dynamic Categories State
  const [monthlyCategories, setMonthlyCategories] = useState(MONTHLY_CATEGORIES);
  const [oneTimeCategories, setOneTimeCategories] = useState(ONETIME_CATEGORIES);

  // Custom Field Form State
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [customFieldType, setCustomFieldType] = useState('monthly');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newFieldDescription, setNewFieldDescription] = useState('');
  
  const [monthlyCosts, setMonthlyCosts] = useState(
    MONTHLY_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {})
  );
  const [oneTimeCosts, setOneTimeCosts] = useState(
    ONETIME_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.defaultValue }), {})
  );

  // Extract tracked universities and their cities from dashboard
  const trackedUniversities = useMemo(() => {
    if (!dashboard?.dashboard_programmes) return [];
    const items = dashboard.dashboard_programmes.map(p => ({
      id: p.programme.id,
      name: p.programme.university?.name,
      location: p.programme.university?.location,
    })).filter(u => u.name && u.location);
    
    // Remove duplicates based on university name + city
    const seen = new Set();
    return items.filter(u => {
      const key = `${u.name}-${u.location}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dashboard]);

  const selectedUniData = useMemo(() => {
    return trackedUniversities.find(u => u.id.toString() === selectedUniversity);
  }, [trackedUniversities, selectedUniversity]);

  // Set initial selection if universities are loaded
  useEffect(() => {
    if (trackedUniversities.length > 0 && !selectedUniversity) {
      setSelectedUniversity(trackedUniversities[0].id.toString());
    }
  }, [trackedUniversities, selectedUniversity]);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const data = await getBudgets();
      setSavedBudgets(data);
    } catch (error) {
      console.error('Failed to load budgets', error);
    }
  };

  const showAlert = (title, message) => {
    setModalConfig({
      isOpen: true, type: 'alert', title, message, inputValue: '',
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
      onCancel: null
    });
  };

  const showConfirm = (title, message, onConfirm) => {
    setModalConfig({
      isOpen: true, type: 'confirm', title, message, inputValue: '',
      onConfirm: () => {
        onConfirm();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showPrompt = (title, message, defaultValue, onConfirm) => {
    setModalConfig({
      isOpen: true, type: 'prompt', title, message, inputValue: defaultValue,
      onConfirm: (val) => {
        onConfirm(val);
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const executeSave = async (budgetName) => {
    try {
      setIsSaving(true);
      
      const monthlyCustoms = monthlyCategories.filter(c => c.isCustom).map(c => ({
        id: c.id,
        label: c.label,
        description: c.description,
        isCustom: true
      }));

      const oneTimeCustoms = oneTimeCategories.filter(c => c.isCustom).map(c => ({
        id: c.id,
        label: c.label,
        description: c.description,
        isCustom: true
      }));

      const budgetData = {
        name: budgetName,
        monthly_costs: {
          ...monthlyCosts,
          _custom_fields: monthlyCustoms
        },
        one_time_costs: {
          ...oneTimeCosts,
          _custom_fields: oneTimeCustoms
        }
      };
      
      if (!budgetData.name) {
          setIsSaving(false);
          return;
      }

      if (currentBudgetId) {
        await updateBudget(currentBudgetId, budgetData);
        showAlert("Success", "Budget updated successfully!");
      } else {
        const newBudget = await createBudget(budgetData);
        setCurrentBudgetId(newBudget.id);
        showAlert("Success", "Budget saved successfully!");
      }
      await loadBudgets();
    } catch (error) {
      console.error(error);
      showAlert("Error", error.response?.data?.detail || "Failed to save budget");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBudget = () => {
    if (currentBudgetId) {
      const existingName = savedBudgets.find(b => b.id === currentBudgetId)?.name || 'My Budget';
      executeSave(existingName);
    } else {
      if (savedBudgets.length >= 5) {
        showAlert("Limit Reached", "You can only save up to 5 budgets. Please delete one to save a new budget.");
        return;
      }
      showPrompt("Save Budget", "Enter a name for your new budget:", "", (name) => {
        if (name && name.trim()) {
          executeSave(name.trim());
        }
      });
    }
  };

  const handleLoadBudget = (budgetId) => {
    const budget = savedBudgets.find(b => b.id === budgetId);
    if (budget) {
      // Reconstruct custom categories
      const monthlyCustoms = budget.monthly_costs?._custom_fields || [];
      const oneTimeCustoms = budget.one_time_costs?._custom_fields || [];

      const reconstructedMonthlyCats = [
        ...MONTHLY_CATEGORIES,
        ...monthlyCustoms.map(c => ({
          ...c,
          icon: Settings2,
          bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
          textColor: 'text-indigo-600 dark:text-indigo-400',
        }))
      ];
      const reconstructedOneTimeCats = [
        ...ONETIME_CATEGORIES,
        ...oneTimeCustoms.map(c => ({
          ...c,
          icon: Settings2,
          bgColor: 'bg-pink-100 dark:bg-pink-900/20',
          textColor: 'text-pink-600 dark:text-pink-400',
        }))
      ];

      setMonthlyCategories(reconstructedMonthlyCats);
      setOneTimeCategories(reconstructedOneTimeCats);

      const cleanMonthlyCosts = { ...budget.monthly_costs };
      delete cleanMonthlyCosts._custom_fields;
      setMonthlyCosts(cleanMonthlyCosts);

      const cleanOneTimeCosts = { ...budget.one_time_costs };
      delete cleanOneTimeCosts._custom_fields;
      setOneTimeCosts(cleanOneTimeCosts);

      setCurrentBudgetId(budgetId);
    }
  };

  const handleDeleteBudget = (id) => {
    showConfirm("Delete Budget", "Are you sure you want to delete this budget? This action cannot be undone.", async () => {
      try {
        await deleteBudget(id);
        if (currentBudgetId === id) setCurrentBudgetId(null);
        await loadBudgets();
      } catch (error) {
        console.error(error);
        showAlert("Error", "Failed to delete budget");
      }
    });
  };

  const totalMonthly = Object.keys(monthlyCosts)
    .filter(key => key !== '_custom_fields')
    .reduce((acc, curr) => acc + (parseInt(monthlyCosts[curr]) || 0), 0);

  const totalOneTime = Object.keys(oneTimeCosts)
    .filter(key => key !== '_custom_fields')
    .reduce((acc, curr) => acc + (parseInt(oneTimeCosts[curr]) || 0), 0);
  
  const diff = totalMonthly - BLOCKED_ACCOUNT_MONTHLY;
  const isOver = totalMonthly > BLOCKED_ACCOUNT_MONTHLY;

  const handleReset = () => {
    setCurrentBudgetId(null);
    if (activeTab === 'monthly') {
      setMonthlyCategories(MONTHLY_CATEGORIES);
      setMonthlyCosts(MONTHLY_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {}));
    } else {
      setOneTimeCategories(ONETIME_CATEGORIES);
      setOneTimeCosts(
        ONETIME_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.defaultValue }), {})
      );
    }
  };

  const handleUniversityChange = (e) => {
    setSelectedUniversity(e.target.value);
  };

  const handleCostChange = (id, val, type) => {
    const numVal = parseInt(val) || 0;
    if (type === 'monthly') {
      setMonthlyCosts(prev => ({ ...prev, [id]: numVal }));
    } else {
      setOneTimeCosts(prev => ({ ...prev, [id]: numVal }));
    }
  };

  const handleRemoveCustomField = (id, type) => {
    if (type === 'monthly') {
      setMonthlyCategories(prev => prev.filter(c => c.id !== id));
      setMonthlyCosts(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setOneTimeCategories(prev => prev.filter(c => c.id !== id));
      setOneTimeCosts(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleAddCustomFieldSubmit = () => {
    if (!newFieldLabel.trim()) return;
    
    const id = 'custom_' + Date.now();
    const newCat = {
      id,
      label: newFieldLabel.trim(),
      icon: Settings2,
      bgColor: customFieldType === 'monthly' ? 'bg-indigo-100 dark:bg-indigo-900/20' : 'bg-pink-100 dark:bg-pink-900/20',
      textColor: customFieldType === 'monthly' ? 'text-indigo-600 dark:text-indigo-400' : 'text-pink-600 dark:text-pink-400',
      description: newFieldDescription.trim(),
      isCustom: true
    };

    const costVal = parseInt(newFieldValue) || 0;

    if (customFieldType === 'monthly') {
      setMonthlyCategories(prev => [...prev, newCat]);
      setMonthlyCosts(prev => ({ ...prev, [id]: costVal }));
    } else {
      setOneTimeCategories(prev => [...prev, newCat]);
      setOneTimeCosts(prev => ({ ...prev, [id]: costVal }));
    }

    setIsCustomFieldModalOpen(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-sapphire-100 dark:bg-sapphire-900/30 text-sapphire-600 dark:text-sapphire-400 rounded-2xl mb-6 shadow-inner">
            <Wallet size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Budget <span className="text-sapphire-600">Architect</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Plan your financial journey based on your shortlisted universities in Germany.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-lg flex border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'monthly' 
                ? 'bg-sapphire-500 text-white shadow-lg' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Monthly Expenses
            </button>
            <button
              onClick={() => setActiveTab('one-time')}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'one-time' 
                ? 'bg-sapphire-500 text-white shadow-lg' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              One-time Expenses
            </button>
          </div>
        </div>

        {/* Saved Budgets Banner */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 mb-10 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold shrink-0">
              <List size={20} className="text-sapphire-500" />
              <span>Saved Budgets ({savedBudgets.length}/5)</span>
            </div>
            <div className="shrink-0">
              <button 
                onClick={handleSaveBudget} 
                disabled={isSaving || (!currentBudgetId && savedBudgets.length >= 5)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-sapphire-600 hover:bg-sapphire-700 disabled:bg-slate-400 text-white transition-colors shadow-lg shadow-sapphire-600/30 text-sm"
                title={!currentBudgetId && savedBudgets.length >= 5 ? "You have reached the limit of 5 saved budgets." : ""}
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : (currentBudgetId ? 'Update Active Budget' : 'Save New Budget')}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {savedBudgets.map(b => {
              const bTotalMonthly = Object.keys(b.monthly_costs || {})
                .filter(key => key !== '_custom_fields')
                .reduce((acc, curr) => acc + (parseInt(b.monthly_costs[curr]) || 0), 0);
              return (
                <div 
                  key={b.id} 
                  className={`flex items-center justify-between p-4 rounded-xl border ${currentBudgetId === b.id ? 'bg-sapphire-50 border-sapphire-300 dark:bg-sapphire-900/30 dark:border-sapphire-700/50 text-sapphire-900 dark:text-sapphire-100 ring-2 ring-sapphire-500/20' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'} transition-all cursor-pointer group`} 
                  onClick={() => handleLoadBudget(b.id)}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-base">{b.name}</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                      {currentBudgetId === b.id ? 'Currently Active' : 'Click to load'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black">€{bTotalMonthly}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Monthly</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteBudget(b.id); }} 
                      className="p-2.5 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 opacity-0 group-hover:opacity-100 focus:opacity-100 md:opacity-100"
                      title="Delete Budget"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            {savedBudgets.length === 0 && (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-400">No saved budgets yet. Adjust your costs below and save a new budget!</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            
            {/* University Selection Dropdown (Only for Monthly) */}
            {activeTab === 'monthly' && (
              <div className="glass p-8 rounded-[2rem] border border-white/50 dark:border-slate-800/50 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <span className="w-2 h-8 bg-sapphire-500 rounded-full mr-3"></span>
                    Shortlisted Institution
                  </h2>
                  <button 
                    onClick={handleReset}
                    className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-sapphire-600 transition-colors"
                  >
                    <RotateCcw size={14} />
                    <span>Clear Values</span>
                  </button>
                </div>
                
                <CustomDropdown
                  label="Shortlisted Institution"
                  icon={Building2}
                  value={selectedUniversity}
                  onChange={handleUniversityChange}
                  options={trackedUniversities.map(uni => ({
                    value: uni.id.toString(),
                    label: uni.name,
                    description: uni.location
                  }))}
                  disabled={trackedUniversities.length === 0}
                  placeholder={trackedUniversities.length === 0 ? "No programmes tracked yet" : "Select a university..."}
                />
                <p className="mt-4 text-xs text-slate-400 font-medium">Select a university to see costs for its specific location.</p>
                <div className="mt-2 text-[11px] text-slate-400/80 font-medium flex items-center gap-1.5 italic">
                  <Globe size={12} className="shrink-0" />
                  <span>Tip: Consult platforms like <a href="https://www.numbeo.com/cost-of-living/" target="_blank" rel="noopener noreferrer" className="hover:text-sapphire-500 underline decoration-slate-400/50 hover:decoration-sapphire-500 transition-all">Numbeo</a> for up-to-date city expense data.</span>
                </div>
              </div>
            )}

            {/* Category Editors */}
            <div className="space-y-4">
              {(activeTab === 'monthly' ? monthlyCategories : oneTimeCategories).map((cat) => {
                const Icon = cat.icon;
                const value = activeTab === 'monthly' ? monthlyCosts[cat.id] : oneTimeCosts[cat.id];
                return (
                  <div 
                    key={cat.id}
                    className="group glass p-6 rounded-3xl border border-white/50 dark:border-slate-800/50 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-5 mr-4 min-w-0">
                      <div className={`p-4 rounded-2xl ${cat.bgColor} ${cat.textColor} transition-transform group-hover:scale-110 duration-300 shrink-0`}>
                        <Icon size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{cat.label}</h3>
                        {cat.description ? (
                          <p className="text-xs text-slate-500 font-medium mt-1 leading-normal max-w-md">
                            {cat.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-sapphire-500/50 transition-all border border-transparent focus-within:bg-white dark:focus-within:bg-slate-900">
                        <span className="text-slate-500 font-bold mr-2">€</span>
                        <input 
                          type="number"
                          value={value}
                          onChange={(e) => handleCostChange(cat.id, e.target.value, activeTab)}
                          className="bg-transparent border-none outline-none w-20 text-right font-black text-slate-900 dark:text-white text-lg [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                        />
                      </div>
                      
                      {cat.isCustom && (
                        <button
                          onClick={() => handleRemoveCustomField(cat.id, activeTab)}
                          className="p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/40 shrink-0"
                          title="Remove expense field"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add Custom Field Button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setCustomFieldType(activeTab);
                    setNewFieldLabel('');
                    setNewFieldValue('');
                    setNewFieldDescription('');
                    setIsCustomFieldModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-sapphire-600 hover:border-sapphire-500/50 dark:hover:text-sapphire-400 dark:hover:border-sapphire-500/50 hover:bg-sapphire-50/50 dark:hover:bg-sapphire-900/10 transition-all font-bold w-full text-sm shadow-sm"
                >
                  <Plus size={16} />
                  <span>Add Custom {activeTab === 'monthly' ? 'Monthly' : 'One-time'} Expense</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="glass p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800/50 shadow-2xl overflow-hidden relative group">
              <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] transition-colors duration-700 ${activeTab === 'monthly' && isOver ? 'bg-rose-500/20' : 'bg-sapphire-500/20'}`}></div>
              
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 relative">
                {activeTab === 'monthly' ? 'Monthly Total' : 'Setup Total'}
              </h2>
              
              <div className="mb-8 relative">
                <div className="flex items-baseline space-x-1">
                  <span className="text-5xl font-black text-slate-900 dark:text-white">€{activeTab === 'monthly' ? totalMonthly : totalOneTime}</span>
                  {activeTab === 'monthly' && <span className="text-slate-500 font-bold text-lg">/mo</span>}
                </div>
                {activeTab === 'monthly' && (
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${isOver ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`}
                      style={{ width: `${Math.min((totalMonthly / 1500) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {activeTab === 'monthly' ? (
                <div className={`p-6 rounded-3xl mb-4 transition-colors duration-500 ${isOver ? 'bg-rose-50 dark:bg-rose-900/10 border border-rose-200/50 dark:border-rose-800/30' : 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30'}`}>
                  <div className="flex items-start space-x-3">
                    {isOver ? (
                      <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                    ) : (
                      <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                    )}
                    <div>
                      <p className={`font-bold text-sm ${isOver ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                        {isOver ? 'Exceeds Blocked Account' : 'Within Blocked Account'}
                      </p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Budget is €{Math.abs(diff)} {isOver ? 'more' : 'less'} than the €{BLOCKED_ACCOUNT_MONTHLY} monthly requirement.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-sapphire-50 dark:bg-sapphire-900/20 p-6 rounded-3xl mb-4 border border-sapphire-100 dark:border-sapphire-800/30">
                  <div className="flex items-center space-x-3 text-sapphire-600 dark:text-sapphire-400 mb-1">
                    <Info size={18} />
                    <p className="font-bold text-sm">Initial Investment</p>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    This represents the one-time costs needed before your studies begin.
                  </p>
                </div>
              )}

              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3 mb-2">
                  <Info size={16} className="text-sapphire-500" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Note</h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                  {activeTab === 'monthly' 
                    ? `The Sperrkonto requires €${BLOCKED_ACCOUNT_MONTHLY} monthly. Your budget helps plan if you need additional funds.`
                    : 'Rent deposits are usually 2-3 months of "cold rent" and are refundable at the end of your stay.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      {modalConfig.isOpen && (() => {
        const getGeneralModalIcon = () => {
          const title = (modalConfig.title || '').toLowerCase();
          const msg = (modalConfig.message || '').toLowerCase();
          if (title.includes('delete') || msg.includes('delete') || msg.includes('undone')) {
            return Trash2;
          }
          if (title.includes('success')) {
            return CheckCircle2;
          }
          if (modalConfig.type === 'prompt') {
            return Save;
          }
          if (modalConfig.type === 'confirm') {
            return AlertCircle;
          }
          return Info;
        };
        const ModalIcon = getGeneralModalIcon();

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[8px] animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm p-6 overflow-hidden rounded-[24px] bg-white/75 dark:bg-slate-900/75 backdrop-blur-[20px] border border-slate-200/40 dark:border-slate-800/40 shadow-2xl shadow-[0_0_50px_-12px_rgba(59,91,219,0.18)] dark:shadow-[0_0_50px_-12px_rgba(59,91,219,0.08)] animate-in zoom-in-95 duration-200 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-sapphire-50 dark:bg-sapphire-900/30 flex items-center justify-center text-sapphire-600 dark:text-sapphire-400 mb-4 border border-sapphire-100/20 shadow-sm shrink-0">
                <ModalIcon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center font-outfit">{modalConfig.title}</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 text-center max-w-xs">{modalConfig.message}</p>
              
              {modalConfig.type === 'prompt' && (
                <div className="w-full mb-6">
                  <input 
                    type="text" 
                    value={modalConfig.inputValue}
                    onChange={(e) => setModalConfig(prev => ({ ...prev, inputValue: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && modalConfig.inputValue.trim()) {
                        modalConfig.onConfirm(modalConfig.inputValue);
                      }
                    }}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-850 focus:border-sapphire-500 focus:ring-2 focus:ring-sapphire-500/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white font-bold outline-none transition-all text-center placeholder-slate-450"
                    placeholder="Budget name..."
                    autoFocus
                  />
                </div>
              )}
              
              <div className="flex items-center justify-center gap-3 w-full mt-2">
                {modalConfig.type !== 'alert' && (
                  <button 
                    onClick={modalConfig.onCancel}
                    className="flex-1 px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all active:scale-95 text-center text-sm"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={() => modalConfig.type === 'prompt' ? modalConfig.onConfirm(modalConfig.inputValue) : modalConfig.onConfirm()}
                  disabled={modalConfig.type === 'prompt' && !modalConfig.inputValue.trim()}
                  className="flex-1 px-6 py-2.5 rounded-xl font-bold bg-sapphire-600 hover:bg-sapphire-700 text-white transition-all shadow-lg shadow-sapphire-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-center text-sm"
                >
                  {modalConfig.type === 'alert' ? 'OK' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Custom Field Modal */}
      {isCustomFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[8px] animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm p-6 overflow-hidden rounded-[24px] bg-white/75 dark:bg-slate-900/75 backdrop-blur-[20px] border border-slate-200/40 dark:border-slate-800/40 shadow-2xl shadow-[0_0_50px_-12px_rgba(59,91,219,0.18)] dark:shadow-[0_0_50px_-12px_rgba(59,91,219,0.08)] animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-sapphire-50 dark:bg-sapphire-900/30 flex items-center justify-center text-sapphire-600 dark:text-sapphire-400 mb-4 border border-sapphire-100/20 shadow-sm shrink-0">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 font-outfit">Add Custom Expense</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
                Create a new custom category for your <span className="text-sapphire-500 font-bold">{customFieldType === 'monthly' ? 'monthly' : 'one-time'}</span> budget.
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Expense Name</label>
                <input 
                  type="text" 
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-sapphire-500 focus:ring-2 focus:ring-sapphire-500/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white font-bold outline-none transition-all placeholder-slate-400/60"
                  placeholder="e.g. German Language Course"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Initial Amount (€)</label>
                <input 
                  type="number" 
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-sapphire-500 focus:ring-2 focus:ring-sapphire-500/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white font-bold outline-none transition-all placeholder-slate-400/60"
                  placeholder="e.g. 150"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Description (Optional)</label>
                <textarea 
                  value={newFieldDescription}
                  onChange={(e) => setNewFieldDescription(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-sapphire-500 focus:ring-2 focus:ring-sapphire-500/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white font-bold outline-none transition-all resize-none h-20 placeholder-slate-400/60"
                  placeholder="e.g. Semester course fees or books"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 w-full mt-2">
              <button 
                onClick={() => setIsCustomFieldModalOpen(false)}
                className="flex-1 px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all active:scale-95 text-center text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCustomFieldSubmit}
                disabled={!newFieldLabel.trim()}
                className="flex-1 px-6 py-2.5 rounded-xl font-bold bg-sapphire-600 hover:bg-sapphire-700 text-white transition-all shadow-lg shadow-sapphire-600/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-center text-sm"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPlannerPage;
