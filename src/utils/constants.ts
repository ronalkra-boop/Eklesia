import { ChurchConfig, IncomeCategory, ExpenseCategory, Member, Transaction, ActaConteo } from '../types/treasury';

export const INCOME_CATEGORIES: { id: IncomeCategory; label: string; icon: string; description: string }[] = [
  { id: 'diezmo', label: 'Diezmo', icon: 'HeartHandshake', description: 'Diezmos personales de los miembros' },
  { id: 'ofrenda_general', label: 'Ofrenda General de Culto', icon: 'Coins', description: 'Recolección de alfolí en reuniones' },
  { id: 'ofrenda_misionera', label: 'Ofrenda Misionera', icon: 'Globe', description: 'Fondo para misiones y evangelismo' },
  { id: 'pro_templo', label: 'Fondo Pro-Templo / Construcción', icon: 'Building2', description: 'Fondo de mejora y compra del templo' },
  { id: 'primicias', label: 'Primicias', icon: 'Sparkles', description: 'Ofrendas de primicias anuales o mensuales' },
  { id: 'accion_social', label: 'Misericordia / Obra Social', icon: 'Users', description: 'Ofrendas para familias y necesitados' },
  { id: 'escuela_dominical', label: 'Escuela Bíblica Infantil', icon: 'GraduationCap', description: 'Ofrendas de las clases de niños' },
  { id: 'ministerio_especifico', label: 'Ministerios (Jóvenes/Damas)', icon: 'Flame', description: 'Fondos de grupos y sociedades' },
  { id: 'donacion_especial', label: 'Donación Especial', icon: 'Gift', description: 'Aportes extraordinarios o eventos' },
];

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; icon: string; description: string }[] = [
  { id: 'pastoral', label: 'Honorarios / Sustento Pastoral', icon: 'UserCheck', description: 'Ofrenda de amor o sustento al pastor' },
  { id: 'servicios_publicos', label: 'Servicios Públicos (Luz/Agua/Net)', icon: 'Zap', description: 'Energía, acueducto, internet y gas' },
  { id: 'alquiler_sede', label: 'Alquiler del Templo / Local', icon: 'Home', description: 'Canon de arrendamiento de la sede' },
  { id: 'mantenimiento_templo', label: 'Mantenimiento y Aseo', icon: 'Wrench', description: 'Insumos de limpieza, pintura y reparaciones' },
  { id: 'ministerio_alabanza', label: 'Sonido y Alabanza', icon: 'Music', description: 'Cables, micrófonos, instrumentos' },
  { id: 'misiones_evangelismo', label: 'Misiones y Envío Nacional', icon: 'Send', description: 'Apoyo a misioneros y salidas de campo' },
  { id: 'escuela_infantil', label: 'Materiales Escuela de Niños', icon: 'BookOpen', description: 'Guías, refrigerios, manualidades' },
  { id: 'accion_social_mercados', label: 'Mercados y Ayuda Benéfica', icon: 'PackageCheck', description: 'Alimentos y auxilio a hermanos necesitados' },
  { id: 'papeleria_administracion', label: 'Papelería y Administración', icon: 'FileSpreadsheet', description: 'Sobres de diezmo, actas, impresiones' },
  { id: 'aporte_denominacion', label: 'Aporte Sede Denominacional', icon: 'Landmark', description: 'Diezmo de diezmos a oficina nacional' },
  { id: 'evento_conferencia', label: 'Eventos, Retiros y Vigilias', icon: 'CalendarDays', description: 'Conferencias, campamentos y aniversarios' },
  { id: 'otro_gasto', label: 'Otros Gastos Menores', icon: 'CircleDollarSign', description: 'Imprevistos de caja menor' },
];

export const SERVICE_NAMES = [
  'Culto Dominical Central (Mañana)',
  'Culto Dominical (Tarde/Noche)',
  'Culto de Oración y Estudio Bíblico',
  'Culto de Jóvenes',
  'Reunión de Damas / Dorcas',
  'Reunión de Caballeros',
  'Vigilia de Oración',
  'Escuela Bíblica de Niños',
  'Campamento / Retiro Espiritual',
  'Actividad Especial de Denominación',
];

export const STANDARD_BILLS = [100000, 50000, 20000, 10000, 5000, 2000];
export const STANDARD_COINS = [1000, 500, 200, 100, 50];

export const DEFAULT_CHURCH_CONFIG: ChurchConfig = {
  churchName: 'Iglesia Casa de Dios',
  denomination: 'Iglesias Bíblicas Misioneras',
  district: 'Circuito Cesar Norte',
  pastorName: 'Pr. Ronald Nuñez',
  tesoreroName: 'Maryuri Heredia',
  auxiliar1Name: 'Ahuivi Vazques',
  auxiliar2Name: 'Yesica Alfaro',
  currency: 'COP',
  tithePercentageToDenomination: 10,
  logoUrl: '/assets/aistudio/logo_CDD5_45ac2aa5.png',
  updatedAt: new Date().toISOString(),
};

export const INITIAL_MEMBERS: Member[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_ACTA: ActaConteo | null = null;

