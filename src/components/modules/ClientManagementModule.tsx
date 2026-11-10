import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  FileText,
  X,
  CreditCard,
  Building2,
  DollarSign,
  TrendingUp,
  Send,
  Edit2,
  Check,
  Trash2,
  Loader2,
} from 'lucide-react';
import { ClientRisk, Invoice } from '../../types';
import { useBcv } from '../../context/BcvContext';
import { useData } from '../../context/DataContext';
import { supabase, isSupabaseConfigured } from '../../supabaseClient.js';

interface ClientManagementModuleProps {
  invoices?: Invoice[];
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
  onNavigateToSection?: (sectionId: 'automatizacion' | 'facturacion') => void;
  userRole?: string;
}

const INITIAL_CLIENTS: ClientRisk[] = [
  {
    id: 'cli-001',
    name: 'Inversiones Tecnológicas Caracas C.A.',
    taxId: 'J-30491823-1',
    phone: '+58 412-3928192',
    email: 'finanzas@inversteccaracas.com',
    creditLimit: 10000.0,
    usedCredit: 4850.0,
    riskLevel: 'bajo',
    lastPaymentDate: '20 Oct 2026',
    registeredDate: '12 Ene 2025',
    notes: 'Cliente corporativo solvente. Pagos puntuales mediante transferencia y pago móvil.',
  },
  {
    id: 'cli-002',
    name: 'Distribuidora Oriental de Alimentos S.A.',
    taxId: 'J-40192834-0',
    phone: '+58 414-8273910',
    email: 'cobranzas@distri-oriental.com',
    creditLimit: 15000.0,
    usedCredit: 14500.0,
    riskLevel: 'medio',
    lastPaymentDate: '15 Oct 2026',
    registeredDate: '03 Mar 2024',
    notes: 'Línea de crédito en el 96.7%. Mantener monitoreo preventivo antes de nuevas emisiones.',
  },
  {
    id: 'cli-003',
    name: 'Eloy Palma (Persona Natural)',
    taxId: 'V-14324186',
    phone: '+58 424-9182374',
    email: 'eloy.palma.ve@gmail.com',
    creditLimit: 2000.0,
    usedCredit: 3250.0,
    riskLevel: 'alto',
    lastPaymentDate: '28 Sep 2026',
    registeredDate: '19 Ago 2025',
    notes: 'Límite de crédito superado en $1,250.00. Facturas vencidas. Retener despachos a crédito.',
  },
];

type RiskFilter = 'todos' | 'bajo' | 'medio' | 'alto';

