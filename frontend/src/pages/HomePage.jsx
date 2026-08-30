import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, BookOpen, Calculator, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const HomePage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen transition-colors duration-700">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className={`absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ${isDarkMode
            ? 'brightness-100 saturate-100'
            : 'brightness-110 saturate-[0.8] contrast-[0.9]'
            }`}
          style={{ backgroundImage: `url('/hero_bg.png')` }}
        >
          <div className={`absolute inset-0 transition-colors duration-700 ${isDarkMode
            ? 'bg-slate-950/70'
            : 'bg-indigo-50/40 backdrop-blur-[1px]'
            }`}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`inline-flex items-center space-x-3 backdrop-blur-md px-4 py-2 rounded-full border mb-8 animate-fade-in transition-all duration-500 ${isDarkMode
            ? 'bg-white/10 border-white/20'
            : 'bg-sapphire-500/10 border-sapphire-500/20'
            }`}>
            <img
              src="/logo.png"
              alt="Gradbahn"
              className="w-5 h-5 object-contain"
            />
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isDarkMode ? 'text-white/90' : 'text-sapphire-900'
              }`}>YOUR ACADEMIC JOURNEY, REIMAGINED</span>
          </div>

          <h1 className={`text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-8 leading-tight font-outfit transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
            Navigate Your German <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sapphire-600 to-indigo-500 dark:from-gold-500 dark:to-amber-400">Master's Journey</span> with Precision
          </h1>

          <p className={`max-w-2xl mx-auto text-lg sm:text-xl mb-12 font-inter leading-relaxed transition-colors duration-500 ${isDarkMode ? 'text-white/80' : 'text-slate-600'
            }`}>
            Gradbahn simplifies the complexity of international applications. From credit conversion to live fee tracking, we provide the tools you need to succeed.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link to="/programmes" className="btn-secondary flex items-center space-x-2 group w-full sm:w-auto">
              <span>Explore Programmes</span>
              <Search className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/calculator" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-3 rounded-lg font-semibold transition-all w-full sm:w-auto">
              Open Calculator
            </Link>
          </div>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className={`w-6 h-10 border-2 rounded-full flex justify-center p-1 transition-colors duration-500 ${isDarkMode ? 'border-white/30' : 'border-slate-900/20'
            }`}>
            <div className={`w-1 h-2 rounded-full transition-colors duration-500 ${isDarkMode ? 'bg-white/50' : 'bg-slate-900/40'
              }`}></div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-24 bg-white dark:bg-slate-900 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 font-outfit">Designed for Academic Excellence</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Our platform bridges the gap between your local transcript and German university standards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-2xl hover:scale-[1.02] transition-all group">
              <div className="w-14 h-14 bg-sapphire-50 dark:bg-sapphire-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-sapphire-500 transition-colors">
                <BookOpen className="w-7 h-7 text-sapphire-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Module Requirements</h3>
              <p className="text-slate-600 dark:text-slate-400">Deep-dive into exact ECTS module requirements to verify your eligibility before you even apply.</p>
            </div>

            <div className="glass p-8 rounded-2xl hover:scale-[1.02] transition-all group">
              <div className="w-14 h-14 bg-sapphire-50 dark:bg-sapphire-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500 transition-colors">
                <Calculator className="w-7 h-7 text-sapphire-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Bavarian Formula</h3>
              <p className="text-slate-600 dark:text-slate-400">Instant German grade conversion with our precision calculator, handling multiple grading scales.</p>
            </div>

            <div className="glass p-8 rounded-2xl hover:scale-[1.02] transition-all group">
              <div className="w-14 h-14 bg-sapphire-50 dark:bg-sapphire-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-sapphire-500 transition-colors">
                <LayoutDashboard className="w-7 h-7 text-sapphire-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Personal Dashboard</h3>
              <p className="text-slate-600 dark:text-slate-400">Organize your applications, track deadlines, and monitor costs with a personalized command center.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 relative overflow-hidden">
        {/* Base layer perfectly matching neighbors */}
        <div className="absolute inset-0 bg-white dark:bg-slate-900 transition-colors duration-500"></div>

        {/* Floating "Seamless" Background Blob - No hard edges at top/bottom */}
        <div className="absolute inset-x-0 top-1/4 bottom-1/4 blur-[120px] rounded-[100%] transition-all duration-500 bg-sapphire-50/80 dark:bg-slate-950/60"></div>

        {/* Subtle Center Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 blur-[100px] rounded-full transition-all duration-500 bg-sapphire-300/10 dark:bg-sapphire-500/5"></div>
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className={`text-4xl sm:text-5xl font-bold mb-8 font-outfit transition-colors duration-500 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Ready to Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-sapphire-600 to-indigo-500 dark:from-gold-500 dark:to-amber-400">Application?</span>
          </h2>
          <p className={`text-lg mb-10 max-w-xl mx-auto transition-colors duration-500 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Join thousands of students using Gradbahn to streamline their master's search in Germany.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn-secondary px-10 py-4 text-lg">
              Create Free Account
            </Link>
            <Link 
              to="/programmes" 
              className={`px-10 py-4 rounded-lg font-semibold border transition-all flex items-center justify-center space-x-2 ${
                isDarkMode 
                  ? 'text-white border-white/20 hover:bg-white/10' 
                  : 'text-slate-900 border-slate-900/20 hover:bg-slate-900/5'
              }`}
            >
              <span>View Programmes</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
