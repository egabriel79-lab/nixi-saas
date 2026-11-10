import React from 'react';
import {
  User,
  FileText,
  BellRing,
  Landmark,
  Users,
  BarChart3,
  ShieldCheck,
  LogOut,
  Trash2,
  X,
  CreditCard,
  Crown,
  HelpCircle,
} from 'lucide-react';
import { DashboardSection } from '../types';
import { useUser } from '../context/UserContext';
import { useData } from '../context/DataContext';

interface SidebarProps {
  currentSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onRequestDeleteAccount: () => void;
  userRole?: string;
  onNavigateToHelp?: () => void;
}

interface MenuItem {
  id: DashboardSection;
  label: string;
  icon: React.ElementType;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'perfil',
    label: 'Perfil de Usuario',
    icon: User,
  },
  {
    id: 'facturacion',
    label: 'Facturación y gestión de documentos',
    icon: FileText,
  },
  {
    id: 'automatizacion',
    label: 'Automatización de cobros y recordatorios',
    icon: BellRing,
  },
  {
    id: 'conciliacion',
    label: 'Conciliación bancaria y pagos',
    icon: Landmark,
  },
  {
    id: 'clientes',
    label: 'Gestión de clientes y riesgo crediticio',
    icon: Users,
  },
  {
    id: 'paneles',
    label: 'Paneles de control e informes',
    icon: BarChart3,
  },
  {
    id: 'seguridad',
    label: 'Seguridad y auditoría',
    icon: ShieldCheck,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpen,
  onClose,
  onLogout,
  onRequestDeleteAccount,
  userRole = 'Administrador',
  onNavigateToHelp,
}) => {
  const { profile } = useUser();
  const { currentUser } = useData();
  const effectiveRole = currentUser?.role || userRole;
  const activeName = currentUser?.name || profile.fullName;
  const isContador = effectiveRole.toLowerCase().includes('contad');

  const activeInitials = (() => {
    if (!activeName.trim()) return 'GE';
    const parts = activeName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  })();

  // Si el usuario es 'Contador', oculta las opciones de 'Seguridad y auditoría' y 'Perfil de Usuario'
  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    if (isContador && (item.id === 'seguridad' || item.id === 'perfil')) {
      return false;
    }
    return true;
  });

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-semibold tracking-wider text-base">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-white leading-none">
              Nixi
            </span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cerrar menú lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Módulos Principales
          </div>

          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span className="leading-snug">{item.label}</span>
              </button>
            );
          })}

          {/* Opción ¿Cómo funciona Nixi? (Tutorial) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToHelp) {
                onNavigateToHelp();
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors text-left cursor-pointer group"
          >
            <HelpCircle className="w-4 h-4 text-blue-400 group-hover:text-blue-300 shrink-0" />
            <span className="leading-snug">¿Cómo funciona Nixi?</span>
          </button>

          {/* Visual Separator */}
          <div className="pt-4 pb-2">
            <div className="border-t border-slate-800" />
            <div className="px-3 pt-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Cuenta y Sesión
            </div>
          </div>

          {/* Cerrar Sesión */}
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>

          {/* Eliminar Cuenta (Solo visible para Administrador) */}
          {!isContador && (
            <button
              onClick={() => {
                onClose();
                onRequestDeleteAccount();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Eliminar Cuenta</span>
            </button>
          )}
        </div>

        {/* User plan badge footer */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            disabled={isContador}
            onClick={() => {
              if (!isContador) {
                onSelectSection('perfil');
                onClose();
              }
            }}
            className={`w-full text-left bg-slate-800/60 rounded-lg p-3 flex items-center justify-between border border-slate-700/50 transition-colors ${
              isContador ? 'cursor-default opacity-90' : 'hover:bg-slate-800 cursor-pointer group'
            }`}
            title={isContador ? 'Rol: Contador (Sin acceso a edición de perfil)' : 'Ver y editar perfil de usuario'}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={activeName}
                  className={`w-8 h-8 rounded-full object-cover shrink-0 ring-1 ${
                    effectiveRole === 'Dueño' ? 'ring-purple-400' : 'ring-blue-500'
                  }`}
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full ${
                    effectiveRole === 'Dueño'
                      ? 'bg-purple-600'
                      : isContador
                      ? 'bg-amber-600'
                      : 'bg-slate-700 group-hover:bg-blue-600'
                  } flex items-center justify-center text-xs font-semibold text-white shrink-0 transition-colors`}
                >
                  {effectiveRole === 'Dueño' ? (
                    <Crown className="w-3.5 h-3.5 fill-white text-white" />
                  ) : (
                    activeInitials
                  )}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate group-hover:text-blue-200 transition-colors flex items-center gap-1">
                  <span>{activeName}</span>
                  {effectiveRole === 'Dueño' && (
                    <Crown className="w-2.5 h-2.5 fill-purple-400 text-purple-400 shrink-0" />
                  )}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {effectiveRole === 'Dueño'
                    ? 'Dueño · Plan Empresarial'
                    : isContador
                    ? 'Rol: Contador'
                    : 'Administrador · Ver Perfil'}
                </p>
              </div>
            </div>
            {!isContador && (
              <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0 ml-1" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