export const ClientManagementModule: React.FC<ClientManagementModuleProps> = ({
  invoices = [],
  onShowToast,
  onNavigateToSection,
  userRole = 'Administrador',
}) => {
  const { bcvRate, formatVes } = useBcv();
  const {
    clientes,
    facturas,
    agregarCliente,
    actualizarLimiteCliente,
    eliminarCliente,
    currentUser,
  } = useData();
  const effectiveRole = currentUser?.role || userRole;
  const isContador = effectiveRole.toLowerCase().includes('contad');

  // Centralized clients collection
  const clients = clientes;

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('todos');

  // Modal states
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // Active client being inspected in detail modal (always live with DataContext)
  const activeClientView = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [selectedClientId, clients]);

  // Backward-compatibility alias
  const selectedClientForView = activeClientView;

  // New Client Form state & validation
  const [newClientName, setNewClientName] = useState('');
  const [newClientTaxId, setNewClientTaxId] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCreditLimit, setNewClientCreditLimit] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');
  const [newClientSubmitted, setNewClientSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form validity checks
  const isClientNameValid = newClientName.trim().length > 0;
  const isClientTaxIdValid = newClientTaxId.trim().length > 0;
  const isClientLimitValid = parseFloat(newClientCreditLimit) > 0;
  const isNewClientFormValid = isClientNameValid && isClientTaxIdValid && isClientLimitValid;

  // Editing limit state in client detail modal
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [adjustedLimit, setAdjustedLimit] = useState('');

  // Calculated metrics
  const totalClientsCount = clients.length;
  const totalDebt = useMemo(
    () => clients.reduce((acc, c) => acc + c.usedCredit, 0),
    [clients]
  );
  const totalCreditLimit = useMemo(
    () => clients.reduce((acc, c) => acc + c.creditLimit, 0),
    [clients]
  );
  const highRiskCount = useMemo(
    () => clients.filter((c) => c.riskLevel === 'alto').length,
    [clients]
  );

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Risk filter
      if (riskFilter !== 'todos' && client.riskLevel !== riskFilter) {
        return false;
      }
      // Search term filter (by name or RIF/Cédula)
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(query);
        const matchesRif = client.taxId.toLowerCase().includes(query);
        if (!matchesName && !matchesRif) return false;
      }
      return true;
    });
  }, [clients, riskFilter, searchTerm]);

  // Handle open New Client Modal
  const handleOpenNewClientModal = () => {
    setNewClientName('');
    setNewClientTaxId('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientCreditLimit('5000');
    setNewClientNotes('');
    setNewClientSubmitted(false);
    setIsNewClientModalOpen(true);
  };

  // Handle Save New Client: Inserta en Supabase y sincroniza con el estado local
  const handleSaveNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewClientSubmitted(true);

    if (!isNewClientFormValid || isLoading) {
      if (!isNewClientFormValid) {
        onShowToast('Por favor completa todos los campos requeridos.', 'warning');
      }
      return;
    }

    const parsedLimit = parseFloat(newClientCreditLimit) || 0;
    const nombre = newClientName.trim();
    const rif = newClientTaxId.trim().toUpperCase();
    const email = newClientEmail.trim() || null;
    const limite_credito = parsedLimit;

    setIsLoading(true);

    try {
      // 1. Inserción en la tabla 'clientes' de Supabase
      const { data, error } = await supabase
        .from('clientes')
        .insert([{ nombre, rif, limite_credito, email }]);

      if (error) {
        console.warn('Supabase Notice/Error:', error.message);
        const isTableMissing =
          error.message.toLowerCase().includes('relation') &&
          error.message.toLowerCase().includes('does not exist');
        if (isTableMissing) {
          onShowToast('⚠️ La tabla "clientes" aún no ha sido creada en Supabase. Guarda localmente.', 'warning');
        } else {
          onShowToast(`Error de Supabase: ${error.message}`, 'warning');
        }
      } else {
        onShowToast('✅ Cliente guardado en Supabase con éxito', 'success');
      }

      // 2. Mantener sincronizado el estado local de la aplicación
      agregarCliente({
        name: nombre,
        taxId: rif,
        phone: newClientPhone.trim() || undefined,
        email: email || undefined,
        creditLimit: parsedLimit,
        usedCredit: 0.0,
        riskLevel: 'bajo',
        lastPaymentDate: 'Sin pagos registrados',
        registeredDate: 'Hoy',
        notes: newClientNotes.trim() || 'Cliente recién incorporado a la cartera.',
      });

      setIsNewClientModalOpen(false);
      setNewClientSubmitted(false);
    } catch (err: any) {
      console.error('Error insertando cliente en Supabase:', err);
      onShowToast(`Error al procesar: ${err.message || 'Fallo de conexión'}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Save Adjusted Limit in View Modal
  const handleSaveAdjustedLimit = (clientId: string) => {
    const val = parseFloat(adjustedLimit);
    if (isNaN(val) || val <= 0) {
      onShowToast('El nuevo límite debe ser un monto válido mayor a 0.', 'warning');
      return;
    }

    actualizarLimiteCliente(clientId, val);
    setIsEditingLimit(false);
    onShowToast(`Límite de crédito actualizado a $${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'success');
  };

  // Handle Send Collection Reminder
  const handleSendClientReminder = (client: ClientRisk) => {
    onShowToast(`📩 Recordatorio de cobro enviado a ${client.name} por WhatsApp y Correo.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Gestión de clientes y riesgo crediticio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra tu cartera, evalúa el historial de pagos y controla los límites de crédito.
          </p>
        </div>

        {/* Primary Action Button (Solo Administrador) */}
        {!isContador && (
          <button
            onClick={handleOpenNewClientModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Cliente</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium truncate">Clientes en Cartera</span>
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight whitespace-nowrap truncate">{totalClientsCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">Empresas y personas registradas</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium truncate">Deuda Total Activa</span>
            <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600 tracking-tight whitespace-nowrap truncate">
            ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5 whitespace-nowrap truncate">
            {formatVes(totalDebt * bcvRate)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium truncate">Límite Global Otorgado</span>
            <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight whitespace-nowrap truncate">
            ${totalCreditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5 whitespace-nowrap truncate">
            {formatVes(totalCreditLimit * bcvRate)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs min-w-0">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium truncate">Riesgo Alto / Excedidos</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-rose-600 tracking-tight whitespace-nowrap truncate">{highRiskCount}</p>
          <p className="text-[11px] text-rose-700 font-medium mt-0.5 truncate">
            {highRiskCount > 0 ? 'Requiere gestión inmediata' : 'Cartera al día'}
          </p>
        </div>
      </div>

      {/* 2. Search & Risk Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o RIF..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Risk Level Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setRiskFilter('todos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                riskFilter === 'todos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({clients.length})
            </button>

            <button
              type="button"
              onClick={() => setRiskFilter('bajo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                riskFilter === 'bajo'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${riskFilter === 'bajo' ? 'bg-white' : 'bg-emerald-500'}`} />
              Riesgo Bajo
            </button>

            <button
              type="button"
              onClick={() => setRiskFilter('medio')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                riskFilter === 'medio'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${riskFilter === 'medio' ? 'bg-white' : 'bg-amber-500'}`} />
              Riesgo Medio
            </button>

            <button
              type="button"
              onClick={() => setRiskFilter('alto')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
                riskFilter === 'alto'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${riskFilter === 'alto' ? 'bg-white' : 'bg-rose-500'}`} />
              Riesgo Alto
            </button>
          </div>
        </div>
      </div>

      {/* 3. Clients Cards Grid / List (Responsive Mobile-First) */}
      <div className="space-y-4">
        {clients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200/80 shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 max-w-md">
              No tienes clientes registrados. Haz clic en + Nuevo Cliente para agregar el primero
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Registra tu primer cliente para asignarle una línea de crédito, emitirle facturas fiscales y monitorear su historial de pagos.
            </p>
            {!isContador && (
              <button
                type="button"
                onClick={handleOpenNewClientModal}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Nuevo Cliente</span>
              </button>
            )}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No se encontraron clientes</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No hay clientes que coincidan con la búsqueda o el filtro de riesgo seleccionado.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setRiskFilter('todos');
              }}
              className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => {
              const usagePercent = (client.usedCredit / client.creditLimit) * 100;
              const isExceeded = client.usedCredit > client.creditLimit;

              // Color configs based on risk / usage
              let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
              let progressColor = 'bg-emerald-500';
              let riskLabel = 'Riesgo Bajo';

              if (client.riskLevel === 'alto' || isExceeded) {
                badgeColor = 'bg-rose-50 text-rose-700 border-rose-200/80';
                progressColor = 'bg-rose-500';
                riskLabel = 'Riesgo Alto';
              } else if (client.riskLevel === 'medio' || usagePercent >= 70) {
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200/80';
                progressColor = 'bg-amber-500';
                riskLabel = 'Riesgo Medio';
              }

              return (
                <div
                  key={client.id}
                  onClick={() => {
                    if (!isContador) {
                      setSelectedClientId(client.id);
                      setAdjustedLimit(client.creditLimit.toString());
                      setIsEditingLimit(false);
                    }
                  }}
                  className={`bg-white rounded-xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                    !isContador ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isExceeded
                      ? 'border-rose-300 hover:border-rose-400 ring-1 ring-rose-200/50'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    {/* Card Top: Client Name & Risk Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <h3
                            className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate"
                            title={client.name}
                          >
                            {client.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                            {client.taxId}
                          </span>
                        </div>
                      </div>

                      {/* Risk Badge */}
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 inline-flex items-center gap-1 ${badgeColor}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            client.riskLevel === 'alto'
                              ? 'bg-rose-500'
                              : client.riskLevel === 'medio'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        {riskLabel}
                      </span>
                    </div>

                    {/* Exceeded Warning Alert Banner if applicable */}
                    {isExceeded && (
                      <div className="mb-3.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span className="leading-tight">
                          ¡Límite de crédito excedido por $
                          {(client.usedCredit - client.creditLimit).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                          !
                        </span>
                      </div>
                    )}

                    {/* Financial Numbers: Deuda vs Límite */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 my-2">
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 block font-medium truncate">
                          Deuda Actual
                        </span>
                        <span
                          className={`text-sm sm:text-base font-bold font-mono tracking-tight whitespace-nowrap truncate block ${
                            isExceeded
                              ? 'text-rose-600'
                              : client.usedCredit > 0
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          ${client.usedCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5 whitespace-nowrap truncate">
                          {formatVes(client.usedCredit * bcvRate)}
                        </span>
                      </div>

                      <div className="text-right min-w-0">
                        <span className="text-[11px] text-slate-400 block font-medium truncate">
                          Límite Asignado
                        </span>
                        <span className="text-sm sm:text-base font-bold font-mono text-slate-800 tracking-tight whitespace-nowrap truncate block">
                          ${client.creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5 whitespace-nowrap truncate">
                          {formatVes(client.creditLimit * bcvRate)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Credit Used */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 text-[11px]">Línea de Crédito:</span>
                        <span className="font-mono text-[11px] font-semibold text-slate-700">
                          {usagePercent.toFixed(1)}% utilizado
                        </span>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${progressColor}`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isExceeded ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendClientReminder(client);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200/80 cursor-pointer"
                        title="Enviar aviso de regularización por WhatsApp/Email"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gestionar Cobro</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Último pago: {client.lastPaymentDate || 'N/A'}
                      </span>
                    )}

                    {!isContador && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClientId(client.id);
                          setAdjustedLimit(client.creditLimit.toString());
                          setIsEditingLimit(false);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Ficha</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Modal: + Nuevo Cliente */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Registrar Nuevo Cliente</h3>
                  <p className="text-xs text-slate-500">Asigna datos fiscales y límite crediticio en USD</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveNewClient} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  placeholder="ej. Inversiones San Antonio C.A."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white rounded-lg text-slate-900 transition-colors focus:outline-none ${
                    newClientSubmitted && !isClientNameValid
                      ? 'border border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                      : 'border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                />
                {newClientSubmitted && !isClientNameValid && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">Este campo es requerido</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    RIF o Cédula *
                  </label>
                  <input
                    type="text"
                    placeholder="ej. J-50123456-7"
                    value={newClientTaxId}
                    onChange={(e) => setNewClientTaxId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm font-mono bg-white rounded-lg text-slate-900 uppercase transition-colors focus:outline-none ${
                      newClientSubmitted && !isClientTaxIdValid
                        ? 'border border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                        : 'border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                  {newClientSubmitted && !isClientTaxIdValid && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">Este campo es requerido</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Límite de Crédito ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="100"
                      placeholder="5000.00"
                      value={newClientCreditLimit}
                      onChange={(e) => setNewClientCreditLimit(e.target.value)}
                      className={`w-full pl-7 pr-3.5 py-2.5 text-sm font-mono bg-white rounded-lg text-slate-900 transition-colors focus:outline-none ${
                        newClientSubmitted && !isClientLimitValid
                          ? 'border border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                          : 'border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {newClientSubmitted && !isClientLimitValid ? (
                    <p className="text-[11px] text-red-500 font-medium mt-1">Este campo es requerido</p>
                  ) : parseFloat(newClientCreditLimit) > 0 ? (
                    <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                      ≈ {formatVes((parseFloat(newClientCreditLimit) || 0) * bcvRate)} (Tasa BCV)
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="+58 414 1234567"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="administracion@empresa.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notas de Riesgo o Cobranza (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Información sobre plazos acordados o persona de contacto..."
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Modal Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isNewClientFormValid || isLoading}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 min-h-[38px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Guardando en Supabase...</span>
                    </>
                  ) : (
                    <span>Guardar Cliente</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Ver Ficha Detallada del Cliente */}
      {selectedClientForView && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {selectedClientForView.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-200 rounded text-slate-700 font-semibold">
                      {selectedClientForView.taxId}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      Registrado: {selectedClientForView.registeredDate || '2025'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Risk Status Assessment */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  selectedClientForView.riskLevel === 'alto' ||
                  selectedClientForView.usedCredit > selectedClientForView.creditLimit
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : selectedClientForView.riskLevel === 'medio'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {selectedClientForView.riskLevel === 'alto' ||
                selectedClientForView.usedCredit > selectedClientForView.creditLimit ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : selectedClientForView.riskLevel === 'medio' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Evaluación de Riesgo:{' '}
                      {selectedClientForView.riskLevel === 'alto'
                        ? 'Alto (Crítico)'
                        : selectedClientForView.riskLevel === 'medio'
                        ? 'Medio (Vigilar)'
                        : 'Bajo (Solvente)'}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {selectedClientForView.riskLevel === 'alto' ||
                    selectedClientForView.usedCredit > selectedClientForView.creditLimit
                      ? 'El cliente ha superado su límite de crédito asignado o registra retrasos. Se sugiere retener nuevos despachos y gestionar cobro prioritario.'
                      : selectedClientForView.riskLevel === 'medio'
                      ? 'La deuda actual supera el 70% del límite crediticio. Se recomienda emitir recordatorio preventivo antes de nuevas facturaciones.'
                      : 'El cliente mantiene un historial de pago puntual y su saldo pendiente está dentro de los márgenes seguros autorizados.'}
                  </p>
                </div>
              </div>

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Límite de Crédito</span>
                    {!isEditingLimit && (
                      <button
                        onClick={() => {
                          setAdjustedLimit(selectedClientForView.creditLimit.toString());
                          setIsEditingLimit(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 p-0.5"
                        title="Ajustar límite"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {isEditingLimit ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-xs font-mono text-slate-500">$</span>
                      <input
                        type="number"
                        value={adjustedLimit}
                        onChange={(e) => setAdjustedLimit(e.target.value)}
                        className="w-24 px-1.5 py-0.5 text-xs font-mono border border-blue-400 rounded bg-white text-slate-900"
                      />
                      <button
                        onClick={() => handleSaveAdjustedLimit(selectedClientForView.id)}
                        className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        title="Guardar nuevo límite"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setIsEditingLimit(false)}
                        className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                        title="Cancelar edición"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                        ${selectedClientForView.creditLimit.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {formatVes(selectedClientForView.creditLimit * bcvRate)}
                      </p>
                    </>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium block">Deuda Actual</span>
                  <p
                    className={`text-lg font-bold font-mono mt-0.5 ${
                      selectedClientForView.usedCredit > selectedClientForView.creditLimit
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}
                  >
                    ${selectedClientForView.usedCredit.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {formatVes(selectedClientForView.usedCredit * bcvRate)}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium block">Crédito Disponible</span>
                  <p
                    className={`text-lg font-bold font-mono mt-0.5 ${
                      selectedClientForView.creditLimit - selectedClientForView.usedCredit < 0
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    ${Math.max(
                      0,
                      selectedClientForView.creditLimit - selectedClientForView.usedCredit
                    ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {selectedClientForView.creditLimit - selectedClientForView.usedCredit < 0
                      ? 'Límite sobregirado'
                      : formatVes(
                          (selectedClientForView.creditLimit - selectedClientForView.usedCredit) *
                            bcvRate
                        )}
                  </p>
                </div>
              </div>

              {/* Progress Bar in View Modal */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">Ratio de Consumo Crediticio:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {(
                      (selectedClientForView.usedCredit / selectedClientForView.creditLimit) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedClientForView.usedCredit > selectedClientForView.creditLimit
                        ? 'bg-rose-500'
                        : selectedClientForView.usedCredit / selectedClientForView.creditLimit >= 0.7
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        (selectedClientForView.usedCredit / selectedClientForView.creditLimit) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                  Canales de Contacto
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono">{selectedClientForView.phone || 'No registrado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedClientForView.email || 'No registrado'}</span>
                  </div>
                </div>
                {selectedClientForView.notes && (
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-200/60 mt-2">
                    <span className="font-medium text-slate-600">Observaciones: </span>
                    {selectedClientForView.notes}
                  </p>
                )}
              </div>

              {/* Invoices Associated with this Client */}
              <div>
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2.5">
                  Documentos y Facturas Asociadas
                </span>
                {(() => {
                  const allInvoices = invoices && invoices.length > 0 ? invoices : facturas;
                  const clientInvoices = allInvoices.filter(
                    (inv) =>
                      Boolean(selectedClientForView.taxId && inv.clientTaxId.trim().toUpperCase() === selectedClientForView.taxId.trim().toUpperCase()) ||
                      inv.client.toLowerCase().includes(selectedClientForView.name.toLowerCase().slice(0, 15)) ||
                      selectedClientForView.name.toLowerCase().includes(inv.client.toLowerCase().slice(0, 15))
                  );

                  if (clientInvoices.length === 0) {
                    return (
                      <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200 text-xs text-slate-500">
                        No hay facturas registradas en la sesión actual para este cliente.
                      </div>
                    );
                  }

                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {clientInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="truncate">
                              <span className="font-mono font-medium text-slate-900 block truncate">
                                {inv.number}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Vencimiento: {inv.dueDate}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-slate-900 block">
                              ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                inv.status === 'pagada'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : inv.status === 'vencida'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const clientName = selectedClientForView.name;
                    eliminarCliente(selectedClientForView.id);
                    setSelectedClientId(null);
                    onShowToast(`Cliente "${clientName}" eliminado del sistema.`, 'info');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Cliente</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                {selectedClientForView.usedCredit > 0 && (
                  <button
                    onClick={() => {
                      handleSendClientReminder(selectedClientForView);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Recordatorio</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedClientId(null)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
