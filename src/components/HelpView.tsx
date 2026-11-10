import React from 'react';
import {
  ArrowLeft,
  Building2,
  UserPlus,
  FileText,
  MessageCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface HelpViewProps {
  onBackToDashboard: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onBackToDashboard }) => {
  const steps = [
    {
      number: '01',
      title: 'Configura tu empresa',
      description: 'Ve a Perfil y coloca tu RIF y datos fiscales para personalizar el encabezado de tus facturas y comprobantes.',
      badge: 'Paso 1 · Identidad Fiscal',
      icon: Building2,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      tagColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      number: '02',
      title: 'Agrega a tus clientes',
      description: 'Ve a Gestión de clientes y registra a quién le vas a facturar, asignando límites de crédito en divisas y días de gracia.',
      badge: 'Paso 2 · Cartera',
      icon: UserPlus,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      number: '03',
      title: 'Emite facturas',
      description: 'Ve al Dashboard, haz clic en + Emitir Factura y calcula el IVA automáticamente en Bolívares a la tasa oficial BCV del día.',
      badge: 'Paso 3 · Emisión Fiscal',
      icon: FileText,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      number: '04',
      title: 'Cobra a tiempo',
      description: 'Usa Automatización para enviar recordatorios por WhatsApp y correo electrónico antes y después de cada vencimiento.',
      badge: 'Paso 4 · Cobranza Inteligente',
      icon: MessageCircle,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0a0f1c]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>Volver al Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              N
            </div>
            <span className="font-bold text-lg text-white tracking-tight hidden sm:inline">Nixi</span>
            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60 hidden sm:inline">
              Centro de Ayuda
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Hero Section */}
        <div className="text-center space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs sm:text-sm font-semibold text-blue-400 shadow-xs">
            <HelpCircle className="w-4 h-4" />
            <span>Tutorial Rápido</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Aprende a usar Nixi en 4 pasos
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Configura tu cuenta en pocos minutos para empezar a facturar con la tasa oficial BCV y automatizar la cobranza de tus clientes en Venezuela.
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-4 sm:space-y-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-950/20"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Step Number + Icon Badge */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <span className="font-mono text-3xl sm:text-4xl font-black text-slate-700 group-hover:text-blue-500/70 transition-colors">
                      {step.number}
                    </span>
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${step.color} border flex items-center justify-center shrink-0 shadow-inner`}
                    >
                      <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${step.tagColor} uppercase tracking-wider`}>
                        {step.badge}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-200 transition-colors">
                      {step.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip / Security banner */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-950 border border-blue-900/40 flex items-start gap-3.5 text-xs sm:text-sm text-slate-300">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white font-semibold">Tranquilidad garantizada:</strong> Todos los cálculos de IVA y tasas de cambio se sincronizan con las publicaciones oficiales del Banco Central de Venezuela (BCV), cumpliendo con la normativa tributaria vigente.
          </p>
        </div>

        {/* Bottom CTA Button */}
        <div className="mt-10 sm:mt-12 flex flex-col items-center justify-center gap-4 text-center">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-full sm:w-auto px-8 py-4 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 transition-all cursor-pointer inline-flex items-center justify-center gap-2.5 min-h-[48px] hover:scale-[1.02]"
          >
            <CheckCircle className="w-5 h-5 text-white" />
            <span>Entendido, ir al Dashboard</span>
          </button>

          <p className="text-xs text-slate-500">
            Puedes volver a consultar esta guía en cualquier momento desde el menú lateral.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>Nixi · Solución integral de facturación y cobranza en Venezuela</p>
      </footer>
    </div>
  );
};
