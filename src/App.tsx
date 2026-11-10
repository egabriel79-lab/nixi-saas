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
import { ToastContainer, ToastMessage } from './components/Toast';
import { ViewMode, AuthUser } from './types';
import { BcvProvider } from './context/BcvContext';
import { UserProvider } from './context/UserContext';
import { DataProvider, useData } from './context/DataContext';
import {
  registerUser,
  verifyCredentials,
  toggleUserRole,
} from './utils/auth';

function AppContent() {
  const { currentUser, setCurrentUser, logoutUser, vaciarEstadoGlobal, setTrialDaysLeft } = useData();

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

  // 2. Protección de Rutas (Auth Guard):
  // Si currentView es 'dashboard' pero currentUser es null o está vacío,
  // la app fuerza automáticamente el cambio a 'login'.
  useEffect(() => {
    if (currentView === 'dashboard') {
      if (!currentUser || !currentUser.name || !currentUser.name.trim()) {
        setCurrentView('login');
        addGlobalToast('Debes iniciar sesión para acceder al panel de control.', 'warning');
      }
    }
  }, [currentView, currentUser]);

  // Registro: crea el usuario, guarda la sesión y navega a Checkout para activar con Pago Móvil
  const handleRegister = (data: { name: string; email: string; password?: string }) => {
    // Vaciar datos globales previos para que la cuenta inicie en blanco (0 clientes, 0 facturas, 0 movimientos)
    vaciarEstadoGlobal();
    setTrialDaysLeft(7);
    try {
      localStorage.setItem('nixi_trial_days_left', '7');
    } catch {}

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
    addGlobalToast(`¡Bienvenido a Nixi, ${authUser.name}! Por favor confirma tu activación mediante Pago Móvil.`, 'info');
  };

  const handleCheckoutSuccess = () => {
    setCurrentView('dashboard');
    addGlobalToast('✅ Pago recibido. ¡Bienvenido a Nixi!', 'success');
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
          onNavigate={(view) => setCurrentView(view)}
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
          onNavigateToSuperadmin={() => setCurrentView('superadmin')}
        />
      )}

      {currentView === 'help' && (
        <HelpView onBackToDashboard={() => setCurrentView('dashboard')} />
      )}

      {currentView === 'superadmin' && (
        <SuperadminView
          onBackToApp={() => {
            if (currentUser && currentUser.name) {
              setCurrentView('dashboard');
            } else {
              // Si no había sesión activa, se inicia sesión como Dueño para entrar al Dashboard
              setCurrentUser({
                name: 'Gabriel Echeverría',
                email: 'Egabriel79@gmail.com',
                role: 'Dueño',
              });
              setCurrentView('dashboard');
            }
          }}
          onBackToLanding={() => setCurrentView('landing')}
          onShowToast={addGlobalToast}
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
