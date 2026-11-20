import React, { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  Calendar, 
  Eye, 
  Printer, 
  CheckCircle2, 
  Banknote, 
  Coins, 
  X,
  FileCheck,
  Trash2
} from 'lucide-react';
import { ActaConteo, ChurchConfig } from '../types/treasury';
import { ChurchMoneyLogo } from './ChurchMoneyLogo';

interface ActasViewProps {
  actas: ActaConteo[];
  config: ChurchConfig;
  onOpenCashCountModal: () => void;
  onDeleteActa: (id: string) => Promise<void>;
}

export const ActasView: React.FC<ActasViewProps> = ({
  actas,
  config,
  onOpenCashCountModal,
  onDeleteActa,
}) => {
  const [selectedActa, setSelectedActa] = useState<ActaConteo | null>(null);

  const handleDelete = async (acta: ActaConteo) => {
    if (confirm(`¿Está seguro de eliminar el acta de conteo del ${acta.date} (${acta.serviceName})? Esta acción se sincronizará para todos los usuarios.`)) {
      await onDeleteActa(acta.id);
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: config.currency || 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePrintActa = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Actas de Conteo y Arqueo de Cultos
          </h2>
          <p className="text-xs text-slate-500">
            Registro formal del recaudo dominical verificado y firmado por 2 o 3 auxiliares de tesorería
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCashCountModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <Calculator className="w-4 h-4" />
          <span>Realizar Nuevo Conteo de Culto</span>
        </button>
      </div>

      {/* Actas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actas.map((acta) => (
          <div
            key={acta.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                  ACTA #{acta.id.replace('acta-', '')}
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {acta.date}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{acta.serviceName}</h3>
              
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100/80">
                <span className="text-xs text-slate-500 block">Total Recaudado:</span>
                <div className="text-xl font-black text-indigo-700">
                  {formatMoney(acta.grandTotal)}
                </div>
                <div className="mt-2 text-[11px] text-slate-600 space-y-0.5 pt-2 border-t border-slate-200/60">
                  <div className="flex justify-between">
                    <span>Sobres Diezmo:</span>
                    <strong>{formatMoney(acta.totalDiezmos)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ofrendas Alfolí:</span>
                    <strong>{formatMoney(acta.totalOfrendas)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Misiones / Pro-templo:</span>
                    <strong>{formatMoney(acta.totalEspeciales)}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 space-y-0.5">
                <p><strong>Auxiliar 1:</strong> {acta.auxiliar1}</p>
                <p><strong>Auxiliar 2:</strong> {acta.auxiliar2}</p>
                <p><strong>Tesorero:</strong> {acta.tesorero}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Arqueo Verificado
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(acta)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Eliminar esta acta de conteo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedActa(acta)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Desglose</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {actas.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            No se han registrado actas de conteo aún.
          </div>
        )}
      </div>

      {/* Detailed Modal for Selected Acta */}
      {selectedActa && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 text-slate-800 flex flex-col max-h-[92vh]">
            
            {/* Modal Actions */}
            <div className="print:hidden bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm">Detalle de Acta de Conteo de Culto</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintActa}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Acta Oficial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedActa(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 overflow-y-auto space-y-6 print:p-0">
              <div className="border-b border-slate-200 pb-4 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <ChurchMoneyLogo size="lg" variant="badge" logoUrl={config.logoUrl} className="w-16 h-16 shadow-none border-slate-200" />
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  {config.churchName}
                </h2>
                <p className="text-xs text-slate-500">
                  {config.denomination} · {config.district}
                </p>
                <div className="mt-2 text-xs font-bold text-indigo-900 uppercase">
                  ACTA DE ARQUEO Y CONTEO DE OFRENDAS N° {selectedActa.id.replace('acta-', '')}
                </div>
              </div>

              {/* Service metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Culto / Servicio:</span>
                  <strong className="text-slate-900 text-sm">{selectedActa.serviceName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha del culto:</span>
                  <strong className="text-slate-900 text-sm">{selectedActa.date}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Auxiliares que contaron:</span>
                  <span className="font-semibold text-slate-800">
                    1. {selectedActa.auxiliar1} <br />
                    2. {selectedActa.auxiliar2}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tesorero supervisor:</span>
                  <span className="font-semibold text-slate-800">{selectedActa.tesorero}</span>
                </div>
              </div>

              {/* Cash Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Bills */}
                <div className="border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-2 mb-2 border-b border-slate-100">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Desglose de Billetes</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(selectedActa.bills || {}).map(([denom, count]) => (
                      <div key={denom} className="flex justify-between text-[11px]">
                        <span>${Number(denom).toLocaleString('es-CO')} × {count}</span>
                        <strong>{formatMoney(Number(denom) * count)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coins */}
                <div className="border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-2 mb-2 border-b border-slate-100">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Desglose de Monedas</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(selectedActa.coins || {}).map(([denom, count]) => (
                      <div key={denom} className="flex justify-between text-[11px]">
                        <span>${Number(denom).toLocaleString('es-CO')} × {count}</span>
                        <strong>{formatMoney(Number(denom) * count)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Total Summary */}
              <div className="bg-slate-900 text-white rounded-xl p-4 text-center">
                <span className="text-xs text-slate-400">GRAN TOTAL ARQUEADO Y DEPOSITADO</span>
                <div className="text-3xl font-black text-amber-400 mt-1">
                  {formatMoney(selectedActa.grandTotal)}
                </div>
                <div className="text-xs text-slate-300 mt-2 flex justify-center gap-6">
                  <span>Diezmos: {formatMoney(selectedActa.totalDiezmos)}</span>
                  <span>Ofrenda General: {formatMoney(selectedActa.totalOfrendas)}</span>
                  <span>Especiales: {formatMoney(selectedActa.totalEspeciales)}</span>
                </div>
              </div>

              {/* Observations */}
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong className="block text-slate-800 mb-1">Observaciones:</strong>
                <p>{selectedActa.observations}</p>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 h-10 mb-1"></div>
                  <strong className="block text-slate-900">{selectedActa.auxiliar1}</strong>
                  <span className="text-[10px] text-slate-400">Auxiliar 1 Testigo</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-10 mb-1"></div>
                  <strong className="block text-slate-900">{selectedActa.auxiliar2}</strong>
                  <span className="text-[10px] text-slate-400">Auxiliar 2 Testigo</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-10 mb-1"></div>
                  <strong className="block text-slate-900">{selectedActa.tesorero}</strong>
                  <span className="text-[10px] text-slate-400">Tesorero Titular</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
