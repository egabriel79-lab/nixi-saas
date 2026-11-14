/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { CheckoutView } from './components/CheckoutView';
import { HelpView } from './components/HelpView';
import { SuperadminView } from './components/SuperadminView';
import { TermsView } from './components/TermsView';
import { PrivacyView } from './components/PrivacyView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ViewMode, AuthUser, CurrentUser } from './types';
import { BcvProvider } from './context/BcvContext';
import { UserProvider } from './context/UserContext';
import { DataProvider, useData } from './context/DataContext';
import {
  registerUser,
  verifyCredentials,
  toggleUserRole,
} from './utils/auth';
import { supabase } from './supabaseClient.js';

function AppContent() {
  const {
    currentUser,
    setCurrentUser,
    logoutUser,
    vaciarEstadoGlobal,
    setTrialDaysLeft,
    activateSubscription,
  } = useData();

  // 1 & 3. Estado Inicial y Persistencia de Sesión:
  // - NUNCA inicia en 'dashboard' si no hay un usuario autenticado guardado en localStorage.
  // - Si hay sesión activa en localStorage tras recarga, navega directo a 'dashboard'.
  // - Si no hay usuario en localStorage, SIEMPRE inicia en 'landing'.
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      const raw = localStorage.getItem('nixi_current_user') || localStorage.getItem('nixi_auth_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name && parsed.name.trim()) {
          return 'dashboard';
        }
      }
      return 'landing';
    } catch {
      return 'landing';
    }
  });

  const SUPERADMIN_EMAIL = 'egabriel79@gmail.com';
  const isSuperAdminUser = (user: CurrentUser | AuthUser | null | undefined) =>
    Boolean(user?.email && user.email.trim().toLowerCase() === SUPERADMIN_EMAIL);

  const navigateToView = (view: ViewMode) => {
    if (view === 'superadmin' && !isSuperAdminUser(currentUser)) {
      addGlobalToast('Acceso denegado', 'warning');
      setCurrentView(currentUser && currentUser.name && currentUser.name.trim() ? 'dashboard' : 'login');
      return;
    }
    setCurrentView(view);
  };

  // Event listener global para cambios de vista directos (ej. botón de activar plan desde Perfil)
  useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ViewMode>;
      if (customEvent.detail) {
        if (customEvent.detail === 'superadmin' && !isSuperAdminUser(currentUser)) {
          addGlobalToast('Acceso denegado', 'warning');
          setCurrentView(currentUser && currentUser.name && currentUser.name.trim() ? 'dashboard' : 'login');
          return;
        }
        setCurrentView(customEvent.detail);
      }
    };
    window.addEventListener('nixi:navigate', handleNavEvent);
    return () => window.removeEventListener('nixi:navigate', handleNavEvent);
  }, [currentUser]);

  const [globalToasts, setGlobalToasts] = useState<ToastMessage[]>([]);

  const addGlobalToast = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setGlobalToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setGlobalToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeGlobalToast = (id: string) => {
    setGlobalToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 2. Protección de Rutas (Auth Guard & Superadmin Route Guard):
  // - Si currentView intenta cambiar a 'superadmin' sin el correo autorizado, muestra Toast "Acceso denegado" y fuerza vuelta a 'dashboard' (o 'login' si no hay sesión).
  // - Si currentView es 'dashboard' pero currentUser es null o está vacío, fuerza cambio a 'login'.
  useEffect(() => {
    if (currentView === 'superadmin') {
      if (!isSuperAdminUser(currentUser)) {
        addGlobalToast('Acceso denegado', 'warning');
        setCurrentView(currentUser && currentUser.name && currentUser.name.trim() ? 'dashboard' : 'login');
      }
      return;
    }
    if (currentView === 'dashboard') {
      if (!currentUser || !currentUser.name || !currentUser.name.trim()) {
        setCurrentView('login');
        addGlobalToast('Debes iniciar sesión para acceder al panel de control.', 'warning');
      }
    }
  }, [currentView, currentUser]);

  // Registro: crea el usuario, registra la empresa en Supabase y navega a Checkout para activar con Pago Móvil
  const handleRegister = async (data: {
    name: string;
    email: string;
    password?: string;
    companyName?: string;
    companyRif?: string;
  }) => {
    // Vaciar datos globales previos para que la cuenta inicie en blanco (0 clientes, 0 facturas, 0 movimientos)
    vaciarEstadoGlobal();
    setTrialDaysLeft(7);
    try {
      localStorage.setItem('nixi_trial_days_left', '7');
    } catch {}

    const userEmail = data.email.trim().toLowerCase();
    // El nombre de la empresa (o el nombre del usuario si no puso empresa)
    const companyName = data.companyName?.trim() || data.name.trim();
    // El RIF (o un texto por defecto si no lo pide)
    const companyRif = data.companyRif?.trim().toUpperCase() || 'J-00000000-0';
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7); // Fecha actual + 7 días (Trial por defecto)

    // Inserción en la tabla 'empresas' de Supabase (evitando duplicar si ya se insertó)
    try {
      const { data: existing } = await supabase
        .from('empresas')
        .select('id')
        .ilike('email', userEmail)
        .limit(1);

      if (!existing || existing.length === 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('empresas')
          .insert([
            {
              nombre: companyName,
              rif: companyRif,
              email: userEmail,
              estado: 'Trial',
              fecha_vencimiento: expDate.toISOString(),
            },
          ])
          .select();

        if (insertError) {
          console.error('Aviso de Supabase al registrar empresa:', insertError.message);
        } else {
          console.info('✅ Empresa creada exitosamente en Supabase:', inserted);
        }
      }
    } catch (err: any) {
      console.error('Error insertando empresa en Supabase:', err);
    }

    const authUser: AuthUser = {
      name: data.name.trim(),
      email: data.email.trim(),
      role: 'Administrador',
    };

    registerUser({
      ...authUser,
      password: data.password || 'password123',
      createdAt: new Date().toISOString(),
    });

    setCurrentUser(authUser);
    setCurrentView('checkout');
    addGlobalToast(`¡Bienvenido a Nixi! Empresa "${companyName}" registrada en periodo de prueba.`, 'success');
  };

  const handleCheckoutSuccess = () => {
    activateSubscription();
    setCurrentView('dashboard');
    addGlobalToast('✅ Pago recibido. ¡Suscripción Plan Emprendedor activada con éxito!', 'success');
  };

  // Inicio de Sesión: valida credenciales, activa sesión y navega al Dashboard
  const handleLogin = (email: string, password: string): boolean => {
    const matched = verifyCredentials(email, password);

    if (matched) {
      setCurrentUser(matched);
      setCurrentView('dashboard');
      addGlobalToast(`Sesión iniciada correctamente. Bienvenido de vuelta, ${matched.name}.`, 'success');
      return true;
    } else {
      addGlobalToast('Credenciales incorrectas. Verifica tu correo y contraseña.', 'warning');
      return false;
    }
  };

  // 4. Cerrar Sesión: borra currentUser del estado y del localStorage, y cambia currentView a 'landing'
  const handleLogout = () => {
    logoutUser();
    setCurrentView('landing');
    addGlobalToast('Has cerrado sesión exitosamente en Nixi.', 'info');
  };

  // Eliminar Cuenta: borra sesión y redirige a la Landing Page
  const handleAccountDeleted = () => {
    logoutUser();
    setCurrentView('landing');
    addGlobalToast('Tu cuenta y datos asociados han sido eliminados de forma permanente.', 'warning');
  };

  // Alternador de rol para pruebas rápidas
  const handleToggleRole = () => {
    if (!currentUser) return;
    const newRole = currentUser.role.toLowerCase().includes('contad') ? 'Administrador' : 'Contador';
    setCurrentUser({
      ...currentUser,
      role: newRole,
    });
    addGlobalToast(`Rol cambiado a ${newRole}. Permisos actualizados en tiempo real.`, 'info');
  };

  return (
    <div
      className={`min-h-screen ${
        currentView === 'dashboard' ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0f1c] text-slate-100'
      }`}
    >
      {currentView === 'landing' && (
        <LandingPage
          onNavigate={navigateToView}
          onEnterDashboard={() => {
            if (currentUser) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('register');
            }
          }}
        />
      )}

      {currentView === 'login' && (
        <LoginView
          onLogin={handleLogin}
          onGoToRegister={() => setCurrentView('register')}
          onBackToLanding={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'register' && (
        <RegisterView
          onRegister={handleRegister}
          onGoToLogin={() => setCurrentView('login')}
          onBackToLanding={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'checkout' && (
        <CheckoutView
          onConfirmSuccess={handleCheckoutSuccess}
          onBackToLanding={() => setCurrentView('landing')}
          onShowToast={addGlobalToast}
        />
      )}

      {currentView === 'dashboard' && currentUser && (
        <Dashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onAccountDeleted={handleAccountDeleted}
          onToggleRole={handleToggleRole}
          onNavigateToCheckout={() => setCurrentView('checkout')}
          onNavigateToHelp={() => setCurrentView('help')}
          onNavigateToSuperadmin={
            isSuperAdminUser(currentUser) ? () => navigateToView('superadmin') : undefined
          }
        />
      )}

      {currentView === 'help' && (
        <HelpView onBackToDashboard={() => setCurrentView('dashboard')} />
      )}

      {currentView === 'superadmin' && isSuperAdminUser(currentUser) && (
        <SuperadminView
          onBackToApp={() => setCurrentView('dashboard')}
          onBackToLanding={() => setCurrentView('landing')}
          onShowToast={addGlobalToast}
        />
      )}

      {currentView === 'terms' && (
        <TermsView
          onBackToLanding={() => setCurrentView('landing')}
          onNavigateToPrivacy={() => setCurrentView('privacy')}
        />
      )}

      {currentView === 'privacy' && (
        <PrivacyView
          onBackToLanding={() => setCurrentView('landing')}
          onNavigateToTerms={() => setCurrentView('terms')}
        />
      )}

      {/* Global toasts for transitions */}
      <ToastContainer toasts={globalToasts} onDismiss={removeGlobalToast} />
    </div>
  );
}

export default function App() {
  return (
    <BcvProvider>
      <UserProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </UserProvider>
    </BcvProvider>
  );
}
