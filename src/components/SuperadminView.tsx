import React, { useState } from 'react';
import {
  TrendingUp,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Search,
  MoreVertical,
  ShieldCheck,
  Eye,
  AlertCircle,
  Calendar,
  Smartphone,
  ExternalLink,
  Crown,
  RefreshCw,
  Filter,
  Check,
  X,
  CreditCard,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface SuperadminViewProps {
  onBackToApp: () => void;
  onBackToLanding?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

interface CompanyItem {
  id: string;
  name: string;
  rif: string;
  email: string;
  status: 'Activo' | 'En Prueba' | 'Suspendido';
  registeredDate: string;
  plan: string;
  trialDaysRemaining?: number;
  invoicesCount: number;
}

interface PendingPayment {
  id: string;
  clientName: string;
  clientRif: string;
  bank: string;
  targetPhone: string;
  reference: string;
  amountVes: number;
  amountUsd: number;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const SuperadminView: React.FC<SuperadminViewProps> = ({
  onBackToApp,
  onBackToLanding,
  onShowToast = () => {},
}) => {
  // Empresas registradas
  const [companies, setCompanies] = useState<CompanyItem[]>([
    {
      id: 'comp-1',
      name: 'Inversiones Altagracia C.A.',
      rif: 'J-30491823-1',
      email: 'facturacion@altagracia.com.ve',
      status: 'Activo',
      registeredDate: '08 Mar 2026',
      plan: 'Plan Emprendedor ($5/mes)',
      invoicesCount: 24,
    },
    {
      id: 'comp-2',
      name: 'Servicios Industriales Tuy S.A.',
      rif: 'J-41239845-2',
      email: 'administracion@tuyindustrias.com',
      status: 'En Prueba',
      registeredDate: '06 Mar 2026',
      plan: 'Prueba Gratuita',
      trialDaysRemaining: 5,
      invoicesCount: 7,
    },
    {
      id: 'comp-3',
      name: 'Farmacia La Candelaria C.A.',
      rif: 'J-50123984-7',
      email: 'contable@farmacandelaria.com',
      status: 'En Prueba',
      registeredDate: '02 Mar 2026',
      plan: 'Prueba Gratuita',
      trialDaysRemaining: 1,
      invoicesCount: 12,
    },
    {
      id: 'comp-4',
      name: 'Distribuidora Global Oriente C.A.',
      rif: 'J-29837412-9',
      email: 'contacto@distoriente.com',
      status: 'Activo',
      registeredDate: '24 Feb 2026',
      plan: 'Plan Emprendedor ($5/mes)',
      invoicesCount: 56,
    },
  ]);

  // Comprobantes de Pago Móvil por verificar
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([
    {
      id: 'pay-001',
      clientName: 'Servicios Industriales Tuy S.A.',
      clientRif: 'J-41239845-2',
      bank: 'Banesco Banco Universal (0134)',
      targetPhone: '0414-4975296',
      reference: '09841284',
      amountVes: 4480.6,
      amountUsd: 5.0,
      date: '09 Mar 2026',
      time: '09:42 AM',
      status: 'pending',
    },
    {
      id: 'pay-002',
      clientName: 'Alimentos y Suministros Caracas S.R.L.',
      clientRif: 'J-31948572-0',
      bank: 'Banco Mercantil (0105)',
      targetPhone: '0424-9876543',
      reference: 'MERC-883921',
      amountVes: 4480.6,
      amountUsd: 5.0,
      date: '09 Mar 2026',
      time: '08:15 AM',
      status: 'pending',
    },
  ]);

  // Filtros y estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'Activo' | 'En Prueba'>('todos');
  const [selectedReceipt, setSelectedReceipt] = useState<PendingPayment | null>(null);
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<CompanyItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Métricas calculadas o dinámicas
  const activeCount = companies.filter((c) => c.status === 'Activo').length;
  const trialCount = companies.filter((c) => c.status === 'En Prueba').length;
  const pendingVouchersCount = pendingPayments.filter((p) => p.status === 'pending').length;

  // Estado de procesamiento individual de pagos
  const [processingPayment, setProcessingPayment] = useState<{ id: string; action: 'approving' | 'rejecting' } | null>(null);

  const handleApprovePayment = (id: string, clientName: string) => {
    setProcessingPayment({ id, action: 'approving' });
    setTimeout(() => {
      setPendingPayments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
      );
      // Activar empresa si estaba en prueba
      setCompanies((prev) =>
        prev.map((c) =>
          c.name.toLowerCase().includes(clientName.toLowerCase().slice(0, 10))
            ? { ...c, status: 'Activo', plan: 'Plan Emprendedor ($5/mes)', trialDaysRemaining: undefined }
            : c
        )
      );
      setProcessingPayment(null);
      onShowToast(`✅ Pago de ${clientName} aprobado. Suscripción activada exitosamente.`, 'success');
    }, 550);
  };

  const handleRejectPayment = (id: string, clientName: string) => {
    setProcessingPayment({ id, action: 'rejecting' });
    setTimeout(() => {
      setPendingPayments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
      );
      setProcessingPayment(null);
      onShowToast(`❌ Comprobante de ${clientName} rechazado. Notificación enviada.`, 'warning');
    }, 550);
  };

  const handleExtendTrial = (companyId: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              trialDaysRemaining: (c.trialDaysRemaining || 0) + 7,
              status: 'En Prueba',
            }
          : c
      )
    );
    setActiveMenuId(null);
    onShowToast('⏳ Periodo de prueba extendido por 7 días adicionales.', 'info');
  };

  const handleToggleSuspend = (companyId: string) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id === companyId) {
          const nextStatus = c.status === 'Suspendido' ? 'Activo' : 'Suspendido';
          onShowToast(`Empresa ${c.name} marcada como ${nextStatus}.`, 'info');
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
    setActiveMenuId(null);
  };

  const filteredCompanies = companies.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.rif.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'todos' ? true : comp.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* 1. Header del Superpanel */}
      <header className="border-b border-slate-800 bg-[#0b1120]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onBackToApp}
              className="px-3 py-2 rounded-xl text-slate-200 hover:text-white bg-slate-800/90 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer inline-flex items-center gap-2 text-xs sm:text-sm font-bold min-h-[44px] shadow-sm active:scale-95 group"
              title="Volver al Dashboard principal de Nixi"
            >
              <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span className="leading-none">Volver al Dashboard</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-purple-900/40">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-none">
                    Panel de Control Global - Nixi
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-xs">
                    <Crown className="w-3 h-3 text-purple-400" />
                    Superadmin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                  Consola centralizada de suscripciones, empresas y pasarelas de pago SaaS
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 text-xs bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Servidores Activos · Venezuela GMT-4</span>
            </div>

            <button
              type="button"
              onClick={() => onShowToast('Métricas y datos sincronizados con éxito', 'info')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 2. Tarjetas de Métricas Globales (KPIs) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Métricas Principales (KPIs Globales)</span>
            </h2>
            <span className="text-xs text-slate-500">Últimos 30 días</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: MRR */}
            <div className="bg-[#1e293b]/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Ingresos Mensuales (MRR)</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  +15%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  $4,500.00
                </span>
                <span className="text-xs font-semibold text-slate-400">USD</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                <span>900 cuentas activas a $5/mes</span>
              </p>
            </div>

            {/* Card 2: Empresas Registradas */}
            <div className="bg-[#1e293b]/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Empresas Registradas</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  342
                </span>
                <span className="text-xs font-semibold text-slate-400">empresas</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                +28 nuevas empresas esta semana
              </p>
            </div>

            {/* Card 3: En Prueba (Trial) */}
            <div className="bg-[#1e293b]/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">En Prueba (Trial)</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  48 activas
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
                  48
                </span>
                <span className="text-xs font-semibold text-slate-400">empresas</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Periodo estándar de 7 días
              </p>
            </div>

            {/* Card 4: Tasa de Conversión */}
            <div className="bg-[#1e293b]/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Tasa de Conversión</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  +4.2%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  68%
                </span>
                <span className="text-xs font-semibold text-slate-400">trial a pago</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Excelente retención por tasa BCV
              </p>
            </div>
          </div>
        </section>

        {/* 4. Validación de Pagos Pendientes (Pago Móvil) - Prioritaria en operación */}
        <section className="bg-gradient-to-br from-[#1e293b] to-[#0b132b] rounded-2xl border border-slate-700/80 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Comprobantes por Verificar
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingVouchersCount} pendientes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Pagos móviles reportados por clientes para activación o renovación del Plan Emprendedor ($5.00)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Pasarela Pago Móvil Interbancario (VES)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className={`rounded-xl border p-4 sm:p-5 transition-all ${
                  payment.status === 'approved'
                    ? 'bg-emerald-950/25 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                    : payment.status === 'rejected'
                    ? 'bg-rose-950/25 border-rose-500/60 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/30'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-purple-500/50 shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Miniatura de Captura con diseño realista de comprobante */}
                  <div
                    onClick={() => setSelectedReceipt(payment)}
                    className="group relative w-full sm:w-28 h-32 sm:h-28 rounded-xl bg-slate-950 border border-slate-700 hover:border-purple-400 overflow-hidden cursor-pointer flex flex-col justify-between p-2 shadow-inner shrink-0"
                    title="Clic para ver comprobante ampliado"
                  >
                    <div className="flex items-center justify-between text-[9px] text-slate-400">
                      <span className="font-bold text-purple-300">PAGO MÓVIL</span>
                      <Eye className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    </div>
                    <div className="space-y-0.5 text-center my-auto">
                      <div className="text-[10px] font-extrabold text-emerald-400">
                        Bs. {payment.amountVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono truncate">
                        {payment.reference}
                      </div>
                    </div>
                    <div className="text-[8px] text-center text-slate-500 bg-slate-900/90 py-0.5 rounded border border-slate-800">
                      Ver Captura
                    </div>
                  </div>

                  {/* Datos del Cliente y Pago */}
                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-white truncate">
                        {payment.clientName}
                      </h3>
                      {payment.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full animate-fade-in">
                          <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" /> Aprobado
                        </span>
                      ) : payment.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 rounded-full animate-fade-in">
                          <X className="w-3.5 h-3.5 stroke-[3] text-rose-400" /> Rechazado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          Por Validar
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">RIF</span>
                        <span className="font-mono text-slate-200 whitespace-nowrap text-xs">{payment.clientRif}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Referencia</span>
                        <span className="font-mono font-bold text-purple-300">{payment.reference}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Monto Pagado</span>
                        <span className="font-semibold text-emerald-400">
                          Bs. {payment.amountVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1">(${payment.amountUsd.toFixed(2)})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Banco Emisor</span>
                        <span className="truncate block text-slate-300" title={payment.bank}>
                          {payment.bank.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Botones de acción: Aprobar / Rechazar con feedback visual */}
                    {payment.status === 'pending' ? (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          disabled={Boolean(processingPayment)}
                          onClick={() => handleApprovePayment(payment.id, payment.clientName)}
                          className={`flex-1 py-2 px-3 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[40px] shadow-md ${
                            processingPayment?.id === payment.id && processingPayment.action === 'approving'
                              ? 'bg-emerald-700 opacity-90 cursor-wait'
                              : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 cursor-pointer shadow-emerald-700/20'
                          }`}
                        >
                          {processingPayment?.id === payment.id && processingPayment.action === 'approving' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Aprobar Pago</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(processingPayment)}
                          onClick={() => handleRejectPayment(payment.id, payment.clientName)}
                          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                            processingPayment?.id === payment.id && processingPayment.action === 'rejecting'
                              ? 'bg-rose-900/60 text-white border border-rose-700 opacity-90 cursor-wait'
                              : 'text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600 border border-rose-800/60 cursor-pointer'
                          }`}
                        >
                          {processingPayment?.id === payment.id && processingPayment.action === 'rejecting' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              <span>Rechazar</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : payment.status === 'approved' ? (
                      <div className="pt-2 space-y-1.5">
                        <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                            <span>Comprobante Aprobado · Suscripción Activada</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingPayments((prev) =>
                                prev.map((item) =>
                                  item.id === payment.id ? { ...item, status: 'pending' } : item
                                )
                              )
                            }
                            className="text-[11px] text-emerald-400 hover:text-emerald-200 underline cursor-pointer ml-2 shrink-0"
                          >
                            Revertir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 space-y-1.5">
                        <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 flex items-center justify-between text-xs text-rose-300">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <X className="w-4 h-4 text-rose-400 stroke-[3]" />
                            <span>Comprobante Rechazado</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingPayments((prev) =>
                                prev.map((item) =>
                                  item.id === payment.id ? { ...item, status: 'pending' } : item
                                )
                              )
                            }
                            className="text-[11px] text-rose-400 hover:text-rose-200 underline cursor-pointer ml-2 shrink-0"
                          >
                            Revertir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Gestión de Clientes (Lista de Empresas) */}
        <section className="bg-[#1e293b]/70 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <span>Gestión de Clientes (Empresas Registradas)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Supervisión de suscripciones, estados de prueba y facturación de clientes
              </p>
            </div>

            {/* Controles de Búsqueda y Filtro */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o RIF..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-60"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus('todos')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterStatus === 'todos'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todas ({companies.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('Activo')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterStatus === 'Activo'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Activas ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('En Prueba')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterStatus === 'En Prueba'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Trial ({trialCount})
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Empresas */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0b1120] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Razón Social y RIF</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Plan Actual</th>
                  <th className="py-3 px-4">Fecha de Registro</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-3.5 px-4 min-w-[240px]">
                      <div className="font-bold text-white group-hover:text-purple-300 transition-colors text-sm">
                        {company.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap sm:flex-nowrap">
                        <span className="whitespace-nowrap font-mono text-[11px] sm:text-xs font-semibold text-purple-300 bg-purple-950/50 border border-purple-800/40 px-2 py-0.5 rounded shrink-0 select-all">
                          {company.rif}
                        </span>
                        <span className="text-slate-600 hidden sm:inline">·</span>
                        <span className="font-sans text-[11px] text-slate-400 truncate max-w-[170px] sm:max-w-xs">{company.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {company.status === 'Activo' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Activo
                        </span>
                      ) : company.status === 'En Prueba' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30">
                          <Clock className="w-3 h-3 text-amber-400" />
                          En Prueba ({company.trialDaysRemaining}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30">
                          Suspendido
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 font-medium">{company.plan}</span>
                      <span className="block text-[11px] text-slate-500">
                        {company.invoicesCount} facturas emitidas
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                      {company.registeredDate}
                    </td>

                    <td className="py-3.5 px-4 text-right relative">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCompanyDetail(company)}
                          className="px-3 py-1.5 text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-600/60 border border-purple-800/60 rounded-lg transition-all cursor-pointer min-h-[36px]"
                        >
                          Ver Detalle
                        </button>

                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === company.id ? null : company.id)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Más opciones de gestión"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Menú de acciones */}
                          {activeMenuId === company.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-30 text-left">
                              <button
                                type="button"
                                onClick={() => handleExtendTrial(company.id)}
                                className="w-full px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Extender prueba (+7d)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setCompanies((prev) =>
                                    prev.map((c) =>
                                      c.id === company.id
                                        ? { ...c, status: 'Activo', plan: 'Plan Emprendedor ($5/mes)' }
                                        : c
                                    )
                                  );
                                  setActiveMenuId(null);
                                  onShowToast(`Plan activado para ${company.name}`, 'success');
                                }}
                                className="w-full px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Activar Plan ($5/mes)</span>
                              </button>

                              <div className="border-t border-slate-800 my-1" />

                              <button
                                type="button"
                                onClick={() => handleToggleSuspend(company.id)}
                                className="w-full px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>
                                  {company.status === 'Suspendido'
                                    ? 'Reactivar Empresa'
                                    : 'Suspender Empresa'}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span>Mostrando {filteredCompanies.length} de {companies.length} empresas registradas</span>
            <span>Tasa BCV de facturación activa: 896.12 VES/USD</span>
          </div>
        </section>
      </main>

      {/* Modal: Vista Ampliada de Comprobante Pago Móvil */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Comprobante de Pago Móvil</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recibo Bancario Visual */}
            <div className="mt-5 p-5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-4 font-sans">
              <div className="text-center pb-3 border-b border-slate-800">
                <div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                  {selectedReceipt.bank}
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  Bs. {selectedReceipt.amountVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Equivalente a ${selectedReceipt.amountUsd.toFixed(2)} USD (Plan Nixi)
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente Emisor:</span>
                  <span className="font-semibold text-white text-right">{selectedReceipt.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RIF:</span>
                  <span className="font-mono text-white">{selectedReceipt.clientRif}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Número de Referencia:</span>
                  <span className="font-mono font-bold text-purple-300">{selectedReceipt.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha y Hora:</span>
                  <span className="text-slate-300">{selectedReceipt.date} · {selectedReceipt.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Teléfono Destino:</span>
                  <span className="font-mono text-slate-300">{selectedReceipt.targetPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Concepto:</span>
                  <span className="text-slate-300">Suscripción Nixi Tools</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              {selectedReceipt.status === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={Boolean(processingPayment)}
                    onClick={() => {
                      handleRejectPayment(selectedReceipt.id, selectedReceipt.clientName);
                      setTimeout(() => setSelectedReceipt(null), 600);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600 rounded-xl transition-all cursor-pointer min-h-[40px] inline-flex items-center gap-1.5"
                  >
                    {processingPayment?.id === selectedReceipt.id && processingPayment.action === 'rejecting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Rechazar</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(processingPayment)}
                    onClick={() => {
                      handleApprovePayment(selectedReceipt.id, selectedReceipt.clientName);
                      setTimeout(() => setSelectedReceipt(null), 600);
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer min-h-[40px] shadow-lg shadow-emerald-700/30 flex items-center gap-1.5"
                  >
                    {processingPayment?.id === selectedReceipt.id && processingPayment.action === 'approving' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Aprobar Pago</span>
                      </>
                    )}
                  </button>
                </>
              )}
              {selectedReceipt.status !== 'pending' && (
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalle de Empresa */}
      {selectedCompanyDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e293b] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Ficha de Empresa</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompanyDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <h4 className="text-base font-extrabold text-white">{selectedCompanyDetail.name}</h4>
                <p className="text-purple-300 font-mono text-xs whitespace-nowrap mt-0.5">{selectedCompanyDetail.rif}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-semibold">Estado de Cuenta</span>
                  <span className="font-bold text-white">{selectedCompanyDetail.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-semibold">Plan Actual</span>
                  <span className="text-purple-300 font-semibold">{selectedCompanyDetail.plan}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-semibold">Facturas Emitidas</span>
                  <span className="font-bold text-white">{selectedCompanyDetail.invoicesCount} documentos</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-semibold">Registrado el</span>
                  <span className="font-mono text-slate-300">{selectedCompanyDetail.registeredDate}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 text-xs block">Correo Electrónico de Contacto:</span>
                <span className="font-mono text-white text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 block">
                  {selectedCompanyDetail.email}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedCompanyDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleExtendTrial(selectedCompanyDetail.id);
                  setSelectedCompanyDetail(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl cursor-pointer shadow-md shadow-purple-700/30"
              >
                Extender 7 Días
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer del Superpanel */}
      <footer className="border-t border-slate-800/80 py-5 bg-[#0b1120] text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Nixi Cloud SaaS · Módulo de Control de Infraestructura y Clientes</span>
          <span className="text-[11px] text-purple-400 font-mono">ID Superadmin: ROOT-MASTER-01</span>
        </div>
      </footer>
    </div>
  );
};
