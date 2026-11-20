import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Calendar, 
  CheckCircle2, 
  Printer, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  ListFilter,
  FileText,
  CalendarRange,
  Users,
  Search,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Transaction, ActaConteo, Member, ChurchConfig } from '../types/treasury';
import { exportDenominationalExcel } from '../utils/excelExport';
import { 
  DatePreset, 
  getPresetDateRange, 
  filterItemsByDateRange, 
  formatPeriodDescription,
  formatReadableDate,
  calculateDaysBetween
} from '../utils/dateFilters';
import { ChurchMoneyLogo } from './ChurchMoneyLogo';

interface DenominationalReportViewProps {
  transactions: Transaction[];
  actas: ActaConteo[];
  members: Member[];
  config: ChurchConfig;
  onImportTransactions: (imported: Transaction[]) => Promise<void>;
}

type ReportSubTab = 'balance' | 'analytics' | 'transactions' | 'actas';

export const DenominationalReportView: React.FC<DenominationalReportViewProps> = ({
  transactions,
  actas,
  members,
  config,
  onImportTransactions,
}) => {
  // Date range state - defaults to "Últimos 2 Meses" or "Este Mes"
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('last_2_months');
  const initialRange = useMemo(() => getPresetDateRange('last_2_months'), []);
  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);
  
  // Sub-view tab
  const [activeReportTab, setActiveReportTab] = useState<ReportSubTab>('balance');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [txSearchTerm, setTxSearchTerm] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Handle Preset Selection
  const handleSelectPreset = (preset: DatePreset) => {
    setSelectedPreset(preset);
    const range = getPresetDateRange(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  // Handle Manual Date Change
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setSelectedPreset('custom');
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setSelectedPreset('custom');
  };

  // Filtered transactions and actas for the selected date range
  const filteredTx = useMemo(() => {
    return filterItemsByDateRange(transactions, startDate, endDate);
  }, [transactions, startDate, endDate]);

  const filteredActas = useMemo(() => {
    return filterItemsByDateRange(actas, startDate, endDate);
  }, [actas, startDate, endDate]);

  // Financial calculations
  const incomes = useMemo(() => filteredTx.filter((t) => t.type === 'income'), [filteredTx]);
  const expenses = useMemo(() => filteredTx.filter((t) => t.type === 'expense'), [filteredTx]);

  const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncomes - totalExpenses;

  // Incomes Breakdown
  const tithesTotal = incomes.filter((t) => t.category === 'diezmo').reduce((sum, t) => sum + t.amount, 0);
  const generalOfferings = incomes.filter((t) => t.category === 'ofrenda_general').reduce((sum, t) => sum + t.amount, 0);
  const missionsTotal = incomes.filter((t) => t.category === 'ofrenda_misionera').reduce((sum, t) => sum + t.amount, 0);
  const templeFundTotal = incomes.filter((t) => t.category === 'pro_templo').reduce((sum, t) => sum + t.amount, 0);
  const otherIncomes = totalIncomes - (tithesTotal + generalOfferings + missionsTotal + templeFundTotal);

  // Denominational contribution calculation (Percentage of tithes + general offerings)
  const tithesAndOfferingsBase = tithesTotal + generalOfferings;
  const denominationFee = Math.round(tithesAndOfferingsBase * (config.tithePercentageToDenomination / 100));
  const finalLocalCash = netBalance - denominationFee;

  // Contributing unique members count
  const uniqueContributors = useMemo(() => {
    const names = new Set<string>();
    incomes.forEach((t) => {
      const name = t.memberOrPayee.trim();
      if (name && !name.toLowerCase().includes('anónimo') && !name.toLowerCase().includes('alfolí')) {
        names.add(name);
      }
    });
    return names.size;
  }, [incomes]);

  // Expenses Breakdown by Category
  const expenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const daysCount = useMemo(() => calculateDaysBetween(startDate, endDate), [startDate, endDate]);
  const periodLabelText = useMemo(() => {
    return formatPeriodDescription(startDate, endDate);
  }, [startDate, endDate]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: config.currency || 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Trigger Excel Export for the selected period
  const handleExport = () => {
    exportDenominationalExcel(transactions, actas, members, config, {
      startDate,
      endDate,
      label: periodLabelText,
    });
  };

  // Excel Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert('El archivo no contiene filas válidas.');
          return;
        }

        const importedTx: Transaction[] = [];
        data.forEach((row: any, idx: number) => {
          const amount = Number(row['Monto'] || row['monto'] || row['Valor'] || row['amount'] || 0);
          if (amount > 0) {
            const rawType = String(row['Tipo'] || row['tipo'] || 'income').toLowerCase();
            const type = rawType.includes('egreso') || rawType.includes('gasto') ? 'expense' : 'income';
            
            importedTx.push({
              id: `imported-${Date.now()}-${idx}`,
              type,
              category: String(row['Concepto'] || row['Categoría'] || (type === 'income' ? 'diezmo' : 'otro_gasto')).toLowerCase().replace(/\s+/g, '_'),
              amount,
              date: String(row['Fecha'] || row['date'] || new Date().toISOString().split('T')[0]),
              serviceName: String(row['Culto'] || 'Culto General'),
              memberOrPayee: String(row['Feligrés'] || row['Proveedor'] || row['Nombre'] || 'Alfolí'),
              paymentMethod: 'efectivo',
              receiptNumber: String(row['Comprobante'] || row['Recibo'] || `IMP-${idx + 1}`),
              description: String(row['Detalle'] || 'Importado desde archivo Excel'),
              recordedBy: 'Importación Excel',
              recordedByRole: 'Tesorero Principal',
              recordedByUid: 'user-import',
              status: 'aprobado',
              createdAt: new Date().toISOString(),
            });
          }
        });

        if (importedTx.length > 0) {
          await onImportTransactions(importedTx);
          setImportStatus(`Se importaron exitosamente ${importedTx.length} registros desde el Excel.`);
        } else {
          alert('No se detectaron columnas compatibles (Fecha, Monto, Tipo/Concepto).');
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Filtered transactions for the Detail Tab
  const tableTransactions = useMemo(() => {
    return filteredTx.filter((tx) => {
      const matchesSearch = 
        tx.memberOrPayee.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
        tx.receiptNumber.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
        tx.description.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
        tx.serviceName.toLowerCase().includes(txSearchTerm.toLowerCase());
      const matchesType = txTypeFilter === 'all' || tx.type === txTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [filteredTx, txSearchTerm, txTypeFilter]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Informes Contables y Balances por Fechas
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Analiza o descarga los estados de cuenta oficiales por semanas, quincenas, dos meses o el periodo exacto que elijas.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Excel for Period */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Descargar libro Excel con todas las hojas del período seleccionado"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Excel del Período</span>
          </button>

          {/* Print Report */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
            title="Imprimir informe oficial del período seleccionado"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          {/* Import existing Excel button */}
          <label className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors border border-slate-200">
            <Upload className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Importar</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importStatus}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportStatus(null)}
            className="text-emerald-700 font-bold hover:underline ml-2"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Date Range Selector Box */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Seleccionar Periodo de Análisis y Descarga
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {periodLabelText} {daysCount ? `· (${daysCount} días)` : ''}
          </div>
        </div>

        {/* Quick Preset Buttons (Shortcuts) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Atajos rápidos de período:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'last_7_days', label: 'Última Semana (7 días)' },
              { id: 'last_15_days', label: 'Últimos 15 días (Quincena)' },
              { id: 'this_month', label: 'Este Mes' },
              { id: 'last_month', label: 'Mes Anterior' },
              { id: 'last_2_months', label: 'Últimos 2 Meses' },
              { id: 'last_3_months', label: 'Últimos 3 Meses' },
              { id: 'this_year', label: 'Año en Curso' },
              { id: 'all', label: 'Todo el Histórico' },
            ].map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id as DatePreset)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white font-bold shadow-xs scale-102 ring-2 ring-amber-300/40'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Pickers (Fecha Inicial y Fecha Final) */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              O elige las fechas exactas:
            </span>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            {/* Start Date */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
              <span className="text-[11px] text-slate-400 font-medium">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
              <span className="text-[11px] text-slate-400 font-medium">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="sm:ml-auto flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-600 font-medium">
            <span className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 font-semibold text-[11px]">
              {filteredTx.length} movimientos
            </span>
            <span className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 font-semibold text-[11px]">
              {filteredActas.length} actas de culto
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards Summary for the Selected Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Incomes */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Ingresos del Período</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-emerald-700">
            {formatMoney(totalIncomes)}
          </div>
          <div className="text-[10px] text-slate-400">
            {incomes.length} registros de recaudación
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Egresos del Período</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-rose-700">
            {formatMoney(totalExpenses)}
          </div>
          <div className="text-[10px] text-slate-400">
            {expenses.length} egresos aprobados
          </div>
        </div>

        {/* Net Operating Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Superávit / Balance</span>
            <span className={`p-1.5 rounded-lg ${netBalance >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-base sm:text-xl font-black ${netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatMoney(netBalance)}
          </div>
          <div className="text-[10px] text-slate-400">
            Margen operativo antes de aportes
          </div>
        </div>

        {/* Aporte Denominacional */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-medium">Aporte Denominacional</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-bold">
              {config.tithePercentageToDenomination}%
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-blue-700">
            {formatMoney(denominationFee)}
          </div>
          <div className="text-[10px] text-slate-400">
            Base: {formatMoney(tithesAndOfferingsBase)}
          </div>
        </div>
      </div>

      {/* Sub-Tabs for Analysis & Review */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveReportTab('balance')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeReportTab === 'balance'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Balance Oficial Imprimible</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('analytics')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeReportTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Análisis y Gráficos del Período</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('transactions')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeReportTab === 'transactions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Movimientos del Período ({filteredTx.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('actas')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeReportTab === 'actas'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Actas de Cultos ({filteredActas.length})</span>
        </button>
      </div>

      {/* VIEW TAB 1: OFFICIAL PRINTABLE BALANCE */}
      {activeReportTab === 'balance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6 text-slate-800 text-xs">
          
          {/* Header Block */}
          <div className="border-b-2 border-slate-900 pb-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <ChurchMoneyLogo size="lg" variant="badge" logoUrl={config.logoUrl} className="w-16 h-16 shadow-none border-slate-200" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              {config.denomination}
            </h1>
            <h2 className="text-base font-bold text-slate-800">
              {config.churchName}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {config.district} · Formato Oficial de Tesorería y Balance Contable
            </p>
            <div className="mt-3 inline-block px-4 py-1.5 bg-slate-900 text-white rounded-md font-bold uppercase tracking-wider text-[11px]">
              INFORME CONTABLE: {periodLabelText.toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {startDate && endDate ? `Desde ${formatReadableDate(startDate)} hasta ${formatReadableDate(endDate)}` : 'Consolidado histórico'}
            </div>
          </div>

          {/* Church & Officers Data */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pastor Titular</span>
              <strong className="text-slate-900">{config.pastorName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tesorero Principal</span>
              <strong className="text-slate-900">{config.tesoreroName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Auxiliar 1</span>
              <strong className="text-slate-900">{config.auxiliar1Name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Moneda Oficial</span>
              <strong className="text-slate-900">{config.currency}</strong>
            </div>
          </div>

          {/* Two Columns: Incomes & Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Incomes Summary */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-emerald-800 text-white px-4 py-2.5 font-bold flex justify-between items-center text-xs">
                <span>I. RESUMEN DE INGRESOS (RECAUDO)</span>
                <span>VALOR ($)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-3 flex justify-between">
                  <span>1. Total Diezmos Registrados</span>
                  <strong className="text-slate-900">{formatMoney(tithesTotal)}</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span>2. Ofrendas Generales de Cultos</span>
                  <strong className="text-slate-900">{formatMoney(generalOfferings)}</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span>3. Ofrendas Misiones y Evangelismo</span>
                  <strong className="text-slate-900">{formatMoney(missionsTotal)}</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span>4. Fondo Pro-Templo y Construcción</span>
                  <strong className="text-slate-900">{formatMoney(templeFundTotal)}</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span>5. Otros Ingresos / Primicias</span>
                  <strong className="text-slate-900">{formatMoney(otherIncomes)}</strong>
                </div>
                <div className="p-3 bg-emerald-50 flex justify-between font-extrabold text-emerald-900">
                  <span>TOTAL RECAUDACIÓN (INGRESOS):</span>
                  <span>{formatMoney(totalIncomes)}</span>
                </div>
              </div>
            </div>

            {/* Expenses Summary */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-rose-800 text-white px-4 py-2.5 font-bold flex justify-between items-center text-xs">
                <span>II. RESUMEN DE EGRESOS (GASTOS)</span>
                <span>VALOR ($)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {expenseCategories.map(([cat, sum]) => (
                  <div key={cat} className="p-3 flex justify-between">
                    <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                    <strong className="text-slate-900">{formatMoney(sum)}</strong>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="p-6 text-center text-slate-400">
                    Sin egresos en este período.
                  </div>
                )}
                <div className="p-3 bg-rose-50 flex justify-between font-extrabold text-rose-900">
                  <span>TOTAL SALIDAS (EGRESOS):</span>
                  <span>{formatMoney(totalExpenses)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Balance & Denomination Share Box */}
          <div className="bg-slate-900 text-white p-5 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">
                SALDO NETO OPERATIVO DEL PERÍODO (Ingresos - Gastos):
              </span>
              <span className={`text-xl font-black ${netBalance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {formatMoney(netBalance)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400">
                Aporte correspondiente a Sede Nacional / Distrito ({config.tithePercentageToDenomination}% de diezmos y ofrendas):
              </span>
              <span className="text-amber-300 font-bold text-sm">
                {formatMoney(denominationFee)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-300 font-semibold">
                Disponibilidad Líquida Final en Caja Local:
              </span>
              <span className="text-white font-extrabold text-base">
                {formatMoney(finalLocalCash)}
              </span>
            </div>
          </div>

          {/* Certifications and Signatures */}
          <div className="pt-8 border-t border-slate-300 text-xs">
            <p className="text-center text-slate-500 italic mb-8">
              Damos fe de que la información aquí consignada es fiel copia de los libros contables, actas de arqueo de cultos y comprobantes de caja archivados en la sede de la iglesia.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="border-b border-slate-400 h-12 mb-2"></div>
                <strong className="block text-slate-900">{config.pastorName}</strong>
                <span className="text-slate-500 text-[10px]">Pastor Titular</span>
              </div>
              <div>
                <div className="border-b border-slate-400 h-12 mb-2"></div>
                <strong className="block text-slate-900">{config.tesoreroName}</strong>
                <span className="text-slate-500 text-[10px]">Tesorero Principal</span>
              </div>
              <div>
                <div className="border-b border-slate-400 h-12 mb-2"></div>
                <strong className="block text-slate-900">{config.auxiliar1Name}</strong>
                <span className="text-slate-500 text-[10px]">Auxiliar / Revisor Fiscal</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW TAB 2: ANALYTICS & VISUAL BREAKDOWN */}
      {activeReportTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Incomes Distribution Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Distribución de Ingresos del Período
                  </h3>
                </div>
                <span className="font-bold text-emerald-700 text-xs">
                  {formatMoney(totalIncomes)}
                </span>
              </div>

              {totalIncomes > 0 ? (
                <div className="space-y-3">
                  {[
                    { label: 'Diezmos Registrados', amount: tithesTotal, color: 'bg-emerald-600' },
                    { label: 'Ofrendas Generales', amount: generalOfferings, color: 'bg-amber-500' },
                    { label: 'Ofrenda Misionera', amount: missionsTotal, color: 'bg-blue-600' },
                    { label: 'Fondo Pro-Templo', amount: templeFundTotal, color: 'bg-indigo-600' },
                    { label: 'Otros Ingresos', amount: otherIncomes, color: 'bg-slate-500' },
                  ]
                    .filter((item) => item.amount > 0)
                    .map((item) => {
                      const pct = Math.round((item.amount / totalIncomes) * 100);
                      return (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600 font-medium">{item.label}</span>
                            <span className="font-bold text-slate-900">
                              {formatMoney(item.amount)} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`${item.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No hay ingresos registrados en este rango de fechas.
                </div>
              )}
            </div>

            {/* Top Expenses Distribution Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Distribución de Egresos del Período
                  </h3>
                </div>
                <span className="font-bold text-rose-700 text-xs">
                  {formatMoney(totalExpenses)}
                </span>
              </div>

              {totalExpenses > 0 ? (
                <div className="space-y-3">
                  {expenseCategories.map(([cat, amount]) => {
                    const pct = Math.round((amount / totalExpenses) * 100);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium capitalize">
                            {cat.replace(/_/g, ' ')}
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatMoney(amount)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No hay gastos registrados en este rango de fechas.
                </div>
              )}
            </div>

          </div>

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Cultos y Arqueos Realizados
              </span>
              <div className="text-xl font-bold text-slate-900">
                {filteredActas.length} Actas
              </div>
              <p className="text-[10px] text-slate-400">
                {filteredActas.length > 0 
                  ? `Promedio por culto: ${formatMoney(totalIncomes / filteredActas.length)}` 
                  : 'Sin actas en este período'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Feligreses Contribuyentes
              </span>
              <div className="text-xl font-bold text-slate-900">
                {uniqueContributors} Hermanos
              </div>
              <p className="text-[10px] text-slate-400">
                Aportes nominativos identificados en el período
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Índice de Retención Operativa
              </span>
              <div className="text-xl font-bold text-slate-900">
                {totalIncomes > 0 ? `${Math.round((finalLocalCash / totalIncomes) * 100)}%` : '0%'}
              </div>
              <p className="text-[10px] text-slate-400">
                Queda en caja local tras gastos y aporte denominacional
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: DETAILED TRANSACTIONS OF THE PERIOD */}
      {activeReportTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Movimientos Contables del Período
              </h3>
              <p className="text-xs text-slate-500">
                {periodLabelText} · {tableTransactions.length} registros listados
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={txSearchTerm}
                  onChange={(e) => setTxSearchTerm(e.target.value)}
                  placeholder="Buscar detalle, feligrés..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium"
              >
                <option value="all">Todos los Tipos</option>
                <option value="income">Solo Ingresos</option>
                <option value="expense">Solo Egresos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Concepto / Categoría</th>
                  <th className="py-2.5 px-3">Feligrés / Beneficiario</th>
                  <th className="py-2.5 px-3">Comprobante</th>
                  <th className="py-2.5 px-3">Medio</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                      {formatReadableDate(tx.date)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {tx.type === 'income' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 capitalize">
                      {tx.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {tx.memberOrPayee}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {tx.receiptNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 capitalize">
                      {tx.paymentMethod}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-black ${
                      tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                    </td>
                  </tr>
                ))}
                {tableTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se encontraron movimientos para el filtro y rango de fechas seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW TAB 4: ACTAS OF THE PERIOD */}
      {activeReportTab === 'actas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              Actas de Conteo y Arqueo en el Período
            </h3>
            <p className="text-xs text-slate-500">
              {filteredActas.length} actas celebradas durante {periodLabelText}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActas.map((acta) => (
              <div key={acta.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Acta #{acta.id.slice(-6)} · {acta.serviceName}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {formatReadableDate(acta.date)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200/80 text-[11px]">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Diezmos</span>
                    <strong className="text-slate-800">{formatMoney(acta.totalDiezmos)}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Ofrendas</span>
                    <strong className="text-slate-800">{formatMoney(acta.totalOfrendas)}</strong>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded border border-emerald-200">
                    <span className="text-emerald-700 block text-[9px] uppercase font-bold">Total Arqueo</span>
                    <strong className="text-emerald-900 font-black">{formatMoney(acta.grandTotal)}</strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1">
                  <span>Firmantes: {acta.auxiliar1}, {acta.auxiliar2}</span>
                  <span>Tesorero: {acta.tesorero}</span>
                </div>
              </div>
            ))}

            {filteredActas.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                No hay actas de arqueo registradas en este período.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
