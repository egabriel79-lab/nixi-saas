import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  UserCheck,
  Activity,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Copy,
  Users,
  Eye,
  Check,
  Laptop,
  Globe,
  Fingerprint,
  FileCode,
  Sliders,
  Crown,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface SecurityModuleProps {
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
  onNavigateToTeam?: () => void;
}

interface AuditLogEvent {
  id: string;
  auditCode: string;
  category: 'normal' | 'critico' | 'sesion';
  action: string;
  userName: string;
  userRole: string;
  timestamp: string;
  fullDate: string;
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  sha256Hash: string;
  payload: Record<string, any>;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Contador' | 'Auditor';
  isOwner?: boolean;
  avatarColor: string;
  lastActive: string;
  permissionsCount: number;
}

const INITIAL_AUDIT_LOGS: AuditLogEvent[] = [
  {
    id: '1',
    auditCode: 'AUD-2026-0891-AP',
    category: 'normal',
    action: 'Gabriel Echeverría aprobó la factura FAC-2026-0891',
    userName: 'Gabriel Echeverría',
    userRole: 'Administrador (Propietario)',
    timestamp: 'Hoy, 11:45 AM',
    fullDate: '02 Mar 2026 - 11:45:22 GMT-4',
    ipAddress: 'IP: 190.12.34.56',
    location: 'Caracas, Distrito Capital (CANTV)',
    device: 'MacBook Pro (Apple Silicon)',
    browser: 'Chrome 122.0.6261.94 (macOS 14.3)',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    payload: {
      factura_id: 'FAC-2026-0891',
      cliente: 'Corporación Metro C.A.',
      rif: 'J-29481920-3',
      monto_usd: 4850.00,
      tasa_bcv: 36.50,
      monto_ves: 177025.00,
      estado_previo: 'pendiente',
      estado_nuevo: 'pagada',
    },
  },
  {
    id: '2',
    auditCode: 'AUD-2026-9921-SC',
    category: 'critico',
    action: 'Intento de acceso bloqueado desde ubicación no habitual',
    userName: 'Sistema Nixi WAF',
    userRole: 'Cortafuegos Perimetral',
    timestamp: 'Hoy, 09:30 AM',
    fullDate: '02 Mar 2026 - 09:30:11 GMT-4',
    ipAddress: 'IP: 185.220.101.5',
    location: 'Frankfurt, Alemania (Nodo Tor detectado)',
    device: 'Dispositivo desconocido / Linux',
    browser: 'Automated Bot / Python-requests 2.31',
    sha256Hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    payload: {
      motivo: 'Dirección IP clasificada como nodo anónimo de riesgo',
      accion_tomada: 'Bloqueo preventivo de endpoint /api/auth',
      solicitudes_rechazadas: 14,
      alerta_enviada: 'correo_y_sms_administrador',
      codigo_defensa: 'SEC-GEO-RESTRICT-VE',
    },
  },
  {
    id: '3',
    auditCode: 'AUD-2026-7892-RE',
    category: 'normal',
    action: 'Carlos Peña vinculó movimiento bancario Ref: 7892341 a FAC-2026-0887',
    userName: 'Carlos Peña',
    userRole: 'Contador',
    timestamp: 'Ayer, 04:15 PM',
    fullDate: '01 Mar 2026 - 16:15:48 GMT-4',
    ipAddress: 'IP: 200.74.198.12',
    location: 'Maracaibo, Zulia (Inter Cable)',
    device: 'Dell Latitude (Windows 11 Pro)',
    browser: 'Microsoft Edge 122.0.2365.66',
    sha256Hash: '4a6b2c89f1823d09aef810931238491823901283091823091820391823091823',
    payload: {
      banco: 'Banco Mercantil C.A.',
      referencia_bancaria: '7892341',
      monto_conciliado: 1250.00,
      factura_afectada: 'FAC-2026-0887',
      saldo_restante: 0.00,
      metodo_conciliacion: 'manual_con_comprobante',
    },
  },
  {
    id: '4',
    auditCode: 'AUD-2026-5501-LG',
    category: 'sesion',
    action: 'Inicio de sesión exitoso desde Chrome en macOS',
    userName: 'Gabriel Echeverría',
    userRole: 'Administrador (Propietario)',
    timestamp: 'Ayer, 08:00 AM',
    fullDate: '01 Mar 2026 - 08:00:05 GMT-4',
    ipAddress: 'IP: 190.12.34.56',
    location: 'Caracas, Distrito Capital (CANTV)',
    device: 'MacBook Pro 16"',
    browser: 'Chrome 122.0.6261.94',
    sha256Hash: 'c7b5f10239102938102938109238102938102938102938102938102938102938',
    payload: {
      metodo_auth: 'credenciales_mas_2fa_totp',
      duracion_token: '8_horas',
      huella_dispositivo: 'fp_mac_9921_verified',
      sesion_valida_hasta: '01 Mar 2026 - 16:00:00 GMT-4',
    },
  },
  {
    id: '5',
    auditCode: 'AUD-2026-4412-CL',
    category: 'normal',
    action: 'María Rodríguez modificó el límite de crédito del cliente Inversiones Alpha C.A.',
    userName: 'María Rodríguez',
    userRole: 'Administradora',
    timestamp: '28 Feb, 03:20 PM',
    fullDate: '28 Feb 2026 - 15:20:19 GMT-4',
    ipAddress: 'IP: 190.12.34.56',
    location: 'Caracas, Distrito Capital (CANTV)',
    device: 'HP EliteBook (Windows 11)',
    browser: 'Firefox 123.0',
    sha256Hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    payload: {
      cliente_id: 'CLI-001',
      cliente: 'Inversiones Alpha C.A.',
      limite_anterior_usd: 15000.00,
      nuevo_limite_usd: 20000.00,
      justificacion: 'Aprobación de comité de crédito tras historial intachable de pagos',
    },
  },
];

