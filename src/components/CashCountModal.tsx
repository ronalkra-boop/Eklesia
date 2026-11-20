import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  Coins, 
  Banknote, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Plus,
  Minus
} from 'lucide-react';
import { ActaConteo, ChurchConfig, AppUserSession, Transaction } from '../types/treasury';
import { SERVICE_NAMES, STANDARD_BILLS, STANDARD_COINS } from '../utils/constants';

interface CashCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChurchConfig;
  session: AppUserSession;
  onSaveActa: (acta: ActaConteo, autoCreateTransactions: boolean) => Promise<void>;
}

export const CashCountModal: React.FC<CashCountModalProps> = ({
  isOpen,
  onClose,
  config,
  session,
  onSaveActa,
}) => {
  const [serviceName, setServiceName] = useState(SERVICE_NAMES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [auxiliar1, setAuxiliar1] = useState(config.auxiliar1Name || '');
  const [auxiliar2, setAuxiliar2] = useState(config.auxiliar2Name || '');
  const [tesorero, setTesorero] = useState(config.tesoreroName || '');

  // Breakdown counts
  const [bills, setBills] = useState<Record<string, number>>({
    '100000': 0,
    '50000': 0,
    '20000': 0,
    '10000': 0,
    '5000': 0,
    '2000': 0,
  });

  const [coins, setCoins] = useState<Record<string, number>>({
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
  });

  const [transfersAmount, setTransfersAmount] = useState<number>(0);
  
  // Categorization of the counted money
  const [totalDiezmos, setTotalDiezmos] = useState<number>(0);
  const [totalOfrendas, setTotalOfrendas] = useState<number>(0);
  const [totalEspeciales, setTotalEspeciales] = useState<number>(0);
  const [observations, setObservations] = useState<string>('');
  const [autoCreateTransactions, setAutoCreateTransactions] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculations
  const totalBills = Object.entries(bills).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (count || 0),
    0
  );

  const totalCoins = Object.entries(coins).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (count || 0),
    0
  );

  const totalCash = totalBills + totalCoins;
  const grandTotal = totalCash + (transfersAmount || 0);

  const sumCategories = (totalDiezmos || 0) + (totalOfrendas || 0) + (totalEspeciales || 0);
  const difference = grandTotal - sumCategories;
  const isBalanced = Math.abs(difference) === 0 && grandTotal > 0;

  const handleBillCountChange = (denom: string, val: number) => {
    setBills((prev) => ({ ...prev, [denom]: Math.max(0, val) }));
  };

  const handleCoinCountChange = (denom: string, val: number) => {
    setCoins((prev) => ({ ...prev, [denom]: Math.max(0, val) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (grandTotal <= 0) {
      alert('Por favor ingrese el conteo de billetes, monedas o transferencias.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newActa: ActaConteo = {
        id: `acta-${Date.now()}`,
        serviceName,
        date,
        auxiliar1,
        auxiliar2,
        tesorero,
        bills,
        coins,
        transfersAmount,
        totalDiezmos,
        totalOfrendas,
        totalEspeciales,
        grandTotal,
        observations: observations || 'Arqueo de culto efectuado conforme a las normas de tesorería eclesiástica.',
        recordedBy: session.name,
        recordedByUid: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        verified: true,
      };

      await onSaveActa(newActa, autoCreateTransactions);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el acta de conteo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: config.currency || 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 text-slate-800 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Acta Digital de Conteo de Ofrendas</h2>
              <p className="text-xs text-slate-400">
                Arqueo en tiempo real para 2 o 3 auxiliares de tesorería al finalizar el culto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          
          {/* Service & Date info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Culto o Reunión *
              </label>
              <select
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white p-2 border"
                required
              >
                {SERVICE_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha del Arqueo *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white p-2 border"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tesorero Supervisor
              </label>
              <input
                type="text"
                value={tesorero}
                onChange={(e) => setTesorero(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white p-2 border"
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Auxiliar 1 (Contador testigo) *
              </label>
              <input
                type="text"
                value={auxiliar1}
                onChange={(e) => setAuxiliar1(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white p-2 border"
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Auxiliar 2 (Contador testigo) *
              </label>
              <input
                type="text"
                value={auxiliar2}
                onChange={(e) => setAuxiliar2(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white p-2 border"
                required
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transferencias / Datáfono ($)
              </label>
              <input
                type="number"
                min="0"
                value={transfersAmount || ''}
                onChange={(e) => setTransfersAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full text-xs rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white p-2 border"
              />
            </div>
          </div>

          {/* Cash counting tables (Billetes y Monedas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bills Section */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-900">Billetes por Denominación</h3>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  Subtotal: {formatMoney(totalBills)}
                </span>
              </div>

              <div className="space-y-2">
                {STANDARD_BILLS.map((denom) => {
                  const count = bills[denom.toString()] || 0;
                  const sub = denom * count;
                  return (
                    <div key={denom} className="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0">
                      <span className="text-xs font-medium text-slate-600 w-24">
                        ${denom.toLocaleString('es-CO')}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleBillCountChange(denom.toString(), count - 1)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        
                        <input
                          type="number"
                          min="0"
                          value={count === 0 ? '' : count}
                          onChange={(e) => handleBillCountChange(denom.toString(), Number(e.target.value))}
                          placeholder="0"
                          className="w-16 text-center text-xs font-bold py-1 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleBillCountChange(denom.toString(), count + 1)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-slate-700 w-24 text-right">
                        {formatMoney(sub)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coins Section */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-900">Monedas por Denominación</h3>
                </div>
                <span className="text-xs font-bold text-amber-700">
                  Subtotal: {formatMoney(totalCoins)}
                </span>
              </div>

              <div className="space-y-2">
                {STANDARD_COINS.map((denom) => {
                  const count = coins[denom.toString()] || 0;
                  const sub = denom * count;
                  return (
                    <div key={denom} className="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0">
                      <span className="text-xs font-medium text-slate-600 w-24">
                        ${denom.toLocaleString('es-CO')}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCoinCountChange(denom.toString(), count - 1)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        
                        <input
                          type="number"
                          min="0"
                          value={count === 0 ? '' : count}
                          onChange={(e) => handleCoinCountChange(denom.toString(), Number(e.target.value))}
                          placeholder="0"
                          className="w-16 text-center text-xs font-bold py-1 border border-slate-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleCoinCountChange(denom.toString(), count + 1)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-slate-700 w-24 text-right">
                        {formatMoney(sub)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Grand Total Arqueo & Comparison with Envelopes */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Total Arqueo Físico y Bancos</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                  {formatMoney(grandTotal)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Efectivo: {formatMoney(totalCash)} · Bancos: {formatMoney(transfersAmount)}
                </div>
              </div>

              {/* Balance Status indicator */}
              <div className="text-right">
                {grandTotal > 0 && (
                  <div>
                    {isBalanced ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Arqueo Cuadrado Exacto ($0 dif.)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          Diferencia con desglose: {formatMoney(difference)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Categorization Inputs */}
            <div className="mt-4 pt-2">
              <p className="text-xs text-slate-300 font-semibold mb-3">
                Distribución del dinero contado por conceptos eclesiásticos:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Total Sobres de Diezmo ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalDiezmos || ''}
                    onChange={(e) => setTotalDiezmos(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold rounded-lg border-slate-700 bg-slate-800 text-white p-2 border focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Total Ofrendas Generales ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalOfrendas || ''}
                    onChange={(e) => setTotalOfrendas(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold rounded-lg border-slate-700 bg-slate-800 text-white p-2 border focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Ofrendas Especiales (Misiones/Pro-templo) ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalEspeciales || ''}
                    onChange={(e) => setTotalEspeciales(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold rounded-lg border-slate-700 bg-slate-800 text-white p-2 border focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Observations and auto-sync toggle */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observaciones del Arqueo / Novedades
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={2}
                placeholder="Ejemplo: Conteo realizado con presencia de los dos auxiliares. Se registraron 12 sobres de diezmo y ofrenda suelta de alfolí..."
                className="w-full text-xs rounded-lg border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white p-2 border"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <input
                type="checkbox"
                id="autoCreateTx"
                checked={autoCreateTransactions}
                onChange={(e) => setAutoCreateTransactions(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="autoCreateTx" className="text-xs text-slate-700 font-medium cursor-pointer">
                Generar automáticamente los registros de Ingreso en el Libro de Tesorería a partir de este conteo.
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || grandTotal <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2 transition-all"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando Acta...' : 'Firmar y Guardar Acta de Conteo'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
