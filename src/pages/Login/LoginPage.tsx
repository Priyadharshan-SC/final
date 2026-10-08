import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api/systemApi';
import { 
  Cpu, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Mail, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('priyadharshan@pcbinspect.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('pcb_auth_token', res.token);
      localStorage.setItem('pcb_user', JSON.stringify(res.user));
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    localStorage.setItem('pcb_auth_token', `mock-${provider.toLowerCase()}-token`);
    localStorage.setItem('pcb_user', JSON.stringify({ name: 'Priyadharshan', email, role: 'Admin' }));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-screen bg-[#070D18] flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-industrial-900 border border-industrial-border rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Left Side: Industrial AI Brand Hero (7 cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#0B1528] via-[#091222] to-[#060D1A] p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-industrial-border flex flex-col justify-between relative overflow-hidden">
          {/* Subtle PCB Track Background Effect */}
          <div className="absolute inset-0 bg-pcb-grid opacity-20 pointer-events-none" />

          {/* Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  PCBInspect <span className="text-cyan-400 font-mono">AI</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">Smart Inspection. Zero Defects.</p>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mt-6">
              AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                PCB Quality Control
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-3 max-w-md leading-relaxed">
              Detect surface solder bridges, component misalignments, and optical micro-anomalies in real-time with sub-millimeter precision.
            </p>
          </div>

          {/* 4 Feature Badges */}
          <div className="grid grid-cols-2 gap-3 my-8 relative z-10">
            <div className="bg-[#0D182B]/80 border border-industrial-border/80 rounded-xl p-3.5 flex items-start gap-3">
              <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Real-time Inspection</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">60 FPS camera pipeline</p>
              </div>
            </div>

            <div className="bg-[#0D182B]/80 border border-industrial-border/80 rounded-xl p-3.5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">98.4% Accuracy</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">IPC-A-610 Class 3</p>
              </div>
            </div>

            <div className="bg-[#0D182B]/80 border border-industrial-border/80 rounded-xl p-3.5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">PatchCore Anomaly</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Memory-bank vision AI</p>
              </div>
            </div>

            <div className="bg-[#0D182B]/80 border border-industrial-border/80 rounded-xl p-3.5 flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Audit Certification</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated PDF reports</p>
              </div>
            </div>
          </div>

          {/* Bottom Factory Line Footer */}
          <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400 pt-4 border-t border-industrial-border/60">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Line 01 Station Online
            </span>
            <span>Target: ESP32 PCB</span>
          </div>
        </div>

        {/* Right Side: Sign-in Form (5 cols) */}
        <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-center bg-industrial-900">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
            <p className="text-xs text-slate-400 mt-1">Enter your credentials to access the inspection console</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 mt-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@pcbinspect.ai"
                  className="w-full bg-[#0E1626] border border-industrial-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0E1626] border border-industrial-border rounded-lg pl-9 pr-10 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input type="checkbox" defaultChecked className="rounded bg-slate-900 border-slate-700 text-blue-600" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to registered email.'); }} className="text-cyan-400 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-glow-blue mt-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to Station'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social SSO Buttons */}
          <div className="mt-6 pt-5 border-t border-industrial-border/60 space-y-2.5">
            <span className="block text-center text-[11px] font-mono text-slate-500 uppercase">
              Or enterprise single sign-on
            </span>

            <button
              onClick={() => handleSocialLogin('Google')}
              className="w-full py-2 bg-industrial-950 hover:bg-slate-800 text-slate-200 border border-industrial-border rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google Workspace
            </button>

            <button
              onClick={() => handleSocialLogin('Microsoft')}
              className="w-full py-2 bg-industrial-950 hover:bg-slate-800 text-slate-200 border border-industrial-border rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Continue with Microsoft Azure AD
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
