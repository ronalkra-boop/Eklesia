import * as XLSX from 'xlsx';
import { Transaction, ActaConteo, Member, ChurchConfig } from '../types/treasury';
import { formatPeriodDescription, filterItemsByDateRange } from './dateFilters';

export interface ExportPeriodOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  label?: string;
}

export function exportDenominationalExcel(
  transactions: Transaction[],
  actas: ActaConteo[],
  members: Member[],
  config: ChurchConfig,
  periodFilter?: ExportPeriodOptions | string
) {
  const wb = XLSX.utils.book_new();

  // Normalize period filter
  let startDate = '';
  let endDate = '';
  let periodLabel = '';

  if (typeof periodFilter === 'string') {
    if (periodFilter.length === 7) {
      // e.g. "2026-10"
      startDate = `${periodFilter}-01`;
      const [y, m] = periodFilter.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      endDate = `${periodFilter}-${String(lastDay).padStart(2, '0')}`;
      periodLabel = `Mes ${periodFilter}`;
    } else {
      periodLabel = periodFilter;
    }
  } else if (periodFilter) {
    startDate = periodFilter.startDate || '';
    endDate = periodFilter.endDate || '';
    periodLabel = periodFilter.label || '';
  }

  // Filter transactions and actas for the specified date range
  const filteredTx = filterItemsByDateRange(transactions, startDate, endDate);
  const filteredActas = filterItemsByDateRange(actas, startDate, endDate);

  const incomes = filteredTx.filter((t) => t.type === 'income');
  const expenses = filteredTx.filter((t) => t.type === 'expense');

  const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncomes - totalExpenses;

  const tithesTotal = incomes.filter((t) => t.category === 'diezmo').reduce((sum, t) => sum + t.amount, 0);
  const generalOfferingsTotal = incomes.filter((t) => t.category === 'ofrenda_general').reduce((sum, t) => sum + t.amount, 0);
  const missionaryTotal = incomes.filter((t) => t.category === 'ofrenda_misionera').reduce((sum, t) => sum + t.amount, 0);
  const templeFundTotal = incomes.filter((t) => t.category === 'pro_templo').reduce((sum, t) => sum + t.amount, 0);
  const otherIncomesTotal = totalIncomes - (tithesTotal + generalOfferingsTotal + missionaryTotal + templeFundTotal);

  // Denominational tithe calculated from tithes + general offerings
  const tithesAndOfferingsBase = tithesTotal + generalOfferingsTotal;
  const denominationFee = Math.round(tithesAndOfferingsBase * (config.tithePercentageToDenomination / 100));

  const periodDescription = formatPeriodDescription(startDate, endDate, periodLabel);

  // --- HOJA 1: RESUMEN GENERAL DENOMINACIONAL ---
  const summaryData = [
    ['INFORME FINANCIERO Y CONTABLE - TESORERÍA ECLESIÁSTICA'],
    ['FORMATO OFICIAL DENOMINACIONAL DE CONTABILIDAD Y BALANCES'],
    [''],
    ['CONGREGACIÓN:', config.churchName],
    ['DENOMINACIÓN / MISIÓN:', config.denomination],
    ['DISTRITO / PRESBITERIO:', config.district],
    ['PASTOR TITULAR:', config.pastorName],
    ['TESORERO PRINCIPAL:', config.tesoreroName],
    ['PERÍODO CONTABLE:', periodDescription],
    ['RANGO DE FECHAS:', startDate && endDate ? `${startDate} al ${endDate}` : 'Histórico Total'],
    ['FECHA DE EMISIÓN DEL INFORME:', new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['MONEDA:', config.currency],
    ['N° ACTAS DE CONTEO EN EL PERÍODO:', filteredActas.length],
    ['N° MOVIMIENTOS CONTABLES EN EL PERÍODO:', filteredTx.length],
    [''],
    ['=== I. RESUMEN DE INGRESOS (RECAUDOS) ===', 'MONTO ($)'],
    ['1. Total Diezmos Registrados', tithesTotal],
    ['2. Total Ofrendas Generales de Cultos', generalOfferingsTotal],
    ['3. Total Ofrenda Misionera y Evangelismo', missionaryTotal],
    ['4. Total Fondo Pro-Templo y Construcción', templeFundTotal],
    ['5. Otros Ingresos, Primicias y Donaciones', otherIncomesTotal],
    ['TOTAL RECAUDACIÓN (INGRESOS):', totalIncomes],
    [''],
    ['=== II. BASE DE CÁLCULO DIEZMO NACIONAL / DISTRITAL ===', 'MONTO ($)'],
    ['Base (Diezmos + Ofrendas Generales):', tithesAndOfferingsBase],
    [`Porcentaje para Sede Nacional:`, `${config.tithePercentageToDenomination}%`],
    [`Monto Aporte a Sede Nacional:`, denominationFee],
    [''],
    ['=== III. RESUMEN DE EGRESOS (GASTOS OPERATIVOS) ===', 'MONTO ($)'],
    ...getExpenseCategorySummary(expenses),
    ['TOTAL SALIDAS (EGRESOS):', totalExpenses],
    [''],
    ['=== IV. BALANCE Y DISPONIBILIDAD LÍQUIDA ===', 'MONTO ($)'],
    ['SUPERÁVIT / DÉFICIT DEL PERÍODO (Ingresos - Gastos):', netBalance],
    [`Aporte a Sede Nacional (${config.tithePercentageToDenomination}%):`, denominationFee],
    ['Saldo Neto Disponible en Caja Local:', netBalance - denominationFee],
    [''],
    ['=== CERTIFICACIÓN Y FIRMAS DE RESPONSABILIDAD ==='],
    ['Damos fe de que la información aquí consignada es fiel copia de los libros contables, actas de arqueo de cultos y comprobantes de caja archivados.'],
    [''],
    ['________________________', '________________________', '________________________'],
    [`Pastor: ${config.pastorName}`, `Tesorero: ${config.tesoreroName}`, `Auxiliar: ${config.auxiliar1Name}`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Balance');

  // --- HOJA 2: DETALLE DE INGRESOS ---
  const incomeHeaders = [
    'ID', 'Fecha', 'Culto / Reunión', 'Concepto', 'Feligrés / Donante', 
    'N° Sobre / Recibo', 'Medio de Pago', 'Monto ($)', 'Registrado Por', 'Estado'
  ];
  const incomeRows = incomes.map((t) => [
    t.id,
    t.date,
    t.serviceName,
    t.category.toUpperCase().replace(/_/g, ' '),
    t.memberOrPayee,
    t.receiptNumber,
    t.paymentMethod.toUpperCase(),
    t.amount,
    t.recordedBy,
    t.status.toUpperCase()
  ]);
  const wsIncomes = XLSX.utils.aoa_to_sheet([incomeHeaders, ...incomeRows]);
  XLSX.utils.book_append_sheet(wb, wsIncomes, 'Libro_Ingresos');

  // --- HOJA 3: DETALLE DE EGRESOS ---
  const expenseHeaders = [
    'ID', 'Fecha', 'Categoría de Gasto', 'Beneficiario / Proveedor', 
    'N° Factura / Comprobante', 'Detalle y Justificación', 'Medio de Pago', 'Monto ($)', 'Aprobado Por'
  ];
  const expenseRows = expenses.map((t) => [
    t.id,
    t.date,
    t.category.toUpperCase().replace(/_/g, ' '),
    t.memberOrPayee,
    t.receiptNumber,
    t.description,
    t.paymentMethod.toUpperCase(),
    t.amount,
    t.recordedBy
  ]);
  const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Libro_Egresos');

  // --- HOJA 4: ACTAS DE CONTEO DE CULTOS ---
  const actasHeaders = [
    'Acta N°', 'Fecha', 'Culto / Servicio', 'Auxiliar 1', 'Auxiliar 2', 'Tesorero',
    'Total Diezmos ($)', 'Total Ofrendas ($)', 'Total Especiales ($)', 'Bancos ($)', 'TOTAL ARQUEO ($)', 'Observaciones'
  ];
  const actasRows = filteredActas.map((a) => [
    a.id,
    a.date,
    a.serviceName,
    a.auxiliar1,
    a.auxiliar2,
    a.tesorero,
    a.totalDiezmos,
    a.totalOfrendas,
    a.totalEspeciales,
    a.transfersAmount,
    a.grandTotal,
    a.observations
  ]);
  const wsActas = XLSX.utils.aoa_to_sheet([actasHeaders, ...actasRows]);
  XLSX.utils.book_append_sheet(wb, wsActas, 'Actas_Conteo_Cultos');

  // --- HOJA 5: MIEMBROS / FELIGRESÍA ---
  const membersHeaders = ['ID', 'Nombre Completo', 'Cédula / Documento', 'Teléfono', 'Correo', 'Ministerio', 'Estado'];
  const membersRows = members.map((m) => [
    m.id,
    m.fullName,
    m.documentNumber || '',
    m.phone || '',
    m.email || '',
    m.ministry || '',
    m.active ? 'ACTIVO' : 'INACTIVO'
  ]);
  const wsMembers = XLSX.utils.aoa_to_sheet([membersHeaders, ...membersRows]);
  XLSX.utils.book_append_sheet(wb, wsMembers, 'Directorio_Miembros');

  // Generate clear and sanitized file name
  const churchNameClean = config.churchName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateTag = startDate && endDate 
    ? `${startDate}_al_${endDate}` 
    : (startDate ? `desde_${startDate}` : (endDate ? `hasta_${endDate}` : 'Historico'));
  
  const fileName = `Informe_Tesoreria_${churchNameClean}_${dateTag}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function getExpenseCategorySummary(expenses: Transaction[]): (string | number)[][] {
  const map: Record<string, number> = {};
  for (const exp of expenses) {
    const cat = exp.category;
    map[cat] = (map[cat] || 0) + exp.amount;
  }
  const entries = Object.entries(map);
  if (entries.length === 0) {
    return [['(Sin gastos en el período)', 0]];
  }
  return entries.map(([cat, amount]) => [
    `• ${cat.replace(/_/g, ' ').toUpperCase()}`,
    amount
  ]);
}
