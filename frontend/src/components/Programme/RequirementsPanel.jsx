import React from 'react';
import { 
  Layers, AlertCircle, CheckCircle2, ChevronRight, 
  HelpCircle, GraduationCap, Scale, FileText, Sparkles, BookOpen,
  Binary, Terminal, Cpu, Code2
} from 'lucide-react';

const getDomainConfig = (key) => {
  const normalizedKey = key.toLowerCase();
  switch (normalizedKey) {
    case 'math':
    case 'mathematics':
      return {
        name: 'Mathematics',
        icon: Binary,
        gradient: 'from-indigo-500 to-purple-500',
        bgColor: 'bg-indigo-500/10',
        iconColor: 'text-indigo-500',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
      };
    case 'cs':
    case 'computer_science':
      return {
        name: 'Computer Science',
        icon: Terminal,
        gradient: 'from-sapphire-500 to-blue-500',
        bgColor: 'bg-sapphire-500/10',
        iconColor: 'text-sapphire-500',
        badgeColor: 'bg-sapphire-500/10 text-sapphire-600 dark:text-sapphire-400'
      };
    case 'theoretical_cs':
    case 'theoretical_computer_science':
      return {
        name: 'Theoretical Computer Science',
        icon: Cpu,
        gradient: 'from-amber-500 to-gold-500',
        bgColor: 'bg-gold-500/10',
        iconColor: 'text-gold-500',
        badgeColor: 'bg-gold-500/10 text-gold-600 dark:text-gold-400'
      };
    case 'practical_cs':
    case 'practical_computer_science':
      return {
        name: 'Practical Computer Science',
        icon: Code2,
        gradient: 'from-emerald-500 to-teal-500',
        bgColor: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      };
    default:
      return {
        name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        icon: HelpCircle,
        gradient: 'from-slate-500 to-slate-600',
        bgColor: 'bg-slate-500/10',
        iconColor: 'text-slate-500',
        badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
      };
  }
};

