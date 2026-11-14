import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { Invoice, ClientRisk, BankMovement, AuditLogEvent, CurrentUser, TeamMember, UserRole } from '../types';
import { INITIAL_INVOICES, INITIAL_CLIENTS, INITIAL_MOVEMENTS, DEFAULT_AUDIT_LOGS } from '../data/mockData';

export interface DashboardMetrics {
  totalFacturadoUsd: number;
  pendienteUsd: number;
  vencidasUsd: number;
  totalPendienteUsd: number; // pendiente + vencida
  pagadasUsd: number;
  totalFacturasCount: number;
  pendientesCount: number;
  vencidasCount: number;
  pagadasCount: number;
  efectividadCobroPercent: number;
}

export interface DataContextType {
  // Global User State (RBAC) & Trial Period
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  setRole: (role: UserRole) => void;
  logoutUser: () => void;
  trialDaysLeft: number;
  setTrialDaysLeft: React.Dispatch<React.SetStateAction<number>>;
  isSubscriptionActive: boolean;
  setIsSubscriptionActive: React.Dispatch<React.SetStateAction<boolean>>;
  activateSubscription: () => void;

  // Team Management (Mi Equipo)
  teamMembers: TeamMember[];
  invitarMiembro: (datos: { email: string; role: 'Administrador' | 'Contador'; name?: string }) => TeamMember;
  eliminarMiembro: (memberId: string) => void;
  cambiarRolMiembro: (memberId: string, nuevoRol: 'Administrador' | 'Contador') => void;

  // Pasarela QuickLink & Saldo de Billetera (Nixi Pay)
  saldoBs: number;
  isSocioActivo: boolean;
  setIsSocioActivo: React.Dispatch<React.SetStateAction<boolean>>;
  recargarSaldo: (montoBs: number, metodo: string, referencia: string) => void;
  retirarGanancias: (montoBs: number, datosBancarios: { banco: string; cuenta: string; referencia: string }) => void;

  // Global Collections
  facturas: Invoice[];
  setFacturas: React.Dispatch<React.SetStateAction<Invoice[]>>;
  clientes: ClientRisk[];
  movimientosBanco: BankMovement[];
  auditLogs: AuditLogEvent[];
  metricasDashboard: DashboardMetrics;

  // Invoice / Payment Operations
  agregarFactura: (nuevaFactura: Omit<Invoice, 'id'> & { id?: string }) => Invoice;
  registrarPagoFactura: (facturaId: string, metodoPago: string, referencia: string) => void;
  eliminarFactura: (facturaId: string) => void;

  // Reconciliation Operations
  vincularTransaccionAFactura: (movimientoId: string, facturaId: string) => void;
  desvincularTransaccion: (movimientoId: string) => void;
  sincronizarBanco: (nuevosMovimientos?: BankMovement[]) => void;
  importarExtracto: (nuevosMovimientos: BankMovement[]) => void;

  // Client Operations
  agregarCliente: (nuevoCliente: Omit<ClientRisk, 'id'>) => ClientRisk;
  actualizarLimiteCliente: (clienteId: string, nuevoLimite: number) => void;
  eliminarCliente: (clienteId: string) => void;
  obtenerClientePorRifONombre: (rif: string, nombre?: string) => ClientRisk | undefined;

  // Audit & Automation Operations
  mensajesEnviadosCount: number;
  ejecutarRecordatoriosMasivos: (
    cantidad?: number,
    detalles?: {
      clientesCount?: number;
      facturasCount?: number;
      clientNames?: string[];
      deudaTotalUsd?: number;
    }
  ) => void;
  agregarEventoAuditoria: (
    eventoData: Omit<AuditLogEvent, 'id' | 'auditCode' | 'sha256Hash'> &
      Partial<Pick<AuditLogEvent, 'auditCode' | 'sha256Hash'>>
  ) => AuditLogEvent;

