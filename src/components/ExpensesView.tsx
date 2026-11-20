import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  Filter, 
  Calendar, 
  ArrowDownRight,
  UserCheck,
  Zap,
  Home,
  Wrench,
  Pencil
} from 'lucide-react';
import { Transaction, ChurchConfig } from '../types/treasury';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import { DatePreset, getPresetDateRange, formatReadableDate } from '../utils/dateFilters';

interface ExpensesViewProps {
  transactions: Transaction[];
  config: ChurchConfig;
  onOpenExpenseModal: () => void;
  onSelectTransactionForPrint: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onEditTransaction: (tx: Transaction) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  transactions,
  config,
  onOpenExpenseModal,
  onSelectTransactionForPrint,
  onDeleteTransaction,
  onEditTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const range = getPresetDateRange(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const expenses = transactions.filter((t) => t.type === 'expense');

  const filtered = expenses.filter((tx) => {
    const matchesSearch =
      tx.memberOrPayee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || tx.category === selectedCategory;

    const txDate = tx.date ? tx.date.slice(0, 10) : '';
    const matchesStartDate = !startDate || txDate >= startDate;
    const matchesEndDate = !endDate || txDate <= endDate;

    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
  });

  const totalFiltered = filtered.reduce((sum, t) => sum + t.amount, 0);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: config.currency || 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleDelete = async (id: string, payee: string) => {
    if (confirm(`¿Está seguro de eliminar el egreso de "${payee}"? Esta acción se sincronizará para todos los usuarios.`)) {
      await onDeleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Libro de Egresos y Gastos Eclesiásticos
          </h2>
          <p className="text-xs text-slate-500">
            Control de salidas de caja menor, servicios públicos, honorarios y compras del templo
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenExpenseModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Egreso / Gasto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por proveedor, factura o justificación..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          {/* Select Category */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-2 bg-slate-50 focus:ring-rose-500"
            >
              <option value="all">Todas las Categorías de Gasto</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Date Period Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-1">
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
            <span>Período:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'last_7_days', label: '7 días' },
              { id: 'last_15_days', label: '15 días' },
              { id: 'this_month', label: 'Este Mes' },
              { id: 'last_2_months', label: '2 Meses' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDatePresetChange(p.id as DatePreset)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-rose-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Manual date inputs */}
          <div className="flex items-center gap-1.5 ml-auto text-[11px]">
            <span className="text-slate-400">Del:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 text-slate-700 font-medium"
            />
            <span className="text-slate-400">al:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 text-slate-700 font-medium"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => handleDatePresetChange('all')}
                className="text-slate-400 hover:text-slate-700 underline text-[10px] ml-1"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Mostrando {filtered.length} de {expenses.length} egresos</span>
          <span className="font-bold text-rose-600 text-sm">
            Total Egresos: {formatMoney(totalFiltered)}
          </span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Categoría de Gasto</th>
                <th className="py-3 px-4">Beneficiario / Proveedor</th>
                <th className="py-3 px-4">N° Comprobante / Factura</th>
                <th className="py-3 px-4">Detalle / Justificación</th>
                <th className="py-3 px-4">Medio de Pago</th>
                <th className="py-3 px-4">Autorizado / Registrado</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                    {tx.date}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                      {tx.category.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {tx.memberOrPayee}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {tx.receiptNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={tx.description}>
                    {tx.description}
                  </td>
                  <td className="py-3 px-4 text-slate-600 capitalize">
                    {tx.paymentMethod}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="text-slate-800 font-medium">{tx.recordedBy}</span>
                    <span className="text-[10px] text-slate-400 block">{tx.recordedByRole}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-rose-600 text-sm whitespace-nowrap">
                    -{formatMoney(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="Editar egreso"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTransactionForPrint(tx)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="Imprimir comprobante de egreso"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id, tx.memberOrPayee)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No se encontraron egresos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
