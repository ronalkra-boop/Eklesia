import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  DollarSign, 
  User, 
  Calendar, 
  CreditCard, 
  FileText,
  HeartHandshake,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Check,
  Edit3
} from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  Member, 
  ChurchConfig, 
  AppUserSession, 
  PaymentMethod 
} from '../types/treasury';
import { 
  INCOME_CATEGORIES, 
  EXPENSE_CATEGORIES, 
  SERVICE_NAMES 
} from '../utils/constants';

interface TransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  transactionToEdit?: Transaction | null;
  onClose: () => void;
  members: Member[];
  config: ChurchConfig;
  session: AppUserSession;
  onSaveTransaction: (tx: Transaction) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialType = 'income',
  transactionToEdit = null,
  onClose,
  members,
  config,
  session,
  onSaveTransaction,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [category, setCategory] = useState<string>(
    initialType === 'income' ? 'diezmo' : 'servicios_publicos'
  );
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [serviceName, setServiceName] = useState<string>(SERVICE_NAMES[0]);
  const [memberOrPayee, setMemberOrPayee] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);

  // Sync state whenever transactionToEdit changes or modal opens
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setCategory(transactionToEdit.category);
      setAmount(transactionToEdit.amount);
      setDate(transactionToEdit.date);
      setServiceName(transactionToEdit.serviceName || SERVICE_NAMES[0]);
      setMemberOrPayee(transactionToEdit.memberOrPayee || '');
      setPaymentMethod(transactionToEdit.paymentMethod || 'efectivo');
      setReceiptNumber(transactionToEdit.receiptNumber || '');
      setDescription(transactionToEdit.description || '');
    } else {
      setType(initialType);
      setCategory(initialType === 'income' ? 'diezmo' : 'servicios_publicos');
      setAmount(0);
      setDate(new Date().toISOString().split('T')[0]);
      setServiceName(SERVICE_NAMES[0]);
      setMemberOrPayee('');
      setPaymentMethod('efectivo');
      setReceiptNumber('');
      setDescription('');
    }
  }, [transactionToEdit, initialType, isOpen]);

  if (!isOpen) return null;

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const quickAmounts = [20000, 50000, 100000, 200000, 500000];

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.documentNumber && m.documentNumber.includes(searchTerm))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newTx: Transaction = {
        id: transactionToEdit?.id || `tx-${Date.now()}`,
        type,
        category,
        amount: Number(amount),
        date,
        serviceName: type === 'income' ? serviceName : (transactionToEdit?.serviceName || 'Gasto Operativo'),
        memberOrPayee: memberOrPayee.trim() || (type === 'income' ? 'Alfolí / Anónimo' : 'Proveedor de Servicios'),
        paymentMethod,
        receiptNumber: receiptNumber.trim() || (transactionToEdit?.receiptNumber || `REC-${Math.floor(1000 + Math.random() * 9000)}`),
        description: description.trim() || (type === 'income' ? 'Ingreso registrado en culto' : 'Salida de caja menor/banco'),
        recordedBy: transactionToEdit ? (transactionToEdit.recordedBy || session.name) : session.name,
        recordedByRole: transactionToEdit ? (transactionToEdit.recordedByRole || session.role) : session.role,
        recordedByUid: transactionToEdit?.recordedByUid || `user-${Date.now()}`,
        status: 'aprobado',
        actaId: transactionToEdit?.actaId,
        createdAt: transactionToEdit?.createdAt || new Date().toISOString(),
      };

      await onSaveTransaction(newTx);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al registrar la transacción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 text-slate-800 flex flex-col max-h-[92vh]">
        
        {/* Header with Type Selector */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === 'income' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                {transactionToEdit ? (
                  <>
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>{type === 'income' ? 'Editar Ingreso (Diezmo / Ofrenda)' : 'Editar Egreso (Gasto / Salida)'}</span>
                  </>
                ) : (
                  <span>{type === 'income' ? 'Registrar Ingreso (Diezmo / Ofrenda)' : 'Registrar Egreso (Gasto / Salida)'}</span>
                )}
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                <span className="text-[11px] text-slate-400">
                  Registrado por: <strong className="text-white font-medium">{session.name}</strong>{' '}
                  <span className="text-slate-400">({session.role})</span>
                </span>
              </div>
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

        {/* Toggle Income vs Expense */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('diezmo');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              type === 'income' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            Ingreso (Diezmo / Ofrenda)
          </button>
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('servicios_publicos');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              type === 'expense' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
            Egreso (Gasto / Factura)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Amount and Quick Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Monto ({config.currency}) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                $
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 text-lg font-extrabold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                required
                autoFocus
              />
            </div>
            
            {/* Quick Amount Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Rápido:</span>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  className="px-2 py-0.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  ${(q / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Categoría Eclesiástica *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
              required
            >
              {currentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} — ({cat.description})
                </option>
              ))}
            </select>
          </div>

          {/* Member / Payee with search */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {type === 'income' ? 'Feligrés / Donante' : 'Beneficiario / Proveedor'} *
            </label>
            <div className="relative">
              <input
                type="text"
                value={memberOrPayee}
                onChange={(e) => {
                  setMemberOrPayee(e.target.value);
                  setSearchTerm(e.target.value);
                  setShowMemberDropdown(true);
                }}
                onFocus={() => setShowMemberDropdown(true)}
                placeholder={type === 'income' ? 'Nombre del hermano o "Alfolí / Ofrenda General"' : 'Ej: Empresa de Energía, Papelería, Pr. Carlos...'}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                required
              />
              {type === 'income' && (
                <button
                  type="button"
                  onClick={() => setMemberOrPayee('Alfolí General / Feligresía')}
                  className="absolute right-2 top-2 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors"
                >
                  Anónimo / Alfolí
                </button>
              )}
            </div>

            {/* Member Suggestions Dropdown */}
            {type === 'income' && showMemberDropdown && searchTerm && filteredMembers.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto p-1">
                <div className="text-[10px] text-slate-400 px-2 py-1 font-semibold border-b border-slate-100">
                  Miembros sugeridos:
                </div>
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMemberOrPayee(m.fullName);
                      setShowMemberDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-md flex items-center justify-between"
                  >
                    <span className="font-medium">{m.fullName}</span>
                    <span className="text-[10px] text-slate-400">{m.ministry || 'Miembro'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service Name & Date (Culto is only applicable for incomes) */}
          {type === 'income' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha del Ingreso *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Culto o Actividad *
                </label>
                <select
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                >
                  {SERVICE_NAMES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha de la Operación / Pago del Gasto *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-rose-500 font-medium"
                required
              />
            </div>
          )}

          {/* Payment Method & Receipt # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Forma de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              >
                <option value="efectivo">Efectivo (Caja Física)</option>
                <option value="transferencia">Transferencia Bancaria / QR</option>
                <option value="consignacion">Consignación en Banco</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {type === 'income' ? 'N° Sobre / Recibo' : 'N° Factura / Comprobante'}
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder={type === 'income' ? 'Ej: SOB-204' : 'Ej: FACT-10928'}
                className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detalle o Justificación
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle complementario de la transacción..."
              className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
            />
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
              disabled={isSubmitting || amount <= 0}
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm flex items-center gap-2 transition-all ${
                type === 'income' 
                  ? 'bg-emerald-600 hover:bg-emerald-500' 
                  : 'bg-rose-600 hover:bg-rose-500'
              } disabled:opacity-50`}
            >
              {transactionToEdit ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>
                {isSubmitting
                  ? 'Guardando en la nube...'
                  : transactionToEdit
                    ? 'Guardar Cambios'
                    : type === 'income'
                      ? 'Guardar Ingreso'
                      : 'Guardar Egreso'}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