  // Reset
  reiniciarDatos: () => void;
  vaciarEstadoGlobal: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function calculateRiskLevel(usedCredit: number, creditLimit: number): 'bajo' | 'medio' | 'alto' {
  if (creditLimit <= 0) return 'alto';
  const ratio = (usedCredit / creditLimit) * 100;
  if (ratio >= 100) return 'alto';
  if (ratio >= 70) return 'medio';
  return 'bajo';
}

function getFormattedDate(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function getFormattedTimestamp(): string {
  const date = new Date();
  const dateStr = getFormattedDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateStr} · ${hours}:${minutes}`;
}

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'usr-1',
    name: 'Gabriel Echeverría',
    email: 'Egabriel79@gmail.com',
    role: 'Dueño',
    status: 'Activo',
    isOwner: true,
    avatarColor: 'bg-purple-600',
    joinedDate: 'Creador de la cuenta',
    lastActive: 'En línea ahora',
  },
  {
    id: 'usr-2',
    name: 'María Rodríguez',
    email: 'maria.r@nixi.app',
    role: 'Administrador',
    status: 'Activo',
    avatarColor: 'bg-blue-600',
    joinedDate: '15 Ene 2026',
    lastActive: 'Hoy, 10:15 AM',
  },
  {
    id: 'usr-3',
    name: 'Carlos Peña',
    email: 'carlos.cpa@nixi.app',
    role: 'Contador',
    status: 'Activo',
    avatarColor: 'bg-amber-600',
    joinedDate: '01 Feb 2026',
    lastActive: 'Ayer, 05:40 PM',
  },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Inicialización con datos de localStorage o fallback a arrays vacíos [] para cuentas nuevas
  const [facturas, setFacturas] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('nixi_facturas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((p: any) => p && String(p.id).startsWith('inv-00'))) {
          localStorage.setItem('nixi_facturas', JSON.stringify([]));
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [clientes, setClientes] = useState<ClientRisk[]>(() => {
    try {
      const saved = localStorage.getItem('nixi_clientes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((p: any) => p && String(p.id).startsWith('cli-00'))) {
          localStorage.setItem('nixi_clientes', JSON.stringify([]));
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [movimientosBanco, setMovimientosBanco] = useState<BankMovement[]>(() => {
    try {
      const saved = localStorage.getItem('nixi_movimientos_bancarios');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((p: any) => p && String(p.id).startsWith('mov-'))) {
          localStorage.setItem('nixi_movimientos_bancarios', JSON.stringify([]));
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>(() => {
    try {
      const saved = localStorage.getItem('nixi_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('nixi_team_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: TeamMember) => {
            if (m.isOwner || m.name.toLowerCase().includes('gabriel') || m.email?.toLowerCase().includes('egabriel')) {
              return { ...m, role: 'Dueño', isOwner: true };
            }
            return m;
          });
        }
      }
      const rawUser = localStorage.getItem('nixi_current_user') || localStorage.getItem('nixi_auth_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        return [
          {
            id: 'usr-owner',
            name: parsed.name || 'Dueño de la Cuenta',
            email: parsed.email || 'admin@nixi.app',
            role: 'Dueño',
            status: 'Activo',
            isOwner: true,
            avatarColor: 'bg-purple-600',
            joinedDate: 'Creador de la cuenta',
            lastActive: 'En línea ahora',
          },
        ];
      }
      return [
        {
          id: 'usr-1',
          name: 'Gabriel Echeverría',
          email: 'Egabriel79@gmail.com',
          role: 'Dueño',
          status: 'Activo',
          isOwner: true,
          avatarColor: 'bg-purple-600',
          joinedDate: 'Creador de la cuenta',
          lastActive: 'En línea ahora',
        },
      ];
    } catch (e) {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem('nixi_current_user') || localStorage.getItem('nixi_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.name.trim()) {
          let role: UserRole | string = parsed.role || 'Dueño';
          if (role === 'Administrador' && (parsed.name.toLowerCase().includes('gabriel') || parsed.email?.toLowerCase().includes('egabriel'))) {
            role = 'Dueño';
          }
          return {
            name: parsed.name,
            email: parsed.email || 'Egabriel79@gmail.com',
            role,
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Reset al cerrar sesión: vacía currentUser y todos los estados globales para evitar filtrado entre usuarios
  const logoutUser = () => {
    setCurrentUser(null);
    setFacturas([]);
    setClientes([]);
    setMovimientosBanco([]);
    setAuditLogs([]);
    setTeamMembers([]);
    try {
      localStorage.removeItem('nixi_current_user');
      localStorage.removeItem('nixi_auth_user');
      localStorage.removeItem('nixi_facturas');
      localStorage.removeItem('nixi_clientes');
      localStorage.removeItem('nixi_movimientos_bancarios');
      localStorage.removeItem('nixi_audit_logs');
      localStorage.removeItem('nixi_team_members');
      localStorage.removeItem('nixi_mensajes_enviados');
      localStorage.removeItem('nixi_sequences');
      localStorage.removeItem('nixi_subscription_payment');
    } catch (e) {
      console.warn('Error limpiando sesión en localStorage', e);
    }
  };

  const [saldoBs, setSaldoBs] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nixi_saldo_bs');
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [isSocioActivo, setIsSocioActivo] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nixi_socio_activo');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [mensajesEnviadosCount, setMensajesEnviadosCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nixi_mensajes_enviados');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nixi_trial_days_left');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 7 : Math.max(0, parsed);
      }
      return 7;
    } catch {
      return 7;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nixi_trial_days_left', trialDaysLeft.toString());
    } catch (e) {
      console.warn('Error guardando nixi_trial_days_left en localStorage', e);
    }
  }, [trialDaysLeft]);

  // Estado global de Suscripción paga de Nixi
  const [isSubscriptionActive, setIsSubscriptionActive] = useState<boolean>(() => {
    try {
      const status = localStorage.getItem('nixi_subscription_status');
      if (status === 'Activo') return true;
      const planActive = localStorage.getItem('nixi_plan_active');
      return planActive === 'true';
    } catch {
      return false;
    }
  });

  const activateSubscription = () => {
    setIsSubscriptionActive(true);
    try {
      localStorage.setItem('nixi_subscription_plan', 'Plan Emprendedor');
      localStorage.setItem('nixi_subscription_status', 'Activo');
      localStorage.setItem('nixi_plan_active', 'true');
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 30);
      localStorage.setItem('nixi_subscription_renewal', expDate.toISOString());
    } catch (e) {
      console.warn('Error guardando suscripción en localStorage', e);
    }
  };

  const setRole = (role: UserRole) => {
    setCurrentUser((prev) => (prev ? { ...prev, role } : { name: 'Gabriel Echeverría', role }));
  };

  const recargarSaldo = (montoBs: number, metodo: string, referencia: string) => {
    setSaldoBs((prev) => {
      const nuevo = prev + montoBs;
      try {
        localStorage.setItem('nixi_saldo_bs', nuevo.toString());
      } catch (e) {
        console.warn(e);
      }
      return nuevo;
    });

    agregarEventoAuditoria({
      category: 'normal',
      action: `Recarga de saldo aprobada por QuickLink (${referencia})`,
      userName: currentUser?.name || 'Gabriel Echeverría',
      userRole: currentUser?.role || 'Administrador',
      timestamp: `Hoy, ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`,
      fullDate: `${new Date().toLocaleDateString('es-VE')} - ${new Date().toLocaleTimeString('es-VE')}`,
      ipAddress: 'IP: 190.12.34.56',
      location: 'Caracas, Distrito Capital (QuickLink Gateway)',
      device: 'Plataforma Web',
      browser: 'Chrome 122.0',
      payload: {
        metodo,
        montoBs,
        referencia,
        pasarela: 'QuickLink Gateway (Nixi Pay)',
      },
    });
  };

  const retirarGanancias = (
    montoBs: number,
    datosBancarios: { banco: string; cuenta: string; referencia: string }
  ) => {
    setSaldoBs((prev) => {
      const nuevo = Math.max(0, prev - montoBs);
      try {
        localStorage.setItem('nixi_saldo_bs', nuevo.toString());
      } catch (e) {
        console.warn(e);
      }
      return nuevo;
    });

    agregarEventoAuditoria({
      category: 'normal',
      action: `Retiro de ganancias procesado vía QuickLink Payouts (${datosBancarios.referencia})`,
      userName: currentUser?.name || 'Gabriel Echeverría',
      userRole: `${currentUser?.role || 'Administrador'} (Socio Activo)`,
      timestamp: `Hoy, ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`,
      fullDate: `${new Date().toLocaleDateString('es-VE')} - ${new Date().toLocaleTimeString('es-VE')}`,
      ipAddress: 'IP: 190.12.34.56',
      location: 'Caracas, Distrito Capital (Dispersión Bancaria)',
      device: 'Plataforma Web',
      browser: 'Chrome 122.0',
      payload: {
        montoBs,
        banco: datosBancarios.banco,
        cuentaDestino: datosBancarios.cuenta,
        referencia: datosBancarios.referencia,
        pasarela: 'QuickLink Payouts (Nixi Pay)',
      },
    });
  };

  // 2. Persistencia automática en localStorage mediante useEffect
  useEffect(() => {
    try {
      if (currentUser && currentUser.name && currentUser.name.trim()) {
        localStorage.setItem('nixi_current_user', JSON.stringify(currentUser));
        localStorage.setItem('nixi_auth_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('nixi_current_user');
        localStorage.removeItem('nixi_auth_user');
      }
    } catch (e) {
      console.warn('Error sincronizando nixi_current_user en localStorage', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('nixi_facturas', JSON.stringify(facturas));
    } catch (e) {
      console.warn('Error guardando nixi_facturas en localStorage', e);
    }
  }, [facturas]);

  useEffect(() => {
    try {
      localStorage.setItem('nixi_clientes', JSON.stringify(clientes));
    } catch (e) {
      console.warn('Error guardando nixi_clientes en localStorage', e);
    }
  }, [clientes]);

  useEffect(() => {
    try {
      localStorage.setItem('nixi_movimientos_bancarios', JSON.stringify(movimientosBanco));
    } catch (e) {
      console.warn('Error guardando nixi_movimientos_bancarios en localStorage', e);
    }
  }, [movimientosBanco]);

  useEffect(() => {
    try {
      localStorage.setItem('nixi_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Error guardando nixi_audit_logs en localStorage', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('nixi_team_members', JSON.stringify(teamMembers));
    } catch (e) {
      console.warn('Error guardando nixi_team_members en localStorage', e);
    }
  }, [teamMembers]);

  // Asegurar que currentUser siempre cuente como el primer miembro del equipo con rol "Dueño"
  useEffect(() => {
    if (!currentUser || !currentUser.name || !currentUser.name.trim()) return;

    const userEmail = (currentUser.email || '').trim().toLowerCase();
    const userName = currentUser.name.trim();

    setTeamMembers((prev) => {
      const hasOwnerOrCurrent = prev.some(
        (m) =>
          m.isOwner ||
          m.role === 'Dueño' ||
          (userEmail && m.email.trim().toLowerCase() === userEmail)
      );

      if (hasOwnerOrCurrent) {
        return prev.map((m) => {
          if (m.isOwner || m.role === 'Dueño' || (userEmail && m.email.trim().toLowerCase() === userEmail)) {
            return {
              ...m,
              name: userName,
              email: currentUser.email || m.email,
              role: 'Dueño',
              isOwner: true,
              status: 'Activo',
            };
          }
          return m;
        });
      }

      const ownerMember: TeamMember = {
        id: 'usr-owner',
        name: userName,
        email: currentUser.email || 'admin@nixi.app',
        role: 'Dueño',
        status: 'Activo',
        isOwner: true,
        avatarColor: 'bg-purple-600',
        joinedDate: 'Creador de la cuenta',
        lastActive: 'En línea ahora',
      };

      return [ownerMember, ...prev];
    });
  }, [currentUser]);

  // Recalculate Dashboard metrics whenever facturas change
  const metricasDashboard = useMemo<DashboardMetrics>(() => {
    if (!facturas || facturas.length === 0) {
      return {
        totalFacturadoUsd: 0,
        pendienteUsd: 0,
        vencidasUsd: 0,
        totalPendienteUsd: 0,
        pagadasUsd: 0,
        totalFacturasCount: 0,
        pendientesCount: 0,
        vencidasCount: 0,
        pagadasCount: 0,
        efectividadCobroPercent: 0,
      };
    }

    const totalFacturadoUsd = facturas.reduce((acc, f) => acc + (f?.amount || 0), 0) || 0;

    const pendientes = facturas.filter((f) => f.status === 'pendiente');
    const vencidas = facturas.filter((f) => f.status === 'vencida');
    const pagadas = facturas.filter((f) => f.status === 'pagada');

    const pendienteUsd = pendientes.reduce((acc, f) => acc + (f?.amount || 0), 0) || 0;
    const vencidasUsd = vencidas.reduce((acc, f) => acc + (f?.amount || 0), 0) || 0;
    const pagadasUsd = pagadas.reduce((acc, f) => acc + (f?.amount || 0), 0) || 0;
    const totalPendienteUsd = pendienteUsd + vencidasUsd;

    const efectividadCobroPercent =
      totalFacturadoUsd > 0 ? Math.round((pagadasUsd / totalFacturadoUsd) * 100) : 0;

    return {
      totalFacturadoUsd,
      pendienteUsd,
      vencidasUsd,
      totalPendienteUsd,
      pagadasUsd,
      totalFacturasCount: facturas.length,
      pendientesCount: pendientes.length,
      vencidasCount: vencidas.length,
      pagadasCount: pagadas.length,
      efectividadCobroPercent: isNaN(efectividadCobroPercent) ? 0 : efectividadCobroPercent,
    };
  }, [facturas]);

  // Helper to find a client by taxId or name
  const obtenerClientePorRifONombre = (rif: string, nombre?: string): ClientRisk | undefined => {
    const cleanRif = rif.trim().toUpperCase();
    let found = clientes.find((c) => c.taxId.trim().toUpperCase() === cleanRif);
    if (!found && nombre) {
      const cleanName = nombre.trim().toLowerCase();
      found = clientes.find((c) => c.name.trim().toLowerCase() === cleanName);
    }
    return found;
  };

  // Helper: reduce client debt when an invoice is paid
  const reducirDeudaCliente = (taxId: string, clientName: string, amountToSubtract: number) => {
    setClientes((prevClientes) =>
      prevClientes.map((c) => {
        const matchesTaxId = Boolean(taxId && c.taxId.trim().toUpperCase() === taxId.trim().toUpperCase());
        const matchesName =
          c.name.trim().toLowerCase() === clientName.trim().toLowerCase() ||
          c.name.trim().toLowerCase().includes(clientName.trim().toLowerCase().slice(0, 15)) ||
          clientName.trim().toLowerCase().includes(c.name.trim().toLowerCase().slice(0, 15));

        if (matchesTaxId || matchesName) {
          const newUsedCredit = Math.max(0, c.usedCredit - amountToSubtract);
          const newRisk = calculateRiskLevel(newUsedCredit, c.creditLimit);
          return {
            ...c,
            usedCredit: Number(newUsedCredit.toFixed(2)),
            riskLevel: newRisk,
            lastPaymentDate: getFormattedDate(),
          };
        }
        return c;
      })
    );
  };

  // Helper: increase client debt when a new unpaid invoice is issued
  const aumentarDeudaCliente = (taxId: string, clientName: string, amountToAdd: number) => {
    setClientes((prevClientes) => {
      let clientExists = false;
      const updated = prevClientes.map((c) => {
        const matchesTaxId = Boolean(taxId && c.taxId.trim().toUpperCase() === taxId.trim().toUpperCase());
        const matchesName =
          c.name.trim().toLowerCase() === clientName.trim().toLowerCase() ||
          c.name.trim().toLowerCase().includes(clientName.trim().toLowerCase().slice(0, 15)) ||
          clientName.trim().toLowerCase().includes(c.name.trim().toLowerCase().slice(0, 15));

        if (matchesTaxId || matchesName) {
          clientExists = true;
          const newUsedCredit = c.usedCredit + amountToAdd;
          const newRisk = calculateRiskLevel(newUsedCredit, c.creditLimit);
          return {
            ...c,
            usedCredit: Number(newUsedCredit.toFixed(2)),
            riskLevel: newRisk,
          };
        }
        return c;
      });

      if (!clientExists && clientName.trim()) {
        const creditLimit = Math.max(10000, Math.ceil((amountToAdd * 1.5) / 1000) * 1000);
        const newClient: ClientRisk = {
          id: `cli-${Date.now()}`,
          name: clientName.trim(),
          taxId: taxId.trim().toUpperCase() || 'J-00000000-0',
          creditLimit,
          usedCredit: Number(amountToAdd.toFixed(2)),
          riskLevel: calculateRiskLevel(amountToAdd, creditLimit),
          registeredDate: getFormattedDate(),
          lastPaymentDate: 'Sin pagos registrados',
          notes: 'Cliente registrado automáticamente desde facturación.',
        };
        return [newClient, ...updated];
      }

      return updated;
    });
  };

  // 1. Agregar Factura (Flujo Emisión)
  const agregarFactura = (nuevaFacturaData: Omit<Invoice, 'id'> & { id?: string }): Invoice => {
    const invoice: Invoice = {
      ...nuevaFacturaData,
      id: nuevaFacturaData.id || `inv-${Date.now()}`,
    };

    setFacturas((prev) => [invoice, ...prev]);

    // If invoice is issued as pendiente or vencida, increment client's current debt
    if (invoice.status !== 'pagada') {
      aumentarDeudaCliente(invoice.clientTaxId, invoice.client, invoice.amount);
    }

    return invoice;
  };

  // 2. Registrar Pago de Factura (Desde Dashboard o modal)
  const registrarPagoFactura = (facturaId: string, _metodoPago: string, _referencia: string) => {
    let targetInvoice: Invoice | undefined;

    setFacturas((prevFacturas) => {
      return prevFacturas.map((inv) => {
        if (inv.id === facturaId) {
          targetInvoice = inv;
          return { ...inv, status: 'pagada' as const };
        }
        return inv;
      });
    });

    if (targetInvoice && targetInvoice.status !== 'pagada') {
      reducirDeudaCliente(targetInvoice.clientTaxId, targetInvoice.client, targetInvoice.amount);
    }
  };

  // 3. Vincular Transacción Bancaria a Factura (Flujo de Conciliación)
  const vincularTransaccionAFactura = (movimientoId: string, facturaId: string) => {
    const targetInvoice = facturas.find((f) => f.id === facturaId);
    if (!targetInvoice) return;

    const timestamp = getFormattedTimestamp();

    // Update bank movement status to 'conciliado'
    setMovimientosBanco((prevMovs) =>
      prevMovs.map((m) => {
        if (m.id === movimientoId) {
          return {
            ...m,
            status: 'conciliado' as const,
            matchedInvoice: {
              id: targetInvoice.id,
              number: targetInvoice.number,
              client: targetInvoice.client,
              amount: targetInvoice.amount,
              reconciledDate: timestamp,
            },
          };
        }
        return m;
      })
    );

    // Update invoice status to 'pagada'
    setFacturas((prevFacturas) =>
      prevFacturas.map((inv) => {
        if (inv.id === facturaId) {
          return { ...inv, status: 'pagada' as const };
        }
        return inv;
      })
    );

    // Subtract invoice amount from client debt if it wasn't already paid
    if (targetInvoice.status !== 'pagada') {
      reducirDeudaCliente(targetInvoice.clientTaxId, targetInvoice.client, targetInvoice.amount);
    }
  };

  // 4. Desvincular Transacción Bancaria
  const desvincularTransaccion = (movimientoId: string) => {
    let unlinkedInvoiceId: string | undefined;

    setMovimientosBanco((prevMovs) =>
      prevMovs.map((m) => {
        if (m.id === movimientoId && m.matchedInvoice) {
          unlinkedInvoiceId = m.matchedInvoice.id;
          return {
            ...m,
            status: 'sin_conciliar' as const,
            matchedInvoice: undefined,
          };
        }
        return m;
      })
    );

    if (unlinkedInvoiceId) {
      const invToRestore = facturas.find((f) => f.id === unlinkedInvoiceId);
      if (invToRestore) {
        // Restore invoice to pendiente
        setFacturas((prev) =>
          prev.map((f) => (f.id === unlinkedInvoiceId ? { ...f, status: 'pendiente' as const } : f))
        );
        // Restore client debt
        aumentarDeudaCliente(invToRestore.clientTaxId, invToRestore.client, invToRestore.amount);
      }
    }
  };

  // 5. Sincronizar Banco
  const sincronizarBanco = (nuevosMovimientos?: BankMovement[]) => {
    if (nuevosMovimientos && nuevosMovimientos.length > 0) {
      setMovimientosBanco((prev) => [...nuevosMovimientos, ...prev]);
    } else {
      const newMovs: BankMovement[] = [
        {
          id: `mov-sync-${Date.now()}-1`,
          date: getFormattedDate(),
          reference: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
          bank: 'Banesco',
          amountText: 'Bs. 2.845.120,00',
          amountUsd: 3200.0,
          amountVes: 2845120.0,
          currency: 'VES',
          status: 'sin_conciliar',
        },
        {
          id: `mov-sync-${Date.now()}-2`,
          date: getFormattedDate(),
          reference: `ZELLE-${Math.floor(1000 + Math.random() * 9000)}`,
          bank: 'Zelle',
          amountText: '$450.00',
          amountUsd: 450.0,
          currency: 'USD',
          status: 'sin_conciliar',
        },
      ];
      setMovimientosBanco((prev) => [...newMovs, ...prev]);
    }
  };

  // 6. Importar Extracto Bancario
  const importarExtracto = (nuevosMovimientos: BankMovement[]) => {
    setMovimientosBanco((prev) => [...nuevosMovimientos, ...prev]);
  };

  // 7. Agregar Cliente (Flujo Nuevo Cliente)
  const agregarCliente = (nuevoClienteData: Omit<ClientRisk, 'id'>): ClientRisk => {
    const risk = calculateRiskLevel(nuevoClienteData.usedCredit || 0, nuevoClienteData.creditLimit);
    const newClient: ClientRisk = {
      ...nuevoClienteData,
      id: `cli-${Date.now()}`,
      riskLevel: risk,
      registeredDate: nuevoClienteData.registeredDate || getFormattedDate(),
      usedCredit: nuevoClienteData.usedCredit || 0,
    };

    setClientes((prev) => [newClient, ...prev]);
    return newClient;
  };

  // 8. Actualizar Límite de Crédito de Cliente
  const actualizarLimiteCliente = (clienteId: string, nuevoLimite: number) => {
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id === clienteId) {
          const newRisk = calculateRiskLevel(c.usedCredit, nuevoLimite);
          return {
            ...c,
            creditLimit: nuevoLimite,
            riskLevel: newRisk,
          };
        }
        return c;
      })
    );
  };

  // 9. Eliminar Factura y actualizar deuda si estaba pendiente
  const eliminarFactura = (facturaId: string) => {
    const invoiceToDelete = facturas.find((f) => f.id === facturaId);

    setFacturas((prev) => prev.filter((f) => f.id !== facturaId));

    if (invoiceToDelete && invoiceToDelete.status !== 'pagada') {
      reducirDeudaCliente(invoiceToDelete.clientTaxId, invoiceToDelete.client, invoiceToDelete.amount);
    }
  };

  // 10. Eliminar Cliente
  const eliminarCliente = (clienteId: string) => {
    setClientes((prev) => prev.filter((c) => c.id !== clienteId));
  };

  // 11. Agregar Evento de Auditoría
  const agregarEventoAuditoria = (
    eventoData: Omit<AuditLogEvent, 'id' | 'auditCode' | 'sha256Hash'> &
      Partial<Pick<AuditLogEvent, 'auditCode' | 'sha256Hash'>>
  ): AuditLogEvent => {
    const id = `aud-${Date.now()}`;
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    const mockHash = Array.from({ length: 64 }, randomHex).join('');
    const randomCode = `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-${
      eventoData.category === 'critico' ? 'SC' : eventoData.category === 'sesion' ? 'LG' : 'AU'
    }`;

    const newEvent: AuditLogEvent = {
      ...eventoData,
      id,
      auditCode: eventoData.auditCode || randomCode,
      sha256Hash: eventoData.sha256Hash || mockHash,
    };

    setAuditLogs((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  // 12. Ejecución Masiva de Recordatorios (Conexión Automatización -> Seguridad y Auditoría)
  const ejecutarRecordatoriosMasivos = (
    cantidad: number = 3,
    detalles?: {
      clientesCount?: number;
      facturasCount?: number;
      clientNames?: string[];
      deudaTotalUsd?: number;
    }
  ) => {
    // 1. Aumentar contador global de mensajes enviados
    setMensajesEnviadosCount((prev) => {
      const nuevo = prev + cantidad;
      try {
        localStorage.setItem('nixi_mensajes_enviados', nuevo.toString());
      } catch (e) {
        console.warn(e);
      }
      return nuevo;
    });

    // 2. Registrar evento con fecha y hora actual en Auditoría (SeguridadModule)
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const formattedTimestamp = `Hoy, ${hours}:${minutes} ${ampm}`;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const formattedFullDate = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()} - ${hours}:${minutes}:${seconds} GMT-4`;

    const clientList = detalles?.clientNames || [
      'Inversiones Tecnológicas Caracas C.A. (FAC-2026-0891)',
      'Distribuidora Oriental de Alimentos S.A. (FAC-2026-0890)',
      'Eloy Palma (FAC-2026-0885)',
    ];

    agregarEventoAuditoria({
      category: 'normal',
      action: `Ejecución masiva de recordatorios pendientes (${cantidad} notificaciones enviadas vía WhatsApp & Correo)`,
      userName: currentUser?.name || 'Gabriel Echeverría',
      userRole: `${currentUser?.role || 'Administrador'} (Cobranzas)`,
      timestamp: formattedTimestamp,
      fullDate: formattedFullDate,
      ipAddress: 'IP: 190.12.34.56',
      location: 'Caracas, Distrito Capital (Meta Cloud & SendGrid API)',
      device: 'MacBook Pro 16" (Apple Silicon)',
      browser: 'Chrome 122.0.6261.94',
      payload: {
        modulo: 'Automatización de cobros',
        destinatarios_notificados: cantidad,
        servicios: ['WhatsApp Business API (Meta)', 'SendGrid Cloud Mailer'],
        clientes_notificados: clientList,
        deuda_total_gestionada_usd: detalles?.deudaTotalUsd || 20500.5,
        resultado: `${cantidad}/${cantidad} entregados satisfactoriamente`,
      },
    });
  };

