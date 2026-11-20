import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Plus, 
  Search, 
  UserCheck, 
  Phone, 
  Mail, 
  FileText, 
  Printer, 
  X,
  Calendar,
  Pencil,
  Trash2,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Upload
} from 'lucide-react';
import { Member, Transaction, ChurchConfig } from '../types/treasury';
import { ChurchMoneyLogo } from './ChurchMoneyLogo';
import { ImportMembersModal } from './ImportMembersModal';

interface MembersViewProps {
  members: Member[];
  transactions: Transaction[];
  config: ChurchConfig;
  onSaveMember: (member: Member) => Promise<void>;
  onImportMembers?: (members: Member[]) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  transactions,
  config,
  onSaveMember,
  onImportMembers,
  onDeleteMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberCertificate, setSelectedMemberCertificate] = useState<Member | null>(null);

  // New member form
  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ministry, setMinistry] = useState('Miembro General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit member form state
  const [editFullName, setEditFullName] = useState('');
  const [editDocumentNumber, setEditDocumentNumber] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMinistry, setEditMinistry] = useState('');
  const [editActive, setEditActive] = useState(true);

  const startEdit = (m: Member) => {
    setEditingMember(m);
    setEditFullName(m.fullName);
    setEditDocumentNumber(m.documentNumber || '');
    setEditPhone(m.phone || '');
    setEditEmail(m.email || '');
    setEditMinistry(m.ministry || 'Miembro General');
    setEditActive(m.active ?? true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editFullName.trim()) return;

    try {
      setIsSubmitting(true);
      const updated: Member = {
        ...editingMember,
        fullName: editFullName.trim(),
        documentNumber: editDocumentNumber.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        ministry: editMinistry.trim(),
        active: editActive,
      };
      await onSaveMember(updated);
      setEditingMember(null);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar feligrés.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (m: Member) => {
    if (confirm(`¿Está seguro de eliminar a ${m.fullName}? Esta acción no se puede deshacer.`)) {
      await onDeleteMember(m.id);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.documentNumber && m.documentNumber.includes(searchTerm)) ||
    (m.ministry && m.ministry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: config.currency || 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getMemberTithesTotal = (memberName: string) => {
    return transactions
      .filter((t) => t.type === 'income' && t.memberOrPayee.toLowerCase() === memberName.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    try {
      setIsSubmitting(true);
      const newMember: Member = {
        id: `mem-${Date.now()}`,
        fullName: fullName.trim(),
        documentNumber: documentNumber.trim(),
        phone: phone.trim(),
        email: email.trim(),
        ministry: ministry.trim(),
        active: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      await onSaveMember(newMember);
      setShowAddModal(false);
      setFullName('');
      setDocumentNumber('');
      setPhone('');
      setEmail('');
    } catch (err) {
      console.error(err);
      alert('Error al registrar feligrés.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportMembersExcel = () => {
    if (members.length === 0) {
      alert('No hay miembros en el directorio para exportar.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const headers = ['ID', 'Nombre Completo', 'Cédula / Documento', 'Teléfono', 'Correo', 'Ministerio', 'Estado', 'Aporte Acumulado'];
    const rows = members.map((m) => [
      m.id,
      m.fullName,
      m.documentNumber || '',
      m.phone || '',
      m.email || '',
      m.ministry || 'Miembro General',
      m.active ? 'Activo' : 'Inactivo',
      getMemberTithesTotal(m.fullName),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [{ wch: 18 }, { wch: 32 }, { wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 22 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Directorio_Miembros');
    XLSX.writeFile(wb, `Directorio_Miembros_${config.churchName.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleBatchImport = async (importedList: Member[]) => {
    if (onImportMembers) {
      await onImportMembers(importedList);
    } else {
      for (const m of importedList) {
        await onSaveMember(m);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Directorio de Feligresía y Diezmantes
          </h2>
          <p className="text-xs text-slate-500">
            Control de hermanos aportantes, ministerios y emisión de constancias de donación
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {members.length > 0 && (
            <button
              type="button"
              onClick={handleExportMembersExcel}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer"
              title="Descargar base de datos actual en Excel"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-all shadow-2xs cursor-pointer"
            title="Importar base de datos de miembros desde archivo Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importar Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Feligrés</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, documento o ministerio..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Total congregación: {members.length} personas
        </span>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((m) => {
          const totalAportado = getMemberTithesTotal(m.fullName);
          return (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{m.fullName}</h3>
                    <span className="text-xs text-emerald-700 font-medium block mt-0.5">
                      {m.ministry || 'Miembro General'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    CC {m.documentNumber || 'S/N'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  {m.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{m.phone}</span>
                    </div>
                  )}
                  {m.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{m.email}</span>
                    </div>
                  )}
                </div>

                {/* Accumulated Contributions */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Aporte acumulado registrado:</span>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {formatMoney(totalAportado)}
                  </div>
                </div>
              </div>

              {/* Card Actions: Edit, Delete, Certificate */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Editar datos de este feligrés"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Eliminar feligrés"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMemberCertificate(m)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                  title="Emitir constancia formal de aportes"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Certificado</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-400">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Users className="w-8 h-8" />
          </div>
          {searchTerm ? (
            <>
              <p className="font-bold text-slate-700 text-sm">No se encontraron miembros con la búsqueda</p>
              <p className="text-xs text-slate-400 mt-1">Prueba con otro término o limpia el buscador.</p>
            </>
          ) : (
            <>
              <h3 className="font-bold text-slate-800 text-base">Aún no hay miembros registrados en el directorio</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Puedes importar tu base de datos completa de miembros directamente desde un archivo de Excel (.xlsx) o agregarlos uno a uno.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Importar Base de Datos desde Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Manualmente</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Registrar Nuevo Feligrés</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Daniel Arturo Gómez"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número de Documento / Cédula</label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ej: 1098765432"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ministerio o Área en la Iglesia</label>
                <input
                  type="text"
                  value={ministry}
                  onChange={(e) => setMinistry(e.target.value)}
                  placeholder="Ej: Alabanza, Ujieres, Damas, Jóvenes..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="310 123 4567"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !fullName.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Feligrés'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Editar Datos del Feligrés</h3>
                  <p className="text-[10px] text-slate-400">Corrige el nombre, documento o ministerio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Ej: Daniel Arturo Gómez"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número de Documento / Cédula</label>
                <input
                  type="text"
                  value={editDocumentNumber}
                  onChange={(e) => setEditDocumentNumber(e.target.value)}
                  placeholder="Ej: 1098765432"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ministerio o Área en la Iglesia</label>
                <input
                  type="text"
                  value={editMinistry}
                  onChange={(e) => setEditMinistry(e.target.value)}
                  placeholder="Ej: Alabanza, Ujieres, Damas, Jóvenes..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="310 123 4567"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado de Membresía</label>
                <select
                  value={editActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditActive(e.target.value === 'active')}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500 bg-white"
                >
                  <option value="active">Activo en la congregación</option>
                  <option value="inactive">Inactivo / Trasladado</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editFullName.trim()}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Certificate Print Modal */}
      {selectedMemberCertificate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
            
            <div className="print:hidden bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Certificado de Aportes y Donaciones Eclesiásticas
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMemberCertificate(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-800 text-xs print:p-0">
              <div className="text-center border-b border-slate-200 pb-4">
                <div className="flex items-center justify-center gap-2.5 mb-1.5">
                  <ChurchMoneyLogo size="sm" variant="badge" />
                  <h2 className="text-lg font-extrabold text-slate-900">{config.churchName}</h2>
                </div>
                <p className="text-slate-500">{config.denomination} · {config.district}</p>
                <div className="mt-3 inline-block px-3 py-1 bg-slate-100 rounded-md font-bold text-slate-800 uppercase">
                  CERTIFICADO DE APORTES VOLUNTARIOS Y DIEZMOS
                </div>
              </div>

              <div className="space-y-3 leading-relaxed text-justify">
                <p>
                  El suscrito Tesorero y Pastor Titular de la <strong>{config.churchName}</strong>, perteneciente a la <strong>{config.denomination}</strong>:
                </p>
                <p className="font-bold text-center text-sm py-2">
                  CERTIFICAN:
                </p>
                <p>
                  Que el hermano(a) <strong>{selectedMemberCertificate.fullName}</strong>, identificado(a) con documento de identidad <strong>N° {selectedMemberCertificate.documentNumber || 'S/N'}</strong>, figura en los libros contables y de tesorería de esta congregación como miembro y aportante activo.
                </p>
                <p>
                  Durante el período contable correspondiente, realizó aportes voluntarios por concepto de diezmos y ofrendas registradas por un valor acumulado de:
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center my-3">
                  <span className="text-slate-500 block text-xs">VALOR TOTAL CERTIFICADO</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatMoney(getMemberTithesTotal(selectedMemberCertificate.fullName))}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Moneda oficial: {config.currency}</span>
                </div>
                <p>
                  Se expide la presente certificación a solicitud del interesado(a), el día <strong>{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                </p>
              </div>

              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 h-10 mb-1"></div>
                  <strong className="block text-slate-900">{config.pastorName}</strong>
                  <span className="text-[10px] text-slate-400">Pastor Titular</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-10 mb-1"></div>
                  <strong className="block text-slate-900">{config.tesoreroName}</strong>
                  <span className="text-[10px] text-slate-400">Tesorero Principal</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ImportMembersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        existingMembers={members}
        onImportMembers={handleBatchImport}
      />

    </div>
  );
};
