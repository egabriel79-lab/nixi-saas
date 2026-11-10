import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Building2,
  UploadCloud,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Check,
  X,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  Filter,
  Image as ImageIcon,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useBcv } from '../../context/BcvContext';
import { Invoice } from '../../types';
import { useData } from '../../context/DataContext';

export interface BankMovement {
  id: string;
  date: string;
  reference: string;
  bank: string;
  amountText: string;
  amountUsd: number;
  amountVes?: number;
  currency: 'VES' | 'USD';
  status: 'sin_conciliar' | 'conciliado';
  matchedInvoice?: {
    id: string;
    number: string;
    client: string;
    amount: number;
    reconciledDate?: string;
  };
}

interface ReconciliationModuleProps {
  invoices?: Invoice[];
  onMarkInvoiceAsPaid?: (invoiceId: string, paymentMethod: string, reference: string) => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

const INITIAL_MOVEMENTS: BankMovement[] = [
  {
    id: 'mov-1',
    date: '01 Nov 2026',
    reference: '08492019482',
    bank: 'Banesco',
    amountText: 'Bs. 4.312.888,21',
    amountUsd: 4850.0,
    amountVes: 4312888.21,
    currency: 'VES',
    status: 'sin_conciliar',
  },
  {
    id: 'mov-2',
    date: '31 Oct 2026',
    reference: 'ZELLE-1234',
    bank: 'Zelle',
    amountText: '$1,200.00',
    amountUsd: 1200.0,
    currency: 'USD',
    status: 'sin_conciliar',
  },
  {
    id: 'mov-3',
    date: '30 Oct 2026',
    reference: '55443322',
    bank: 'Mercantil',
    amountText: 'Bs. 11.027.210,35',
    amountUsd: 12400.5,
    amountVes: 11027210.35,
    currency: 'VES',
    status: 'conciliado',
    matchedInvoice: {
      id: 'inv-002',
      number: 'FAC-2026-0890',
      client: 'Distribuidora Oriental de Alimentos S.A.',
      amount: 12400.5,
      reconciledDate: '30 Oct 2026 · 16:45',
    },
  },
];

export const ReconciliationModule: React.FC<ReconciliationModuleProps> = ({
  invoices,
  onMarkInvoiceAsPaid,
  onShowToast,
}) => {
  const { bcvRate, formatVes } = useBcv();
  const {
    movimientosBanco,
    facturas,
    vincularTransaccionAFactura,
    desvincularTransaccion,
    sincronizarBanco,
    importarExtracto,
  } = useData();

  // Unified movements from global DataContext
  const movements = movimientosBanco;

  // Real-time pending invoices from DataContext
  const availablePendingInvoices: Invoice[] = useMemo(() => {
    const list = invoices && invoices.length > 0 ? invoices : facturas;
    return list.filter((inv: Invoice) => inv.status !== 'pagada');
  }, [invoices, facturas]);

  // Reconciliation modal state
  const [selectedMovement, setSelectedMovement] = useState<BankMovement | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  // Detail modal state for already reconciled movements
  const [detailMovement, setDetailMovement] = useState<BankMovement | null>(null);

  // Import extract modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedBankToImport, setSelectedBankToImport] = useState('Banesco');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingExtract, setIsProcessingExtract] = useState(false);

  // Manage image preview URL creation and cleanup
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter & Search states
  const [filterStatus, setFilterStatus] = useState<'todos' | 'sin_conciliar' | 'conciliado'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // KPIs calculation
  const totalReconciled = movements
    .filter((m) => m.status === 'conciliado')
    .reduce((acc, curr) => acc + (curr.amountUsd || 0), 0);

  const pendingReconcileCount = movements.filter((m) => m.status === 'sin_conciliar').length;
  const pendingReconcileAmount = movements
    .filter((m) => m.status === 'sin_conciliar')
    .reduce((acc, curr) => acc + (curr.amountUsd || 0), 0);

  // Open reconciliation modal
  const handleOpenLinkModal = (movement: BankMovement) => {
    setSelectedMovement(movement);
    setInvoiceSearchQuery('');
    // Auto-select matching invoice if exact amount matches
    const exactMatch = availablePendingInvoices.find(
      (inv) => Math.abs(inv.amount - movement.amountUsd) < 1
    );
    setSelectedInvoiceId(
      exactMatch
        ? exactMatch.id
        : availablePendingInvoices.length > 0
        ? availablePendingInvoices[0].id
        : ''
    );
  };

  // Confirm Reconciliation
  const handleConfirmReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovement) return;

    const matchedInv = availablePendingInvoices.find((inv) => inv.id === selectedInvoiceId);
    if (!matchedInv) {
      onShowToast('Por favor selecciona una factura pendiente del selector', 'warning');
      return;
    }