const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    name: 'Gabriel Echeverría',
    email: 'gabriel@nixi.app',
    role: 'Administrador',
    isOwner: true,
    avatarColor: 'bg-blue-600',
    lastActive: 'En línea ahora',
    permissionsCount: 16,
  },
  {
    id: 'usr-2',
    name: 'María Rodríguez',
    email: 'maria.r@nixi.app',
    role: 'Administrador',
    avatarColor: 'bg-emerald-600',
    lastActive: 'Hoy, 10:15 AM',
    permissionsCount: 16,
  },
  {
    id: 'usr-3',
    name: 'Carlos Peña',
    email: 'carlos.cpa@nixi.app',
    role: 'Contador',
    avatarColor: 'bg-amber-600',
    lastActive: 'Ayer, 05:40 PM',
    permissionsCount: 9,
  },
];

export const SecurityModule: React.FC<SecurityModuleProps> = ({ onShowToast, onNavigateToTeam }) => {
  const { auditLogs, currentUser, teamMembers } = useData();
  const effectiveRole = currentUser?.role || 'Dueño';
  const isDueño = effectiveRole === 'Dueño';
  const isContador = effectiveRole.toLowerCase().includes('contad');

  // 1. Security Scan State
  const [lastScanTime, setLastScanTime] = useState('Hoy, 08:00 AM');
  const [isScanning, setIsScanning] = useState(false);

  // 2. Security Toggles State
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [isNewDeviceAlertEnabled, setIsNewDeviceAlertEnabled] = useState(true);
  const [isAutoLockEnabled, setIsAutoLockEnabled] = useState(false);

  // 3. Audit Log Filter & Detail Modal
  const [auditFilter, setAuditFilter] = useState<'todos' | 'criticos' | 'sesion'>('todos');
  const [selectedEvent, setSelectedEvent] = useState<AuditLogEvent | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Handler for manual security scan
  const handleRunSecurityScan = () => {
    setIsScanning(true);
    onShowToast('Iniciando escaneo de seguridad y verificación de integridad...', 'info');

    setTimeout(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const formattedTime = `Hoy, ${hours}:${minutes} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
      setLastScanTime(formattedTime);
      setIsScanning(false);
      onShowToast('✅ Escaneo de seguridad completado. 0 vulnerabilidades detectadas.', 'success');
    }, 2000);
  };

  // Toggle handlers with notifications
  const handleToggle2FA = () => {
    const nextState = !is2FAEnabled;
    setIs2FAEnabled(nextState);
    if (nextState) {
      onShowToast('✅ Autenticación de dos pasos (2FA) activada. Se solicitará token TOTP.', 'success');
    } else {
      onShowToast('⚠️ 2FA desactivado. El nivel de protección de la cuenta se ha reducido.', 'warning');
    }
  };

  const handleToggleDeviceAlerts = () => {
    const nextState = !isNewDeviceAlertEnabled;
    setIsNewDeviceAlertEnabled(nextState);
    if (nextState) {
      onShowToast('✅ Alertas de inicio de sesión en dispositivos nuevos activadas.', 'success');
    } else {
      onShowToast('Alertas de nuevos dispositivos desactivadas.', 'info');
    }
  };

  const handleToggleAutoLock = () => {
    const nextState = !isAutoLockEnabled;
    setIsAutoLockEnabled(nextState);
    if (nextState) {
      onShowToast('✅ Bloqueo automático por inactividad (15 min) activado.', 'success');
    } else {
      onShowToast('Bloqueo automático desactivado.', 'info');
    }
  };

  // Copy SHA256 hash helper
  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(true);
    onShowToast('Hash SHA-256 copiado al portapapeles para auditoría forense.', 'info');
    setTimeout(() => setCopiedHash(false), 2500);
  };

  // Filtered audit events
  const filteredEvents = auditLogs.filter((ev) => {
    if (auditFilter === 'criticos') return ev.category === 'critico';
    if (auditFilter === 'sesion') return ev.category === 'sesion';
    return true;
  });

  // Calculate roles counts from centralized team members
  const ownerCount = teamMembers.filter((u) => u.role === 'Dueño').length;
  const adminCount = teamMembers.filter((u) => u.role === 'Administrador').length;
  const accountantCount = teamMembers.filter((u) => u.role === 'Contador').length;
  const pendingCount = teamMembers.filter((u) => u.status === 'Pendiente').length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-32 overflow-visible">
      {/* 1. Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Seguridad y auditoría
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Control de accesos, trazabilidad de cambios y protección de datos bancarios.
        </p>
      </div>

      {/* 2. Top Status Indicator (Green Card) */}
      <div className="bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-teal-50 border border-emerald-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <span>🛡️ Sistema Protegido</span>
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Grado Bancario
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Último escaneo de seguridad: <span className="font-semibold text-slate-800">{lastScanTime}</span>
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> Cifrado AES-256 en reposo
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-600" /> TLS 1.3 Seguro
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <Fingerprint className="w-3 h-3 text-emerald-600" /> Sellado SHA-256
              </span>
            </div>
          </div>
        </div>

        {/* Scan Trigger Button */}
        <div className="self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={handleRunSecurityScan}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Escaneando...' : 'Escanear Ahora'}</span>
          </button>
        </div>
      </div>

      {/* 3. Middle Section: Configuración de Seguridad + Roles de Usuario (RBAC) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Security Toggles (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Configuración de Seguridad
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Controles en tiempo real</span>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: 2FA */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Autenticación de dos pasos (2FA)
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Solicita un código de verificación TOTP (Google Authenticator / Authy) al iniciar sesión.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggle2FA}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  is2FAEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={is2FAEnabled}
                aria-label="Alternar 2FA"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    is2FAEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: New Device Alerts */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Alertas de inicio de sesión en dispositivos nuevos
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Activado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Envía avisos de seguridad inmediatos por correo electrónico si se accede desde un navegador no reconocido.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleDeviceAlerts}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  isNewDeviceAlertEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={isNewDeviceAlertEnabled}
                aria-label="Alternar alertas de dispositivo"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isNewDeviceAlertEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Auto Lock 15 min */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Bloqueo automático por inactividad (15 min)
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      15 min
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Cierra la sesión temporalmente tras un periodo de inactividad para resguardar información financiera.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleAutoLock}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  isAutoLockEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={isAutoLockEnabled}
                aria-label="Alternar bloqueo automático"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isAutoLockEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Roles de Usuario (RBAC) Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 pb-6 sm:pb-8 mb-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Roles de Usuario
                </h2>
              </div>
              {isDueño ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToTeam) {
                      onNavigateToTeam();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Gestionar</span>
                </button>
              ) : (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  Solo el dueño puede gestionar roles
                </span>
              )}
            </div>

            {/* Role Summary Requested */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Estructura de Acceso (RBAC):
              </span>
              <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {ownerCount > 0 ? `${ownerCount} Dueño, ` : ''}
                {adminCount} Administrador{adminCount !== 1 ? 'es' : ''}, {accountantCount} Contador{accountantCount !== 1 ? 'es' : ''}
                {pendingCount > 0 && (
                  <span className="text-amber-600 font-semibold text-xs sm:text-sm block sm:inline mt-0.5 sm:mt-0">
                    {' '}· {pendingCount} invitación pendiente
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Permisos granulares aplicados sobre facturación, cobranza y cuentas bancarias.
              </p>
            </div>

            {/* Direct Member Directory Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                <span>Miembro</span>
                <span>Rol Asignado</span>
              </div>

              {teamMembers.slice(0, 4).map((u) => {
                const isDueño = u.role === 'Dueño';
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full ${
                          isDueño ? 'bg-purple-600 ring-2 ring-purple-300' : u.avatarColor || 'bg-slate-700'
                        } text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs`}
                      >
                        {isDueño ? <Crown className="w-3.5 h-3.5 fill-white text-white" /> : u.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {u.name} {u.isOwner && <span className="text-[10px] text-purple-600 font-medium">(Tú / Dueño)</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {u.status === 'Pendiente' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Pendiente
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                          isDueño
                            ? 'bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs'
                            : u.role === 'Administrador'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isDueño && <Crown className="w-3 h-3 text-purple-600 fill-purple-600" />}
                        {u.role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 pb-1 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Principio de mínimo privilegio aplicado
            </span>

            {!isContador && onNavigateToTeam && (
              <button
                type="button"
                onClick={onNavigateToTeam}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Ver todo el equipo →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bitácora de Auditoría (Log de Actividad Reciente) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Registro de Actividad Reciente
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Trazabilidad inmutable de cambios financieros, aprobaciones y accesos al sistema.
            </p>
          </div>

          {/* Activity Filters Requested: Todos, Críticos, Inicios de sesión */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'criticos', label: 'Críticos' },
                { id: 'sesion', label: 'Inicios de sesión' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setAuditFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  auditFilter === f.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Events List */}
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-500">No hay eventos en esta categoría de filtro.</p>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isCritical = event.category === 'critico';
              const isSession = event.category === 'sesion';

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCritical
                      ? 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50 hover:border-rose-300'
                      : isSession
                      ? 'bg-slate-50/60 border-slate-200 hover:bg-blue-50/30 hover:border-blue-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Icon indicator */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCritical
                          ? 'bg-rose-100 text-rose-600'
                          : isSession
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {isCritical ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : isSession ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>

                    {/* Action Text and User info */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs sm:text-sm font-semibold whitespace-normal line-clamp-2 leading-snug break-words ${
                          isCritical ? 'text-rose-900' : 'text-slate-900'
                        }`}
                      >
                        {event.action}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                        <span className="font-medium text-slate-700">{event.userName}</span>
                        <span className="text-slate-300">•</span>
                        <span>{event.timestamp}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {event.ipAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Click hint */}
                  <div className="self-end sm:self-center shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver detalles</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Modal: Detalles Técnicos del Evento de Auditoría */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedEvent.category === 'critico'
                      ? 'bg-rose-100 text-rose-600'
                      : selectedEvent.category === 'sesion'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Detalles Técnicos de Auditoría
                  </h3>
                  <p className="text-xs font-mono text-slate-500">
                    {selectedEvent.auditCode}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* Action Banner */}
              <div
                className={`p-3.5 rounded-xl border ${
                  selectedEvent.category === 'critico'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Acción Registrada
                </span>
                <p className="text-sm font-semibold mt-0.5">{selectedEvent.action}</p>
              </div>

              {/* Grid of technical details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-medium block">Usuario Responsable</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{selectedEvent.userName}</span>
                  <span className="text-slate-500 text-[11px]">{selectedEvent.userRole}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-medium block">Fecha y Hora Exacta</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{selectedEvent.fullDate}</span>
                  <span className="text-slate-500 text-[11px]">Sello de tiempo NTP sincronizado</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-medium block">Dirección IP y Proveedor</span>
                  <span className="font-semibold font-mono text-slate-800 mt-0.5 block">{selectedEvent.ipAddress}</span>
                  <span className="text-slate-500 text-[11px]">{selectedEvent.location}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-medium block">Dispositivo / Agente</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{selectedEvent.device}</span>
                  <span className="text-slate-500 text-[11px] truncate block">{selectedEvent.browser}</span>
                </div>
              </div>

              {/* SHA256 Integrity Hash */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-mono">
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                    Hash SHA-256 de Integridad Inmutable
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(selectedEvent.sha256Hash)}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Hash</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-300 break-all select-all bg-slate-800/80 p-2 rounded">
                  {selectedEvent.sha256Hash}
                </p>
              </div>

              {/* JSON Payload Inspection */}
              <div>
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  Carga Útil de Datos Modificados (Payload)
                </span>
                <pre className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-800 overflow-x-auto">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/60">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End of Audit Detail Modal */}
    </div>
  );
};
