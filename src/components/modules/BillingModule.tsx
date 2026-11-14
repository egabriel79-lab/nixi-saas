import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  Send,
  Eye,
  FileCheck2,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Calculator,
  CreditCard,
  BellRing,
  Loader2,
  Mail,
  MessageSquare,
  ShieldCheck,
  Check,
  Trash2,
  FileText,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { Invoice } from '../../types';
import { useBcv } from '../../context/BcvContext';
import { useData } from '../../context/DataContext';
import { InvoiceView } from '../InvoiceView';
import { supabase, isSupabaseConfigured } from '../../supabaseClient.js';

interface BillingModuleProps {
  invoices: Invoice[];
  onAddInvoice: (invoice: Omit<Invoice, 'id'> & { id?: string }) => void;
  onSendReminder: (invoice: Invoice) => void;
  onDownloadPdf: (invoice: Invoice) => void;
  onMarkAsPaid?: (invoiceId: string, paymentMethod: string, reference: string) => void;
  onSendBulkReminders?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  invoices,
  onAddInvoice,
  onSendReminder,
  onDownloadPdf,
  onMarkAsPaid,
  onSendBulkReminders,
  onShowToast,
}) => {
  const { bcvRate, formatUsd, formatVes, usdToVes } = useBcv();
  const { clientes, eliminarFactura, currentUser } = useData();
  const isContador = currentUser?.role?.toLowerCase().includes('contad') ?? false;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendiente' | 'pagada' | 'vencida'>('todas');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Interactive Mock Modals requested
  const [isBulkReminderModalOpen, setIsBulkReminderModalOpen] = useState(false);
  const [noticeInvoice, setNoticeInvoice] = useState<Invoice | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);

  // Quick payment form state
  const [paymentInvoiceId, setPaymentInvoiceId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria');
  const [paymentReference, setPaymentReference] = useState('');

  // New Invoice Form State with SENIAT & Dual Currency
  const [newNumber, setNewNumber] = useState(`FAC-2026-0${892 + invoices.length}`);
  const [newClient, setNewClient] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [inputCurrency, setInputCurrency] = useState<'USD' | 'VES'>('USD');
  const [newBaseAmount, setNewBaseAmount] = useState('');
  const [ivaPercent, setIvaPercent] = useState<number>(16); // SENIAT default 16%
  const [newDueDate, setNewDueDate] = useState('');
  const [newItemsCount, setNewItemsCount] = useState('1');

  // Loading & validation states for modals
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [invoiceSubmitted, setInvoiceSubmitted] = useState(false);

  // Form validity checks for Emitir Factura
  const isInvoiceNumberValid = newNumber.trim().length > 0;
  const isInvoiceTaxIdValid = newTaxId.trim().length > 0;
  const isInvoiceClientValid = newClient.trim().length > 0;
  const isInvoiceBaseValid = parseFloat(newBaseAmount) > 0;
  const isInvoiceDueDateValid = newDueDate.trim().length > 0;
  const isInvoiceFormValid = isInvoiceNumberValid && isInvoiceTaxIdValid && isInvoiceClientValid && isInvoiceBaseValid && isInvoiceDueDateValid;

  // Form validity checks for Registrar Pago
  const effectivePaymentInvoiceId = paymentInvoiceId || (invoices.filter((i) => i.status !== 'pagada').length > 0 ? invoices.filter((i) => i.status !== 'pagada')[0].id : '');
  const isPaymentInvoiceValid = Boolean(effectivePaymentInvoiceId);
  const isPaymentRefValid = paymentReference.trim().length > 0;
  const isPaymentFormValid = isPaymentInvoiceValid && isPaymentRefValid;

  // Helper to trigger toast
  const triggerToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    if (onShowToast) {
      onShowToast(message, type);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientTaxId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'todas' ? true : inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const pendingInvoices = invoices.filter((i) => i.status !== 'pagada');

  // Aggregate Metrics & Percentages for Progress Bars
  const metrics = useMemo(() => {
    const totalAmount = invoices.reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = invoices
      .filter((i) => i.status === 'pendiente')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const overdueAmount = invoices
      .filter((i) => i.status === 'vencida')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const paidAmount = invoices
      .filter((i) => i.status === 'pagada')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const paidRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
    const pendingPercent = totalAmount > 0 ? Math.round((pendingAmount / totalAmount) * 100) : 0;
    const overduePercent = totalAmount > 0 ? Math.round((overdueAmount / totalAmount) * 100) : 0;

    return {
      totalUsd: totalAmount,
      totalVes: usdToVes(totalAmount),
      pendingUsd: pendingAmount,
      pendingVes: usdToVes(pendingAmount),
      pendingPercent,
      overdueUsd: overdueAmount,
      overdueVes: usdToVes(overdueAmount),
      overduePercent,
      paidUsd: paidAmount,
      paidVes: usdToVes(paidAmount),
      rate: paidRate,
    };
  }, [invoices, usdToVes]);

  // Calculations for Modal in real-time
  const modalCalculations = useMemo(() => {
    const rawVal = parseFloat(newBaseAmount) || 0;
    if (rawVal <= 0) {
      return {
        baseUsd: 0,
        baseVes: 0,
        ivaUsd: 0,
        ivaVes: 0,
        totalUsd: 0,
        totalVes: 0,
      };
    }

    let baseUsd = 0;
    let baseVes = 0;

    if (inputCurrency === 'USD') {
      baseUsd = rawVal;
      baseVes = rawVal * bcvRate;
    } else {
      baseVes = rawVal;
      baseUsd = bcvRate > 0 ? rawVal / bcvRate : 0;
    }

    const ivaUsd = baseUsd * (ivaPercent / 100);
    const ivaVes = baseVes * (ivaPercent / 100);
    const totalUsd = baseUsd + ivaUsd;
    const totalVes = baseVes + ivaVes;

    return {
      baseUsd,
      baseVes,
      ivaUsd,
      ivaVes,
      totalUsd,
      totalVes,
    };
  }, [newBaseAmount, inputCurrency, ivaPercent, bcvRate]);

  // Abre el componente InvoiceView para imprimir o descargar como PDF
  const handlePdfClick = (inv: Invoice) => {
    setSelectedInvoice(inv);
  };

  // Handle Bulk Reminder Submission
  const handleConfirmBulkReminders = () => {
    setIsBulkReminderModalOpen(false);
    triggerToast('✅ Recordatorios enviados exitosamente', 'success');
  };

  // Handle Single Invoice Notice Submission (WhatsApp / Email)
  const handleSendNoticeAction = (method: 'whatsapp' | 'email') => {
    if (!noticeInvoice) return;

    if (method === 'whatsapp') {
      const montoUsd = formatUsd(noticeInvoice.amount);
      const montoBs = formatVes(usdToVes(noticeInvoice.amount));

      // 1. Construir el Mensaje exacto solicitado
      const mensaje = `Hola *${noticeInvoice.client}*, le saludamos de *Nixi*. Le recordamos que tiene pendiente la factura *N° ${noticeInvoice.number}* por un monto de *${montoUsd}* (aprox. *${montoBs}* a la tasa BCV). Por favor, realice su pago para mantener su crédito activo. ¡Gracias!`;

      // 2 & 3. Codificar y generar la URL con número de prueba venezolano
      const urlWhatsApp = `https://wa.me/584141234567?text=${encodeURIComponent(mensaje)}`;

      try {
        window.open(urlWhatsApp, '_blank');
      } catch (e) {
        console.warn('Popup blocked:', e);
      }

      // 4. Cerrar el modal y notificar al usuario
      setNoticeInvoice(null);
      triggerToast('✅ Abriendo WhatsApp con el aviso de cobro...', 'success');
    } else {
      setNoticeInvoice(null);
      triggerToast('✅ Correo enviado exitosamente al cliente', 'success');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceSubmitted(true);
    if (!isInvoiceFormValid || isCreatingInvoice) {
      if (!isInvoiceFormValid) triggerToast('Por favor completa todos los campos requeridos.', 'warning');
      return;
    }

    const rawVal = parseFloat(newBaseAmount);
    const totalUsd = modalCalculations.totalUsd;
    const totalVes = modalCalculations.totalVes;

    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    setIsCreatingInvoice(true);
    try {
      // 1. Inserción en Supabase (tabla facturas)
      const { data, error } = await supabase
        .from('facturas')
        .insert([
          {
            numero_factura: newNumber.trim(),
            monto_usd: totalUsd,
            monto_ves: totalVes,
            tasa_bcv: bcvRate,
            estado: 'Pendiente',
          },
        ])
        .select();

      if (error) {
        console.warn('Aviso de Supabase al insertar factura:', error.message);
        const isTableMissing =
          error.message.toLowerCase().includes('relation') &&
          error.message.toLowerCase().includes('does not exist');
        if (isTableMissing) {
          triggerToast('⚠️ La tabla "facturas" aún no ha sido creada en Supabase. Guarda localmente.', 'warning');
        } else {
          triggerToast(`Error de Supabase: ${error.message}`, 'warning');
        }
      } else {
        triggerToast('✅ Factura registrada en Supabase exitosamente', 'success');
      }

      // 2. Mantener sincronizado el estado local (preservando id real si Supabase lo devolvió)
      const insertedId = Array.isArray(data) && data[0]?.id ? String(data[0].id) : undefined;
      onAddInvoice({
        ...(insertedId ? { id: insertedId } : {}),
        number: newNumber.trim(),
        client: newClient.trim(),
        clientTaxId: newTaxId.trim(),
        issueDate: formattedDate,
        dueDate: newDueDate.trim(),
        amount: totalUsd,
        currency: inputCurrency,
        originalAmount: rawVal,
        originalCurrency: inputCurrency,
        ivaPercent: ivaPercent,
        status: 'pendiente',
        itemsCount: parseInt(newItemsCount, 10) || 1,
      });

      setIsModalOpen(false);
      setInvoiceSubmitted(false);
      setNewClient('');
      setNewTaxId('');
      setNewBaseAmount('');
      setNewDueDate('');
      setNewNumber(`FAC-2026-0${893 + invoices.length}`);
    } catch (err: any) {
      console.error('Error insertando factura en Supabase:', err);
      triggerToast(`Error al emitir factura: ${err.message || 'Fallo de conexión'}`, 'warning');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSubmitted(true);
    if (!isPaymentFormValid || isProcessingPayment) return;

    const targetInvoice = invoices.find((i) => i.id === effectivePaymentInvoiceId);
    if (!targetInvoice || !onMarkAsPaid) return;

    setIsProcessingPayment(true);
    setTimeout(() => {
      onMarkAsPaid(
        targetInvoice.id,
        paymentMethod,
        paymentReference.trim()
      );
      setIsProcessingPayment(false);
      setIsPaymentModalOpen(false);
      setPaymentSubmitted(false);
      setPaymentInvoiceId('');
      setPaymentReference('');
    }, 2000);
  };

  const handleConfirmDeleteInvoice = async () => {
    if (!invoiceToDelete || isDeletingInvoice) return;

    setIsDeletingInvoice(true);
    try {
      const factura = invoiceToDelete;

      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('facturas')
          .delete()
          .eq('id', factura.id);

        if (error) {
          const isLocalTempId = String(factura.id).startsWith('inv-');
          if (isLocalTempId && factura.number) {
            const fallbackRes = await supabase
              .from('facturas')
              .delete()
              .eq('numero_factura', factura.number);
            if (fallbackRes.error) {
              console.warn('Aviso al eliminar factura en Supabase:', fallbackRes.error.message);
            }
          } else {
            console.error('Error al eliminar factura en Supabase:', error.message);
            triggerToast(`Error al eliminar factura: ${error.message}`, 'warning');
            return;
          }
        }
      }

      eliminarFactura(factura.id);
      setInvoiceToDelete(null);
      triggerToast('Factura eliminada correctamente', 'success');
    } catch (err: any) {
      console.error('Error inesperado al eliminar factura:', err);
      triggerToast(`Error al eliminar factura: ${err?.message || 'Fallo de conexión'}`, 'warning');
    } finally {
      setIsDeletingInvoice(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Module Title & Action Buttons Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Facturación y gestión de documentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Emisión legal SENIAT en doble moneda (USD / VES) y conciliación a tasa oficial BCV.
          </p>
        </div>

        {/* Action Buttons Column */}
        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          {/* Primary Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Emitir Factura</span>
          </button>

          {/* Quick Actions Row: Registrar Pago & Enviar Recordatorio */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                if (pendingInvoices.length > 0) {
                  setPaymentInvoiceId(pendingInvoices[0].id);
                }
                setIsPaymentModalOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 rounded-lg transition-colors cursor-pointer"
              title="Registrar pago recibido en cuenta"
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Registrar Pago</span>
            </button>

            {/* Main Dashboard: Enviar Recordatorio (Opens Mass Reminder Modal) */}
            <button
              onClick={() => setIsBulkReminderModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 rounded-lg transition-colors cursor-pointer"
              title="Enviar recordatorios automáticos de cobro"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-600" />
              <span>Enviar Recordatorio</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards (Compact padding py-3 / py-3.5 & Visual Progress Bars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Facturado */}
        <div className="bg-white py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Facturado</span>
              <FileCheck2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums block">
                {formatUsd(metrics.totalUsd)}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums block">
                {formatVes(metrics.totalVes)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>{invoices.length} facturas emitidas</span>
              <span className="font-semibold text-blue-700">100%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Pendiente de Cobro with Progress Bar */}
        <div className="bg-white py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Pendiente de Cobro</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums block">
                {formatUsd(metrics.pendingUsd)}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums block">
                {formatVes(metrics.pendingVes)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Cuentas por cobrar</span>
              <span className="font-mono font-bold text-amber-600">{metrics.pendingPercent}% del total</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(metrics.pendingPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Facturas Vencidas with Progress Bar */}
        <div className="bg-white py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Facturas Vencidas</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-bold text-rose-600 font-mono tabular-nums block">
                {formatUsd(metrics.overdueUsd)}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums block">
                {formatVes(metrics.overdueVes)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Cartera en mora</span>
              <span className="font-mono font-bold text-rose-600">{metrics.overduePercent}% del total</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(metrics.overduePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasa de Recuperación with Progress Bar */}
        <div className="bg-white py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Tasa de Recuperación</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono tabular-nums block">
                {metrics.rate}%
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums block">
                Cobrado: {formatUsd(metrics.paidUsd)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Efectividad de cobro</span>
              <span className="font-mono font-bold text-emerald-600">{metrics.rate}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(metrics.rate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Segmented status filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {(['todas', 'pendiente', 'pagada', 'vencida'] as const).map((filter) => {
            const labels = {
              todas: 'Todas',
              pendiente: 'Pendientes',
              pagada: 'Pagadas',
              vencida: 'Vencidas',
            };
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, RIF o folio..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Invoices List Container (Mobile Stacked Cards + Desktop Table) */}
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200/80 shadow-inner">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 max-w-md">
            Aún no hay facturas emitidas. Haz clic en + Emitir Factura para empezar
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Genera comprobantes fiscales con numeración de control, cálculo de IVA oficial y conversión automática a la tasa oficial del BCV.
          </p>
          {!isContador && (
            <button
              type="button"
              onClick={() => {
                setInvoiceSubmitted(false);
                setIsModalOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Emitir Factura</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* 1. MÓVIL: Tarjetas Apiladas (sm:hidden) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredInvoices.length === 0 ? (
            <div className="py-10 text-center px-4">
              <p className="font-semibold text-slate-700 text-sm">No se encontraron facturas</p>
              <p className="text-xs text-slate-400 mt-1">
                Ajusta el término de búsqueda o selecciona otro filtro de estado.
              </p>
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const vesAmount = usdToVes(inv.amount);
              const isGenerating = generatingPdfId === inv.id;

              return (
                <div key={inv.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                  {/* Fila superior: Folio y Estado */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {inv.number}
                    </span>
                    {inv.status === 'pagada' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Pagada
                      </span>
                    )}
                    {inv.status === 'pendiente' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Pendiente
                      </span>
                    )}
                    {inv.status === 'vencida' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Vencida
                      </span>
                    )}
                  </div>

                  {/* Cliente y RIF */}
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 leading-snug">
                      {inv.client}
                    </h4>
                    <span className="font-mono text-xs font-medium text-blue-700 block mt-0.5">
                      RIF: {inv.clientTaxId}
                    </span>
                  </div>

                  {/* Fechas y Monto Dual */}
                  <div className="flex items-end justify-between pt-1 border-t border-slate-100 text-xs">
                    <div className="space-y-0.5 text-slate-500">
                      <div>Emisión: <span className="text-slate-700">{inv.issueDate}</span></div>
                      <div>
                        Vence:{' '}
                        <span className={inv.status === 'vencida' ? 'font-semibold text-rose-600' : 'text-slate-700'}>
                          {inv.dueDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-slate-900 block leading-tight">
                        {formatUsd(inv.amount)}
                      </span>
                      <span className="text-xs font-mono text-slate-500 block">
                        {formatVes(vesAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción móvil interactivos */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>Detalle</span>
                    </button>

                    <button
                      onClick={() => handlePdfClick(inv)}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer disabled:opacity-75"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          <span className="text-blue-700 font-medium">Generando...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>PDF</span>
                        </>
                      )}
                    </button>

                    {inv.status !== 'pagada' && (
                      <button
                        onClick={() => setNoticeInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-md transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Aviso</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInvoiceToDelete(inv)}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-md transition-colors cursor-pointer"
                      title="Eliminar factura"
                      aria-label={`Eliminar factura ${inv.number}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. TABLET Y ESCRITORIO: Tabla Completa (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 sm:px-6">Documento</th>
                <th className="py-3 px-4">Cliente / RIF</th>
                <th className="py-3 px-4">Emisión</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4 text-right">Importe (USD / Bs.)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700">No se encontraron facturas</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Intenta ajustar el término de búsqueda o cambia el filtro de estado.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const vesAmount = usdToVes(inv.amount);
                  const isGenerating = generatingPdfId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-mono font-semibold text-slate-900 text-xs sm:text-sm">
                          {inv.number}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {inv.itemsCount} {inv.itemsCount === 1 ? 'concepto' : 'conceptos'} · IVA {inv.ivaPercent || 16}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1 max-w-xs">
                          {inv.client}
                        </div>
                        <span className="text-[11px] font-mono font-medium text-blue-700">
                          {inv.clientTaxId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {inv.issueDate}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium whitespace-nowrap">
                        <span
                          className={
                            inv.status === 'vencida'
                              ? 'text-rose-600 font-semibold'
                              : 'text-slate-600'
                          }
                        >
                          {inv.dueDate}
                        </span>
                      </td>

                      {/* Dual currency in table */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold tabular-nums text-slate-900">
                          {formatUsd(inv.amount)}
                        </div>
                        <div className="font-mono text-[11px] tabular-nums text-slate-500">
                          {formatVes(vesAmount)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'pagada' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Pagada
                          </span>
                        )}
                        {inv.status === 'pendiente' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pendiente
                          </span>
                        )}
                        {inv.status === 'vencida' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Vencida
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-medium cursor-pointer"
                            title="Ver detalle del comprobante SENIAT"
                            aria-label={`Ver detalle de factura ${inv.number}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalle</span>
                          </button>

                          <button
                            onClick={() => handlePdfClick(inv)}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-medium cursor-pointer disabled:opacity-75"
                            title="Descargar comprobante en formato PDF"
                            aria-label={`Descargar factura ${inv.number}`}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                                <span className="text-blue-700 font-medium">Generando...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </>
                            )}
                          </button>

                          {inv.status !== 'pagada' && (
                            <button
                              onClick={() => setNoticeInvoice(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors text-xs font-semibold cursor-pointer"
                              title="Enviar aviso de cobro al cliente"
                              aria-label={`Enviar aviso de cobro a ${inv.client}`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Aviso</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setInvoiceToDelete(inv)}
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar factura"
                            aria-label={`Eliminar factura ${inv.number}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table / List summary footer with BCV conversion note */}
        <div className="p-3 bg-slate-50/75 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Mostrando {filteredInvoices.length} de {invoices.length} facturas fiscales</span>
          <span className="font-mono tabular-nums text-slate-600">
            Tasa referencial BCV: <strong className="text-slate-900">Bs. {bcvRate.toFixed(2)}</strong> por USD
          </span>
        </div>
      </div>
      )}

      {/* MODAL 1: Enviar Recordatorios Masivos (Requerimiento 1) */}
      {isBulkReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900">
                <BellRing className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold">Enviar Recordatorios Masivos</h3>
              </div>
              <button
                onClick={() => setIsBulkReminderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-blue-50/70 rounded-xl p-3.5 border border-blue-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Send className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Se enviará un correo y un mensaje de WhatsApp a los clientes con facturas pendientes o vencidas.
                </p>
              </div>

              {/* Scope summary */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Destinatarios identificados:</span>
                  <span className="font-bold text-slate-900">{pendingInvoices.length} clientes</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Monto total por gestionar:</span>
                  <span className="font-mono font-bold text-blue-700">{formatUsd(metrics.pendingUsd + metrics.overdueUsd)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Canales de notificación:</span>
                  <span className="text-slate-800 font-medium">WhatsApp Business & Correo</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBulkReminderModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkReminders}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Confirmar Envío
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Enviar Aviso de Cobro Específico (Requerimiento 3) */}
      {noticeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold">Enviar Aviso de Cobro</h3>
              </div>
              <button
                onClick={() => setNoticeInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Se notificará al cliente el estado de su comprobante fiscal <strong>{noticeInvoice.number}</strong> con los datos de pago actualizados.
              </p>

              {/* Client and Debt Summary */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="pb-1.5 border-b border-slate-200/70">
                  <span className="text-[11px] text-slate-400 block">Razón Social:</span>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">{noticeInvoice.client}</p>
                  <p className="font-mono text-blue-700 font-medium text-xs mt-0.5">RIF: {noticeInvoice.clientTaxId}</p>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Fecha de Vencimiento:</span>
                    <span className={noticeInvoice.status === 'vencida' ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                      {noticeInvoice.dueDate} ({noticeInvoice.status.toUpperCase()})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Monto Pendiente:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm block">
                      {formatUsd(noticeInvoice.amount)}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 block">
                      {formatVes(usdToVes(noticeInvoice.amount))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Envío: WhatsApp y Correo */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSendNoticeAction('whatsapp')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendNoticeAction('email')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Enviar por Correo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Pago Rápido */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2 text-slate-900">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold">Registrar Pago de Factura</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterPaymentSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Factura Pendiente
                </label>
                {pendingInvoices.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No hay facturas pendientes o vencidas por cobrar.
                  </p>
                ) : (
                  <select
                    value={paymentInvoiceId}
                    onChange={(e) => setPaymentInvoiceId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  >
                    {pendingInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.number} - {inv.client} ({formatUsd(inv.amount)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Transferencia Bancaria Nacional">Transferencia Bancaria (Bs.)</option>
                  <option value="Pago Móvil Interbancario">Pago Móvil (Bs.)</option>
                  <option value="Zelle / ACH USD">Zelle / Transferencia USD</option>
                  <option value="Efectivo en Divisas">Efectivo USD</option>
                  <option value="Depósito en Cuenta Custodia">Depósito Cuenta Custodia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Referencia Bancaria *
                </label>
                <input
                  type="text"
                  placeholder="Ej. 08492019482 o ZELLE-1234"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className={`w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-lg font-mono transition-colors focus:outline-none ${
                    paymentSubmitted && !isPaymentRefValid
                      ? 'border border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                      : 'border border-slate-300 focus:ring-2 focus:ring-blue-600'
                  }`}
                />
                {paymentSubmitted && !isPaymentRefValid && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">Este campo es requerido</p>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold block text-slate-800 mb-0.5">Conciliación Automática:</span>
                Al confirmar, la factura cambiará inmediatamente a estado <strong>Pagada</strong> y se actualizarán las métricas de recuperación.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={isProcessingPayment}
                  className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isPaymentFormValid || isProcessingPayment}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <span>Confirmar Pago</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Emitir Nueva Factura Electrónica (Mobile-First) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Fijo */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Emitir Nueva Factura Electrónica
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cumplimiento SENIAT · Tasa BCV: <span className="font-mono font-semibold text-blue-700">Bs. {bcvRate.toFixed(2)}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form con cuerpo desplazable */}
            <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-4 sm:p-5 space-y-3 flex-1">
                {/* Fila 1: Folio y RIF en dos columnas incluso en móvil */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      N° Folio / Control *
                    </label>
                    <input
                      type="text"
                      value={newNumber}
                      onChange={(e) => setNewNumber(e.target.value)}
                      className={`w-full px-2.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-lg font-mono focus:bg-white focus:outline-none transition-colors ${
                        invoiceSubmitted && !isInvoiceNumberValid
                          ? 'border border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                          : 'border border-slate-300 focus:ring-2 focus:ring-blue-600'
                      }`}
                    />
                    {invoiceSubmitted && !isInvoiceNumberValid && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">Este campo es requerido</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 truncate">
                      RIF / Cédula *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. J-12345678-9"
                      value={newTaxId}
                      onChange={(e) => setNewTaxId(e.target.value)}
                      className={`w-full px-2.5 py-2 text-xs sm:text-sm bg-white rounded-lg focus:outline-none font-mono transition-colors ${
                        invoiceSubmitted && !isInvoiceTaxIdValid
                          ? 'border border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                          : 'border border-slate-300 focus:ring-2 focus:ring-blue-600'
                      }`}
                    />
                    {invoiceSubmitted && !isInvoiceTaxIdValid && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">Este campo es requerido</p>
                    )}
                  </div>
                </div>

                {/* Selector de Cliente de la Cartera */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Seleccionar de la Cartera de Clientes
                    </label>
                    <span className="text-[11px] text-blue-600 font-medium">
                      {clientes.length} clientes en sistema
                    </span>
                  </div>
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const c = clientes.find((item) => item.id === selectedId);
                      if (c) {
                        setNewClient(c.name);
                        setNewTaxId(c.taxId);
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-blue-50/70 border border-blue-200 text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="">-- Seleccionar cliente para autocompletar --</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.taxId} (Deuda: ${c.usedCredit.toLocaleString('en-US')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fila 2: Razón Social */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Razón Social o Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Inversiones Tecnológicas Caracas C.A."
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-lg focus:outline-none transition-colors ${
                      invoiceSubmitted && !isInvoiceClientValid
                        ? 'border border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                        : 'border border-slate-300 focus:ring-2 focus:ring-blue-600'
                    }`}
                  />
                  {invoiceSubmitted && !isInvoiceClientValid && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">Este campo es requerido</p>
                  )}
                </div>

                {/* Fila 3: Importe Base con Selector de Moneda (USD / VES) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Importe Base (Subtotal) *
                  </label>
                  <div
                    className={`flex rounded-lg overflow-hidden transition-colors ${
                      invoiceSubmitted && !isInvoiceBaseValid
                        ? 'border border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
                        : 'border border-slate-300 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent'
                    }`}
                  >
                    <select
                      value={inputCurrency}
                      onChange={(e) => setInputCurrency(e.target.value as 'USD' | 'VES')}
                      className="bg-slate-100 border-r border-slate-300 text-xs font-bold text-slate-700 px-2.5 py-2 outline-none cursor-pointer shrink-0"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="VES">VES (Bs.)</option>
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newBaseAmount}
                      onChange={(e) => setNewBaseAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white outline-none font-mono"
                    />
                  </div>
                  {invoiceSubmitted && !isInvoiceBaseValid && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">Este campo es requerido</p>
                  )}

                  {/* Cálculo automático de equivalencia según tasa BCV */}
                  <div className="mt-1 text-[11px] text-slate-500 font-mono">
                    {inputCurrency === 'USD' ? (
                      <span>
                        Equivalente:{' '}
                        <strong className="text-blue-700">
                          {formatVes(modalCalculations.baseVes)}
                        </strong>{' '}
                        (BCV: {bcvRate.toFixed(2)})
                      </span>
                    ) : (
                      <span>
                        Equivalente:{' '}
                        <strong className="text-blue-700">
                          {formatUsd(modalCalculations.baseUsd)}
                        </strong>{' '}
                        (BCV: {bcvRate.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Fila 4: Alícuota IVA (%) y Fecha de Vencimiento en la misma fila (2 cols en móvil) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 truncate">
                      Alícuota IVA (%)
                    </label>
                    <select
                      value={ivaPercent}
                      onChange={(e) => setIvaPercent(Number(e.target.value))}
                      className="w-full px-2 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value={16}>16% (General)</option>
                      <option value={8}>8% (Reducida)</option>
                      <option value={0}>0% (Exento)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 truncate">
                      Fecha Vencimiento *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 15 Nov 2026"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className={`w-full px-2.5 py-2 text-xs sm:text-sm bg-white rounded-lg focus:outline-none transition-colors ${
                        invoiceSubmitted && !isInvoiceDueDateValid
                          ? 'border border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                          : 'border border-slate-300 focus:ring-2 focus:ring-blue-600'
                      }`}
                    />
                    {invoiceSubmitted && !isInvoiceDueDateValid && (
                      <p className="text-[11px] text-red-500 font-medium mt-1">Este campo es requerido</p>
                    )}
                  </div>
                </div>

                {/* Resumen Fiscal Compacto con montos alineados a la derecha */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px] pb-1 border-b border-slate-200/70">
                    <Calculator className="w-3.5 h-3.5 text-blue-600" />
                    <span>Resumen de Liquidación Fiscal:</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 pt-0.5">
                    <span>Base Imponible:</span>
                    <div className="text-right font-mono tabular-nums">
                      <span className="text-slate-900 font-medium">{formatUsd(modalCalculations.baseUsd)}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">/ {formatVes(modalCalculations.baseVes)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>IVA Trasladado ({ivaPercent}%):</span>
                    <div className="text-right font-mono tabular-nums">
                      <span className="text-slate-900 font-medium">{formatUsd(modalCalculations.ivaUsd)}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">/ {formatVes(modalCalculations.ivaVes)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center font-bold text-slate-900">
                    <span>Total Factura:</span>
                    <div className="text-right font-mono tabular-nums">
                      <span className="text-blue-700 font-bold">{formatUsd(modalCalculations.totalUsd)}</span>
                      <span className="text-slate-500 text-[11px] font-medium ml-1.5">({formatVes(modalCalculations.totalVes)})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones inferiores fijos (sticky bottom-0) */}
              <div className="sticky bottom-0 bg-white px-4 py-3 sm:px-6 border-t border-slate-200 flex items-center justify-end gap-2.5 z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isInvoiceFormValid || isCreatingInvoice}
                  className={`px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 ${
                    !isInvoiceFormValid || isCreatingInvoice
                      ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-75'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer'
                  }`}
                >
                  {isCreatingInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Timbrando...</span>
                    </>
                  ) : (
                    <span>Timbrar y Guardar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirmar Eliminación de Factura */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Eliminar Factura
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingInvoice && setInvoiceToDelete(null)}
                disabled={isDeletingInvoice}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-100/60 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Cerrar confirmación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                ¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.
              </p>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Documento:</span>
                  <span className="font-mono font-bold text-slate-900">{invoiceToDelete.number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">
                    {invoiceToDelete.client}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Importe:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatUsd(invoiceToDelete.amount)}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInvoiceToDelete(null)}
                  disabled={isDeletingInvoice}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteInvoice}
                  disabled={isDeletingInvoice}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-70"
                >
                  {isDeletingInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sí, eliminar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA Y DOCUMENTO DE FACTURA NIXI (Imprimir / Guardar PDF) */}
      {selectedInvoice && (
        <InvoiceView
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onShowToast={triggerToast}
        />
      )}
  </div>
);
};
