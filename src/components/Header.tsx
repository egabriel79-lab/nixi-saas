import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  Bell,
  RefreshCw,
  Crown,
  UserCheck,
  ShieldAlert,
  FileText,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { SECTION_METADATA } from '../data/mockData';
import { DashboardSection } from '../types';
import { useBcv } from '../context/BcvContext';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';

interface NotificationItem {
  id: string;
  type: 'user' | 'security' | 'invoice' | 'welcome';
  message: string;
  time: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-welcome',
    type: 'welcome',
    message: '¡Bienvenido a Nixi! Tu cuenta ha sido creada exitosamente. Empieza emitiendo tu primera factura.',
    time: 'Hoy',
    isRead: false,
  },
];

interface HeaderProps {
  onToggleSidebar: () => void;
  currentSection: DashboardSection;
  userName?: string;
  userRole?: string;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onToggleRole?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentSection,
  userName,
  userRole,
  onOpenProfile,
  onToggleRole,
}) => {
  const currentTitle = SECTION_METADATA[currentSection]?.title || 'Dashboard';
  const { bcvRate, isLoading, refreshRate } = useBcv();
  const { profile } = useUser();
  const { currentUser } = useData();

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem('nixi_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const hasOldMocks = parsed.some(
            (n: any) =>
              n.message?.includes('Carlos Peña') ||
              n.message?.includes('Intento de inicio de sesión') ||
              n.id === 'notif-1' ||
              n.id === 'notif-2'
          );
          if (hasOldMocks) {
            localStorage.setItem('nixi_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
            return INITIAL_NOTIFICATIONS;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nixi_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn(e);
    }
  }, [notifications]);

  // Close notifications panel when clicking outside (desktop & mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const handleToggleNotifications = () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);
    if (nextState) {
      // Al hacer clic en la campana, el badge rojo desaparece marcando como leídas
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const activeName = currentUser?.name || userName || profile.fullName;
  const activeRole = currentUser?.role || userRole || 'Administrador';
  const isContador = activeRole.toLowerCase().includes('contad');

  // Cálculo dinámico de iniciales (GE para Gabriel Echeverría, CP para Carlos Peña, etc.)
  const userInitials = (() => {
    if (!activeName.trim()) return 'GE';
    const parts = activeName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  })();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 pr-4 sm:pr-6 print:hidden">
      {/* Left side: Hamburger button + Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span>Nixi</span>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="font-semibold text-slate-800 truncate max-w-xs md:max-w-md">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Center / Right side: BCV Exchange Rate + User profile + Bell Notifications */}
      <div className="flex items-center gap-2 sm:gap-3.5 mr-1 sm:mr-3">
        {/* Tasa BCV Display (Strict Requirement 1) */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium shadow-2xs">
          <span className="hidden sm:inline text-slate-500 font-normal">Tasa Oficial</span>
          <span className="font-semibold text-slate-900 whitespace-nowrap">
            Tasa BCV: <span className="font-mono tabular-nums text-blue-700 font-bold">Bs. {bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
          <button
            onClick={() => refreshRate()}
            disabled={isLoading}
            className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded cursor-pointer"
            title="Actualizar tasa oficial BCV"
            aria-label="Actualizar tasa BCV"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />

        {/* Contenedor flex unificado: Avatar, Badge Dueño/Admin y Campana de Notificaciones */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* User profile action button */}
          <button
            type="button"
            disabled={isContador}
            onClick={() => {
              if (!isContador && onOpenProfile) onOpenProfile();
            }}
            className={`flex items-center gap-2 sm:gap-2.5 p-1 rounded-lg transition-colors text-left ${
              isContador ? 'cursor-default' : 'hover:bg-slate-50 cursor-pointer group'
            }`}
            title={isContador ? 'Rol: Contador (Sin acceso a edición de perfil)' : 'Ver y editar perfil de usuario'}
          >
            <div className="flex flex-col text-right hidden md:flex items-end">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-sm font-semibold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                  {activeName}
                </span>

                {/* Badge de Rol dinámico: Dueño con Corona morada, Admin en azul, Contador en amarillo */}
                {activeRole === 'Dueño' ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs tracking-wide inline-flex items-center gap-1">
                    <Crown className="w-3 h-3 text-purple-600 fill-purple-600" />
                    Dueño
                  </span>
                ) : isContador ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-50 text-orange-900 border border-yellow-300 shadow-2xs tracking-wide">
                    Contador
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs tracking-wide">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-1">
                {activeRole === 'Dueño'
                  ? 'Dueño · Propietario Nixi'
                  : isContador
                  ? 'Operaciones Contables'
                  : 'Administrador · Nixi VE'}
              </span>
            </div>

            {/* User Avatar con Iniciales Dinámicas */}
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={activeName}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ${
                  activeRole === 'Dueño'
                    ? 'ring-purple-500 shadow-xs'
                    : isContador
                    ? 'ring-amber-400'
                    : 'ring-blue-500 group-hover:ring-blue-600'
                } shadow-xs transition-all`}
              />
            ) : (
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${
                  activeRole === 'Dueño'
                    ? 'bg-purple-600 group-hover:bg-purple-700'
                    : isContador
                    ? 'bg-amber-600'
                    : 'bg-slate-900 group-hover:bg-blue-600'
                } text-white font-bold flex items-center justify-center text-xs ring-2 ring-slate-100 shadow-xs transition-colors`}
              >
                {activeRole === 'Dueño' ? (
                  <Crown className="w-4 h-4 fill-white text-white" />
                ) : (
                  userInitials
                )}
              </div>
            )}
          </button>

          {/* Badge visible en móviles */}
          <div className="md:hidden flex items-center">
            {activeRole === 'Dueño' ? (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5 fill-purple-600 text-purple-600" />
                Dueño
              </span>
            ) : isContador ? (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-yellow-50 text-orange-900 border border-yellow-300">
                Contador
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Admin
              </span>
            )}
          </div>

          {/* Notificaciones (Campana centrada verticalmente en el mismo contenedor flex) */}
          <div className="relative flex items-center" ref={notificationsRef}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 flex items-center justify-center"
              aria-label="Notificaciones del sistema"
              title={unreadCount > 0 ? `${unreadCount} notificaciones no leídas` : 'Notificaciones'}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-in zoom-in-75">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Overlay invisible para capturar clics fuera en cualquier capa */}
            {isNotificationsOpen && (
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsNotificationsOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Floating Dropdown Panel */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-0 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              {/* Header del Panel */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Notificaciones Recientes
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Marcar todas como leídas</span>
                </button>
              </div>

              {/* Lista de notificaciones o estado vacío */}
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No tienes notificaciones</p>
                    <p className="text-slate-400 mt-0.5">Te avisaremos cuando ocurran eventos importantes en tu cuenta.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                          !notif.isRead ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* Ícono representativo */}
                        <div className="shrink-0 mt-0.5">
                          {notif.type === 'welcome' ? (
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                            </div>
                          ) : notif.type === 'user' ? (
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                              <UserCheck className="w-4 h-4" />
                            </div>
                          ) : notif.type === 'security' ? (
                            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Texto y Fecha */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {notif.message}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 font-medium">
                            {notif.time}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 font-medium">
                  Centro de Notificaciones · Nixi VE
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);
};

