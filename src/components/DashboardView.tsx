import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Landmark, 
  Calculator, 
  Calendar, 
  Clock,
  Printer,
  ChevronRight,
  Sparkles,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { Transaction, ActaConteo, ChurchConfig } from '../types/treasury';

interface DashboardViewProps {
  transactions: Transaction[];
  actas: ActaConteo[];
  config: ChurchConfig;
  onOpenIncomeModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenCashCountModal: () => void;
  onSelectTransactionForPrint: (tx: Transaction) => void;
  onGoToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  actas,
  config,
  onOpenIncomeModal,
  onOpenExpenseModal,
  onOpenCashCountModal,
  onSelectTransactionForPrint,
  onGoToTab,
}) => {
  // Current month filter: default current YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const filteredTx = selectedMonth
    ? transactions.filter((t) => t.date.startsWith(selectedMonth))
    : transactions;

  const incomes = filteredTx.filter((t) => t.type === 'income');
  const expenses = filteredTx.filter((t) => t.type === 'expense');

  const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncomes - totalExpenses;

  // Breakdown of incomes
  const tithesTotal = incomes.filter((t) => t.category === 'diezmo').reduce((sum, t) => sum + t.amount, 0);
  const offeringsTotal = incomes.filter((t) => t.category === 'ofrenda_general').reduce((sum, t) => sum + t.amount, 0);
  const missionsTotal = incomes.filter((t) => t.category === 'ofrenda_misionera').reduce((sum, t) => sum + t.amount, 0);
  const proTempleTotal = incomes.filter((t) => t.category === 'pro_templo').reduce((sum, t) => sum + t.amount, 0);

  // Denomination national tithe calculation (from tithes + general offerings)
  const tithesAndOfferingsBase = tithesTotal + offeringsTotal;
  const denominationContribution = Math.round(tithesAndOfferingsBase * (config.tithePercentageToDenomination / 100));

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: config.currency || 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const latestActa = actas[0];

  return (
    <div className="space-y-6">
      
      {/* Month Selector Bar & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Estado de Tesorería en Tiempo Real</h2>
          <p className="text-xs text-slate-500">
            Libro de caja general consolidado · {config.churchName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Mes a consultar:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 focus:ring-amber-500 focus:border-amber-500"
          />
          {selectedMonth && (
            <button
              type="button"
              onClick={() => setSelectedMonth('')}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium px-1 cursor-pointer"
            >
              Ver todo
            </button>
          )}

          <button
            type="button"
            onClick={() => onGoToTab('report')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors border border-amber-200 cursor-pointer ml-1"
            title="Analizar o descargar informes de 15 días, 2 meses o fechas personalizadas"
          >
            <span>Informes por Fechas →</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Incomes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Ingresos del Mes</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatMoney(totalIncomes)}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span>{incomes.length} movimientos de ofrendas y diezmos</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Gastos y Salidas</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{formatMoney(totalExpenses)}</div>
            <div className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
              <span>{expenses.length} pagos y egresos realizados</span>
            </div>
          </div>
        </div>

        {/* Net Monthly Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Superávit / Saldo del Mes</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              netBalance >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${netBalance >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
              {formatMoney(netBalance)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Ingresos menos egresos del período
            </div>
          </div>
        </div>

        {/* Denominational Tithe Obligation */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Aporte Denominacional ({config.tithePercentageToDenomination}%)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400">
              {formatMoney(denominationContribution)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              {config.tithePercentageToDenomination}% de Diezmos y Ofrendas a Sede Nacional
            </div>
          </div>
        </div>

      </div>

      {/* Breakdown Row: Incomes composition & Last Service Counting Acta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Incomes Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Distribución de Ingresos Eclesiásticos</h3>
              <p className="text-xs text-slate-500">Recaudo clasificado por fondos de la iglesia</p>
            </div>
            <button
              type="button"
              onClick={() => onGoToTab('incomes')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">Diezmos</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">{formatMoney(tithesTotal)}</span>
              <span className="text-[10px] text-slate-400">
                {totalIncomes > 0 ? `${Math.round((tithesTotal / totalIncomes) * 100)}% del total` : '0%'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">Ofrenda General</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">{formatMoney(offeringsTotal)}</span>
              <span className="text-[10px] text-slate-400">
                {totalIncomes > 0 ? `${Math.round((offeringsTotal / totalIncomes) * 100)}% del total` : '0%'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">Fondo Misiones</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">{formatMoney(missionsTotal)}</span>
              <span className="text-[10px] text-slate-400">
                {totalIncomes > 0 ? `${Math.round((missionsTotal / totalIncomes) * 100)}% del total` : '0%'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium block">Fondo Pro-Templo</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">{formatMoney(proTempleTotal)}</span>
              <span className="text-[10px] text-slate-400">
                {totalIncomes > 0 ? `${Math.round((proTempleTotal / totalIncomes) * 100)}% del total` : '0%'}
              </span>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  ¿Terminó el culto de hoy?
                </h4>
                <p className="text-[11px] text-amber-800">
                  Los auxiliares pueden abrir la calculadora digital de arqueo para contar billetes y monedas en conjunto.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenCashCountModal}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors"
            >
              Abrir Conteo de Culto
            </button>
          </div>

        </div>

        {/* Latest Acta Conteo Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Última Acta de Conteo</h3>
              </div>
              <button
                type="button"
                onClick={() => onGoToTab('actas')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Historial
              </button>
            </div>

            {latestActa ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Culto verificado:</span>
                  <strong className="text-slate-800 block text-xs">{latestActa.serviceName}</strong>
                  <span className="text-[10px] text-slate-500">Fecha: {latestActa.date}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Total Arqueado:</span>
                    <strong className="text-indigo-600 font-extrabold text-sm">
                      {formatMoney(latestActa.grandTotal)}
                    </strong>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                    <span>Sobres diezmo: {formatMoney(latestActa.totalDiezmos)}</span>
                    <span>Ofrendas: {formatMoney(latestActa.totalOfrendas)}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <p><strong>Auxiliar 1:</strong> {latestActa.auxiliar1}</p>
                  <p><strong>Auxiliar 2:</strong> {latestActa.auxiliar2}</p>
                  <p><strong>Tesorero:</strong> {latestActa.tesorero}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No hay actas de conteo registradas aún.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenCashCountModal}
            className="w-full mt-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Crear nueva acta de conteo</span>
          </button>
        </div>

      </div>

      {/* Recent Movements in Real-Time */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Últimos Movimientos en Tiempo Real</h3>
            <p className="text-xs text-slate-500">
              Registros ingresados por los auxiliares y tesorero sincronizados al instante
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenIncomeModal}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+ Diezmo / Ofrenda</span>
            </button>
            <button
              type="button"
              onClick={onOpenExpenseModal}
              className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>+ Gasto</span>
            </button>
          </div>
        </div>

        {/* Table of Transactions */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/70">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo & Concepto</th>
                <th className="py-3 px-4">Feligrés / Beneficiario</th>
                <th className="py-3 px-4">Comprobante</th>
                <th className="py-3 px-4">Medio</th>
                <th className="py-3 px-4">Registrado Por</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTx.slice(0, 8).map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                          <strong className="text-slate-900 block capitalize">
                            {tx.category.replace(/_/g, ' ')}
                          </strong>
                          <span className="text-[10px] text-slate-400">{tx.serviceName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {tx.memberOrPayee}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {tx.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 capitalize">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <span className="font-medium text-slate-700">{tx.recordedBy}</span>
                      <span className="text-[10px] text-slate-400 block">{tx.recordedByRole}</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={`font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectTransactionForPrint(tx)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                        title="Ver o imprimir recibo"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No hay movimientos registrados para este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredTx.length > 8 && (
          <div className="p-3 text-center border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => onGoToTab('incomes')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
            >
              Ver todos los movimientos en los libros ({filteredTx.length} registros) →
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

function denominationFee(tithes: number, percent: number) {
  return Math.round(tithes * (percent / 100));
}
