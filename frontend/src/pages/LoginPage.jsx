import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import PremiumInput from '../components/UI/PremiumInput';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Access granted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row overflow-hidden transition-colors duration-500">
      {/* Left Side: Visual Anchor */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-700" 
            style={{ backgroundImage: `url('/login_bg.png')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100/95 via-slate-50/80 to-slate-100/95 dark:from-sapphire-900 dark:via-sapphire-900/60 dark:to-sapphire-900/90 z-10"></div>
          {/* Decorative geometric elements */}
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-sapphire-200/50 dark:bg-sapphire-500/20 blur-[120px] z-20"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gold-200/40 dark:bg-gold-500/10 blur-[100px] z-20"></div>
          <div className="absolute inset-0 opacity-[0.05] dark:opacity-20 bg-[radial-gradient(#3b5bdb_1px,transparent_1px)] [background-size:40px_40px] z-20"></div>
          
          {/* Seamless Transition Gradient */}
          <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-r from-transparent via-slate-50/40 to-slate-50 dark:via-slate-900/40 dark:to-slate-900 z-30 hidden lg:block"></div>
        </div>

        <div className="relative z-20 max-w-lg">
          <h2 className="text-6xl font-black text-slate-900 dark:text-white font-outfit leading-[1.1] mb-8 tracking-tighter">
            Precision in <br />
            <span className="text-sapphire-600 dark:text-gold-400">Academic Planning.</span>
          </h2>
          <p className="text-xl text-slate-500 dark:text-sapphire-100/80 font-medium leading-relaxed mb-12">
            Navigate your international academic journey with Gradbahn’s expert-level guidance and precision tools.
          </p>
          <div className="flex items-center space-x-4">
            <div className="h-0.5 w-16 bg-sapphire-600 dark:bg-gold-500"></div>
            <span className="text-xs font-black text-sapphire-600 dark:text-gold-500 uppercase tracking-[0.2em]">Established Excellence</span>
          </div>
        </div>
      </section>

      {/* Right Side: Login Content */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 transition-colors relative">
        <div className="w-full max-w-md relative z-10">
          <div className="glass p-12 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-12">
              <img
                src="/logo.png"
                alt="Gradbahn Logo"
                className="w-20 h-20 mx-auto mb-8 object-contain drop-shadow-2xl animate-float"
              />
              <h1 className="text-4xl font-black text-slate-900 dark:text-white font-outfit tracking-tight mb-3">
                Welcome Back
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Access your academic portfolio and applications.
              </p>
            </div>

            <form className="space-y-10" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <PremiumInput
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="space-y-1">
                  <PremiumInput
                    label="Password"
                    icon={Lock}
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="flex justify-end px-1">
                    <Link to="#" className="text-[10px] font-black text-sapphire-500 hover:text-sapphire-600 transition-colors uppercase tracking-widest">Forgot password?</Link>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-sapphire-600 hover:bg-sapphire-700 text-white rounded-2xl font-black flex items-center justify-center space-x-3 shadow-2xl shadow-sapphire-500/30 transition-all active:scale-[0.98] group disabled:opacity-70"
                disabled={loading}
              >
                <span className="uppercase tracking-widest text-sm">Sign In</span>
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-12 text-center pt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex flex-wrap justify-center items-center gap-2">
                <span className="whitespace-nowrap">New to Gradbahn?</span>
                <Link to="/register" className="text-gold-500 hover:text-gold-600 font-bold inline-flex items-center transition-colors underline decoration-2 underline-offset-4 decoration-gold-500/30 whitespace-nowrap">
                  Create an account <ArrowRight className="ml-1.5 w-4 h-4" />
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-40">
            © 2024 Gradbahn Academic Systems. All Rights Reserved.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
