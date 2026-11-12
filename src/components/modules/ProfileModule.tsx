import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Building2,
  Mail,
  User,
  FileText,
  ShieldCheck,
  Check,
  LogOut,
  Users,
  UserPlus,
  Crown,
  Shield,
  Clock,
  CheckCircle2,
  Send,
  X,
  RefreshCw,
  MoreVertical,
  AlertTriangle,
  Info,
  Lock,
  UserCheck,
  Receipt,
  Smartphone,
  Copy,
  Calendar,
  AlertCircle,
  Zap,
  Loader2,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useData } from '../../context/DataContext';
import { useBcv } from '../../context/BcvContext';
import { TeamMember, UserRole } from '../../types';
import { supabase } from '../../supabaseClient.js';

interface ProfileModuleProps {
  onBackToDashboard: () => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
  userRole?: string;
  initialTab?: 'datos' | 'equipo';
  onNavigateToCheckout?: () => void;
  onNavigateToSuperadmin?: () => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  onBackToDashboard,
  onShowToast,
  onLogout,
  onAccountDeleted,
  userRole = 'Dueño',
  initialTab = 'datos',
  onNavigateToCheckout,
  onNavigateToSuperadmin,
}) => {
  const { profile, initials, updateProfile, setProfileImage } = useUser();
  const {
    currentUser,
    setCurrentUser,
    teamMembers,
    invitarMiembro,
    eliminarMiembro,
    cambiarRolMiembro,
    trialDaysLeft,
    setTrialDaysLeft,
    isSubscriptionActive,
  } = useData();

  const isSuperAdmin = currentUser?.email?.toLowerCase() === 'egabriel79@gmail.com';

  const handleGoToCheckout = () => {
    if (onNavigateToCheckout) {
      onNavigateToCheckout();
    } else {
      window.dispatchEvent(new CustomEvent('nixi:navigate', { detail: 'checkout' }));
    }
  };

  const effectiveRole = currentUser?.role || userRole;
  const isCurrentLoggedDueño = effectiveRole === 'Dueño';
  const isContador = effectiveRole.toLowerCase().includes('contad');

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'datos' | 'equipo'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Helper to prevent showing hardcoded mock strings in user fields
  const cleanMock = (val: string | undefined | null, mocks: string[]) => {
    if (!val) return '';
    return mocks.some((m) => m.toLowerCase() === val.trim().toLowerCase()) ? '' : val;
  };

  // Local form state for user & company
  const [fullName, setFullName] = useState(() =>
    cleanMock(profile.fullName, ['Gabriel Echeverría', 'Eloy Gabriel Palma', 'Juan Pérez'])
  );
  const [companyName, setCompanyName] = useState(() =>
    cleanMock(profile.companyName, [
      'Nixi Soluciones Financieras C.A.',
      'Nixi Soluciones',
      'Nixi Soluciones C.A.',
    ])
  );
  const [email, setEmail] = useState(() =>
    cleanMock(profile.email, ['Egabriel79@gmail.com', 'egabriel79@gmail.com'])
  );
  const [companyRif, setCompanyRif] = useState(() =>
    cleanMock(profile.companyRif, ['J-50491823-1'])
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    setFullName(cleanMock(profile.fullName, ['Gabriel Echeverría', 'Eloy Gabriel Palma', 'Juan Pérez']));
    setCompanyName(cleanMock(profile.companyName, ['Nixi Soluciones Financieras C.A.', 'Nixi Soluciones', 'Nixi Soluciones C.A.']));
    setEmail(cleanMock(profile.email, ['Egabriel79@gmail.com', 'egabriel79@gmail.com']));
    setCompanyRif(cleanMock(profile.companyRif, ['J-50491823-1']));
  }, [profile.fullName, profile.companyName, profile.email, profile.companyRif]);

  // Pago Móvil Subscription & Receipt State
  const { bcvRate } = useBcv();
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptCopied, setReceiptCopied] = useState(false);

  // Estado del Plan: Activo (true) o Inactivo / Pendiente (false)
  const [isPlanActive, setIsPlanActive] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('nixi_plan_active');
      if (stored !== null) {
        return stored === 'true';
      }
    } catch {}
    return true; // Por defecto el plan inicia activo
  });

  const togglePlanActive = () => {
    setIsPlanActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nixi_plan_active', String(next));
      } catch {}
      onShowToast(
        next ? 'Plan Emprendedor activo' : 'Plan marcado como Inactivo / Pago Pendiente',
        'info'
      );
      return next;
    });
  };

  // Obtener datos del comprobante guardado o predeterminado
  const [receiptData] = useState(() => {
    try {
      const raw = localStorage.getItem('nixi_subscription_payment');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.reference) {
          return {
            method: 'Pago Móvil',
            issuingBank: parsed.bank || 'Banesco Banco Universal (0134)',
            targetBank: 'Banco de Venezuela (0102)',
            targetPhone: '0414-4975296',
            targetRif: '14324186',
            targetHolder: 'Eloy Palma',
            reference: parsed.reference,
            paymentDate: parsed.date || new Date().toISOString().split('T')[0],
            amountUsd: parsed.amountUsd || 5.0,
            amountVes: parsed.amountVes || (5.0 * (bcvRate || 896.12)),
            fileName: parsed.fileName || 'comprobante_pagomovil.png',
            status: 'Aprobado / Conciliado',
          };
        }
      }
    } catch {}

    return {
      method: 'Pago Móvil',
      issuingBank: 'Banesco Banco Universal (0134)',
      targetBank: 'Banco de Venezuela (0102)',
      targetPhone: '0414-4975296',
      targetRif: '14324186',
      targetHolder: 'Eloy Palma',
      reference: 'REF-88492015',
      paymentDate: new Date().toISOString().split('T')[0],
      amountUsd: 5.0,
      amountVes: 5.0 * (bcvRate || 896.12),
      fileName: 'comprobante_pagomovil.png',
      status: 'Aprobado / Conciliado',
    };
  });

  const nextPaymentDate = (() => {
    try {
      const saved = localStorage.getItem('nixi_subscription_renewal');
      if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
      }
    } catch {}
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return future.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  })();

  // Consulta de estado real de la empresa en Supabase
  const [companyDb, setCompanyDb] = useState<{
    id?: string;
    nombre?: string;
    rif?: string;
    email?: string;
    estado?: string;
    fecha_vencimiento?: string;
    created_at?: string;
  } | null>(null);
  const [isLoadingCompanyDb, setIsLoadingCompanyDb] = useState(false);

  const fetchCompanyFromSupabase = async () => {
    const userEmail = (currentUser?.email || profile?.email || '').trim().toLowerCase();
    if (!userEmail) return;

    setIsLoadingCompanyDb(true);
    try {
      let { data, error } = await supabase
        .from('empresas')
        .select('*')
        .ilike('email', userEmail)
        .order('created_at', { ascending: false })
        .limit(1);

      if ((!data || data.length === 0) && (companyRif || profile.companyRif)) {
        const rifToSearch = (companyRif || profile.companyRif || '').trim();
        if (rifToSearch) {
          const resRif = await supabase
            .from('empresas')
            .select('*')
            .eq('rif', rifToSearch)
            .order('created_at', { ascending: false })
            .limit(1);
          if (resRif.data && resRif.data.length > 0) {
            data = resRif.data;
          }
        }
      }

      if (error) {
        console.warn('Aviso Supabase al consultar empresa:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const emp = data[0];
        setCompanyDb(emp);

        // Auto-completar campos de empresa si estaban vacíos
        if (emp.nombre && !companyName) {
          setCompanyName(emp.nombre);
        }
        if (emp.rif && !companyRif) {
          setCompanyRif(emp.rif);
        }

        // Si en BD está Activo, sincronizar con el storage local para consistencia en la app
        if (emp.estado === 'Activo') {
          try {
            localStorage.setItem('nixi_subscription_status', 'Activo');
            localStorage.setItem('nixi_plan_active', 'true');
            if (emp.fecha_vencimiento) {
              localStorage.setItem('nixi_subscription_renewal', emp.fecha_vencimiento);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Excepción consultando empresa en Supabase:', e);
    } finally {
      setIsLoadingCompanyDb(false);
    }
  };

  useEffect(() => {
    fetchCompanyFromSupabase();
  }, [currentUser?.email, profile?.email]);

  // Cálculo de estado dinámico de suscripción
  const dbEstado = companyDb?.estado;
  const dbVencimiento = companyDb?.fecha_vencimiento;

  const daysRemainingFromDb = (() => {
    if (!dbVencimiento) return null;
    const diff = new Date(dbVencimiento).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const effectiveIsActive = dbEstado
    ? dbEstado.toLowerCase() === 'activo'
    : isSubscriptionActive;

  const effectiveIsTrial = dbEstado
    ? (dbEstado.toLowerCase() === 'trial' || dbEstado.toLowerCase() === 'en prueba') &&
      (daysRemainingFromDb === null || daysRemainingFromDb > 0)
    : (!effectiveIsActive && trialDaysLeft > 0);

  const effectiveTrialDays = daysRemainingFromDb !== null ? daysRemainingFromDb : trialDaysLeft;

  const effectiveRenewalDate = (() => {
    if (dbVencimiento) {
      const d = new Date(dbVencimiento);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }
    return nextPaymentDate;
  })();

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Administrador' | 'Contador'>('Administrador');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Action sheet & modal states for team members (Mobile & Desktop)
  const [selectedMemberForActions, setSelectedMemberForActions] = useState<TeamMember | null>(null);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [isDeleteMemberConfirmOpen, setIsDeleteMemberConfirmOpen] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<'Administrador' | 'Contador'>('Administrador');

  // Role filter state for team summary cards (Parte 1)
  const [filtroRol, setFiltroRol] = useState<'Todos' | 'Dueño' | 'Administrador' | 'Contador' | 'Pendiente'>('Todos');

  // Read-only Role Details Transparency modal (Administrador / Contador / Dueño)
  const [roleDetailModal, setRoleDetailModal] = useState<'Administrador' | 'Contador' | 'Dueño' | null>(null);

  // Close role detail modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && roleDetailModal) {
        setRoleDetailModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roleDetailModal]);

  // File input reference for avatar upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoutClick = () => {
    onShowToast('Sesión cerrada', 'info');
    onLogout();
  };

  const handleConfirmDeleteAccount = () => {
    setIsDeleteModalOpen(false);
    onShowToast('Cuenta eliminada con éxito', 'success');
    onAccountDeleted();
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Por favor selecciona un archivo de imagen válido', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfileImage(result);
      onShowToast('Foto de perfil actualizada en tiempo real', 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProfileImage(null);
    onShowToast('Foto de perfil eliminada', 'info');
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim() || profile.fullName;
    updateProfile({
      fullName: cleanName,
      companyName: companyName.trim() || profile.companyName,
      email: email.trim() || profile.email,
      companyRif: companyRif.trim() || profile.companyRif,
    });

    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name: cleanName,
      });
    }

    onShowToast('✅ Perfil actualizado correctamente', 'success');
  };

  // Submit handler for Inviting a new team member
  const handleSendInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      onShowToast('Por favor ingresa un correo electrónico corporativo válido', 'warning');
      return;
    }

    // Check if team member limit of 5 has been reached
    if (teamMembers.length >= 5) {
      onShowToast('Has alcanzado el límite de 5 miembros de tu plan actual', 'warning');
      setIsInviteModalOpen(false);
      return;
    }

    // Check if email already exists in team
    const exists = teamMembers.some((m) => m.email.toLowerCase() === cleanEmail);
    if (exists) {
      onShowToast('Este correo ya está registrado en tu equipo de Nixi', 'warning');
      return;
    }

    setIsSendingInvite(true);

    setTimeout(() => {
      invitarMiembro({
        email: cleanEmail,
        role: inviteRole,
        name: inviteName.trim() || undefined,
      });

      setIsSendingInvite(false);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('Administrador');

      onShowToast(`Invitación enviada a ${cleanEmail}`, 'success');
    }, 600);
  };

  // Action Sheet Handlers
  const handleOpenMemberActions = (member: TeamMember) => {
    if (!isCurrentLoggedDueño) {
      onShowToast('Solo el Dueño de la cuenta puede gestionar miembros del equipo.', 'warning');
      return;
    }
    if (member.role === 'Dueño' || member.isOwner) {
      onShowToast('El Dueño de la cuenta no puede ser gestionado.', 'warning');
      return;
    }
    setSelectedMemberForActions(member);
    setSelectedNewRole(member.role === 'Administrador' ? 'Contador' : 'Administrador');
    setIsChangeRoleModalOpen(false);
    setIsDeleteMemberConfirmOpen(false);
  };

  const handleCloseMemberActions = () => {
    setSelectedMemberForActions(null);
    setIsChangeRoleModalOpen(false);
    setIsDeleteMemberConfirmOpen(false);
  };

  const handleConfirmRoleChange = () => {
    if (!isCurrentLoggedDueño) {
      onShowToast('Solo el Dueño de la cuenta puede cambiar roles.', 'warning');
      return;
    }
    if (!selectedMemberForActions) return;
    if (selectedMemberForActions.isOwner || selectedMemberForActions.role === 'Dueño') {
      onShowToast('El rol del Dueño de la cuenta no puede ser modificado.', 'warning');
      return;
    }
    cambiarRolMiembro(selectedMemberForActions.id, selectedNewRole);
    onShowToast(`Rol de ${selectedMemberForActions.name} actualizado a ${selectedNewRole}`, 'success');
    handleCloseMemberActions();
  };

  const handleConfirmRemoveMember = () => {
    if (!isCurrentLoggedDueño) {
      onShowToast('Solo el Dueño de la cuenta puede eliminar miembros.', 'warning');
      return;
    }
    if (!selectedMemberForActions) return;
    if (selectedMemberForActions.isOwner || selectedMemberForActions.role === 'Dueño') {
      onShowToast('El Dueño de la cuenta no puede ser eliminado.', 'warning');
      return;
    }
    eliminarMiembro(selectedMemberForActions.id);
    onShowToast(`Miembro ${selectedMemberForActions.name} eliminado del equipo`, 'info');
    handleCloseMemberActions();
  };

  const handleResendInvitation = (member: TeamMember) => {
    onShowToast(`Enlace de invitación reenviado a ${member.email}`, 'info');
    handleCloseMemberActions();
  };

  // KPI counts and team limits
  const MAX_TEAM_MEMBERS = 5;
  const totalMembersCount = teamMembers.length;
  const hasReachedLimit = totalMembersCount >= MAX_TEAM_MEMBERS;
  const ownerCount = teamMembers.filter((m) => m.role === 'Dueño').length;
  const adminCount = teamMembers.filter((m) => m.role === 'Administrador').length;
  const accountantCount = teamMembers.filter((m) => m.role === 'Contador').length;
  const pendingCount = teamMembers.filter((m) => m.status === 'Pendiente').length;

  // Filtrado reactivo del Directorio Corporativo (Parte 1)
  const miembrosFiltrados = teamMembers.filter((m) => {
    if (filtroRol === 'Todos') return true;
    if (filtroRol === 'Pendiente') return m.status === 'Pendiente';
    if (filtroRol === 'Dueño') return m.role === 'Dueño';
    if (filtroRol === 'Administrador') return m.role === 'Administrador';
    if (filtroRol === 'Contador') return m.role === 'Contador';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Bar with Back Button & Screen Title */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Volver al Dashboard</span>
        </button>

        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Nixi VE · Administración de Cuenta & Equipo
        </span>
      </div>

      {/* Tab Switcher Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-2 sm:p-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center">
            {/* Tab 1: Datos de la Cuenta */}
            <button
              type="button"
              onClick={() => setActiveTab('datos')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'datos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Datos de la Cuenta</span>
            </button>

            {/* Tab 2: Miembros del Equipo */}
            <button
              type="button"
              onClick={() => setActiveTab('equipo')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'equipo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Miembros del Equipo</span>
              <span
                className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
                  activeTab === 'equipo'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {teamMembers.length}
              </span>
            </button>
          </div>

          {/* Quick invite button visible from tab bar on desktop if on 'equipo' tab and user is Dueño */}
          {activeTab === 'equipo' && isCurrentLoggedDueño && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Invitar Miembro</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DATOS DE LA CUENTA & EMPRESA                                      */}
      {/* ========================================================================= */}
      {activeTab === 'datos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-150">
          {/* Cover banner */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 relative">
            <div className="absolute top-3 right-4 flex items-center gap-1.5 text-[11px] font-semibold text-blue-200 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cuenta Verificada SENIAT</span>
            </div>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSaveChanges} className="px-5 sm:px-8 pb-8 pt-0">
            {/* Avatar Section: Center Round Big Avatar */}
            <div className="flex flex-col items-center -mt-12 sm:-mt-16 mb-6">
              <div className="relative group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Cargar foto de perfil"
                />

                <div
                  onClick={handleAvatarClick}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-2xl sm:text-3xl ring-4 ring-white shadow-xl cursor-pointer overflow-hidden transition-transform active:scale-95 relative"
                  title="Haz clic para subir o cambiar foto"
                >
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}

                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] sm:text-xs font-medium transition-opacity">
                    <Camera className="w-6 h-6 mb-1" />
                    <span>Cambiar</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors border-2 border-white cursor-pointer"
                  title="Subir foto desde archivo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Avatar controls */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Cambiar foto
                </button>
                {profile.profileImage && (
                  <>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs font-medium text-rose-600 hover:text-rose-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar foto</span>
                    </button>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                JPG, PNG o WebP. Se sincroniza con el Header y en el directorio de equipo.
              </p>
            </div>

            {/* User & Company Information Fields */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Información de Identidad & Empresa
                </h3>
                <p className="text-xs text-slate-500">
                  Datos asociados a la emisión de facturas electrónicas y notificaciones de cobro.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Nombre de la Empresa */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Razón Social / Nombre de la Empresa
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nombre de tu empresa"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* RIF de la Empresa */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RIF de la Empresa (SENIAT)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={companyRif}
                      onChange={(e) => setCompanyRif(e.target.value)}
                      placeholder="J-12345678-9"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs placeholder:text-slate-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sección "Mi Suscripción" */}
              <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl p-5 sm:p-6 border border-slate-700/80 text-white shadow-xl mt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                        Mi Suscripción
                      </span>
                      {isLoadingCompanyDb ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-full">
                          <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                          Sincronizando...
                        </span>
                      ) : effectiveIsActive ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Plan Activo ($5/mes)
                        </span>
                      ) : effectiveIsTrial ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-blue-400" />
                          Prueba Gratis ({effectiveTrialDays} {effectiveTrialDays === 1 ? 'día restante' : 'días restantes'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Plan Inactivo (Pago Pendiente)
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={fetchCompanyFromSupabase}
                        title="Actualizar estado desde Supabase"
                        className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingCompanyDb ? 'animate-spin text-blue-400' : ''}`} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300">
                      Emisión fiscal SENIAT ilimitada, cobros automatizados por WhatsApp y tasa oficial BCV.
                    </p>

                    {/* Estado del periodo o próximo pago */}
                    {effectiveIsActive ? (
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Próximo pago:</span>
                        <span className="font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                          {effectiveRenewalDate}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsReceiptModalOpen(true)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2 ml-1 cursor-pointer"
                        >
                          Ver comprobante
                        </button>
                      </div>
                    ) : effectiveIsTrial ? (
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Periodo de prueba activo:</span>
                        <span className="font-mono font-bold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                          {effectiveTrialDays} {effectiveTrialDays === 1 ? 'día restante' : 'días restantes'}
                        </span>
                        <span className="text-slate-400 text-[11px] hidden sm:inline">
                          (Vence: {effectiveRenewalDate})
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-300/90 pt-1">
                        Tu periodo de prueba ha finalizado. Activa tu plan para continuar utilizando el sistema.
                      </p>
                    )}
                  </div>

                  {/* Botón de acción */}
                  {effectiveIsActive ? (
                    <button
                      type="button"
                      onClick={() => setIsReceiptModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer shrink-0 min-h-[44px]"
                    >
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>Ver Comprobante</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoToCheckout}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/30 hover:shadow-blue-500/40 cursor-pointer shrink-0 min-h-[44px]"
                    >
                      <Zap className="w-4 h-4 fill-white text-white" />
                      <span>Activar Plan por $5</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Acceso Rápido Superpanel de Administrador (Protegido: sólo visible para el Superadmin de Nixi) */}
              {onNavigateToSuperadmin && isSuperAdmin && (
                <div className="bg-gradient-to-r from-purple-950/70 via-[#1e1b4b]/60 to-slate-900 rounded-2xl p-4 sm:p-5 border border-purple-500/40 text-white shadow-xl mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 text-center sm:text-left">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                      <Crown className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="text-xs sm:text-sm font-bold text-white">Superpanel de Administrador Nixi</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Dueño SaaS
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Consola global ejecutiva para supervisar las 342 empresas registradas, KPIs y verificar capturas de Pago Móvil.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToSuperadmin}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-xl transition-all shadow-md shadow-purple-600/30 cursor-pointer shrink-0 min-h-[44px]"
                  >
                    <span>Abrir Superpanel</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Action Button: Guardar Cambios */}
            <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onBackToDashboard}
                className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>

          {/* Línea Divisoria */}
          <div className="border-t border-gray-200 my-6" />

          {/* Opciones de Cuenta: Cerrar Sesión y Eliminar Cuenta */}
          <div className="flex flex-col items-center justify-center gap-3 pb-8 px-5">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full sm:w-auto min-w-[220px] px-5 py-2.5 bg-white hover:bg-slate-50 border border-gray-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Cerrar Sesión</span>
            </button>

            {!isContador && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full sm:w-auto min-w-[220px] mt-1 px-5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Eliminar Cuenta</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MIEMBROS DEL EQUIPO (GESTIÓN DE EQUIPO / RBAC)                     */}
      {/* ========================================================================= */}
      {activeTab === 'equipo' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Banner and Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="pb-5 border-b border-slate-100 space-y-3">
              {/* Row 1: Title and visual counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                      Miembros del Equipo
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gestiona los colaboradores con acceso a tu cuenta corporativa Nixi y sus niveles de permiso (RBAC).
                    </p>
                  </div>
                </div>

                {/* Contador visual: "Miembros del equipo: 3 de 5" */}
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 self-start sm:self-auto transition-all shadow-2xs ${
                    hasReachedLimit
                      ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-200/60'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    Miembros del equipo:{' '}
                    <strong className="font-mono text-sm font-black">{totalMembersCount}</strong> de{' '}
                    <strong className="font-mono text-sm font-black">{MAX_TEAM_MEMBERS}</strong>
                  </span>
                </div>
              </div>

              {/* Row 2: Botón "+ Invitar Miembro" súper visible justo debajo del título (visible para el Dueño) */}
              {isCurrentLoggedDueño && (
                <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    disabled={hasReachedLimit}
                    onClick={() => {
                      if (!hasReachedLimit) {
                        setIsInviteModalOpen(true);
                      } else {
                        onShowToast('Has alcanzado el límite de 5 miembros de tu plan actual', 'warning');
                      }
                    }}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all shrink-0 ${
                      hasReachedLimit
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-80 shadow-none'
                        : 'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-600/25 cursor-pointer hover:-translate-y-0.5'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Invitar Miembro</span>
                  </button>

                  {/* Texto de advertencia si llega a 5 */}
                  {hasReachedLimit && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium animate-in fade-in duration-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Has alcanzado el límite de 5 miembros de tu plan actual</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick KPI stats pills (Interactive Filters - Parte 1 + Ver Permisos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
              {/* Dueño Card */}
              <div
                onClick={() => setFiltroRol((prev) => (prev === 'Dueño' ? 'Todos' : 'Dueño'))}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none hover:shadow-md hover:border-purple-300 flex flex-col justify-between ${
                  filtroRol === 'Dueño'
                    ? 'bg-purple-100/90 border-purple-500 ring-2 ring-purple-500 shadow-sm'
                    : 'bg-purple-50/70 border-purple-100 hover:bg-purple-50'
                }`}
                title="Filtrar por Dueño (clic en la tarjeta para filtrar)"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-purple-700 text-xs font-semibold">
                      <Crown className="w-4 h-4 fill-purple-600 text-purple-600" />
                      <span>Dueño</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {filtroRol === 'Dueño' && (
                        <span className="text-[10px] font-bold text-purple-800 bg-white/80 px-1.5 py-0.5 rounded-full border border-purple-300 shadow-2xs">
                          Filtrado
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoleDetailModal('Dueño');
                        }}
                        className="p-1 rounded-md text-purple-600 hover:text-purple-900 hover:bg-purple-200/70 transition-colors cursor-pointer"
                        title="Ver detalles y permisos de Dueño"
                        aria-label="Ver permisos de Dueño"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-purple-950 mt-1">{ownerCount}</p>
                  <p className="text-[11px] text-purple-700/80">Propietario de la cuenta</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-purple-200/70 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoleDetailModal('Dueño');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-950 bg-purple-100/80 hover:bg-purple-200/90 px-2 py-0.5 rounded-md border border-purple-200 transition-colors cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    <span>Ver Permisos</span>
                  </button>
                  <span className="text-[10px] text-purple-500 font-medium">Control total</span>
                </div>
              </div>

              {/* Administradores Card */}
              <div
                onClick={() => setFiltroRol((prev) => (prev === 'Administrador' ? 'Todos' : 'Administrador'))}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none hover:shadow-md hover:border-blue-300 flex flex-col justify-between ${
                  filtroRol === 'Administrador'
                    ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-500 shadow-sm'
                    : 'bg-blue-50/70 border-blue-100 hover:bg-blue-50'
                }`}
                title="Filtrar por Administradores (clic en la tarjeta para filtrar)"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-700 text-xs font-semibold">
                      <Shield className="w-4 h-4" />
                      <span>Administradores</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {filtroRol === 'Administrador' && (
                        <span className="text-[10px] font-bold text-blue-800 bg-white/80 px-1.5 py-0.5 rounded-full border border-blue-300 shadow-2xs">
                          Filtrado
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoleDetailModal('Administrador');
                        }}
                        className="p-1 rounded-md text-blue-600 hover:text-blue-900 hover:bg-blue-200/70 transition-colors cursor-pointer"
                        title="Ver detalles y permisos de Administrador"
                        aria-label="Ver permisos de Administrador"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-blue-950 mt-1">{adminCount}</p>
                  <p className="text-[11px] text-blue-700/80">Acceso operativo y fiscal</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-blue-200/70 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoleDetailModal('Administrador');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-950 bg-blue-100/80 hover:bg-blue-200/90 px-2 py-0.5 rounded-md border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    <span>Ver Permisos</span>
                  </button>
                  <span className="text-[10px] text-blue-500 font-medium">Operación activa</span>
                </div>
              </div>

              {/* Contadores Card */}
              <div
                onClick={() => setFiltroRol((prev) => (prev === 'Contador' ? 'Todos' : 'Contador'))}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none hover:shadow-md hover:border-amber-300 flex flex-col justify-between ${
                  filtroRol === 'Contador'
                    ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-500 shadow-sm'
                    : 'bg-amber-50/70 border-amber-100 hover:bg-amber-50'
                }`}
                title="Filtrar por Contadores (clic en la tarjeta para filtrar)"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold">
                      <FileText className="w-4 h-4" />
                      <span>Contadores</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {filtroRol === 'Contador' && (
                        <span className="text-[10px] font-bold text-amber-900 bg-white/80 px-1.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                          Filtrado
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoleDetailModal('Contador');
                        }}
                        className="p-1 rounded-md text-amber-700 hover:text-amber-950 hover:bg-amber-200/70 transition-colors cursor-pointer"
                        title="Ver detalles y permisos de Contador"
                        aria-label="Ver permisos de Contador"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-amber-950 mt-1">{accountantCount}</p>
                  <p className="text-[11px] text-amber-700/80">Operación contable y saldos</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoleDetailModal('Contador');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/90 px-2 py-0.5 rounded-md border border-amber-200 transition-colors cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    <span>Ver Permisos</span>
                  </button>
                  <span className="text-[10px] text-amber-600 font-medium">Auditoría / Saldos</span>
                </div>
              </div>

              {/* Pendientes Card */}
              <div
                onClick={() => setFiltroRol((prev) => (prev === 'Pendiente' ? 'Todos' : 'Pendiente'))}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none hover:shadow-md hover:border-slate-400 flex flex-col justify-between ${
                  filtroRol === 'Pendiente'
                    ? 'bg-slate-200/90 border-slate-500 ring-2 ring-slate-500 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                }`}
                title="Filtrar por Invitaciones Pendientes (clic en la tarjeta para filtrar)"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>Pendientes</span>
                    </div>
                    {filtroRol === 'Pendiente' && (
                      <span className="text-[10px] font-bold text-slate-800 bg-white/80 px-1.5 py-0.5 rounded-full border border-slate-300 shadow-2xs">
                        Filtrado
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-slate-800 mt-1">{pendingCount}</p>
                  <p className="text-[11px] text-slate-500">Invitaciones por activar</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Sin activación aún</span>
                  <span className="text-[10px] text-slate-400 font-medium">Pendientes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Directory of Members List (Corporate Style) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-t-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Directorio Corporativo ({miembrosFiltrados.length} {miembrosFiltrados.length === 1 ? 'usuario' : 'usuarios'})
                </span>
                {filtroRol !== 'Todos' && (
                  <button
                    type="button"
                    onClick={() => setFiltroRol('Todos')}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Restablecer filtro y ver todos"
                  >
                    <span>
                      Filtro:{' '}
                      {filtroRol === 'Pendiente'
                        ? 'Pendientes'
                        : filtroRol === 'Administrador'
                        ? 'Administradores'
                        : filtroRol === 'Contador'
                        ? 'Contadores'
                        : 'Dueño'}
                    </span>
                    <X className="w-3 h-3 text-blue-600" />
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Políticas de seguridad Nixi VE activas
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {miembrosFiltrados.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      No se encontraron miembros con el filtro "{filtroRol}"
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Prueba seleccionando otro rol o restablece el filtro para ver todo el equipo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiltroRol('Todos')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    Mostrar todos los miembros
                  </button>
                </div>
              ) : (
                miembrosFiltrados.map((member) => {
                const isDueño =
                  member.role === 'Dueño' ||
                  Boolean(member.isOwner) ||
                  member.name.toLowerCase().includes('gabriel') ||
                  member.email.toLowerCase().includes('egabriel');

                const isCurrentLoggedUser =
                  member.email.toLowerCase() === (currentUser?.email || profile.email).toLowerCase() ||
                  member.isOwner;

                const memberInitials = (() => {
                  const parts = member.name.trim().split(/\s+/);
                  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
                  return (parts[0][0] + parts[1][0]).toUpperCase();
                })();

                return (
                  <div
                    key={member.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Left: Avatar + Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {isDueño && profile.profileImage ? (
                          <img
                            src={profile.profileImage}
                            alt={member.name}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500 shadow-xs"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-full ${
                              isDueño
                                ? 'bg-purple-600 ring-2 ring-purple-300'
                                : member.avatarColor || 'bg-slate-700'
                            } text-white font-bold flex items-center justify-center text-sm shadow-xs`}
                          >
                            {memberInitials}
                          </div>
                        )}

                        {/* Crown badge indicator for Dueño */}
                        {isDueño && (
                          <div
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-xs"
                            title="Propietario de la Cuenta"
                          >
                            <Crown className="w-3 h-3 text-purple-900 fill-purple-900" />
                          </div>
                        )}
                      </div>

                      {/* Name, email, badges */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {member.name}
                          </h3>
                          {isDueño ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1 shadow-2xs">
                              <Crown className="w-2.5 h-2.5 fill-purple-600 text-purple-600" />
                              <span>Tú (Dueño)</span>
                            </span>
                          ) : isCurrentLoggedUser ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              Tú
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                          <span className="font-medium text-slate-600">{member.email}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-400">
                            {member.status === 'Pendiente'
                              ? `Invitado el ${member.invitedDate || 'recientemente'}`
                              : `Activo · ${member.lastActive || 'En línea'}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Role badge + Status badge + Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {/* Status badge */}
                      {member.status === 'Pendiente' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Pendiente</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Activo</span>
                        </span>
                      )}

                      {/* Role badge */}
                      {isDueño ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
                          <Crown className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                          <span>Dueño</span>
                        </span>
                      ) : member.role === 'Administrador' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                          <Shield className="w-3.5 h-3.5 text-blue-600" />
                          <span>Administrador</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-orange-900 border border-yellow-300 shadow-2xs">
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Contador</span>
                        </span>
                      )}

                      {/* Botón de tres puntos: SOLO el Dueño puede gestionar y NUNCA en su propia tarjeta */}
                      {isCurrentLoggedDueño && !isDueño && (
                        <button
                          type="button"
                          onClick={() => handleOpenMemberActions(member)}
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          aria-label={`Opciones para ${member.name}`}
                          title={`Opciones para ${member.name}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MODAL / BOTTOM SHEET: ACCIONES DE MIEMBRO (MÓVIL & DESKTOP)               */}
          {/* ========================================================================= */}
          {selectedMemberForActions && !isChangeRoleModalOpen && !isDeleteMemberConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div
                className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden transform transition-all animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
              >
                {/* Grab handle bar for mobile */}
                <div className="pt-3 pb-1 sm:hidden">
                  <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
                </div>

                {/* Header del Bottom Sheet */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full ${
                        selectedMemberForActions.avatarColor || 'bg-slate-700'
                      } text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}
                    >
                      {selectedMemberForActions.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {selectedMemberForActions.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {selectedMemberForActions.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseMemberActions}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    aria-label="Cerrar modal de acciones"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Badges de rol y estado */}
                <div className="px-5 py-3 bg-slate-50/30 border-b border-slate-100 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">Estado actual:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedMemberForActions.role === 'Administrador'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-yellow-50 text-orange-900 border border-yellow-300'
                    }`}
                  >
                    {selectedMemberForActions.role}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      selectedMemberForActions.status === 'Pendiente'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {selectedMemberForActions.status}
                  </span>
                </div>

                {/* Opciones del Modal */}
                <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto">
                  {/* Opción 1: Cambiar Rol */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNewRole(
                        selectedMemberForActions.role === 'Administrador' ? 'Contador' : 'Administrador'
                      );
                      setIsChangeRoleModalOpen(true);
                    }}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                          Cambiar Rol
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Alternar entre Administrador y Contador
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">Configurar →</span>
                  </button>

                  {/* Opción 2: Reenviar Invitación (si estuviera pendiente) */}
                  {selectedMemberForActions.status === 'Pendiente' && (
                    <button
                      type="button"
                      onClick={() => handleResendInvitation(selectedMemberForActions)}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                            Reenviar Invitación
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Enviar un nuevo enlace de activación por correo
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber-600">Reenviar →</span>
                    </button>
                  )}

                  {/* Opción 3: Eliminar del Equipo (En texto rojo) */}
                  <button
                    type="button"
                    onClick={() => setIsDeleteMemberConfirmOpen(true)}
                    className="w-full text-left p-3.5 rounded-xl border border-rose-100 hover:border-rose-300 bg-rose-50/30 hover:bg-rose-50 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-rose-600 block">
                          Eliminar del Equipo
                        </span>
                        <span className="text-[11px] text-rose-500/80 block">
                          Revocar acceso inmediato a la cuenta Nixi
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-rose-600">Eliminar →</span>
                  </button>
                </div>

                {/* Footer con botón de Cancelar */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleCloseMemberActions}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL: CAMBIAR ROL                                                        */}
          {/* ========================================================================= */}
          {selectedMemberForActions && isChangeRoleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Cambiar Rol de Usuario
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedMemberForActions.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangeRoleModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <p className="text-xs text-slate-600">
                    Selecciona el nuevo nivel de acceso para <strong>{selectedMemberForActions.name}</strong> ({selectedMemberForActions.email}):
                  </p>

                  {/* Selector de Rol */}
                  <div className="space-y-2.5">
                    {/* Administrador */}
                    <label
                      onClick={() => setSelectedNewRole('Administrador')}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedNewRole === 'Administrador'
                          ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="newRole"
                        checked={selectedNewRole === 'Administrador'}
                        onChange={() => setSelectedNewRole('Administrador')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                            Administrador
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleDetailModal('Administrador');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            <Info className="w-3 h-3" />
                            <span>Ver permisos</span>
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-500 block leading-relaxed mt-0.5">
                          Acceso total a facturación, conciliación, gestión de clientes, emisión de comprobantes SENIAT e invitación de miembros.
                        </span>
                      </div>
                    </label>

                    {/* Contador */}
                    <label
                      onClick={() => setSelectedNewRole('Contador')}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedNewRole === 'Contador'
                          ? 'border-amber-600 bg-amber-50/50 shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="newRole"
                        checked={selectedNewRole === 'Contador'}
                        onChange={() => setSelectedNewRole('Contador')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                            Contador
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoleDetailModal('Contador');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                          >
                            <Info className="w-3 h-3" />
                            <span>Ver permisos</span>
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-500 block leading-relaxed mt-0.5">
                          Acceso a emitir facturas, consultar saldos y registrar pagos. No puede invitar miembros, gestionar el equipo ni eliminar la cuenta.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsChangeRoleModalOpen(false)}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRoleChange}
                    className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Guardar Rol
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL: CONFIRMACIÓN ELIMINAR DEL EQUIPO                                   */}
          {/* ========================================================================= */}
          {selectedMemberForActions && isDeleteMemberConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    ¿Eliminar a {selectedMemberForActions.name} del equipo?
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    ¿Estás seguro que deseas eliminar a <strong>{selectedMemberForActions.name}</strong> del equipo? Perderá acceso inmediatamente.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteMemberConfirmOpen(false)}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRemoveMember}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    Sí, eliminar del equipo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INVITAR NUEVO MIEMBRO                                              */}
      {/* ========================================================================= */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header del Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Invitar Nuevo Miembro
                  </h3>
                  <p className="text-xs text-slate-500">
                    Incorpora a un colega o asesor contable
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSendInviteSubmit}>
              <div className="p-5 sm:p-6 space-y-4">
                {/* Correo Electrónico del empleado */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico del empleado <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="ejemplo@empresa.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Nombre Opcional */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre del Colaborador (Opcional)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Ej. Lic. Fernando Gómez"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Rol a Asignar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rol a asignar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'Administrador' | 'Contador')}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer font-medium"
                  >
                    <option value="Administrador">Administrador (Acceso total operativo)</option>
                    <option value="Contador">Contador (Saldos, facturación y conciliación)</option>
                  </select>
                </div>

                {/* Explicación del rol seleccionado */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {inviteRole === 'Administrador' ? 'Permisos de Administrador:' : 'Permisos de Contador:'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {inviteRole === 'Administrador'
                      ? 'Puede emitir facturas, conciliar pagos, gestionar clientes, invitar miembros y exportar reportes.'
                      : 'Puede registrar pagos y visualizar facturas. No puede invitar miembros, gestionar el equipo ni eliminar la cuenta.'}
                  </p>
                </div>

                {/* Texto explicativo obligatorio requerido por el usuario */}
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
                  Enviaremos un correo de invitación para que se una a tu equipo en Nixi.
                </div>
              </div>

              {/* Acciones */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  disabled={isSendingInvite}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingInvite ? 'animate-pulse' : ''}`} />
                  <span>{isSendingInvite ? 'Enviando...' : 'Enviar Invitación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Advertencia para Eliminar Cuenta */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                ¿Estás seguro que deseas eliminar tu cuenta?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Esta acción borrará todas tus facturas y clientes permanentemente.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Sí, eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE TRANSPARENCIA: DETALLES DEL ROL (SOLO LECTURA)                  */}
      {/* ========================================================================= */}
      {roleDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setRoleDetailModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-detail-title"
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal con Color según el Rol */}
            <div
              className={`p-5 sm:p-6 border-b flex items-start justify-between gap-3 ${
                roleDetailModal === 'Administrador'
                  ? 'bg-blue-50/90 border-blue-100'
                  : roleDetailModal === 'Contador'
                  ? 'bg-amber-50/90 border-amber-100'
                  : 'bg-purple-50/90 border-purple-100'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    roleDetailModal === 'Administrador'
                      ? 'bg-blue-600 text-white'
                      : roleDetailModal === 'Contador'
                      ? 'bg-amber-500 text-white'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  {roleDetailModal === 'Administrador' ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : roleDetailModal === 'Contador' ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <Crown className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      id="role-detail-title"
                      className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
                    >
                      Detalles del Rol: {roleDetailModal}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        roleDetailModal === 'Administrador'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : roleDetailModal === 'Contador'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-purple-100 text-purple-900 border border-purple-200'
                      }`}
                    >
                      <Lock className="w-2.5 h-2.5" />
                      Solo Lectura
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {roleDetailModal === 'Administrador'
                      ? 'Control operativo sobre facturación, clientes y conciliación bancaria.'
                      : roleDetailModal === 'Contador'
                      ? 'Perfil para consulta, balances contables y reportes ejecutivos.'
                      : 'Propietario de la cuenta con gobierno total sobre la organización.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRoleDetailModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                aria-label="Cerrar modal de detalles del rol"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de Navegación Rápida entre Roles */}
            <div className="px-5 pt-3 pb-0 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Ver otro rol:
              </span>
              {(['Administrador', 'Contador', 'Dueño'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleDetailModal(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    roleDetailModal === r
                      ? r === 'Administrador'
                        ? 'border-blue-600 text-blue-700 bg-white shadow-2xs font-bold'
                        : r === 'Contador'
                        ? 'border-amber-600 text-amber-800 bg-white shadow-2xs font-bold'
                        : 'border-purple-600 text-purple-700 bg-white shadow-2xs font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Cuerpo del Modal: Lo que PUEDE y NO PUEDE hacer */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
              {/* Sección 1: Lo que PUEDE hacer (Check verde) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    Lo que PUEDE hacer
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {roleDetailModal === 'Administrador' && (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Emitir y anular facturas.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Emisión fiscal en doble moneda (USD / VES), cálculo automático del IVA 16% y tasa oficial del BCV.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Gestionar clientes y riesgos.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Creación de fichas de clientes, consulta de solvencia, límites de crédito y días de gracia.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Conciliar pagos bancarios.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Validación de comprobantes, depósitos bancarios nacionales (Pago Móvil / Transferencias) y Zelle.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Invitar nuevos miembros al equipo.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Incorporación de nuevos colaboradores y envío de invitaciones por correo electrónico.
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {roleDetailModal === 'Contador' && (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Ver facturas y saldos.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Consulta en tiempo real de facturación emitida, saldos pendientes y cartera de cobranza.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Descargar reportes ejecutivos (Excel/PDF).
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Exportación de cartera por antigüedad, libros de ventas y estados de cuentas por cobrar.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Registrar pagos (opcional, dependiendo de la política de la empresa).
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Asentar cobros bancarios confirmados para actualizar el saldo del cliente en la plataforma.
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {roleDetailModal === 'Dueño' && (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Control total de la organización y suscripción.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Acceso irrestricto a todos los módulos: Facturación, Cobros, Conciliación, Clientes, Informes y Seguridad.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Gestionar y asignar roles del equipo.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Facultad exclusiva de promover a Administrador, cambiar a Contador o revocar accesos al Directorio.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                            Eliminar la cuenta corporativa.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Único usuario autorizado para ejecutar la eliminación permanente de la cuenta jurídica.
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sección 2: Lo que NO PUEDE hacer (X roja) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    Lo que NO PUEDE hacer
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {roleDetailModal === 'Administrador' && (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-rose-950 block text-xs sm:text-sm">
                            Eliminar la cuenta corporativa.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            Protección de seguridad corporativa. Solo el Dueño puede disolver la cuenta y sus datos.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-rose-950 block text-xs sm:text-sm">
                            Cambiar el rol del Dueño.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            La titularidad de la empresa es inmutable para los administradores.
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {roleDetailModal === 'Contador' && (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-rose-950 block text-xs sm:text-sm">
                            Emitir nuevas facturas.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            No posee permisos de facturación activa ni anulación de documentos fiscales.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-rose-950 block text-xs sm:text-sm">
                            Gestionar clientes (crear/eliminar).
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            No puede alterar la base de clientes comerciales ni modificar cupos crediticios.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-bold text-rose-950 block text-xs sm:text-sm">
                            Invitar miembros al equipo.
                          </span>
                          <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                            La incorporación y control de usuarios está reservada para niveles con mayor jerarquía.
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {roleDetailModal === 'Dueño' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>El rol de Dueño cuenta con inmunidad y facultades absolutas sobre el sistema.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nota Informativa de Gobernanza (Solo Lectura) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-slate-600 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Panel de transparencia (Solo lectura):</strong> Esta información permite al Dueño conocer las capacidades exactas de cada rol antes de asignarlo. La gestión y modificación de roles continúa estando reservada <strong>únicamente para el Dueño</strong>.
                </p>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
                Nixi RBAC · Matriz de Seguridad y Privilegios
              </span>
              <button
                type="button"
                onClick={() => setRoleDetailModal(null)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalles del Comprobante de Pago Móvil */}
      {isReceiptModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsReceiptModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-slate-900 animate-in zoom-in-95 duration-200 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                    Comprobante de Pago Móvil
                  </h3>
                  <p className="text-xs text-blue-200">
                    Suscripción Nixi · Plan Emprendedor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Comprobante */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Badge de Estado: Aprobado / Conciliado */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">
                      Estado del Pago
                    </span>
                    <span className="text-sm font-bold text-emerald-950">
                      Aprobado / Conciliado
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-600 text-white rounded-lg shadow-xs">
                  Conciliado
                </span>
              </div>

              {/* Lista Detallada de Campos Requeridos */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 divide-y divide-slate-200 text-xs sm:text-sm">
                <div className="p-3 sm:p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Método:</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    {receiptData.method}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Banco Emisor:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[200px] truncate">
                    {receiptData.issuingBank}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Banco Destino:</span>
                  <span className="font-semibold text-slate-900">
                    {receiptData.targetBank}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Teléfono Destino:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {receiptData.targetPhone}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">RIF Destino:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {receiptData.targetRif}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Titular Beneficiario:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {receiptData.targetHolder}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 flex items-center justify-between bg-blue-50/60">
                  <span className="text-blue-900 font-semibold">Número de Referencia:</span>
                  <span className="font-mono font-bold text-blue-700 text-sm tracking-wider">
                    {receiptData.reference}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Fecha de Pago:</span>
                  <span className="font-medium text-slate-900">
                    {receiptData.paymentDate}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Comprobante Adjunto:</span>
                  <span className="font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-xs flex items-center gap-1.5 truncate max-w-[200px]">
                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{receiptData.fileName}</span>
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 flex items-center justify-between bg-slate-100/70">
                  <span className="text-slate-700 font-bold">Monto Pagado:</span>
                  <div className="text-right">
                    <span className="font-black text-slate-900 text-sm sm:text-base font-mono block">
                      ${receiptData.amountUsd.toFixed(2)} USD
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      (aprox. Bs. {receiptData.amountVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => {
                  const receiptText = `COMPROBANTE PAGO MÓVIL NIXI\nRef: ${receiptData.reference}\nFecha: ${receiptData.paymentDate}\nMonto: $${receiptData.amountUsd.toFixed(2)} USD (Bs. ${receiptData.amountVes.toFixed(2)})\nBanco: ${receiptData.issuingBank}\nDestino: ${receiptData.targetBank} (${receiptData.targetPhone})\nEstado: Aprobado / Conciliado`;
                  navigator.clipboard.writeText(receiptText);
                  setReceiptCopied(true);
                  onShowToast('Comprobante copiado al portapapeles', 'info');
                  setTimeout(() => setReceiptCopied(false), 2000);
                }}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {receiptCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copiar Resumen</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
