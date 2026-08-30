import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, UserPlus, ArrowRight } from 'lucide-react';
import PremiumInput from '../components/UI/PremiumInput';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, username, password);
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
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
            style={{ backgroundImage: `url('/reg_bg.png')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-100/95 via-slate-50/80 to-slate-100/95 dark:from-sapphire-900/80 dark:via-sapphire-900/40 dark:to-sapphire-900/90 z-10"></div>
          {/* Decorative architectural/academic patterns */}
          <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] rounded-full bg-sapphire-200/50 dark:bg-sapphire-600/10 blur-[140px] z-20"></div>
          <div className="absolute bottom-[-15%] right-[-5%] w-[70%] h-[70%] rounded-full bg-gold-200/40 dark:bg-gold-600/5 blur-[120px] z-20"></div>
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] z-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b5bdb 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>

          {/* Seamless Transition Gradient */}
          <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-r from-transparent via-slate-50/40 to-slate-50 dark:via-slate-900/40 dark:to-slate-900 z-30 hidden lg:block"></div>
        </div>

        <div className="relative z-20 max-w-lg">
          <div className="flex items-center space-x-3 mb-10">
            <img src="/logo.png" alt="Gradbahn Logo" className="w-12 h-12 object-contain" />
            <span className="text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tighter">Gradbahn</span>
          </div>
          <h2 className="text-6xl font-black text-slate-900 dark:text-white font-outfit leading-[1.1] mb-8 tracking-tighter">
            Your Future <br />
            <span className="text-sapphire-600 dark:text-gold-400">Master's Starts Here.</span>
          </h2>
          <p className="text-xl text-slate-500 dark:text-sapphire-100/80 font-medium leading-relaxed mb-12">
            Join the elite circle of international students securing their academic future in Germany with precision planning.
          </p>
        </div>
      </section>

      {/* Right Side: Registration Content */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 transition-colors relative">
        {/* Subtle background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1a40c2 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="w-full max-w-md relative z-10">
          <div className="glass p-10 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6 lg:hidden">
                <img src="/logo.png" alt="Gradbahn Logo" className="w-16 h-16 object-contain drop-shadow-xl" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white font-outfit tracking-tight mb-3">
                Join Gradbahn
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Start your German master's journey today
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <PremiumInput
                  label="Full Name"
                  icon={User}
                  type="text"
                  required
                  placeholder="Johann Schmidt"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />

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
                    label="Secure Password"
                    icon={Lock}
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 px-1 font-medium italic">At least 8 characters required</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-5 bg-sapphire-600 hover:bg-sapphire-700 text-white rounded-2xl font-black flex items-center justify-center space-x-3 shadow-2xl shadow-sapphire-500/30 transition-all active:scale-[0.98] group disabled:opacity-70"
                disabled={loading}
              >
                <span className="uppercase tracking-widest text-sm">Get Started</span>
                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              <p className="text-[11px] text-center text-slate-400 leading-relaxed px-6 font-medium">
                By joining, you agree to our{' '}
                <Link to="#" className="text-sapphire-500 hover:underline font-bold transition-colors">Terms of Service</Link>{' '}
                and{' '}
                <Link to="#" className="text-sapphire-500 hover:underline font-bold transition-colors">Privacy Policy</Link>.
              </p>
            </form>

            <div className="mt-10 text-center pt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex flex-wrap justify-center items-center gap-2">
                <span className="whitespace-nowrap">Already have an account?</span>
                <Link to="/login" className="text-gold-500 hover:text-gold-600 font-bold inline-flex items-center transition-colors decoration-2 underline-offset-4 decoration-gold-500/30 whitespace-nowrap">
                  Sign in <ArrowRight className="ml-1.5 w-4 h-4" />
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-40">
            © 2024 Gradbahn Precision Academic Services.
          </p>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
