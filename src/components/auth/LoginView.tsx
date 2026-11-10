import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, password: string) => boolean;
  onGoToRegister: () => void;
  onBackToLanding: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onGoToRegister,
  onBackToLanding,
}) => {
  const [email, setEmail] = useState('gabriel@inversteccaracas.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const success = onLogin(email.trim(), password.trim());
      if (!success) {
        setErrorMessage('Credenciales incorrectas');
      }
    }, 450);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center bg-[#0a0f1c] text-slate-100 relative overflow-x-hidden selection:bg-blue-600 selection:text-white py-12">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/[0.08] blur-[150px] pointer-events-none rounded-full" />

      {/* Botón 'Volver al inicio' en la esquina superior izquierda */}
      <button
        type="button"
        onClick={onBackToLanding}
        className="absolute top-6 left-6 z-30 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-blue-400 active:text-blue-300 transition-colors cursor-pointer group p-1.5 rounded-lg hover:bg-slate-800/50"
      >
        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:-translate-x-1 transition-all" />
        <span>Volver al inicio</span>
      </button>

      {/* Formulario en pantalla lisa (sin contenedor de tarjeta, sin bordes ni sombras de caja) */}
      <div className="w-full max-w-md mx-auto px-6 relative z-10">
        {/* Header: Logo Nixi centrado y Título grande */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40 mx-auto mb-4">
            N
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bienvenido de nuevo
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Ingresa a tu cuenta para gestionar tus facturas y cobros
          </p>
        </div>

        {/* Mensaje de error si las credenciales fallan */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}. Verifica tu correo y contraseña.</span>
          </div>
        )}

        {/* Login Form directo sobre fondo liso */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="tuempresa@correo.com"
                className="w-full pl-10 pr-3.5 py-3 text-sm bg-[#111827] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Contraseña
              </label>
              <button
                type="button"
                className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Tu contraseña secreta"
                className="w-full pl-10 pr-10 py-3 text-sm bg-[#111827] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón Grande Entrar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Enlace inferior: Regístrate aquí */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-sm text-slate-400">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 cursor-pointer transition-colors"
            >
              Regístrate aquí
            </button>
          </p>
        </div>

        {/* Badge de seguridad */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Acceso encriptado de grado bancario TLS 1.3</span>
        </div>
      </div>
    </div>
  );
};
