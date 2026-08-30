import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, BookOpen, GraduationCap, Info, AlertTriangle, ChevronRight, BarChart3 } from 'lucide-react';
import CustomDropdown from '../components/UI/CustomDropdown';

const CATEGORIES = [
  "Mathematics (Analysis, Algebra, Stats)",
  "Theoretical Computer Science",
  "Programming & Software Engineering",
  "Natural / Engineering Sciences",
  "Seminars, Labs & Projects",
  "Electives / Interdisciplinary",
  "Thesis / Final Project"
];

const ALPHA_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

const ALPHA_TO_4 = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'F': 0.0
};

const CalculatorPage = () => {
  const [degreeYears, setDegreeYears] = useState(4);
  const [totalLocalCredits, setTotalLocalCredits] = useState(160);
  const [subjectGradeMode, setSubjectGradeMode] = useState('numeric');
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({
    name: '', credits: '', grade: '', alphaGrade: 'A', category: CATEGORIES[0]
  });

  const [cgpaScale, setCgpaScale] = useState('10-point');
  const [cgpaNMax, setCgpaNMax] = useState(10);
  const [cgpaNMin, setCgpaNMin] = useState(4);
  const [cgpaValue, setCgpaValue] = useState('');
  const [cgpaAlpha, setCgpaAlpha] = useState('A');

  const totalEcts = useMemo(() => (degreeYears || 0) * 60, [degreeYears]);
  const conversionFactor = useMemo(() => totalLocalCredits ? (totalEcts / totalLocalCredits) : 0, [totalEcts, totalLocalCredits]);

  const bavarianFormula = (grade, nMax, nMin) => {
    if (grade === null || grade === undefined || !nMax || nMin === undefined || nMax === nMin) return null;
    const g = parseFloat(grade);
    const max = parseFloat(nMax);
    const min = parseFloat(nMin);
    if (isNaN(g) || isNaN(max) || isNaN(min)) return null;
    const result = 1 + 3 * ((max - g) / (max - min));
    const capped = Math.max(1.0, Math.min(5.0, result));
    return Math.floor(capped * 10) / 10;
  };

  const cgpaOutOfBounds = useMemo(() => {
    if (cgpaScale === 'alpha' || cgpaValue === '') return false;
    const val = parseFloat(cgpaValue);
    const max = parseFloat(cgpaNMax);
    const min = parseFloat(cgpaNMin);
    if (isNaN(val) || isNaN(max) || isNaN(min)) return false;
    return val > max || val < min;
  }, [cgpaScale, cgpaValue, cgpaNMax, cgpaNMin]);

  const cgpaGermanGrade = useMemo(() => {
    if (cgpaScale === 'alpha') {
      const numeric = ALPHA_TO_4[cgpaAlpha];
      return bavarianFormula(numeric, 4.0, 0);
    }
    const val = parseFloat(cgpaValue);
    if (isNaN(val) || cgpaOutOfBounds) return null;
    return bavarianFormula(val, parseFloat(cgpaNMax), parseFloat(cgpaNMin));
  }, [cgpaScale, cgpaValue, cgpaAlpha, cgpaNMax, cgpaNMin, cgpaOutOfBounds]);

  const handleScaleChange = (scale) => {
    setCgpaScale(scale);
    if (scale === '10-point') { setCgpaNMax(10); setCgpaNMin(4); }
    else if (scale === '4-point') { setCgpaNMax(4); setCgpaNMin(0); }
    setCgpaValue('');
    setCgpaAlpha('A');
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.credits) return;
    setSubjects([...subjects, { ...newSubject, id: Date.now(), gradeMode: subjectGradeMode }]);
    setNewSubject({ ...newSubject, name: '', credits: '', grade: '', alphaGrade: 'A' });
  };

  const summaryByCategory = useMemo(() => {
    const summary = {};
    CATEGORIES.forEach(cat => summary[cat] = 0);
    subjects.forEach(sub => {
      const ects = parseFloat(sub.credits) * conversionFactor;
      if (!isNaN(ects)) summary[sub.category] += ects;
    });
    return summary;
  }, [subjects, conversionFactor]);

  const getGradeColor = (g) => {
    if (g <= 1.5) return 'text-emerald-500';
    if (g <= 2.5) return 'text-emerald-600';
    if (g <= 3.5) return 'text-gold-600';
    return 'text-rose-500';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 bg-sapphire-50 dark:bg-sapphire-900/30 px-4 py-2 rounded-full border border-sapphire-100 dark:border-sapphire-800 mb-4">
            <Calculator className="w-4 h-4 text-sapphire-500" />
            <span className="text-sapphire-700 dark:text-sapphire-300 text-xs font-bold tracking-widest uppercase">Academic Precision Tool</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight">
            ECTS & Grade <span className="text-sapphire-500">Calculator</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Convert your local grades and credits to German academic standards.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Side: Configuration & Formula */}
          <div className="lg:col-span-4 space-y-8">

            {/* ECTS Config */}
            <div className="glass p-8 rounded-2xl border-l-4 border-l-sapphire-500">
              <div className="flex items-center space-x-3 mb-6">
                <BookOpen className="w-6 h-6 text-sapphire-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">Credit Conversion</h2>
              </div>
              <div className="space-y-5">
                <div className="w-full h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[20px] border border-slate-200/50 dark:border-slate-800/50 rounded-xl px-4 flex flex-col justify-center transition-all duration-300 focus-within:border-sapphire-500/50 focus-within:ring-2 focus-within:ring-sapphire-500/10 shadow-[0_0_20px_-5px_rgba(59,91,219,0.06)] dark:shadow-[0_0_25px_-5px_rgba(59,91,219,0.02)]">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Length of Degree (Years)</label>
                  <input
                    type="number"
                    value={degreeYears}
                    onChange={(e) => setDegreeYears(parseFloat(e.target.value) || '')}
                    className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white text-base font-semibold focus:ring-0 focus:outline-none mt-0.5"
                  />
                </div>
                <div className="w-full h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[20px] border border-slate-200/50 dark:border-slate-800/50 rounded-xl px-4 flex flex-col justify-center transition-all duration-300 focus-within:border-sapphire-500/50 focus-within:ring-2 focus-within:ring-sapphire-500/10 shadow-[0_0_20px_-5px_rgba(59,91,219,0.06)] dark:shadow-[0_0_25px_-5px_rgba(59,91,219,0.02)]">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Total Local Credits</label>
                  <input
                    type="number"
                    value={totalLocalCredits}
                    onChange={(e) => setTotalLocalCredits(parseFloat(e.target.value) || '')}
                    className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white text-base font-semibold focus:ring-0 focus:outline-none mt-0.5"
                  />
                </div>
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Equivalent</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalEcts} ECTS</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Factor</p>
                    <p className="text-lg font-bold text-sapphire-500">{conversionFactor.toFixed(2)}x</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bavarian Formula */}
            <div className="glass p-8 rounded-2xl border-l-4 border-l-gold-500">
              <div className="flex items-center space-x-3 mb-6">
                <GraduationCap className="w-6 h-6 text-gold-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">Bavarian Formula</h2>
              </div>
              <div className="space-y-5">
                <CustomDropdown
                  label="Grading Scale"
                  value={cgpaScale}
                  onChange={e => handleScaleChange(e.target.value)}
                  options={[
                    { value: '10-point', label: '10-Point Scale' },
                    { value: '4-point', label: '4-Point GPA' },
                    { value: 'alpha', label: 'Alphabetical (A-F)' }
                  ]}
                />

                {cgpaScale !== 'alpha' ? (
                  <div className="animate-fade-in w-full h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[20px] border border-slate-200/50 dark:border-slate-800/50 rounded-xl px-4 flex flex-col justify-center transition-all duration-300 focus-within:border-gold-500/50 focus-within:ring-2 focus-within:ring-gold-500/10 shadow-[0_0_20px_-5px_rgba(59,91,219,0.06)] dark:shadow-[0_0_25px_-5px_rgba(59,91,219,0.02)] relative">
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Your CGPA</label>
                    <input
                      type="number"
                      value={cgpaValue}
                      onChange={e => setCgpaValue(e.target.value)}
                      placeholder={`Range: ${cgpaNMin} - ${cgpaNMax}`}
                      className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white text-base font-semibold focus:ring-0 focus:outline-none mt-0.5"
                    />
                    {cgpaOutOfBounds && (
                      <span className="absolute right-4 text-rose-500 text-[9px] font-black uppercase tracking-wider">
                        Out of scale
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <CustomDropdown
                      label="Your Letter Grade"
                      value={cgpaAlpha}
                      onChange={e => setCgpaAlpha(e.target.value)}
                      options={ALPHA_GRADES}
                    />
                  </div>
                )}

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                  {cgpaGermanGrade ? (
                    <div className="animate-scale-in">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">German Grade</p>
                      <p className={`text-5xl font-black ${getGradeColor(cgpaGermanGrade)}`}>{cgpaGermanGrade.toFixed(1)}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm italic py-4">Enter CGPA to convert</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Side: Transcript & Analysis */}
          <div className="lg:col-span-8 space-y-8">

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-6 rounded-2xl flex items-start space-x-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-amber-800 dark:text-amber-300 font-bold text-sm mb-1 uppercase tracking-tight">Important Notice</h4>
                <p className="text-amber-700 dark:text-amber-400 text-sm leading-relaxed">
                  Please note that these converted figures are approximations meant to assist with your academic planning. The final, official assessment of your eligibility will be conducted and determined exclusively by the university's examination committee. This platform accepts no responsibility or liability regarding the final outcome of your application or academic assessment.                </p>
              </div>
            </div>

            {/* Add Subject Form */}
            <div className="glass p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">Add Course to Transcript</h2>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button onClick={() => setSubjectGradeMode('numeric')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${subjectGradeMode === 'numeric' ? 'bg-white dark:bg-slate-700 text-sapphire-500 shadow-sm' : 'text-slate-500'}`}>Numeric</button>
                  <button onClick={() => setSubjectGradeMode('alpha')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${subjectGradeMode === 'alpha' ? 'bg-white dark:bg-slate-700 text-sapphire-500 shadow-sm' : 'text-slate-500'}`}>A-F</button>
                </div>
              </div>

               <form onSubmit={handleAddSubject} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 w-full h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[20px] border border-slate-200/50 dark:border-slate-800/50 rounded-xl px-4 flex flex-col justify-center transition-all duration-300 focus-within:border-sapphire-500/50 focus-within:ring-2 focus-within:ring-sapphire-500/10 shadow-[0_0_20px_-5px_rgba(59,91,219,0.06)] dark:shadow-[0_0_25px_-5px_rgba(59,91,219,0.02)]">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={newSubject.name}
                    onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="e.g. Algorithms & Complexity"
                    className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white text-base font-semibold focus:ring-0 focus:outline-none mt-0.5"
                  />
                </div>
                <div className="w-full h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[20px] border border-slate-200/50 dark:border-slate-800/50 rounded-xl px-4 flex flex-col justify-center transition-all duration-300 focus-within:border-sapphire-500/50 focus-within:ring-2 focus-within:ring-sapphire-500/10 shadow-[0_0_20px_-5px_rgba(59,91,219,0.06)] dark:shadow-[0_0_25px_-5px_rgba(59,91,219,0.02)]">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Local Credits</label>
                  <input
                    type="number"
                    required
                    value={newSubject.credits}
                    onChange={e => setNewSubject({ ...newSubject, credits: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white text-base font-semibold focus:ring-0 focus:outline-none mt-0.5"
                  />
                </div>
                 <CustomDropdown
                   label="Category"
                   value={newSubject.category}
                   onChange={e => setNewSubject({ ...newSubject, category: e.target.value })}
                   options={CATEGORIES.map(cat => {
                     const parts = cat.split(' (');
                     if (parts.length > 1) {
                       return {
                         value: cat,
                         label: parts[0],
                         description: parts[1].replace(')', '')
                       };
                     }
                     return { value: cat, label: cat };
                   })}
                 />
                <div className="flex flex-col">
                  {subjectGradeMode === 'numeric' ? (
                    <div className="w-full h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[20px] border border-slate-200/50 dark:border-slate-800/50 rounded-xl px-4 flex flex-col justify-center transition-all duration-300 focus-within:border-sapphire-500/50 focus-within:ring-2 focus-within:ring-sapphire-500/10 shadow-[0_0_20px_-5px_rgba(59,91,219,0.06)] dark:shadow-[0_0_25px_-5px_rgba(59,91,219,0.02)]">
                      <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">Grade</label>
                      <input type="number" required step="0.01" value={newSubject.grade} onChange={e => setNewSubject({ ...newSubject, grade: e.target.value })} className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white text-base font-semibold focus:ring-0 focus:outline-none mt-0.5" />
                    </div>
                  ) : (
                    <CustomDropdown
                      label="Grade"
                      value={newSubject.alphaGrade}
                      onChange={e => setNewSubject({ ...newSubject, alphaGrade: e.target.value })}
                      options={ALPHA_GRADES}
                    />
                  )}
                </div>
                <div className="flex items-start">
                  <button type="submit" className="btn-primary w-full h-16 rounded-xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform">
                    <Plus className="w-5 h-5 animate-pulse" />
                    <span className="font-bold tracking-tight">Add Course</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Transcript Table */}
            <div className="glass rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-sapphire-500" />
                  <h2 className="font-bold text-slate-900 dark:text-white font-outfit">Transcript Analysis</h2>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{subjects.length} Courses</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4 text-center">Local CR</th>
                      <th className="px-6 py-4 text-center text-sapphire-500">ECTS</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-sapphire-50/30 dark:hover:bg-sapphire-900/10 transition-colors group/row">
                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{sub.name}</p>
                          <p className="text-[10px] text-slate-400">{sub.gradeMode === 'alpha' ? sub.alphaGrade : sub.grade} Grade</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{sub.category.split('(')[0]}</span>
                        </td>
                        <td className="px-6 py-5 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">{sub.credits}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 bg-sapphire-50 dark:bg-sapphire-900/30 text-sapphire-600 dark:text-sapphire-400 rounded-lg font-bold text-sm">
                            {(parseFloat(sub.credits) * conversionFactor).toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))} className="text-rose-500 opacity-0 group-hover/row:opacity-100 hover:scale-110 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {subjects.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                          Your transcript is empty. Add courses above to start analysis.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Breakdown */}
            {subjects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="glass p-8 rounded-2xl">
                  <h3 className="font-bold text-slate-900 dark:text-white font-outfit mb-6">Subject Breakdown</h3>
                  <div className="space-y-4">
                    {CATEGORIES.map(cat => (
                      summaryByCategory[cat] > 0 && (
                        <div key={cat}>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-500 truncate pr-4">{cat.split('(')[0]}</span>
                            <span className="text-sapphire-500">{summaryByCategory[cat].toFixed(1)} ECTS</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sapphire-500 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, (summaryByCategory[cat] / 30) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
                <div className="glass p-8 rounded-2xl bg-sapphire-500 text-white flex flex-col justify-center items-center text-center">
                  <img
                    src="/logo.png"
                    alt="Gradbahn"
                    className="w-16 h-16 mb-4 object-contain brightness-0 invert opacity-80"
                  />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Evaluation</p>
                  <p className="text-6xl font-black mb-2">
                    {subjects.reduce((sum, s) => sum + (parseFloat(s.credits || 0) * conversionFactor), 0).toFixed(0)}
                  </p>
                  <p className="text-lg font-bold opacity-80">Total ECTS Equivalent</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
