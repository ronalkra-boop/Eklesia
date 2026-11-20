export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'diezmo'
  | 'ofrenda_general'
  | 'ofrenda_misionera'
  | 'pro_templo'
  | 'primicias'
  | 'accion_social'
  | 'escuela_dominical'
  | 'ministerio_especifico'
  | 'donacion_especial';

export type ExpenseCategory =
  | 'pastoral'
  | 'servicios_publicos'
  | 'alquiler_sede'
  | 'mantenimiento_templo'
  | 'ministerio_alabanza'
  | 'misiones_evangelismo'
  | 'escuela_infantil'
  | 'accion_social_mercados'
  | 'papeleria_administracion'
  | 'aporte_denominacion'
  | 'evento_conferencia'
  | 'otro_gasto';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'consignacion' | 'cheque' | 'otro';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: IncomeCategory | ExpenseCategory | string;
  amount: number;
  date: string; // YYYY-MM-DD
  serviceName: string; // e.g. 'Culto Dominical Mañana', 'Culto de Oración'
  memberOrPayee: string; // feligrés (o "Anónimo / Alfolí") o proveedor de gasto
  paymentMethod: PaymentMethod;
  receiptNumber: string; // Sobre N° o Factura N°
  description: string;
  recordedBy: string; // Nombre del auxiliar o tesorero
  recordedByRole: string; // 'Tesorero Principal' | 'Auxiliar 1' | 'Auxiliar 2' | 'Pastor / Revisor'
  recordedByUid: string;
  status: 'aprobado' | 'pendiente_revision';
  actaId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActaConteo {
  id: string;
  serviceName: string;
  date: string;
  auxiliar1: string;
  auxiliar2: string;
  tesorero: string;
  // Billetes: conteo por cantidad
  bills: Record<string, number>;
  // Monedas: conteo por cantidad
  coins: Record<string, number>;
  transfersAmount: number;
  totalDiezmos: number;
  totalOfrendas: number;
  totalEspeciales: number;
  grandTotal: number;
  observations: string;
  recordedBy: string;
  recordedByUid: string;
  createdAt: string;
  verified: boolean;
}

export interface Member {
  id: string;
  fullName: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  ministry?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface ChurchConfig {
  churchName: string;
  denomination: string;
  district: string;
  pastorName: string;
  tesoreroName: string;
  auxiliar1Name: string;
  auxiliar2Name: string;
  currency: string;
  tithePercentageToDenomination: number; // typically 10%
  logoUrl?: string;
  updatedAt: string;
}

export interface AppUserSession {
  name: string;
  role: 'Tesorero Principal' | 'Auxiliar 1' | 'Auxiliar 2' | 'Pastor / Revisor';
  email?: string;
  roleId?: 'tesorero' | 'auxiliar1' | 'auxiliar2' | 'pastor';
}

export type UserRoleId = 'tesorero' | 'auxiliar1' | 'auxiliar2' | 'pastor';

export interface UserCredential {
  roleId: UserRoleId;
  roleName: 'Tesorero Principal' | 'Auxiliar 1' | 'Auxiliar 2' | 'Pastor / Revisor';
  userName: string;
  passwordHash: string;
  isDefault: boolean;
  updatedAt: string;
}

