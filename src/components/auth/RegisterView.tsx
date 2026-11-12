import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface RegisterViewProps {
  onRegister: (data: {
    name: string;
    email: string;
    password?: string;
    companyName?: string;
    companyRif?: string;
  }) => Promise<void> | void;
  onGoToLogin: () => void;
  onBackToLanding: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegister,
  onGoToLogin,
  onBackToLanding,
}) => {
  const { updateProfile } = useUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyRif, setCompanyRif] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim() || !password.trim()) return;

    setIsLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Nuevo Usuario';
    const finalCompanyName = companyName.trim() || `Inversiones ${fullName}`;
    const finalCompanyRif = companyRif.trim().toUpperCase() || `J-${Math.floor(10000000 + Math.random() * 90000000)}-1`;

    updateProfile({
      fullName,
      email: email.trim(),
      companyName: finalCompanyName,
      companyRif: finalCompanyRif,
    });

    try {
      await onRegister({
        name: fullName,
        email: email.trim(),
        password: password.trim(),
        companyName: finalCompanyName,
        companyRif: finalCompanyRif,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center bg-[#0a0f1c] text-slate-100 relative overflow-x-hidden selection:bg-blue-600 selection:text-white py-12">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-blue-600/[0.08] blur-[150px] pointer-events-none rounded-full" />

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
            Crea tu cuenta
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Empieza a facturar legalmente y a cobrar a tiempo en minutos
          </p>
        </div>

        {/* Register Form directo sobre fondo liso */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombres y Apellidos en dos columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombres
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Gabriel"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm bg-[#111827] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Apellidos
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Echeverría"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm bg-[#111827] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Nombre de la Empresa y RIF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre de la Empresa / Razón Social
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Inversiones Altagracia C.A."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm bg-[#111827] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                RIF de la Empresa
              </label>
              <div className="relative">
                <span className="text-slate-500 font-mono text-xs font-bold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  RIF
                </span>
                <input
                  type="text"
                  placeholder="J-40123456-7"
                  value={companyRif}
                  onChange={(e) => setCompanyRif(e.target.value)}
                  className="w-full pl-11 pr-3 py-3 text-sm bg-[#111827] border border-slate-700 rounded-lg text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

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
                placeholder="tuempresa@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 text-sm bg-[#111827] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Textos de valor adicionales */}
          <div className="space-y-2 pt-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sin tarjeta de crédito requerida</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Conexión inmediata con tasa oficial BCV y SENIAT</span>
            </div>
          </div>

          {/* Botón Grande Crear Cuenta */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configurando tu espacio...</span>
                </>
              ) : (
                <>
                  <span>Crear Cuenta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Enlace inferior: Inicia sesión aquí */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 cursor-pointer transition-colors"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>

        {/* Badge de seguridad */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Datos resguardados con cifrado AES-256</span>
        </div>
      </div>
    </div>
  );
};
