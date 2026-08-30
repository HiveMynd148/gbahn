import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  School,
  UserCheck,
  Calculator,
  Globe,
  Calendar,
  CreditCard,
  ArrowRight,
  ChevronRight,
  Verified,
  Lock,
  MessageSquare,
  Search,
  BookOpen,
  Info,
  Building2,
  ShieldCheck,
  FileText,
  Home,
  Briefcase,
  Clock,
  Coins,
  Key,
  Users,
  HeartPulse,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

const Tag = ({ type }) => {
  const styles = {
    Institution: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-400/30',
    Document: 'bg-sapphire-50 dark:bg-sapphire-900/20 text-sapphire-600 dark:text-sapphire-400 border-sapphire-100 dark:border-sapphire-400/30',
    Administrative: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600',
    Examination: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-400/30',
    Visa: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-400/30',
    Mandatory: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-400/30',
    Work: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-400/30',
    Optional: 'bg-slate-50 dark:bg-slate-900/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  };

  return (
    <div className={`w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${styles[type] || styles['Administrative']} mb-3`}>
      {type}
    </div>
  );
};

const InfoPage = () => {
  const [activeSection, setActiveSection] = useState('section-1');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-8', 'section-9', 'section-10'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    { id: 'section-1', label: 'Institutions', icon: Building2 },
    { id: 'section-2', label: 'Application Portals', icon: School },
    { id: 'section-3', label: 'Admission Types', icon: UserCheck },
    { id: 'section-4', label: 'Academic Docs', icon: BookOpen },
    { id: 'section-5', label: 'Language', icon: Globe },
    { id: 'section-6', label: 'Enrollment', icon: Calendar },
    { id: 'section-7', label: 'Financials', icon: CreditCard },
    { id: 'section-8', label: 'Visa & Bureaucracy', icon: ShieldCheck },
    { id: 'section-9', label: 'Housing & Living', icon: Home },
    { id: 'section-10', label: 'Student Employment', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-sapphire-100 selection:text-sapphire-900 transition-colors duration-500">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-72 border-r border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl hidden lg:flex flex-col p-8 z-30 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
        <div className="mb-12">
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-sapphire-500 font-outfit">Academic Guide</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Academic Terms Made Simple</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {sections.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${activeSection === id
                ? 'bg-sapphire-500 text-white shadow-lg shadow-sapphire-500/20 translate-x-1'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-sapphire-900 dark:hover:text-white'
                }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeSection === id ? 'text-white' : 'text-slate-400'}`} />
              <span className="text-sm font-bold">{label}</span>
            </a>
          ))}
        </nav>

        {/* <div className="pt-8 border-t border-slate-100">
          <button className="w-full py-4 bg-sapphire-900 text-white rounded-2xl font-bold hover:bg-sapphire-800 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4 text-gold-500" />
            Contact Advisor
          </button>
        </div> */}
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen px-6 sm:px-12 py-16 max-w-6xl mx-auto">

        {/* Section 1: Types of Institutions */}
        <section id="section-1" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
            <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-24 overflow-hidden">
              <Building2 className="w-80 h-80 text-white translate-x-20 translate-y-20 rotate-6" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Types of Institutions</h2>
              <p className="text-slate-200 max-w-2xl text-lg font-medium leading-relaxed">Understanding the structural differences between German academic environments is critical for technical fields.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-sapphire-100 rounded-2xl flex items-center justify-center mb-6">
                <School className="w-6 h-6 text-sapphire-500" />
              </div>
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">Universität (Uni)</h3>
              <Tag type="Institution" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Research-oriented universities emphasizing theoretical knowledge and independent academic research. They possess the traditional, unrestricted right to confer doctoral degrees (Promotionsrecht) and postdoctoral qualifications (Habilitation).</p>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gold-100 rounded-2xl flex items-center justify-center mb-6">
                <Calculator className="w-6 h-6 text-gold-600" />
              </div>
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">Technische Universität (TU)</h3>
              <Tag type="Institution" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">A specialized subset of research universities focusing primarily on engineering, natural sciences, and technology. Like traditional universities, they possess the full independent right to confer doctoral degrees and postdoctoral qualifications, maintaining a highly rigorous, theoretical, and research-driven methodology.</p>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">Fachhochschule (FH / UAS)</h3>
              <Tag type="Institution" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Institutions focused on practical, application-oriented education. Curricula are tightly integrated with industry requirements and frequently include mandatory practical semesters (Praxissemester). While they traditionally lacked the independent right to confer doctoral degrees, an increasing number of German federal states now grant the independent right to award doctorates directly to highly research-intensive FH faculties.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Application Portals */}
        <section id="section-2" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-sapphire-900 via-sapphire-800 to-slate-900">
            <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-24 overflow-hidden">
              <School className="w-80 h-80 text-white translate-x-20 translate-y-20 rotate-12" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Application Portals & Organizations</h2>
              <p className="text-sapphire-100 max-w-2xl text-lg font-medium leading-relaxed">Navigating the central gateways to German higher education requires understanding the specific agencies managing your data.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-white">
            {/* uni-assist Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-800 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white/10">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white font-outfit">uni-assist</h3>
                  <a href="https://www.uni-assist.de/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                <div className="w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white border border-white/30 mb-4">
                  Platform
                </div>
                <p className="text-amber-50 text-sm leading-relaxed mb-6 flex-1">Uni-assist is the central evaluation agency for international certificates. While many German universities utilize it to assess foreign credentials and convert grades, others require direct applications via specific academic portals.</p>
                <a href="https://www.uni-assist.de/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1 hover:underline">
                  Official Website <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            </div>

            {/* DAAD Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#003366] to-[#0055aa] p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white/10">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white font-outfit">DAAD</h3>
                  <a href="https://www.daad.de/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                <div className="w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white border border-white/30 mb-4">
                  Institution
                </div>
                <p className="text-sapphire-50 text-sm leading-relaxed mb-6 flex-1">The German Academic Exchange Service (DAAD) is a prominent funding organization promoting international academic relations. It supports students primarily through prestigious scholarships and comprehensive databases.</p>
                <a href="https://www.daad.de/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1 hover:underline">
                  Official Website <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <div className="absolute bottom-0 right-0 w-36 h-36 bg-white/5 rounded-full -mr-16 -mb-16 blur-3xl"></div>
            </div>

            {/* Hochschulstart Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#e11d48] to-[#003366] p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white/10">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white font-outfit">Hochschulstart</h3>
                  <a href="https://www.hochschulstart.de/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                <div className="w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white border border-white/30 mb-4">
                  Platform
                </div>
                <p className="text-rose-50 text-sm leading-relaxed mb-6 flex-1">The central admission coordination platform. It is almost exclusively designed for Bachelor's degrees and highly regulated state-examination subjects (Medicine, Pharmacy, Dentistry, and Law), managing nationwide restrictions via DoSV.</p>
                <a href="https://www.hochschulstart.de/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1 hover:underline">
                  Official Website <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <div className="absolute top-0 right-0 w-36 h-36 bg-rose-400/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* Section 3: Admission Types */}
        <section id="section-3" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-gold-700 via-gold-600 to-gold-700">
            <div className="absolute inset-0 opacity-20 flex items-center justify-end pr-24 overflow-hidden">
              <Verified className="w-80 h-80 text-white translate-x-20 translate-y-10 -rotate-6" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Admission Types & Evaluation</h2>
              <p className="text-gold-50 max-w-2xl text-lg font-medium leading-relaxed">Understanding your status and the requirements for entry into specific faculty programs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gold-50/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-[2rem] border border-gold-200/60 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity">
                <Verified className="w-36 h-36 text-sapphire-900 dark:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">VPD</h3>
              <div className="flex gap-2">
                <Tag type="Document" />
                <Tag type="Optional" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">A preliminary review document issued by uni-assist. It validates credentials and establishes grade equivalents. Only required by specific universities; always verify institutional requirements before applying.</p>
            </div>

            <div className="bg-rose-50/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-[2rem] border border-rose-200/60 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity">
                <Lock className="w-36 h-36 text-sapphire-900 dark:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">NC (Numerus Clausus)</h3>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Meaning "closed number," it denotes localized or national admission capacity restrictions. It is the grade of the last admitted applicant in a cycle, fluctuating based on supply and demand.</p>
            </div>

            <div className="bg-emerald-50/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-[2rem] border border-emerald-200/60 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity">
                <UserCheck className="w-36 h-36 text-sapphire-900 dark:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Zulassungsfrei</h3>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Programs without admission capacity restrictions. Applicants who fulfill minimum entrance requirements are guaranteed enrollment without competing against the pool.</p>
            </div>

            <div className="bg-sapphire-50/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-[2rem] border border-sapphire-200/60 dark:border-slate-700/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity">
                <Search className="w-36 h-36 text-sapphire-900 dark:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">EFV</h3>
              <Tag type="Examination" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">An aptitude assessment procedure. Universities utilize this to evaluate if an applicant possesses the specific foundational knowledge and skills required for a particular program.</p>
            </div>

            <div className="md:grid-cols-2 bg-emerald-200 dark:bg-emerald-900 backdrop-blur-md p-8 rounded-[2rem] border border-indigo-200/60 dark:border-slate-700/60 shadow-sm relative overflow-hidden group md:col-span-2">
              <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity">
                <ShieldCheck className="w-36 h-36 text-sapphire-900 dark:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Zulassungsbescheid / Ablehnungsbescheid</h3>
              <Tag type="Document" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">The legally binding notification of admission (Zulassungsbescheid) or rejection (Ablehnungsbescheid) issued by a higher education institution following the application review process.</p>
            </div>
          </div>

        </section>

        <section id="section-4" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
            <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-24 overflow-hidden">
              <div className="absolute bottom-0 right-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:40px_40px]"></div>
              <BookOpen className="w-80 h-80 text-white translate-x-20 translate-y-20 rotate-45" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Academic Documents & Equivalencies</h2>
              <p className="text-slate-300 max-w-2xl text-lg font-medium leading-relaxed">The paperwork required to validate your previous education within the European Higher Education Area.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="bg-sapphire-50/50 dark:bg-slate-800/50 backdrop-blur-md p-10 rounded-[2.5rem] border border-sapphire-200/60 dark:border-slate-700/60 shadow-sm group flex flex-col">
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">HZB</h3>
              <Tag type="Document" />
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed flex-1">The higher education entrance qualification. For international applicants, it represents the formal assessment of whether a foreign school-leaving certificate or prior university study is legally equivalent to the German Abitur, thereby determining eligibility for admission to German higher education institutions.</p>
            </div>

            <div className="bg-sapphire-50/50 dark:bg-slate-800/50 backdrop-blur-md p-10 rounded-[2.5rem] border border-sapphire-200/60 dark:border-slate-700/60 shadow-sm group flex flex-col">
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">ECTS System</h3>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-1">The standard framework used across Europe to quantify workload. One full academic year corresponds to 60 ECTS credits, with one credit typically representing 25 to 30 hours of academic work.</p>
              <Link to="/calculator" className="flex items-center gap-2 text-xs font-black text-sapphire-400 uppercase tracking-widest group-hover:gap-3 transition-all">
                Convert your Credits to ECTS <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md flex flex-col">
              <h4 className="text-xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Diploma Supplement</h4>
              <div className="flex gap-2">
                <Tag type="Document" />
                <Tag type="Optional" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">A standardized document accompanying a higher education diploma, providing a detailed description of the nature, level, context, content, and status of the studies completed.</p>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md flex flex-col">
              <h4 className="text-xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Studienkolleg</h4>
              <Tag type="Institution" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">A preparatory college for international applicants whose secondary educational qualifications do not grant direct entry. It concludes with the assessment test (Feststellungsprüfung or FSP).</p>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-sm group transition-all hover:shadow-md flex flex-col">
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Modulhandbuch</h3>
              <Tag type="Document" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 flex-1">A detailed and formally structured academic catalog outlining a degree program’s curriculum, including learning objectives, course content, ECTS credit allocation, teaching methods, and examination formats. It provides a comprehensive overview of the academic structure and expected competencies of a program. During master’s admissions, it is carefully reviewed to assess whether an applicant’s prior studies are academically comparable and sufficiently aligned with the specific subject requirements of the intended degree program.</p>
              {/* <Link to="/calculator" className="flex items-center gap-2 text-xs font-black text-sapphire-400 uppercase tracking-widest group-hover:gap-3 transition-all">
                Run ECTS Audit <ChevronRight className="w-4 h-4" />
              </Link> */}
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md flex flex-col">
              <h4 className="text-xl font-bold mb-1 font-outfit flex items-center gap-2">
                APS (Akademische Prüfstelle)
              </h4>
              <div className="flex flex-nowrap gap-2 mb-3">
                <Tag type="Mandatory" />
                <Tag type="Visa" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">
                An academic evaluation center in specific countries (India, China, Vietnam). It verifies the authenticity of academic documents and issues a certificate that is strictly required for both university admission and the visa application.                <span className="block mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-900/50 font-medium text-amber-700 dark:text-amber-400">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-amber-800 dark:text-amber-300">India Alert:</span>
                  </span>
                  <span className="block mt-2">Starting March 15, 2026, a strict 70% minimum overall marks requirement in Class XII applies for undergraduate applicants (Studienkolleg or direct Bachelor) for the Winter 2026/27 intake.</span>
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Language Requirements */}
        <section id="section-5" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700">
            <div className="absolute inset-0 opacity-10 flex items-center justify-center">
              <Globe className="w-64 h-64 text-white" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Language Requirements</h2>
              <p className="text-emerald-50 max-w-2xl text-lg font-medium leading-relaxed">Proven proficiency in the language of instruction is non-negotiable for enrollment.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-sapphire-50/40 dark:bg-slate-800/40 backdrop-blur-md p-10 rounded-[2.5rem] border-2 border-sapphire-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-8 font-outfit flex items-center gap-3">
                <div className="w-10 h-10 bg-sapphire-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-sapphire-500" />
                </div>
                German Proficiency
              </h3>
              <div className="space-y-4">
                <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-[2rem] border border-sapphire-100/30 dark:border-slate-700/30 transition-all hover:bg-white/60 dark:hover:bg-slate-700/50">
                  <h4 className="text-lg font-bold text-sapphire-900 dark:text-white mb-1">TestDAF</h4>
                  <Tag type="Examination" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">A standardized language test recognized by all German institutions. Admission generally requires a minimum score of TDN 4 in all four testing sections.</p>
                </div>
                <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-[2rem] border border-sapphire-100/30 dark:border-slate-700/30 transition-all hover:bg-white/60 dark:hover:bg-slate-700/50">
                  <h4 className="text-lg font-bold text-sapphire-900 dark:text-white mb-1">DSH</h4>
                  <Tag type="Examination" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">A university-specific German language examination, typically administered on-site. DSH-2 is the standard proficiency level required for matriculation into German-taught programs.</p>
                </div>
                <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-[2rem] border border-sapphire-100/30 dark:border-slate-700/30 transition-all hover:bg-white/60 dark:hover:bg-slate-700/50">
                  <h4 className="text-lg font-bold text-sapphire-900 dark:text-white mb-1">Goethe Zertifikat</h4>
                  <Tag type="Examination" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">General certificates issued by the Goethe-Institut. For university admission, the C2 level (GDS) is universally accepted, while some institutions may permit C1.</p>
                </div>
              </div>
            </div>

            <div className="bg-gold-50/40 dark:bg-slate-800/40 backdrop-blur-md p-10 rounded-[2.5rem] border-2 border-gold-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-8 font-outfit flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-gold-600" />
                </div>
                English Proficiency
              </h3>
              <div className="space-y-4">
                <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-[2rem] border border-gold-100/30 dark:border-slate-700/30 transition-all hover:bg-white/60 dark:hover:bg-slate-700/50">
                  <h4 className="text-lg font-bold text-sapphire-900 dark:text-white mb-1">IELTS Academic</h4>
                  <Tag type="Examination" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">A widely accepted English test. Institutional requirements commonly range from an IELTS band of 6.5 or a TOEFL iBT score of 80–100.</p>
                </div>
                <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-[2rem] border border-gold-100/30 dark:border-slate-700/30 transition-all hover:bg-white/60 dark:hover:bg-slate-700/50">
                  <h4 className="text-lg font-bold text-sapphire-900 dark:text-white mb-1">TOEFL iBT</h4>
                  <Tag type="Examination" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">Standardized English proficiency examinations required for English-taught programs. TOEFL iBT requirements commonly range from 80–100 points.</p>
                </div>
                <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-[2rem] border border-gold-100/30 dark:border-slate-700/30 transition-all hover:bg-white/60 dark:hover:bg-slate-700/50">
                  <h4 className="text-lg font-bold text-sapphire-900 dark:text-white mb-1">Cambridge English</h4>
                  <Tag type="Examination" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">Advanced English certificates (e.g., C1 Advanced, C2 Proficiency). Unlike IELTS or TOEFL, these certificates generally do not expire and are accepted by many technical universities.</p>
                </div>
                <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-[2rem] border border-gold-100/30 dark:border-slate-700/30 transition-all hover:bg-white/60 dark:hover:bg-slate-700/50">
                  <h4 className="text-lg font-bold text-sapphire-900 dark:text-white mb-1">Duolingo English Test</h4>
                  <div className="flex gap-2">
                    <Tag type="Examination" />
                    <Tag type="Optional" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">An online English proficiency test. While its acceptance has broadened, it is not universally recognized across the sector and requires individual program verification.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Semesters & Enrollment */}
        <section id="section-6" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-700">
            <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-24 overflow-hidden">
              <Calendar className="w-80 h-80 text-white translate-x-20 translate-y-10 rotate-12" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Semesters & Enrollment</h2>
              <p className="text-indigo-50 max-w-2xl text-lg font-medium leading-relaxed">The academic calendar and the administrative steps to maintain your student status.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md flex flex-col">
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Wintersemester (WiSe)</h3>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">The winter academic term. At universities, it spans from October 1st to March 31st (September 1st to February 28/29 at UAS). Most programs initiate curriculum in the WiSe.</p>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md flex flex-col">
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Sommersemester (SoSe)</h3>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">The summer academic term. It runs from April 1st to September 30th at universities (March 1st to August 31st at Universities of Applied Sciences).</p>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md flex flex-col">
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Immatrikulation</h3>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">The formal administrative procedure of enrolling at a university, thereby conferring student status and its associated rights and obligations.</p>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md flex flex-col">
              <h4 className="text-xl font-bold text-sapphire-900 dark:text-white mb-2 font-outfit">Exmatrikulation</h4>
              <Tag type="Administrative" />

              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">The formal termination of student status. Occurs upon successful graduation, voluntary withdrawal, transfer, or dismissal (e.g., failing a mandatory exam or fees).</p>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md flex flex-col">
              <h4 className="text-xl font-bold text-sapphire-900 dark:text-white mb-2 font-outfit">Fachsemester</h4>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">The number of semesters a student has been enrolled in a specific degree program, tracked independently from total 'Hochschulsemester'.</p>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all hover:shadow-md flex flex-col">
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Rückmeldung</h3>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">The requirement to confirm ongoing enrollment for the subsequent semester, completed by transferring the mandatory semester fee before the deadline.</p>
            </div>
          </div>
        </section>

        {/* Section 7: Financial & Practical Terms */}
        <section id="section-7" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-sapphire-900 via-sapphire-800 to-slate-900">
            <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-24 overflow-hidden">
              <CreditCard className="w-80 h-80 text-white translate-x-20 translate-y-10 -rotate-12" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Financial & Practical Terms</h2>
              <p className="text-sapphire-50 max-w-2xl text-lg font-medium leading-relaxed">Critical financial requirements for maintaining your visa and day-to-day student life in Germany.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gold-50/40 dark:bg-slate-800/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-gold-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-[1.25rem] flex items-center justify-center mb-8 shadow-inner border border-amber-200/30 dark:border-amber-800/30">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">Sperrkonto (Blocked Account)</h3>
              <div className="flex flex-nowrap gap-2 mb-4">
                <Tag type="Visa" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">A specialized bank account for non-EU students to secure a visa. It must be funded with a legally mandated annual minimum sum (Bedarfssatz) to guarantee subsistence.</p>
            </div>

            <div className="bg-sapphire-50/40 dark:bg-slate-800/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-sapphire-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="w-16 h-16 bg-sapphire-100 dark:bg-sapphire-900/50 rounded-[1.25rem] flex items-center justify-center mb-8 shadow-inner border border-sapphire-200/30 dark:border-sapphire-800/30">
                <CreditCard className="w-8 h-8 text-sapphire-600 dark:text-sapphire-400" />
              </div>
              <h3 className="text-2xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">Semesterbeitrag (Semester Fee)</h3>
              <div className="flex flex-nowrap gap-2 mb-4">
                <Tag type="Mandatory" />
                <Tag type="Administrative" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">A mandatory administrative contribution paid per semester. It funds the student union (Studierendenwerk), the student government (AStA), and covers the regional transit pass.</p>
            </div>
          </div>

          <div className="mt-8 bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCheck className="w-36 h-36 text-white" />
            </div>
            <div className="max-w-3xl relative z-10">
              <h3 className="text-3xl font-bold font-outfit mb-4">AStA (Allgemeiner Studierendenausschuss)</h3>
              <p className="text-slate-400 text-lg leading-relaxed">The executive organ of the student body. It represents student interests before the administration and facilitates various advisory, legal, and social services.</p>
            </div>
          </div>
        </section>

        {/* Section 8: Visa & Bureaucracy */}
        <section id="section-8" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-rose-700 via-rose-600 to-rose-800">
            <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-24 overflow-hidden">
              <ShieldCheck className="w-80 h-80 text-white translate-x-20 translate-y-10 rotate-6" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Visa & Bureaucracy</h2>
              <p className="text-rose-50 max-w-2xl text-lg font-medium leading-relaxed">Navigating the legal landscape of your stay in Germany.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-rose-50/30 dark:bg-slate-800/30 backdrop-blur-md p-8 rounded-3xl border border-rose-200/50 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-xl font-bold text-sapphire-900 dark:text-white font-outfit">Anmeldung</h3>
              </div>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">The statutory obligation for all residents in Germany to register their address at the local Bürgeramt within 14 days of occupying a new dwelling.</p>
            </div>

            <div className="bg-rose-50/30 dark:bg-slate-800/30 backdrop-blur-md p-8 rounded-3xl border border-rose-200/50 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-3 font-outfit">Ausländerbehörde</h3>
              </div>
              <Tag type="Visa" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">The local authority responsible for implementing immigration law, including the issuance, extension, and modification of residence permits (Aufenthaltstitel).</p>
            </div>

            <div className="bg-emerald-50/30 dark:bg-slate-800/30 backdrop-blur-md p-8 rounded-3xl border border-emerald-200/50 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-sapphire-900 dark:text-white font-outfit">Krankenversicherung</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <Tag type="Mandatory" />
                <Tag type="Visa" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Statutory requirement for university matriculation. Students under age 30 typically enroll in public health insurance at a regulated student tariff.</p>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/50 dark:border-slate-600/30 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-sapphire-900 dark:text-white font-outfit">Fiktionsbescheinigung</h3>
              </div>
              <Tag type="Visa" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">A temporary document issued by the Ausländerbehörde. It legally proves the provisional legality of residence while a permit application or renewal is under review.</p>
            </div>
          </div>
        </section>

        {/* Section 9: Housing & Living */}
        <section id="section-9" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-sapphire-600 via-sapphire-500 to-sapphire-700">
            <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-24 overflow-hidden">
              <Home className="w-80 h-80 text-white translate-x-20 translate-y-10 -rotate-6" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Housing & Living</h2>
              <p className="text-sapphire-50 max-w-2xl text-lg font-medium leading-relaxed">Finding your home in Germany and understanding the shared living culture.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">WG (Wohngemeinschaft)</h3>
              <Tag type="Administrative" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">A shared apartment living arrangement. Tenants rent individual private bedrooms while sharing common facilities like kitchens and bathrooms.</p>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">Studierendenwerk</h3>
              <Tag type="Institution" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">State-subsidized institution responsible for social infrastructure. They manage public student dormitories (Wohnheime) and dining halls (Mensa).</p>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">Rundfunkbeitrag</h3>
              <Tag type="Mandatory" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">A legally mandated broadcasting contribution fee levied per household, irrespective of media usage, to finance German public broadcasting services.</p>
            </div>
          </div>

          <div className="mt-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-bold text-sapphire-900 dark:text-white mb-4 font-outfit flex items-center gap-2">
                <Coins className="w-5 h-5 text-gold-500" /> Kaltmiete vs. Warmmiete
              </h4>
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">Kaltmiete:</span> Base rental cost for the physical space.</p>
                <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">Warmmiete:</span> Base rent + Nebenkosten (heating, water, waste management). Constitutes the final monthly payment.</p>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4 font-outfit flex items-center gap-2">
                <Key className="w-5 h-5 text-sapphire-400" /> Kaution (Deposit)
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">A deposit transferred to the landlord, legally capped at three months' Kaltmiete. It acts as financial security and is reimbursable post-tenancy.</p>
            </div>
          </div>
        </section>

        {/* Section 10: Student Employment */}
        <section id="section-10" className="mb-24 scroll-mt-16">
          <div className="relative w-full h-[300px] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl group bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-900">
            <div className="absolute inset-0 opacity-10 flex items-center justify-end pr-24 overflow-hidden">
              <Briefcase className="w-80 h-80 text-white translate-x-20 translate-y-20 rotate-12" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 font-outfit tracking-tight">Student Employment</h2>
              <p className="text-emerald-50 max-w-2xl text-lg font-medium leading-relaxed">Working while studying: laws, roles, and networking.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50/30 dark:bg-slate-800/30 backdrop-blur-md p-8 rounded-3xl border border-emerald-200/50 dark:border-slate-700/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity">
                <Clock className="w-28 h-28 text-emerald-900 dark:text-white" />
              </div>
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">140 / 280 Days Rule</h3>
              <div className="flex gap-2">
                <Tag type="Visa" />
                <Tag type="Work" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Non-EU students may work up to 140 full days or 280 half days per calendar year without requiring explicit approval from the Federal Employment Agency.</p>
            </div>

            <div className="bg-emerald-50/30 dark:bg-slate-800/30 backdrop-blur-md p-8 rounded-3xl border border-emerald-200/50 dark:border-slate-700/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity">
                <Users className="w-28 h-28 text-emerald-900 dark:text-white" />
              </div>
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">Werkstudent</h3>
              <Tag type="Work" />
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">A privileged employment status parallel to studies, typically capped at 20h/week during lectures. Offers exemptions from certain social security contributions.</p>
            </div>

            <div className="bg-emerald-50/30 dark:bg-slate-800/30 backdrop-blur-md p-8 rounded-3xl border border-emerald-200/50 dark:border-slate-700/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-30 transition-opacity">
                <School className="w-28 h-28 text-emerald-900 dark:text-white" />
              </div>
              <h3 className="text-xl font-bold text-sapphire-900 dark:text-white mb-1 font-outfit">HiWi</h3>
              <div className="flex gap-2">
                <Tag type="Institution" />
                <Tag type="Work" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Academic student assistants directly employed by a department. HiWi hours are legally exempt from the 140-day work limit, but must be reported to the Ausländerbehörde.</p>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <footer className="mt-24 pt-12 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
          <p className="text-slate-400 text-sm font-medium">© 2026 Gradbahn Academic Consulting. All data points verified for international applicants.</p>
        </footer>
      </main>

      {/* Custom Styles for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default InfoPage;
