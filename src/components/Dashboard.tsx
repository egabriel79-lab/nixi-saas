import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BillingModule } from './modules/BillingModule';
import { ConstructionModule } from './modules/ConstructionModule';
import { ProfileModule } from './modules/ProfileModule';
import { AutomationModule } from './modules/AutomationModule';
import { ReconciliationModule } from './modules/ReconciliationModule';
import { ClientManagementModule } from './modules/ClientManagementModule';
import { ReportsModule } from './modules/ReportsModule';
import { SecurityModule } from './modules/SecurityModule';
import { DeleteAccountModal } from './DeleteAccountModal';
import { ToastContainer, ToastMessage } from './Toast';
import { InvoiceView } from './InvoiceView';
import { DashboardSection, Invoice, AuthUser, CurrentUser } from '../types';
import { useData } from '../context/DataContext';
import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

interface DashboardProps {
  currentUser?: CurrentUser | AuthUser | null;
  onLogout: () => void;
  onAccountDeleted: () => void;
  onToggleRole?: () => void;
  onNavigateToCheckout?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToSuperadmin?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onLogout,
  onAccountDeleted,
  onToggleRole,
  onNavigateToCheckout,
  onNavigateToHelp,
  onNavigateToSuperadmin,
}) => {
  const [currentSection, setCurrentSection] = useState<DashboardSection>('facturacion');
  const [profileTab, setProfileTab] = useState<'datos' | 'equipo'>('datos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const {
    currentUser: contextUser,
    facturas,
    setFacturas,
    agregarFactura,
    registrarPagoFactura,
    trialDaysLeft,
  } = useData();

  const activeUser = contextUser || currentUser || { name: 'Gabriel Echeverría', role: 'Administrador' };
  const userRole = activeUser.role;
  const isContador = userRole.toLowerCase().includes('contad');

  const addToast = useCallback((message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 4. Consulta de Datos Reales en el Dashboard (SELECT * from facturas)
  useEffect(() => {
    const fetchSupabaseFacturas = async () => {
      if (!isSupabaseConfigured()) {
        console.info('Supabase: utilizando datos locales (reemplaza credenciales en src/supabaseClient.js)');
        return;
      }

      try {
        const { data, error } = await supabase.from('facturas').select('*');
        if (error) {
          console.warn('Aviso al consultar facturas en Supabase:', error.message);
          const isTableMissing =
            error.message.toLowerCase().includes('relation') &&
            error.message.toLowerCase().includes('does not exist');
          if (isTableMissing) {
            addToast('ℹ️ Conectado a Supabase: Crea las tablas "facturas" y "clientes" para persistir en la nube.', 'info');
          } else {
            addToast(`Aviso Supabase: ${error.message}`, 'warning');
          }
        } else if (data && data.length > 0) {
          const mappedInvoices: Invoice[] = data.map((row: any, index: number) => ({
            id: String(row.id || `inv-supabase-${index}-${Date.now()}`),
            number: row.numero_factura || row.number || `FAC-2026-0${100 + index}`,
            client: row.cliente || row.client || 'Cliente Registrado',
            clientTaxId: row.rif || row.client_tax_id || 'J-40123456-7',
            issueDate: row.fecha_emision || row.issue_date || 'Hoy',
            dueDate: row.fecha_vencimiento || row.due_date || '30 días',
            amount: Number(row.monto_usd ?? row.amount ?? 0),
            currency: 'USD' as const,
            originalAmount: Number(row.monto_usd ?? row.amount ?? 0),
            originalCurrency: 'USD' as const,
            ivaPercent: 16,
            status: (
              String(row.estado || '').toLowerCase() === 'pagada'
                ? 'pagada'
                : String(row.estado || '').toLowerCase() === 'vencida'
                ? 'vencida'
                : 'pendiente'
            ) as 'pendiente' | 'pagada' | 'vencida',
            itemsCount: 1,
          }));

          setFacturas(mappedInvoices);
          addToast(`✅ ${data.length} facturas sincronizadas desde Supabase`, 'success');
        }
      } catch (err: any) {
        console.error('Error cargando facturas de Supabase:', err);
      }
    };

    fetchSupabaseFacturas();
  }, [setFacturas, addToast]);

  const handleAddInvoice = (newInv: Omit<Invoice, 'id'>) => {
    agregarFactura(newInv);
    addToast('✅ Emisión de factura exitosa', 'success');
  };

  const handleSendReminder = (invoice: Invoice) => {
    addToast(`📩 Aviso de cobro enviado a ${invoice.client}`, 'info');
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
  };

  const handleMarkAsPaid = (invoiceId: string, paymentMethod: string, reference: string) => {
    registrarPagoFactura(invoiceId, paymentMethod, reference);
    addToast('✅ Registro de pago exitoso', 'success');
  };

  const handleSendBulkReminders = () => {
    addToast('✅ Recordatorios enviados exitosamente', 'success');
  };

  const handleConfirmDelete = () => {
    onAccountDeleted();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Responsive Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
        onRequestDeleteAccount={() => setIsDeleteModalOpen(true)}
        userRole={userRole}
        onNavigateToHelp={onNavigateToHelp}
      />

      {/* Main Layout Area (offset on desktop by sidebar width) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          currentSection={currentSection}
          userName={activeUser.name}
          userRole={userRole}
          onOpenProfile={() => {
            setProfileTab('datos');
            setCurrentSection('perfil');
          }}
          onToggleRole={onToggleRole}
        />

        {/* Banner de Periodo de Prueba (Facturación) */}
        {currentSection === 'facturacion' && trialDaysLeft > 0 && (
          <div className="bg-gradient-to-r from-blue-900/95 via-slate-900 to-blue-950 border-b border-blue-500/30 px-4 sm:px-6 py-2.5 text-white shadow-md">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-center sm:text-left">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-slate-200">
                  Estás en tu periodo de prueba. Te quedan{' '}
                  <span className="font-bold text-white underline decoration-blue-400 underline-offset-2">
                    {trialDaysLeft} {trialDaysLeft === 1 ? 'día' : 'días'}
                  </span>{' '}
                  para activar tu plan.
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToCheckout}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer shrink-0 hover:scale-[1.02]"
              >
                <span>Activar ahora</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 sm:pb-28">
          {currentSection === 'perfil' ? (
            <ProfileModule
              initialTab={profileTab}
              onBackToDashboard={() => setCurrentSection('facturacion')}
              onShowToast={addToast}
              onLogout={onLogout}
              onAccountDeleted={onAccountDeleted}
              userRole={userRole}
              onNavigateToCheckout={onNavigateToCheckout}
              onNavigateToSuperadmin={onNavigateToSuperadmin}
            />
          ) : currentSection === 'facturacion' ? (
            <BillingModule
              invoices={facturas}
              onAddInvoice={handleAddInvoice}
              onSendReminder={handleSendReminder}
              onDownloadPdf={handleDownloadPdf}
              onMarkAsPaid={handleMarkAsPaid}
              onSendBulkReminders={handleSendBulkReminders}
              onShowToast={addToast}
            />
          ) : currentSection === 'automatizacion' ? (
            <AutomationModule onShowToast={addToast} />
          ) : currentSection === 'conciliacion' ? (
            <ReconciliationModule
              invoices={facturas}
              onMarkInvoiceAsPaid={handleMarkAsPaid}
              onShowToast={addToast}
            />
          ) : currentSection === 'clientes' ? (
            <ClientManagementModule
              invoices={facturas}
              onShowToast={addToast}
              onNavigateToSection={(sec) => setCurrentSection(sec)}
              userRole={userRole}
            />
          ) : currentSection === 'paneles' ? (
            <ReportsModule onShowToast={addToast} />
          ) : currentSection === 'seguridad' ? (
            <SecurityModule
              onShowToast={addToast}
              onNavigateToTeam={() => {
                setProfileTab('equipo');
                setCurrentSection('perfil');
              }}
            />
          ) : (
            <ConstructionModule
              sectionId={currentSection}
              onBackToBilling={() => setCurrentSection('facturacion')}
              onNotifyToast={(msg) => addToast(msg, 'info')}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal for Eliminar Cuenta */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Invoice Document Preview / Print */}
      {previewInvoice && (
        <InvoiceView
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onShowToast={addToast}
        />
      )}

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