    // Call DataContext linking logic (reconciles movement, marks invoice as paid, reduces client debt, updates Dashboard metrics)
    vincularTransaccionAFactura(selectedMovement.id, matchedInv.id);

    onShowToast(`✅ Movimiento vinculado exitosamente a ${matchedInv.number}. Factura marcada como Pagada.`, 'success');
    setSelectedMovement(null);
  };

  // Unlink / Undo reconciliation
  const handleUnlinkMovement = (movementId: string) => {
    desvincularTransaccion(movementId);
    setDetailMovement(null);
    onShowToast('↩️ Vinculación deshecha. Movimiento devuelto a estado pendiente.', 'info');
  };

  // 1. Simulate bank synchronization (2 seconds + toast "✅ Sincronización bancaria exitosa")
  const handleSyncBank = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      sincronizarBanco();
      onShowToast('✅ Sincronización bancaria exitosa', 'success');
    }, 2000);
  };

  // Drag and drop and file handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 2. Simulate extract file processing with validation and 1.5s loading state
  const handleImportExtract = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      onShowToast('⚠️ Selecciona una imagen o archivo primero', 'warning');
      return;
    }

    setIsProcessingExtract(true);

    setTimeout(() => {
      setIsProcessingExtract(false);
      setIsImportModalOpen(false);

      // Prepend 3 movements as indicated in the prompt
      const newMovs: BankMovement[] = [
        {
          id: `mov-imp-${Date.now()}-1`,
          date: '01 Nov 2026',
          reference: `EXT-${Math.floor(100000 + Math.random() * 900000)}`,
          bank: selectedBankToImport,
          amountText: '$3,200.00',
          amountUsd: 3200.0,
          currency: 'USD',
          status: 'sin_conciliar',
        },
        {
          id: `mov-imp-${Date.now()}-2`,
          date: '01 Nov 2026',
          reference: `EXT-${Math.floor(100000 + Math.random() * 900000)}`,
          bank: selectedBankToImport,
          amountText: '$1,200.00',
          amountUsd: 1200.0,
          currency: 'USD',
          status: 'sin_conciliar',
        },
        {
          id: `mov-imp-${Date.now()}-3`,
          date: '01 Nov 2026',
          reference: `EXT-${Math.floor(100000 + Math.random() * 900000)}`,
          bank: selectedBankToImport,
          amountText: '$550.00',
          amountUsd: 550.0,
          currency: 'USD',
          status: 'sin_conciliar',
        },
      ];

      importarExtracto(newMovs);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onShowToast('✅ Procesamiento de extracto exitoso', 'success');
    }, 2000);
  };

  const filteredMovements = movements.filter((m) => {
    if (filterStatus !== 'todos' && m.status !== filterStatus) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchBank = m.bank.toLowerCase().includes(q);
      const matchRef = m.reference.toLowerCase().includes(q);
      const matchAmount = m.amountText.toLowerCase().includes(q) || m.amountUsd.toString().includes(q);
      const matchClient = m.matchedInvoice?.client.toLowerCase().includes(q);
      const matchInvoiceNum = m.matchedInvoice?.number.toLowerCase().includes(q);
      return Boolean(matchBank || matchRef || matchAmount || matchClient || matchInvoiceNum);
    }
    return true;
  });

  const filteredInvoices = availablePendingInvoices.filter((inv) => {
    if (!invoiceSearchQuery.trim()) return true;
    const q = invoiceSearchQuery.toLowerCase().trim();
    return (
      inv.number.toLowerCase().includes(q) ||
      inv.client.toLowerCase().includes(q) ||
      inv.amount.toString().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Encabezado del Módulo & 2. Botones de Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Conciliación bancaria y pagos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Cruza los movimientos de tu banco con las facturas pendientes de forma automática y segura.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
          {/* Secondary Button: Sincronizar Banco */}
          <button
            type="button"
            onClick={handleSyncBank}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Conectar con la API bancaria para obtener últimos extractos"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isSyncing ? 'Procesando...' : 'Sincronizar Banco'}</span>
          </button>

          {/* Primary Blue Button: + Importar Extracto Bancario */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>+ Importar Extracto Bancario</span>
          </button>
        </div>
      </div>

      {/* 3. Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* KPI 1: Total Conciliado */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Conciliado
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              ${totalReconciled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-0.5">
              ≈ {formatVes(totalReconciled * bcvRate)}
            </div>
          </div>
        </div>

        {/* KPI 2: Por Conciliar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Por Conciliar
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
              ${pendingReconcileAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-0.5">
              ≈ {formatVes(pendingReconcileAmount * bcvRate)}
            </div>
          </div>
        </div>

        {/* KPI 3: Movimientos Pendientes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Movimientos Pendientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {pendingReconcileCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                movimientos sin vincular
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Requieren asignación a comprobante fiscal
            </span>
          </div>
        </div>
      </div>

      {/* 4. Lista de Movimientos Bancarios (Diseño de Tarjetas) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table/Cards Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900">
              Movimientos Recientes del Banco
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {movements.length} transacciones
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {(['todos', 'sin_conciliar', 'conciliado'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st === 'todos'
                  ? 'Todos'
                  : st === 'sin_conciliar'
                  ? 'Sin conciliar'
                  : 'Conciliados'}
              </button>
            ))}
          </div>
        </div>

        {movements.length === 0 ? (
          <div className="p-10 sm:p-14 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200/80 shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 max-w-md">
              No hay movimientos pendientes. Sincroniza tu banco para empezar
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Conecta tus extractos bancarios para conciliar pagos automáticamente con tus facturas emitidas.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSyncBank}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sincronizar Banco</span>
              </button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-slate-500" />
                <span>Importar Extracto</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Barra de Búsqueda funcional (debajo de los botones de filtro) */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por banco o referencia..."
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Movement Cards List */}
            <div className="divide-y divide-slate-100">
              {filteredMovements.map((mov) => {
                const isReconciled = mov.status === 'conciliado';
                return (
                  <div
                    key={mov.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left Side: Bank, Date, Ref & Amount */}
                    <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                      {/* Bank Icon Badge */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                          mov.bank === 'Zelle'
                            ? 'bg-purple-50 border-purple-200 text-purple-700 font-bold'
                            : mov.bank === 'Banesco'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                            : 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {mov.bank}
                          </span>
                          {/* State Badge: Naranja para Sin conciliar / Verde para Conciliado */}
                          {isReconciled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Conciliado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Sin conciliar</span>
                            </span>
                          )}
                        </div>

                        {/* Metadata line: Fecha + Ref */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                          <span>Fecha: <strong className="text-slate-700 font-medium">{mov.date}</strong></span>
                          <span className="text-slate-300">·</span>
                          <span>Ref: <strong className="text-slate-800 font-mono font-medium">{mov.reference}</strong></span>
                        </div>

                        {/* Matched Invoice info if already reconciled */}
                        {isReconciled && mov.matchedInvoice && (
                          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200 px-2.5 py-1 rounded-md mt-2">
                            <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Vinculado a: <strong>{mov.matchedInvoice.number}</strong> ({mov.matchedInvoice.client})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Amounts + Action Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Amount Display */}
                      <div className="text-left sm:text-right">
                        <div className="text-sm sm:text-base font-bold font-mono text-slate-900">
                          {mov.amountText}
                        </div>
                        {mov.currency === 'VES' && (
                          <div className="text-xs font-mono text-slate-500">
                            ≈ ${mov.amountUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </div>
                        )}
                        {mov.currency === 'USD' && (
                          <div className="text-xs font-mono text-slate-500">
                            ≈ {formatVes(mov.amountUsd * bcvRate)}
                          </div>
                        )}
                      </div>

                      {/* Action Button: "Vincular a Factura" or "Ver detalle" */}
                      {!isReconciled ? (
                        <button
                          type="button"
                          onClick={() => handleOpenLinkModal(mov)}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                        >
                          Vincular a Factura
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetailMovement(mov)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Ver información completa o desvincular"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ver detalle</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredMovements.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No se encontraron movimientos</p>
                  <p className="text-slate-400 mt-1">Prueba con otro término de búsqueda o cambia el filtro de estado.</p>
                  {(searchTerm || filterStatus !== 'todos') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('todos');
                      }}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Restablecer filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 5. MODAL DE CONCILIACIÓN: "Vincular Movimiento Bancario" */}
      {selectedMovement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header (Fixed) */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Vincular Movimiento Bancario
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Asocia este movimiento bancario con una factura emitida
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMovement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with scroll */}
            <form onSubmit={handleConfirmReconciliation} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {/* Resumen del movimiento bancario seleccionado */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Resumen del Movimiento Bancario
                    </span>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Sin conciliar
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Banco:</span>
                      <strong className="text-slate-900">{selectedMovement.bank}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Referencia:</span>
                      <strong className="text-slate-900 font-mono">{selectedMovement.reference}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fecha del Abono:</span>
                      <strong className="text-slate-900">{selectedMovement.date}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Monto Registrado:</span>
                      <strong className="text-slate-900 font-mono text-sm text-blue-700">
                        {selectedMovement.amountText}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Selector Dropdown de Facturas Pendientes (Requerido: <select> con folio y monto) */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      Seleccionar Factura Pendiente *
                    </label>
                    {availablePendingInvoices.length === 0 ? (
                      <div className="p-3.5 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                        No hay facturas pendientes en el sistema para conciliar.
                      </div>
                    ) : (
                      <select
                        value={selectedInvoiceId}
                        onChange={(e) => setSelectedInvoiceId(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono cursor-pointer"
                      >
                        <option value="">-- Selecciona una factura pendiente --</option>
                        {availablePendingInvoices.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.number} - {inv.client} (${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Resumen de la Factura Seleccionada */}
                  {(() => {
                    const currentSelected = availablePendingInvoices.find((i) => i.id === selectedInvoiceId);
                    if (!currentSelected) return null;
                    const isExactMatch = Math.abs(currentSelected.amount - selectedMovement.amountUsd) < 1;

                    return (
                      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {currentSelected.number}
                          </span>
                          {isExactMatch ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              ✓ Monto exacto coincidente
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              Pendiente por cobrar
                            </span>
                          )}
                        </div>

                        <div className="text-slate-800 font-medium">
                          {currentSelected.client} · <span className="font-mono text-blue-700">RIF: {currentSelected.clientTaxId}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-blue-200/60 font-mono">
                          <span>Monto Factura: <strong>${currentSelected.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                          <span>Vencimiento: {currentSelected.dueDate}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Modal Fixed Footer Buttons */}
              <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedMovement(null)}
                  className="px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Vinculación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Ver Detalle de Movimiento Conciliado */}
      {detailMovement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Detalle de Movimiento Conciliado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailMovement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Movimiento auditado y conciliado con comprobante tributario.</span>
              </div>

              <div className="space-y-2.5 divide-y divide-slate-100">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Institución Financiera:</span>
                  <span className="font-bold text-slate-900">{detailMovement.bank}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Número de Referencia:</span>
                  <span className="font-mono font-bold text-slate-900">{detailMovement.reference}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Fecha del Abono:</span>
                  <span className="font-medium text-slate-900">{detailMovement.date}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Monto Conciliado:</span>
                  <span className="font-mono font-bold text-slate-900">{detailMovement.amountText}</span>
                </div>
                {detailMovement.matchedInvoice && (
                  <>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Factura Asignada:</span>
                      <span className="font-mono font-bold text-blue-600">{detailMovement.matchedInvoice.number}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Cliente / Razón Social:</span>
                      <span className="font-medium text-slate-900 text-right max-w-xs truncate">{detailMovement.matchedInvoice.client}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Fecha de Conciliación:</span>
                      <span className="text-slate-600">{detailMovement.matchedInvoice.reconciledDate}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleUnlinkMovement(detailMovement.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Deshacer la vinculación y devolver este movimiento a pendientes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Deshacer Vinculación</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailMovement(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Importar Extracto Bancario */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Importar Extracto Bancario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportExtract} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banco Emisor del Extracto
                </label>
                <select
                  value={selectedBankToImport}
                  onChange={(e) => setSelectedBankToImport(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="Banesco">Banesco Banco Universal</option>
                  <option value="Mercantil">Banco Mercantil</option>
                  <option value="Banco de Venezuela">Banco de Venezuela (BDV)</option>
                  <option value="BBVA Provincial">BBVA Provincial</option>
                  <option value="Bancamiga">Bancamiga</option>
                  <option value="Zelle">Zelle (USD)</option>
                  <option value="Banesco Panamá">Banesco Panamá (USD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Archivo o Comprobante de Pago
                </label>

                {/* Hidden File Input allowing phone gallery images, screenshots and documents */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*, .pdf, .csv, .txt, .ofx"
                  onChange={handleFileSelect}
                />

                {/* Interactive Drag & Drop Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-400 ring-offset-1'
                      : selectedFile
                      ? 'border-blue-400 bg-blue-50/30 hover:bg-blue-50/50'
                      : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      {previewUrl ? (
                        <div className="relative mb-2">
                          <img
                            src={previewUrl}
                            alt="Comprobante seleccionado"
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-2xs mx-auto"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-2xs">
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-2xs">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <p className="text-xs font-bold text-slate-800 max-w-full truncate px-2">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB {selectedFile.type?.startsWith('image/') ? '· Imagen' : ''}
                      </p>

                      <p className="text-[11px] font-medium text-blue-600 hover:text-blue-700 mt-2">
                        Haz clic para cambiar el archivo
                      </p>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-[11px] font-medium text-rose-500 hover:text-rose-700 hover:underline mt-1 transition-colors"
                      >
                        Quitar archivo
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className={`w-8 h-8 mx-auto mb-2 transition-transform ${isDragging ? 'scale-110 text-blue-600' : 'text-blue-500'}`} />
                      <p className="text-xs font-semibold text-slate-700">
                        {isDragging ? 'Suelta el archivo aquí' : 'Arrastra aquí el archivo o haz clic para buscar'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Permite fotos de galería (capturas) o archivos (.PDF, .CSV, .TXT, .OFX)
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isProcessingExtract}
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingExtract}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isProcessingExtract ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <span>Procesar Extracto</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