const RequirementsPanel = ({ programme }) => {
  const reqs = programme.requirements || {};
  const hasCustomReqs = Object.keys(reqs).length > 0;
  
  // Detect standardized schema
  const isStandardized = reqs.assessment_type !== undefined;

  const renderStandardized = () => {
    const { assessment_type, quantitative = {}, qualitative = {}, contingencies = {} } = reqs;
    const ectsThresholds = quantitative.ects_thresholds || {};
    const pillars = qualitative.core_reference_pillars || [];
    const hasValidThresholds = Object.values(ectsThresholds).some(
      (val) => val !== null && val !== undefined && val > 0
    );

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Assessment Type & AI Evaluation Summary Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-sapphire-500/5 to-gold-500/5 dark:from-sapphire-900/10 dark:to-gold-900/10 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
          <div className="flex items-center space-x-3">
            <Scale className="w-5 h-5 text-sapphire-500" />
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Assessment Strategy</span>
              <span className={`inline-block px-2.5 py-0.5 mt-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                assessment_type === 'QUANTITATIVE' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : assessment_type === 'QUALITATIVE'
                  ? 'bg-gold-500/10 text-gold-600 dark:text-gold-400'
                  : 'bg-sapphire-500/10 text-sapphire-600 dark:text-sapphire-400'
              }`}>
                {assessment_type}
              </span>
            </div>
          </div>
          
          {(assessment_type === 'QUALITATIVE' || assessment_type === 'HYBRID') && (
            <div className="flex items-center space-x-2 bg-gold-500/10 text-gold-600 dark:text-gold-400 px-3.5 py-1.5 rounded-xl border border-gold-500/20 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-gold-500 animate-pulse" />
              <span>Gemini Equivalence Matrix Active</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quantitative Criteria */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center">
              <GraduationCap className="w-4 h-4 mr-1.5 text-sapphire-500" /> Quantitative Constraints
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">German Grade Boundary</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {quantitative.min_gpa_german_scale 
                    ? `≤ ${quantitative.min_gpa_german_scale} (German scale)` 
                    : programme.min_gpa_german_scale
                    ? `≤ ${programme.min_gpa_german_scale} (German scale)`
                    : 'Flexible Grade Boundary'}
                </p>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Credits Required</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {quantitative.total_ects_required 
                    ? `${quantitative.total_ects_required} ECTS` 
                    : programme.total_ects_required
                    ? `${programme.total_ects_required} ECTS`
                    : 'No overall limit'}
                </p>
              </div>
            </div>

            {/* ECTS Thresholds Sub-object */}
            {hasValidThresholds && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-200/50 dark:border-slate-800 pb-2">
                  ECTS Thresholds by Domain
                </p>
                <div className="space-y-4">
                  {Object.entries(ectsThresholds).map(([key, val]) => {
                    if (val === null || val === undefined || val <= 0) return null;
                    
                    const domainConfig = getDomainConfig(key);
                    const IconComponent = domainConfig.icon;
                    
                    return (
                      <div key={key} className="group/item">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-lg ${domainConfig.bgColor} transition-transform duration-300 group-hover/item:scale-110`}>
                              <IconComponent className={`w-3.5 h-3.5 ${domainConfig.iconColor}`} />
                            </div>
                            <span className="group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors duration-300">
                              {domainConfig.name}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${domainConfig.badgeColor}`}>
                            {val} ECTS
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner relative group-hover/item:ring-1 group-hover/item:ring-slate-300 dark:group-hover/item:ring-slate-700 transition-all duration-300">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${domainConfig.gradient} transition-all duration-1000 ease-out`}
                            style={{ width: `${Math.min((val / 60) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Qualitative & Contingency Criteria */}
          <div className="space-y-6">
            {/* Semantic Pillars */}
            {pillars.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                  <BookOpen className="w-4 h-4 mr-1.5 text-sapphire-500" /> Syllabus Core Pillars
                </h4>
                <div className="flex flex-wrap gap-2">
                  {pillars.map((pillar, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1.5 bg-sapphire-50 dark:bg-sapphire-950/40 border border-sapphire-100/50 dark:border-sapphire-900/50 rounded-xl text-xs font-bold text-sapphire-600 dark:text-sapphire-400"
                    >
                      {pillar}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vague Equivalence Clause Block */}
            {qualitative.has_vague_equivalence_clause && (
              <div className="p-5 bg-gold-500/5 dark:bg-gold-500/10 border border-gold-500/20 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-gold-600 dark:text-gold-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-widest">Equivalence Clause Identified</span>
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 italic bg-white/40 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                  "{qualitative.equivalence_statement_raw}"
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                  *The university utilizes non-quantifiable degree match requirements. We recommend uploading your syllabus in the Calculator to trigger an automated LLM compatibility matching check.
                </p>
              </div>
            )}

            {/* Contingencies */}
            {contingencies.allows_conditional_admission && (
              <div className="p-5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-widest">Admission Contingencies</span>
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Allows Conditional Admission (Deficit: up to {contingencies.max_conditional_ects || 'flexible'} ECTS)
                </div>
                {contingencies.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Note: {contingencies.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLegacy = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fadeIn">
        {/* General Requirements */}
        <div className="space-y-6">
          <div className="p-6 bg-sapphire-50 dark:bg-sapphire-900/20 rounded-2xl border border-sapphire-100 dark:border-sapphire-800/30">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-sapphire-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-sapphire-600 dark:text-sapphire-400 uppercase tracking-widest mb-1">GPA Requirement</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Minimum Grade: {programme.min_gpa_german_scale ? `Better than ${programme.min_gpa_german_scale}` : 'Flexible / No fixed NC'}
                </p>
              </div>
            </div>
          </div>

          {programme.total_ects_required && (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total ECTS</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {programme.total_ects_required} Credits Required
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Requirements List */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Specific Criteria</h4>
          
          {hasCustomReqs ? (
            <ul className="space-y-4">
              {Object.entries(reqs).map(([key, value]) => (
                <li key={key} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 italic">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span>No specific modular requirements listed.</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="glass rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-800/30">
        <Layers className="w-6 h-6 text-sapphire-500" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight">Admission Requirements</h3>
      </div>
      
      <div className="p-8">
        {isStandardized ? renderStandardized() : renderLegacy()}
      </div>
    </div>
  );
};

export default RequirementsPanel;