  // 13. Team Management (Mi Equipo)
  const invitarMiembro = (datos: {
    email: string;
    role: 'Administrador' | 'Contador';
    name?: string;
  }): TeamMember => {
    const cleanEmail = datos.email.trim().toLowerCase();
    const cleanName =
      datos.name?.trim() ||
      cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: datos.role,
      status: 'Pendiente',
      avatarColor: datos.role === 'Contador' ? 'bg-amber-600' : 'bg-blue-600',
      invitedDate: getFormattedDate(),
      lastActive: 'Invitación pendiente',
    };

    setTeamMembers((prev) => [newMember, ...prev]);

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const formattedTimestamp = `Hoy, ${hours}:${minutes} ${ampm}`;
    const formattedFullDate = `${getFormattedDate()} - ${hours}:${minutes}:${String(now.getSeconds()).padStart(2, '0')} GMT-4`;

    agregarEventoAuditoria({
      category: 'normal',
      action: `Invitación a nuevo colaborador enviada a ${cleanEmail} con rol de ${datos.role}`,
      userName: currentUser?.name || 'Gabriel Echeverría',
      userRole: currentUser?.role || 'Dueño',
      timestamp: formattedTimestamp,
      fullDate: formattedFullDate,
      ipAddress: 'IP: 190.12.34.56',
      location: 'Caracas, Distrito Capital (Nixi Team Management)',
      device: 'Plataforma Web',
      browser: 'Chrome 122.0',
      payload: {
        modulo: 'Gestión de Equipo',
        emailInvitado: cleanEmail,
        rolAsignado: datos.role,
        estado: 'Pendiente',
      },
    });

