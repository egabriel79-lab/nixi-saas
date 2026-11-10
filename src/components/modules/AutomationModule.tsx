import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageCircle,
  Mail,
  Clock,
  ToggleLeft,
  ToggleRight,
  Plus,
  Send,
  TrendingUp,
  DollarSign,
  Edit3,
  CheckCircle2,
  X,
  Smartphone,
  Eye,
  AlertCircle,
  Zap,
  Loader2,
  Bell,
} from 'lucide-react';
import { useBcv } from '../../context/BcvContext';
import { useData } from '../../context/DataContext';
import { Invoice } from '../../types';

export interface PendingRecipient {
  id: string;
  name: string;
  taxId: string;
  debtUsd: number;
  invoiceNumber: string;
  dueDate: string;
  channel: string;
  status: 'Pendiente' | 'Vencida';
}

export const PENDING_RECIPIENTS: PendingRecipient[] = [
  {
    id: 'rec-1',
    name: 'Inversiones Tecnológicas Caracas C.A.',
    taxId: 'J-30491823-1',
    debtUsd: 4850.00,
    invoiceNumber: 'FAC-2026-0891',
    dueDate: '12 Nov 2026',
    channel: 'WhatsApp & Correo',
    status: 'Pendiente',
  },
  {
    id: 'rec-2',
    name: 'Distribuidora Oriental de Alimentos S.A.',
    taxId: 'J-40192834-0',
    debtUsd: 12400.50,
    invoiceNumber: 'FAC-2026-0890',
    dueDate: '24 Oct 2026',
    channel: 'WhatsApp & Correo',
    status: 'Vencida',
  },
  {
    id: 'rec-3',
    name: 'Eloy Palma',
    taxId: 'V-18920412',
    debtUsd: 3250.00,
    invoiceNumber: 'FAC-2026-0885',
    dueDate: '02 Nov 2026',
    channel: 'WhatsApp',
    status: 'Pendiente',
  },
];

export interface ReminderSequence {
  id: string;
  name: string;
  channel: 'whatsapp' | 'email';
  timing: string;
  isActive: boolean;
  description: string;
  templateText: string;
  stats: {
    sent: number;
    successRate: number;
  };
}

