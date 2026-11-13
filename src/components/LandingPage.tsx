import React from 'react';
import {
  FileText,
  MessageCircle,
  RefreshCcw,
  Users,
  ArrowRight,
  TrendingUp,
  Star,
  CheckCircle2,
  Activity,
  Headphones,
  Check,
} from 'lucide-react';
import { useBcv } from '../context/BcvContext';
import { ViewMode } from '../types';

interface LandingPageProps {
  onNavigate: (view: ViewMode) => void;
  onEnterDashboard?: (flow: 'register' | 'login') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onEnterDashboard,
}) => {
  const { bcvRate } = useBcv();

  const handleGoToRegister = () => {
    onNavigate('register');
  };

  const handleGoToLogin = () => {
    onNavigate('login');
  };

  // Sección de Características (Estilo TechNova: 4 tarjetas con íconos y colores suaves)
  const TECHNOVA_FEATURES = [
    {
      id: 'facturacion',
      title: 'Facturación Electrónica',
      tag: 'SENIAT & BCV',
      description:
        'Emisión fiscal en doble moneda (USD y Bolívares) con actualización automática de la tasa oficial del BCV y cálculo de IVA.',
      icon: FileText,
      accent: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
      borderGlow: 'hover:border-blue-500/40',
      benefits: ['Cumplimiento legal SENIAT', 'Doble moneda en un clic', 'Descarga de PDF fiscal'],
    },
    {
      id: 'cobros',
      title: 'Cobros Automáticos',
      tag: 'WhatsApp & Correo',
      description:
        'Avisos preventivos y recordatorios de pago automáticos para acelerar la recaudación de cartera vencida sin llamadas incómodas.',
      icon: MessageCircle,
      accent: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      borderGlow: 'hover:border-emerald-500/40',
      benefits: ['Avisos por WhatsApp', 'Reducción de morosidad', 'Plantillas con datos de pago'],
    },
    {
      id: 'conciliacion',
      title: 'Conciliación Bancaria',
      tag: 'Pagos & Referencias',
      description:
        'Emparejamiento inteligente de extractos bancarios en bolívares (Pago Móvil, transferencias) y transferencias en divisas Zelle.',
      icon: RefreshCcw,
      accent: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
      borderGlow: 'hover:border-purple-500/40',
      benefits: ['Banesco, Mercantil y BDV', 'Validación de referencias', 'Cero descuadre contable'],
    },
    {
      id: 'clientes',
      title: 'Gestión de Clientes',
      tag: 'Riesgo Crediticio',
      description:
        'Ficha comercial de clientes con evaluación de solvencia, límites de crédito asignados y monitoreo histórico de puntualidad.',
      icon: Users,
      accent: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      borderGlow: 'hover:border-amber-500/40',
      benefits: ['Límites de crédito claros', 'Alertas de sobregiro', 'Historial de pagos'],
    },
  ];

  // Sección de Estadísticas (Estilo TechNova)
  const TECHNOVA_STATS = [
    {
      value: '500+',
      label: 'Facturas Emitidas',
      sublabel: 'En dólares y bolívares',
      icon: FileText,
      color: 'text-blue-400',
    },
    {
      value: '100+',
      label: 'Empresas Activas',
      sublabel: 'En toda Venezuela',
      icon: Users,
      color: 'text-emerald-400',
    },
    {
      value: '99.9%',
      label: 'Uptime',
      sublabel: 'Disponibilidad continua',
      icon: Activity,
      color: 'text-purple-400',
    },
    {
      value: '24/7',
      label: 'Soporte',
      sublabel: 'Atención personalizada',
      icon: Headphones,
      color: 'text-amber-400',
    },
  ];

  // Testimonios realistas
  const TESTIMONIALS = [
    {
      quote:
        'Nixi me ahorra más de 5 horas a la semana. Antes pasábamos mañanas enteras revisando transferencias bancarias y calculando el dólar BCV a mano.',
      author: 'María Rodríguez',
      role: 'Directora de Operaciones',
      company: 'Distribuidora Oriental en Caracas',
      initials: 'MR',
    },
    {
      quote:
        'Poder cobrar en dólares con la tasa del BCV del día exacta evitó que perdiéramos margen por el diferencial cambiario. Además, las facturas salen impecables.',
      author: 'Alejandro Mendoza',
      role: 'Gerente de Administración',
      company: 'Servicios Logísticos en Valencia',
      initials: 'AM',
    },
    {
      quote:
        'Los recordatorios automáticos por WhatsApp cambiaron nuestro negocio: el 85% de los clientes ahora pagan antes del vencimiento sin tener que llamarlos.',
      author: 'Carlos Peña',
      role: 'Socio Fundador',
      company: 'Consultora de Ingeniería en Maracaibo',
      initials: 'CP',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-blue-600/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-[850px] -left-[200px] w-[500px] h-[500px] bg-cyan-600/10 blur-[140px] pointer-events-none rounded-full" />

      {/* 1. Header (Barra Superior) */}
      <header className="h-20 border-b border-slate-800/80 bg-[#0a0f1c]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo Nixi a la izquierda */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40">
              N
            </div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-none">
              Nixi
            </span>
          </div>

          {/* Tasa Oficial BCV Pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Tasa Oficial BCV:</span>
            <span className="font-mono font-bold text-white tabular-nums">
              Bs. {bcvRate.toFixed(2)}
            </span>
          </div>

          {/* Botones a la derecha: "Iniciar Sesión" (texto) y "Crear Cuenta" (botón azul) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleGoToLogin}
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-lg hover:bg-slate-900/80 transition-colors cursor-pointer"
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={handleGoToRegister}
              className="text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/25 hover:shadow-blue-500/40 cursor-pointer flex items-center gap-1.5"
            >
              <span>Crear Cuenta</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 z-10">
        {/* 2. Hero Section (Inspirado en Digital Planai) */}
        <section className="pt-20 sm:pt-32 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Texto superior en lugar del badge anterior */}
          <p className="text-lg sm:text-xl font-bold tracking-widest text-blue-400 uppercase mb-6 sm:mb-8 animate-in fade-in duration-300">
            NIXI
          </p>

          {/* Tipografía GIGANTE con palabras clave en azul brillante */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08] text-balance">
            Deja de perseguir clientes.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
              Empieza a cobrar a tiempo.
            </span>
          </h1>

          {/* Subtítulo enfocado en la solución */}
          <p className="mt-8 text-base sm:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed text-balance font-normal">
            El software de facturación venezolano que automatiza tus cobros por WhatsApp, calcula el IVA y la tasa BCV, y te dice exactamente cómo va tu negocio.
          </p>

          {/* Botón principal grande (solo uno, sin 'Ver Demostración') */}
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={handleGoToRegister}
              className="w-full sm:w-auto px-10 py-5 text-base sm:text-lg font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-2xl transition-all shadow-2xl shadow-blue-600/40 hover:shadow-blue-500/55 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-3 group"
            >
              <span>Empezar gratis ahora</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="mt-6 mb-8 sm:mb-12">
            <p className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center justify-center gap-2 px-4 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sin tarjeta de crédito · Registro en 2 minutos · Tasa BCV oficial</span>
            </p>
          </div>
        </section>

        {/* 2.5 Planes y Precios (Debajo del Hero) */}
        <section id="precios" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest px-3.5 py-1 rounded-full bg-blue-950/70 border border-blue-800/60 inline-flex items-center gap-1.5">
              <span>Suscripción Simple y Transparente</span>
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mt-4 text-balance">
              Planes y Precios
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              Un único plan accesible pensado para empresas y emprendedores en Venezuela, con todas las herramientas fiscales y de cobranza incluidas.
            </p>
          </div>

          {/* Tarjeta de Precio Destacada (Stripe / Notion Style) */}
          <div className="max-w-md mx-auto">
            <div className="relative rounded-3xl bg-gradient-to-b from-[#111827] via-[#0f172a] to-[#0a0f1c] border-2 border-blue-500/60 shadow-2xl shadow-blue-600/25 p-7 sm:p-9 text-left overflow-hidden transition-all hover:border-blue-400 hover:shadow-blue-500/30">
              {/* Resplandores ambientales dentro de la tarjeta */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Tag y badge de flexibilidad */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full">
                  Acceso Total
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Sin permanencia
                </span>
              </div>

              {/* Título y Subtítulo */}
              <h3 className="text-2xl font-black text-white tracking-tight">
                Plan Emprendedor
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Todo lo que necesitas para profesionalizar tus cobros.
              </p>

              {/* Bloque de Precio */}
              <div className="mt-6 pb-6 border-b border-slate-800 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                  $5 USD
                </span>
                <span className="text-slate-400 text-sm font-semibold">
                  / mes
                </span>
              </div>

              {/* Lista de características con checks verdes */}
              <div className="mt-6 space-y-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Incluye todo lo siguiente:
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="font-medium text-white">Facturación SENIAT ilimitada</span>
                  </li>

                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="font-medium text-white">Tasa BCV en tiempo real</span>
                  </li>

                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="font-medium text-white">Hasta 5 usuarios en tu equipo</span>
                  </li>

                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="font-medium text-white">Cobros por WhatsApp y Correo</span>
                  </li>
                </ul>
              </div>

              {/* Botón azul grande: "Crear Cuenta por $5" */}
              <div className="mt-8 pt-2">
                <button
                  type="button"
                  onClick={handleGoToRegister}
                  className="w-full py-4 px-6 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <span>Crear Cuenta por $5</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Nota al pie de la tarjeta */}
              <p className="text-[11px] text-center text-slate-500 mt-3.5">
                Activación instantánea · Cancela cuando quieras
              </p>
            </div>
          </div>
        </section>

        {/* 3. Sección de Estadísticas (Estilo Flat Design / Pantalla Lisa con divisores sutiles) */}
        <section className="border-y border-slate-800/80 bg-slate-900/20 py-14 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {TECHNOVA_STATS.map((stat, idx) => {
                const IconStat = stat.icon;
                const isEvenColMobile = idx % 2 === 0;
                const isFirstRowMobile = idx < 2;
                const isLastItem = idx === TECHNOVA_STATS.length - 1;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center text-center py-8 px-4 sm:px-6 transition-colors ${
                      isEvenColMobile ? 'border-r border-slate-800/80' : ''
                    } ${
                      isFirstRowMobile ? 'border-b border-slate-800/80' : ''
                    } ${
                      !isLastItem ? 'md:border-r md:border-slate-800/80' : 'md:border-r-0'
                    } md:border-b-0`}
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-900/70 border border-slate-800/60 flex items-center justify-center mb-3.5 shadow-inner">
                      <IconStat className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white tabular-nums">
                      {stat.value}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-200 mt-2">
                      {stat.label}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      {stat.sublabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Sección de Características (Estilo TechNova: 4 tarjetas con íconos y colores suaves) */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header de la sección */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest px-3 py-1 rounded-full bg-blue-950/70 border border-blue-800/60">
              Plataforma Todo-en-Uno
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mt-4 text-balance">
              Herramientas diseñadas para empresas reales
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed text-balance">
              Gestiona todo el ciclo comercial de tu empresa con cumplimiento fiscal estricto y total control de cobranza.
            </p>
          </div>

          {/* Cuadrícula de 4 tarjetas estilo TechNova */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {TECHNOVA_FEATURES.map((feat) => {
              const IconC = feat.icon;
              return (
                <div
                  key={feat.id}
                  className={`bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 sm:p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/20 flex flex-col justify-between ${feat.borderGlow} group`}
                >
                  <div>
                    {/* Top Row: Icon and Tag Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <IconC className={`w-6 h-6 ${feat.accent}`} />
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${feat.badgeBg}`}>
                        {feat.tag}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed">
                      {feat.description}
                    </p>

                    {/* Feature bullets */}
                    <div className="mt-5 pt-4 border-t border-slate-800/70 space-y-2">
                      {feat.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3">
                    <button
                      type="button"
                      onClick={handleGoToRegister}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Explorar {feat.title}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Sección de Testimonios / Prueba Social */}
        <section className="py-20 sm:py-28 border-t border-slate-800/80 bg-slate-950 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400" />
              ))}
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
              Únete a los emprendedores que ya organizaron sus finanzas con Nixi.
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Empresas en Caracas, Valencia, Maracaibo y Barquisimeto facturan y cobran a tiempo todos los días.
            </p>
          </div>

          {/* 3 Mini-testimonios limpios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            {TESTIMONIALS.map((test, tIdx) => (
              <div
                key={tIdx}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3.5">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    "{test.quote}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                    {test.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{test.author}</p>
                    <p className="text-[11px] text-slate-400 truncate">{test.role}</p>
                    <p className="text-[10px] text-blue-400 font-medium truncate">{test.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Final */}
        <section className="py-16 sm:py-24 border-t border-slate-800/80 bg-slate-900/40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              ¿Listo para simplificar tu facturación y cobrar a tiempo?
            </h2>
            <p className="text-base sm:text-lg text-slate-300">
              Comienza hoy mismo sin compromisos. Configura tu empresa en menos de 2 minutos.
            </p>
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={handleGoToRegister}
                className="w-full sm:w-auto px-9 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all shadow-xl shadow-blue-600/35 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Crear Cuenta Gratis</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer (Pie de Página) */}
      <footer className="border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo y Eslogan */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                N
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">Nixi</span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-xs text-slate-400 font-medium">
              Nixi - Decisiones inteligentes para negocios que quieren crecer.
            </span>
          </div>

          {/* Enlaces rápidos y Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-right">
            <div className="flex items-center gap-4 text-slate-400">
              <a href="#terminos" onClick={(e) => { e.preventDefault(); }} className="hover:text-slate-200 transition-colors">
                Términos
              </a>
              <span className="text-slate-700">•</span>
              <a href="#privacidad" onClick={(e) => { e.preventDefault(); }} className="hover:text-slate-200 transition-colors">
                Privacidad
              </a>
              <span className="text-slate-700">•</span>
              <a href="#soporte" onClick={(e) => { e.preventDefault(); }} className="hover:text-slate-200 transition-colors">
                Soporte
              </a>
            </div>
            <span className="text-slate-500 font-mono">
              © 2026 Nixi. Todos los derechos reservados.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
