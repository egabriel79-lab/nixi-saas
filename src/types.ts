export type ViewMode = 'landing' | 'login' | 'register' | 'checkout' | 'dashboard' | 'help' | 'superadmin' | 'terms' | 'privacy';

export type UserRole = 'Dueño' | 'Administrador' | 'Contador';

export interface CurrentUser {
  name: string;
  email?: string;
  role: UserRole | string;
}

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole | string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Dueño' | 'Administrador' | 'Contador';
  status: 'Activo' | 'Pendiente';
  isOwner?: boolean;
  avatarColor?: string;
  avatarImage?: string | null;
  joinedDate?: string;
  invitedDate?: string;
  lastActive?: string;
}

export type DashboardSection =
  | 'perfil'
  | 'facturacion'
  | 'automatizacion'
  | 'conciliacion'
  | 'clientes'
  | 'paneles'
  | 'seguridad';

export interface UserProfile {
  fullName: string;
  companyName: string;
  email: string;
  companyRif: string;
  profileImage: string | null;
}

export interface Invoice {
  id: string;
  number: string;
  client: string;
  clientTaxId: string; // RIF o Cédula (e.g. J-12345678-9 o V-12345678)
  issueDate: string;
  dueDate: string;
  amount: number; // Monto base equivalente en USD para cálculos uniformes
  currency: 'USD' | 'VES';
  originalAmount?: number;
  originalCurrency?: 'USD' | 'VES';
  ivaPercent?: number; // Por defecto 16%
  status: 'pagada' | 'pendiente' | 'vencida';
  itemsCount: number;
}

export interface ClientRisk {
  id: string;
  name: string;
  taxId: string;
  phone?: string;
  email?: string;
  creditLimit: number;
  usedCredit: number;
  riskLevel: 'bajo' | 'medio' | 'alto';
  lastPaymentDate?: string;
  registeredDate?: string;
  notes?: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  matchedInvoice?: string;
  status: 'conciliado' | 'pendiente' | 'discrepancia';
}

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

export interface AuditLogEvent {
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

