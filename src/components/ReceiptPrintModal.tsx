import React from 'react';
import { X, Printer, Heart, CheckCircle2 } from 'lucide-react';
import { Transaction, ChurchConfig } from '../types/treasury';
import { ChurchMoneyLogo } from './ChurchMoneyLogo';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  config: ChurchConfig;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  transaction,
  config,
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: config.currency || 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isIncome = transaction.type === 'income';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 text-slate-800 flex flex-col">
        
        {/* Modal Controls (Not printed) */}
        <div className="print:hidden bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            Vista previa del Recibo / Comprobante
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 bg-white print:p-0 print:m-0 space-y-6">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <ChurchMoneyLogo size="lg" variant="badge" logoUrl={config.logoUrl} className="w-16 h-16 shadow-none border-slate-200" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {config.churchName}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {config.denomination} · {config.district}
            </p>
            <div className="mt-3 inline-block px-3 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isIncome ? 'RECIBO DE INGRESO ECLESIÁSTICO' : 'COMPROBANTE DE EGRESO'} N° {transaction.receiptNumber}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Fecha del registro:</span>
              <strong className="text-slate-800 text-sm">{transaction.date}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Culto / Servicio:</span>
              <strong className="text-slate-800">{transaction.serviceName}</strong>
            </div>

            <div>
              <span className="text-slate-400 block">
                {isIncome ? 'Feligrés / Aportante:' : 'Beneficiario / Proveedor:'}
              </span>
              <strong className="text-slate-900 text-sm">{transaction.memberOrPayee}</strong>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block">Medio de pago:</span>
              <span className="capitalize font-semibold text-slate-800">{transaction.paymentMethod}</span>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-100">
              <span className="text-slate-400 block">Concepto:</span>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                {transaction.category.toUpperCase().replace('_', ' ')}: {transaction.description}
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">VALOR RECIBIDO</span>
            <div className="text-2xl font-black text-slate-900">
              {formatMoney(transaction.amount)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block font-medium">
              Moneda: {config.currency}
            </span>
          </div>

          {/* Verse */}
          {isIncome && (
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 text-center">
              <p className="text-[11px] text-amber-900 italic font-medium leading-relaxed">
                "Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre."
              </p>
              <span className="text-[10px] text-amber-700 font-bold block mt-1">2 Corintios 9:7</span>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <strong className="block text-slate-900">{transaction.recordedBy}</strong>
              <span className="text-[10px] text-slate-400">{transaction.recordedByRole}</span>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 mb-1"></div>
              <strong className="block text-slate-900">{config.tesoreroName}</strong>
              <span className="text-[10px] text-slate-400">Tesorero Titular</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