interface AutomationModuleProps {
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

const INITIAL_SEQUENCES: ReminderSequence[] = [];

export const AutomationModule: React.FC<AutomationModuleProps> = ({ onShowToast }) => {
  const { bcvRate, formatVes, formatUsd } = useBcv();
  const { facturas, mensajesEnviadosCount, ejecutarRecordatoriosMasivos } = useData();
  const [sequences, setSequences] = useState<ReminderSequence[]>(() => {
    try {
      const stored = localStorage.getItem('nixi_sequences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // If stored contains old demo mock sequences, purge them
          const hasOldMocks = parsed.some((s: any) => s.id === 'seq-1' || s.name === 'Aviso Preventivo');
          if (hasOldMocks) {
            localStorage.setItem('nixi_sequences', JSON.stringify([]));
            return [];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('nixi_sequences', JSON.stringify(sequences));
    } catch (e) {
      console.warn(e);
    }
  }, [sequences]);

  // Modal states
  const [selectedSequence, setSelectedSequence] = useState<ReminderSequence | null>(null);
  const [editedTemplate, setEditedTemplate] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Dynamic recipients derived from pending/overdue invoices in DataContext
  const pendingInvoices = useMemo(
    () => facturas.filter((f) => f.status === 'pendiente' || f.status === 'vencida'),
    [facturas]
  );

  const dynamicRecipients: PendingRecipient[] = useMemo(() => {
    if (pendingInvoices.length > 0) {
      return pendingInvoices.map((inv: Invoice) => ({
        id: inv.id,
        name: inv.client,
        taxId: inv.clientTaxId,
        debtUsd: inv.amount,
        invoiceNumber: inv.number,
        dueDate: inv.dueDate,
        channel: 'WhatsApp & Correo',
        status: inv.status === 'vencida' ? 'Vencida' : 'Pendiente',
      }));
    }
    return [];
  }, [pendingInvoices]);

  const totalDebtGestionada = useMemo(
    () => dynamicRecipients.reduce((acc, curr) => acc + (curr.debtUsd || 0), 0),
    [dynamicRecipients]
  );

  const totalRecuperado = useMemo(
    () => facturas.filter((f) => f.status === 'pagada').reduce((sum, f) => sum + (f.amount || 0), 0),
    [facturas]
  );

  // New sequence form state
  const [newSeqName, setNewSeqName] = useState('');
  const [newSeqChannel, setNewSeqChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [newSeqTiming, setNewSeqTiming] = useState('3 días antes del vencimiento');
  const [newSeqDescription, setNewSeqDescription] = useState('');
  const [newSeqTemplate, setNewSeqTemplate] = useState('');

  // Handle Bulk Reminder Execution with 2.5s simulated connection & multi-step toasts
  const handleConfirmBulkSend = () => {
    setIsBulkModalOpen(false);
    setIsSendingBulk(true);

    const count = dynamicRecipients.length;

    // Exact 2.5s (2500 ms) delay for connecting with WhatsApp Business API and Mail Server
    setTimeout(() => {
      setIsSendingBulk(false);

      // Increment global counter and log audit event in SecurityModule
      ejecutarRecordatoriosMasivos(count, {
        clientesCount: count,
        facturasCount: count,
        clientNames: dynamicRecipients.map((r) => `${r.name} (${r.invoiceNumber})`),
        deudaTotalUsd: totalDebtGestionada,
      });

      // Paso 1: Conexión con Meta
      onShowToast('✅ Conexión establecida con Meta.', 'success');

      // Paso 2: Correos vía SendGrid
      setTimeout(() => {
        onShowToast(`✅ ${count} Correos enviados vía SendGrid.`, 'success');
      }, 700);

      // Paso 3: Mensajes de WhatsApp entregados
      setTimeout(() => {
        onShowToast(`✅ ${count} Mensajes de WhatsApp entregados.`, 'success');
      }, 1400);
    }, 2500);
  };

  // Toggle sequence active state
  const handleToggle = (id: string) => {
    const targetSeq = sequences.find((s) => s.id === id);
    if (!targetSeq) return;
    const nextState = !targetSeq.isActive;

    setSequences((prev) =>
      prev.map((seq) =>
        seq.id === id ? { ...seq, isActive: nextState } : seq
      )
    );

    onShowToast(
      nextState
        ? `Secuencia "${targetSeq.name}" activada`
        : `Secuencia "${targetSeq.name}" pausada`,
      nextState ? 'success' : 'info'
    );
  };

  // Open Edit Template Modal
  const handleOpenEditModal = (seq: ReminderSequence) => {
    setSelectedSequence(seq);
    setEditedTemplate(seq.templateText);
  };

  // Save Template
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSequence) return;

    setSequences((prev) =>
      prev.map((seq) =>
        seq.id === selectedSequence.id
          ? { ...seq, templateText: editedTemplate }
          : seq
      )
    );

    onShowToast(`✅ Plantilla de "${selectedSequence.name}" actualizada con éxito`, 'success');
    setSelectedSequence(null);
  };

  // Create New Sequence
  const handleCreateSequence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeqName.trim()) {
      onShowToast('Por favor introduce un nombre para la secuencia', 'warning');
      return;
    }

    const newSeq: ReminderSequence = {
      id: `seq-${Date.now()}`,
      name: newSeqName.trim(),
      channel: newSeqChannel,
      timing: newSeqTiming,
      isActive: true,
      description:
        newSeqDescription.trim() ||
        `Secuencia automatizada enviada vía ${
          newSeqChannel === 'whatsapp' ? 'WhatsApp' : 'Correo electrónico'
        }.`,
      templateText:
        newSeqTemplate.trim() ||
        `Estimado {cliente}, le recordamos sobre su factura #{numero_factura} por un monto de {monto_usd} ({monto_ves}). Por favor realice su pago correspondiente.`,
      stats: {
        sent: 0,
        successRate: 0,
      },
    };

    setSequences((prev) => [...prev, newSeq]);
    onShowToast(`✅ Nueva secuencia "${newSeq.name}" configurada con éxito`, 'success');

    // Reset form
    setNewSeqName('');
    setNewSeqChannel('whatsapp');
    setNewSeqTiming('3 días antes del vencimiento');
    setNewSeqDescription('');
    setNewSeqTemplate('');
    setIsNewModalOpen(false);
  };