    return newMember;
  };

  const eliminarMiembro = (memberId: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const cambiarRolMiembro = (memberId: string, nuevoRol: 'Administrador' | 'Contador') => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === memberId && !m.isOwner ? { ...m, role: nuevoRol } : m))
    );
  };

  // 14. Reiniciar Datos a Estado Inicial (vacío por defecto)
  const reiniciarDatos = () => {
    setFacturas([]);
    setClientes([]);
    setMovimientosBanco([]);
    setAuditLogs([]);
    setSaldoBs(0);
    setMensajesEnviadosCount(0);
    try {
      localStorage.setItem('nixi_facturas', JSON.stringify([]));
      localStorage.setItem('nixi_clientes', JSON.stringify([]));
      localStorage.setItem('nixi_movimientos_bancarios', JSON.stringify([]));
      localStorage.setItem('nixi_audit_logs', JSON.stringify([]));
      localStorage.setItem('nixi_saldo_bs', '0');
      localStorage.setItem('nixi_mensajes_enviados', '0');
      localStorage.setItem('nixi_trial_days_left', '7');
      localStorage.removeItem('nixi_sequences');
      localStorage.removeItem('nixi_notifications');
    } catch (e) {
      console.warn('Error reiniciando datos en localStorage', e);
    }
    setTrialDaysLeft(7);
  };

  const vaciarEstadoGlobal = () => {
    reiniciarDatos();
  };

  return (
    <DataContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        setRole,
        logoutUser,
        trialDaysLeft,
        setTrialDaysLeft,
        isSubscriptionActive,
        setIsSubscriptionActive,
        activateSubscription,
        teamMembers,
        invitarMiembro,
        eliminarMiembro,
        cambiarRolMiembro,
        saldoBs,
        isSocioActivo,
        setIsSocioActivo,
        recargarSaldo,
        retirarGanancias,
        facturas,
        setFacturas,
        clientes,
        movimientosBanco,
        auditLogs,
        metricasDashboard,
        mensajesEnviadosCount,
        ejecutarRecordatoriosMasivos,
        agregarFactura,
        registrarPagoFactura,
        eliminarFactura,
        vincularTransaccionAFactura,
        desvincularTransaccion,
        sincronizarBanco,
        importarExtracto,
        agregarCliente,
        actualizarLimiteCliente,
        eliminarCliente,
        obtenerClientePorRifONombre,
        agregarEventoAuditoria,
        reiniciarDatos,
        vaciarEstadoGlobal,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