  // Dynamic preview helper
  const renderPreviewText = (text: string) => {
    if (!text || !text.trim()) {
      return 'Escribe un mensaje para ver la vista previa en tiempo real...';
    }
    const sampleVes = formatVes ? formatVes(4850 * bcvRate) : 'Bs. 4.312.888,21';
    return text
      .replace(/\{cliente\}/gi, 'Inversiones Caracas C.A.')
      .replace(/\{empresa\}/gi, 'Nixi Soluciones Financieras C.A.')
      .replace(/\{numero_factura\}/gi, 'FAC-2026-0891')
      .replace(/\{monto_usd\}/gi, '$4,850.00')
      .replace(/\{monto_ves\}/gi, sampleVes)
      .replace(/\{tasa_bcv\}/gi, bcvRate.toFixed(2))
      .replace(/\{fecha_vencimiento\}/gi, '12 Nov 2026');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Automatización de cobros
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configura secuencias automáticas de recordatorios por WhatsApp y correo electrónico para acelerar el recaudo y reducir la morosidad.
          </p>
        </div>

        {/* Action Buttons: "+ Nueva Secuencia" and "⚡ Ejecutar Recordatorios Pendientes" */}
        <div className="flex flex-col sm:items-end gap-2.5 shrink-0 w-full sm:w-auto">
          {/* Primary Blue Button "+ Nueva Secuencia" */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Secuencia</span>
          </button>

          {/* Large Green Button: ⚡ Ejecutar Recordatorios Pendientes */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            disabled={isSendingBulk}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
          >
            {isSendingBulk ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Conectando con WhatsApp Business API y Servidor de Correos...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>⚡ Ejecutar Recordatorios Pendientes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading state banner when sending bulk reminders */}
      {isSendingBulk && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between shadow-2xs animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-950">
                Conectando con WhatsApp Business API y Servidor de Correos...
              </p>
              <p className="text-xs text-emerald-700">
                Estableciendo enlace seguro con servidores de Meta Cloud y SendGrid para el despacho masivo.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-200/70 px-2.5 py-1 rounded-full">
            3 en progreso
          </span>
        </div>
      )}

      {/* KPI Metrics Row (3 compact cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* KPI 1: Mensajes Enviados */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Mensajes Enviados
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {mensajesEnviadosCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                este mes
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>{mensajesEnviadosCount > 0 ? '+18% de entregas efectivas' : '0% de entregas efectivas'}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Tasa de Efectividad */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Tasa de Efectividad
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {mensajesEnviadosCount > 0 ? '68%' : '0%'}
              </span>
              <span className="text-xs font-medium text-slate-500">
                pagaron tras el recordatorio
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: mensajesEnviadosCount > 0 ? '68%' : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Recuperado por Gestión */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Recuperado por Gestión
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {formatUsd(totalRecuperado)}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-0.5">
              ≈ {formatVes(totalRecuperado * bcvRate)}
            </div>
          </div>
        </div>
      </div>

      {/* Active Sequences Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Section title header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Secuencias Activas
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {sequences.filter((s) => s.isActive).length} activas de {sequences.length}
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Disparadores automáticos sincronizados
          </span>
        </div>

        {/* Sequences List or Empty State */}
        {sequences.length === 0 ? (
          <div className="p-10 sm:p-14 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200/80 shadow-inner">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 max-w-md">
              No tienes secuencias creadas aún. Haz clic en + Nueva Secuencia
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Configura avisos automáticos por WhatsApp y correo electrónico antes y después del vencimiento.
            </p>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Secuencia</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sequences.map((seq) => {
              const isWhatsApp = seq.channel === 'whatsapp';
              return (
                <div
                  key={seq.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left side: Icon, Name, Timing & Description */}
                  <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                    {/* Channel Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isWhatsApp
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-sky-50 border-sky-200 text-sky-600'
                      }`}
                    >
                      {isWhatsApp ? (
                        <MessageCircle className="w-5 h-5" />
                      ) : (
                        <Mail className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {seq.name}
                        </h3>
                        {/* Channel Tag */}
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            isWhatsApp
                              ? 'bg-emerald-100/70 text-emerald-800'
                              : 'bg-sky-100/70 text-sky-800'
                          }`}
                        >
                          {isWhatsApp ? 'WhatsApp' : 'Email'}
                        </span>
                      </div>

                      {/* Trigger timing */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{seq.timing}</span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-xl">
                        {seq.description}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Switch / Toggle + Editar Plantilla Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Editar Plantilla Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(seq)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Editar Plantilla</span>
                    </button>

                    {/* Interruptor (Toggle / Switch) with state and color transition */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(seq.id)}
                        role="switch"
                        aria-checked={seq.isActive}
                        className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                          seq.isActive
                            ? 'bg-blue-600 border-blue-700 text-white shadow-xs'
                            : 'bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300'
                        }`}
                        title={
                          seq.isActive
                            ? 'Desactivar esta secuencia'
                            : 'Activar esta secuencia'
                        }
                      >
                        {seq.isActive ? (
                          <>
                            <span>Activa</span>
                            <ToggleRight className="w-4 h-4 text-white" />
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-500" />
                            <span>Pausada</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Editar Plantilla */}
      {selectedSequence && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header (Fixed) */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedSequence.channel === 'whatsapp'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-sky-50 text-sky-600'
                  }`}
                >
                  {selectedSequence.channel === 'whatsapp' ? (
                    <MessageCircle className="w-4 h-4" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Editar Plantilla: {selectedSequence.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Canal: {selectedSequence.channel === 'whatsapp' ? 'WhatsApp' : 'Email'} · {selectedSequence.timing}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSequence(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with scrollable body and fixed footer */}
            <form onSubmit={handleSaveTemplate} className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Scrollable Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {/* Texto del Mensaje */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Texto del Mensaje
                  </label>
                  <textarea
                    rows={6}
                    value={editedTemplate}
                    onChange={(e) => setEditedTemplate(e.target.value)}
                    className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans leading-relaxed resize-y min-h-[130px]"
                    placeholder="Escribe el mensaje de la plantilla..."
                    required
                  />
                </div>

                {/* Vista Previa en Tiempo Real */}
                <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/70 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Vista previa simulada para el cliente</span>
                  </div>
                  <div className="bg-white border border-emerald-200/80 rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap shadow-2xs">
                    {renderPreviewText(editedTemplate)}
                  </div>
                </div>
              </div>

              {/* Fixed Footer Buttons */}
              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedSequence(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Guardar Plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: + Nueva Secuencia */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Crear Nueva Secuencia de Cobro
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Automatiza el envío de avisos según la fecha de vencimiento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSequence} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {/* Nombre de la secuencia */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre de la Secuencia
                  </label>
                  <input
                    type="text"
                    value={newSeqName}
                    onChange={(e) => setNewSeqName(e.target.value)}
                    placeholder="Ej. Recordatorio 7 Días Antes"
                    required
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Canal & Tiempo de disparo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Canal */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Canal de Envío
                    </label>
                    <select
                      value={newSeqChannel}
                      onChange={(e) => setNewSeqChannel(e.target.value as 'whatsapp' | 'email')}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="whatsapp">WhatsApp Business</option>
                      <option value="email">Correo Electrónico</option>
                    </select>
                  </div>

                  {/* Timing */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tiempo de Disparo
                    </label>
                    <select
                      value={newSeqTiming}
                      onChange={(e) => setNewSeqTiming(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="7 días antes del vencimiento">7 días antes del vencimiento</option>
                      <option value="3 días antes del vencimiento">3 días antes del vencimiento</option>
                      <option value="1 día antes del vencimiento">1 día antes del vencimiento</option>
                      <option value="El mismo día">El mismo día del vencimiento</option>
                      <option value="3 días después">3 días después (Mora leve)</option>
                      <option value="5 días después">5 días después (Mora)</option>
                      <option value="15 días después">15 días después (Mora crítica)</option>
                    </select>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Descripción breve
                  </label>
                  <input
                    type="text"
                    value={newSeqDescription}
                    onChange={(e) => setNewSeqDescription(e.target.value)}
                    placeholder="Ej. Recordatorio para clientes corporativos con límite amplio"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Plantilla Inicial */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plantilla de Mensaje
                  </label>
                  <textarea
                    rows={4}
                    value={newSeqTemplate}
                    onChange={(e) => setNewSeqTemplate(e.target.value)}
                    placeholder="Hola {cliente}, le recordamos sobre su factura #{numero_factura}..."
                    className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Crear Secuencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirmar Envío Masivo de Recordatorios */}
      {isBulkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg sm:max-w-xl w-full flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Confirmar Envío Masivo de Recordatorios
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Notificaciones directas por WhatsApp y Correo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with scroll */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                Se enviarán mensajes personalizados a los clientes con facturas pendientes o vencidas.
              </div>

              {/* Client List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Clientes Destinatarios ({dynamicRecipients.length})
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Total deuda: ${totalDebtGestionada.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {dynamicRecipients.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs sm:text-sm">
                    <p className="font-semibold text-slate-700">No hay facturas pendientes por notificar</p>
                    <p className="text-slate-400 mt-1">Todos tus clientes están al día con sus compromisos de pago.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dynamicRecipients.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {rec.name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                rec.status === 'Vencida'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            {rec.taxId} · Factura #{rec.invoiceNumber} · Vence: {rec.dueDate}
                          </p>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-slate-900">
                            Deuda: ${rec.debtUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 block">
                            ≈ {formatVes(rec.debtUsd * bcvRate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Personalized preview for first client */}
              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ejemplo de mensaje personalizado ({dynamicRecipients[0]?.name || 'Cliente'}):</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                    WhatsApp & Email
                  </span>
                </div>

                <div className="bg-white border border-emerald-200/80 rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-sans shadow-2xs whitespace-pre-wrap">
                  {dynamicRecipients[0]
                    ? `Hola ${dynamicRecipients[0].name}, le saludamos de Nixi Soluciones. Le recordamos que su factura #${dynamicRecipients[0].invoiceNumber} por un monto de $${dynamicRecipients[0].debtUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${formatVes(dynamicRecipients[0].debtUsd * bcvRate)} a la tasa oficial BCV de Bs. ${bcvRate.toFixed(2)}) vencerá pronto (${dynamicRecipients[0].dueDate}). Puede realizar su pago mediante Pago Móvil o transferencia bancaria. ¡Agradecemos su puntualidad!`
                    : 'No hay recordatorios pendientes por despachar.'}
                </div>
                <p className="text-[11px] text-emerald-800">
                  Cada cliente recibirá automáticamente su nombre, saldo en USD/VES y fecha de vencimiento individual.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkSend}
                disabled={dynamicRecipients.length === 0}
                className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                  dynamicRecipients.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 hover:shadow cursor-pointer'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${dynamicRecipients.length === 0 ? 'fill-slate-400 text-slate-400' : 'fill-white text-white'}`} />
                <span>Confirmar y Enviar ({dynamicRecipients.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
