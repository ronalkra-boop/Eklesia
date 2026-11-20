import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  Users,
  RefreshCw,
  ArrowRight,
  UserCheck,
  UserPlus,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Member } from '../types/treasury';

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Member[];
  onImportMembers: (members: Member[]) => Promise<void>;
}

interface ColumnMapping {
  fullNameCol: string;
  documentNumberCol: string;
  phoneCol: string;
  emailCol: string;
  ministryCol: string;
  activeCol: string;
  notesCol: string;
}

interface ParsedRow {
  originalIndex: number;
  fullName: string;
  documentNumber: string;
  phone: string;
  email: string;
  ministry: string;
  active: boolean;
  notes: string;
  isValid: boolean;
  isExisting: boolean;
  existingId?: string;
  validationError?: string;
}

export const ImportMembersModal: React.FC<ImportMembersModalProps> = ({
  isOpen,
  onClose,
  existingMembers,
  onImportMembers,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'completed'>('upload');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawDataRows, setRawDataRows] = useState<Record<string, unknown>[]>([]);

  // Column mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    fullNameCol: '',
    documentNumberCol: '',
    phoneCol: '',
    emailCol: '',
    ministryCol: '',
    activeCol: '',
    notesCol: '',
  });

  // Duplicate resolution strategy
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update' | 'skip' | 'allow_duplicates'>('update');
  const [defaultMinistry, setDefaultMinistry] = useState('Miembro General');

  // Preview & parsed members
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedStats, setImportedStats] = useState({ created: 0, updated: 0, total: 0 });
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  if (!isOpen) return null;

  // Reset modal state
  const handleReset = () => {
    setStep('upload');
    setFileName('');
    setFileSize('');
    setWorkbook(null);
    setAvailableSheets([]);
    setSelectedSheet('');
    setRawHeaders([]);
    setRawDataRows([]);
    setParsedRows([]);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download official sample Excel template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const headers = [
      'Nombre Completo',
      'Cédula / Documento',
      'Teléfono / Celular',
      'Correo Electrónico',
      'Ministerio / Cargo',
      'Estado (Activo / Inactivo)',
      'Notas / Observaciones',
    ];

    const sampleData = [
      headers,
      ['Juan Carlos Gómez Pérez', '1020304050', '3101234567', 'juan.gomez@gmail.com', 'Alabanza', 'Activo', 'Voz principal'],
      ['María Elena Rodríguez', '52890123', '3159876543', 'maria.rodriguez@hotmail.com', 'Escuela Dominical', 'Activo', 'Maestra de niños'],
      ['Andrés Felipe Martínez', '1035789123', '3004567890', 'andres.martinez@email.com', 'Ujieres', 'Activo', 'Líder de recepción'],
      ['Carmen Rosa Valencia', '41987654', '3123456789', '', 'Intercesión', 'Activo', 'Reunión de oración'],
      ['Samuel David Ortiz', '1017894561', '3207894561', 'samuel.david@gmail.com', 'Jóvenes', 'Activo', 'Guitarrista'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Nombre Completo
      { wch: 20 }, // Cédula
      { wch: 18 }, // Teléfono
      { wch: 28 }, // Correo
      { wch: 22 }, // Ministerio
      { wch: 18 }, // Estado
      { wch: 30 }, // Notas
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Miembros');
    XLSX.writeFile(wb, 'Plantilla_Importar_Miembros_Iglesia.xlsx');
  };

  // Auto-detect best column matches
  const autoDetectColumns = (headers: string[]): ColumnMapping => {
    const clean = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    let fullNameCol = '';
    let documentNumberCol = '';
    let phoneCol = '';
    let emailCol = '';
    let ministryCol = '';
    let activeCol = '';
    let notesCol = '';

    headers.forEach((h) => {
      const c = clean(h);
      if (!fullNameCol && (c.includes('nombre') || c.includes('feligres') || c.includes('miembro') || c.includes('hermano') || c === 'persona')) {
        fullNameCol = h;
      } else if (!documentNumberCol && (c.includes('cedula') || c.includes('documento') || c.includes('identificacion') || c === 'cc' || c === 'dni' || c.includes('nit'))) {
        documentNumberCol = h;
      } else if (!phoneCol && (c.includes('telefono') || c.includes('celular') || c.includes('movil') || c.includes('tel') || c.includes('contacto') || c.includes('whatsapp'))) {
        phoneCol = h;
      } else if (!emailCol && (c.includes('correo') || c.includes('email') || c.includes('mail') || c.includes('electronico'))) {
        emailCol = h;
      } else if (!ministryCol && (c.includes('ministerio') || c.includes('area') || c.includes('cargo') || c.includes('servicio') || c.includes('grupo') || c.includes('rol'))) {
        ministryCol = h;
      } else if (!activeCol && (c.includes('estado') || c.includes('activo') || c.includes('status') || c.includes('estatus'))) {
        activeCol = h;
      } else if (!notesCol && (c.includes('nota') || c.includes('observacion') || c.includes('comentario') || c.includes('direccion'))) {
        notesCol = h;
      }
    });

    return {
      fullNameCol: fullNameCol || (headers[0] || ''),
      documentNumberCol,
      phoneCol,
      emailCol,
      ministryCol,
      activeCol,
      notesCol,
    };
  };

  // Process selected sheet from workbook
  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    // Convert sheet to json array of objects
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    if (!jsonData || jsonData.length === 0) {
      alert(`La hoja "${sheetName}" no contiene registros.`);
      return;
    }

    // Extract headers from keys of the first row or sheet range
    const headerSet = new Set<string>();
    jsonData.forEach((row) => {
      Object.keys(row).forEach((k) => headerSet.add(k));
    });
    const headers = Array.from(headerSet);

    setRawHeaders(headers);
    setRawDataRows(jsonData);

    const initialMapping = autoDetectColumns(headers);
    setMapping(initialMapping);

    // Compute initial parsed rows
    computeParsedRows(jsonData, initialMapping, duplicateStrategy, defaultMinistry);
    setStep('preview');
  };

  // Re-compute preview when column mapping or duplicate strategy changes
  const computeParsedRows = (
    rows: Record<string, unknown>[],
    currentMapping: ColumnMapping,
    strategy: 'update' | 'skip' | 'allow_duplicates',
    fallbackMinistry: string
  ) => {
    // Index existing members by normalized document and name
    const existingByDoc = new Map<string, Member>();
    const existingByName = new Map<string, Member>();

    existingMembers.forEach((m) => {
      if (m.documentNumber) {
        existingByDoc.set(m.documentNumber.trim().toLowerCase(), m);
      }
      if (m.fullName) {
        existingByName.set(m.fullName.trim().toLowerCase(), m);
      }
    });

    const parsed: ParsedRow[] = rows.map((row, index) => {
      const rawName = String(row[currentMapping.fullNameCol] || '').trim();
      const rawDoc = currentMapping.documentNumberCol ? String(row[currentMapping.documentNumberCol] || '').trim() : '';
      const rawPhone = currentMapping.phoneCol ? String(row[currentMapping.phoneCol] || '').trim() : '';
      const rawEmail = currentMapping.emailCol ? String(row[currentMapping.emailCol] || '').trim() : '';
      const rawMinistry = currentMapping.ministryCol ? String(row[currentMapping.ministryCol] || '').trim() : '';
      const rawActive = currentMapping.activeCol ? String(row[currentMapping.activeCol] || '').trim().toLowerCase() : '';
      const rawNotes = currentMapping.notesCol ? String(row[currentMapping.notesCol] || '').trim() : '';

      // Check validity
      if (!rawName) {
        return {
          originalIndex: index + 1,
          fullName: '(Fila sin nombre)',
          documentNumber: rawDoc,
          phone: rawPhone,
          email: rawEmail,
          ministry: rawMinistry || fallbackMinistry,
          active: true,
          notes: rawNotes,
          isValid: false,
          isExisting: false,
          validationError: 'Nombre ausente o vacío',
        };
      }

      // Check if existing member match
      let matchedExisting: Member | undefined;
      if (rawDoc && existingByDoc.has(rawDoc.toLowerCase())) {
        matchedExisting = existingByDoc.get(rawDoc.toLowerCase());
      } else if (existingByName.has(rawName.toLowerCase())) {
        matchedExisting = existingByName.get(rawName.toLowerCase());
      }

      const isExisting = !!matchedExisting;
      let isActive = true;
      if (rawActive) {
        if (rawActive.includes('inact') || rawActive === 'no' || rawActive === '0' || rawActive === 'false') {
          isActive = false;
        }
      }

      return {
        originalIndex: index + 1,
        fullName: rawName,
        documentNumber: rawDoc,
        phone: rawPhone,
        email: rawEmail,
        ministry: rawMinistry || fallbackMinistry || 'Miembro General',
        active: isActive,
        notes: rawNotes,
        isValid: true,
        isExisting,
        existingId: matchedExisting?.id,
      };
    });

    setParsedRows(parsed);
  };

  // Handle file select or drop
  const handleFile = (file: File) => {
    setIsProcessingFile(true);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary', cellDates: true });
        setWorkbook(wb);
        setAvailableSheets(wb.SheetNames);

        // Pick first sheet by default
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        loadSheetData(wb, firstSheet);
      } catch (err) {
        console.error('Error parsing excel:', err);
        alert('No se pudo procesar el archivo. Verifique que sea un formato válido (.xlsx, .xls o .csv).');
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
      alert('Error al leer el archivo en el navegador.');
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Sheet Change
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      loadSheetData(workbook, sheetName);
    }
  };

  // Handle Mapping Field Change
  const updateMappingField = (field: keyof ColumnMapping, value: string) => {
    const updated = { ...mapping, [field]: value };
    setMapping(updated);
    computeParsedRows(rawDataRows, updated, duplicateStrategy, defaultMinistry);
  };

  // Handle Duplicate Strategy Change
  const updateStrategy = (strat: 'update' | 'skip' | 'allow_duplicates') => {
    setDuplicateStrategy(strat);
    computeParsedRows(rawDataRows, mapping, strat, defaultMinistry);
  };

  // Filter rows to import according to duplicate strategy
  const getRowsToImport = (): ParsedRow[] => {
    return parsedRows.filter((row) => {
      if (!row.isValid) return false;
      if (duplicateStrategy === 'skip' && row.isExisting) return false;
      return true;
    });
  };

  const rowsToImport = getRowsToImport();
  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;
  const existingMatchesCount = parsedRows.filter((r) => r.isValid && r.isExisting).length;
  const newMembersCount = parsedRows.filter((r) => r.isValid && !r.isExisting).length;

  // Execute Import
  const handleConfirmImport = async () => {
    if (rowsToImport.length === 0) {
      alert('No hay miembros válidos para importar.');
      return;
    }

    try {
      setStep('importing');
      setImportProgress(10);

      const membersToSave: Member[] = [];
      let updatedCount = 0;
      let createdCount = 0;

      rowsToImport.forEach((row, i) => {
        let memberId: string;
        let createdAt = new Date().toISOString().split('T')[0];

        if (row.isExisting && row.existingId && duplicateStrategy === 'update') {
          // Preserve existing ID & creation date if found
          memberId = row.existingId;
          const orig = existingMembers.find((m) => m.id === memberId);
          if (orig?.createdAt) createdAt = orig.createdAt;
          updatedCount++;
        } else {
          // Generate unique ID
          memberId = `mem-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
          createdCount++;
        }

        membersToSave.push({
          id: memberId,
          fullName: row.fullName,
          documentNumber: row.documentNumber || undefined,
          phone: row.phone || undefined,
          email: row.email || undefined,
          ministry: row.ministry || 'Miembro General',
          active: row.active,
          notes: row.notes || undefined,
          createdAt,
        });
      });

      setImportProgress(40);

      // Save via bulk batch in treasury service & update state
      await onImportMembers(membersToSave);

      setImportProgress(100);
      setImportedStats({
        created: createdCount,
        updated: updatedCount,
        total: membersToSave.length,
      });

      setStep('completed');
    } catch (error) {
      console.error('Error importing members:', error);
      alert('Ocurrió un error al guardar los miembros en la base de datos.');
      setStep('preview');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Importar Feligresía y Miembros desde Excel
              </h3>
              <p className="text-xs text-slate-500">
                Carga masiva de base de datos desde archivos .xlsx, .xls o .csv
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* STEP 1: UPLOAD & TEMPLATE */}
          {step === 'upload' && (
            <div className="space-y-6">
              
              {/* Informative Guidance & Template Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                      Recomendado
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                      ¿Aún no tienes el archivo con el formato oficial?
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-xl">
                    Descarga nuestra plantilla de Excel prediseñada con las columnas recomendadas (Nombre, Cédula, Teléfono, Correo, Ministerio y Estado) para pegar tu listado y subirlo directamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla Excel (.xlsx)</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:border-emerald-300 transition-all">
                  <Upload className="w-8 h-8" />
                </div>
                
                <h4 className="mt-4 font-bold text-slate-800 text-sm sm:text-base">
                  Haz clic para seleccionar o arrastra tu archivo Excel aquí
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos soportados: Microsoft Excel (.xlsx, .xls) o valores separados por comas (.csv)
                </p>

                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 text-[11px] text-slate-600 font-medium shadow-2xs">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Detección automática de columnas y nombres</span>
                </div>
              </div>

              {/* Instructions Pill Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">1</div>
                    <span className="text-xs font-bold text-slate-800">Carga tu Excel</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Sube cualquier archivo con columnas de miembros existentes de tu iglesia.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">2</div>
                    <span className="text-xs font-bold text-slate-800">Revisa y Mapea</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Verifica que las columnas correspondan al nombre, cédula, teléfono o ministerio.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">3</div>
                    <span className="text-xs font-bold text-slate-800">Importación Masiva</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Guarda cientos de miembros en segundos con sincronización segura en Firestore.
                  </p>
                </div>
              </div>

              {isProcessingFile && (
                <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Leyendo y analizando archivo Excel...</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW & COLUMN MAPPING */}
          {step === 'preview' && (
            <div className="space-y-6">
              
              {/* File Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-800">{fileName}</span>
                  <span className="text-slate-400 font-normal">({fileSize})</span>
                </div>

                <div className="flex items-center gap-3">
                  {availableSheets.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 font-medium">Hoja:</span>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800"
                      >
                        {availableSheets.map((sh) => (
                          <option key={sh} value={sh}>
                            {sh}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                  >
                    Cambiar archivo
                  </button>
                </div>
              </div>

              {/* Status Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 font-medium block">Total Filas en Excel</span>
                  <span className="text-lg font-black text-slate-800">{parsedRows.length}</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[11px] text-emerald-800 font-medium block">Nuevos Miembros</span>
                  <span className="text-lg font-black text-emerald-700 flex items-center gap-1">
                    <UserPlus className="w-4 h-4" />
                    {newMembersCount}
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <span className="text-[11px] text-blue-800 font-medium block">Coincidencias Existentes</span>
                  <span className="text-lg font-black text-blue-700 flex items-center gap-1">
                    <UserCheck className="w-4 h-4" />
                    {existingMatchesCount}
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-[11px] text-amber-800 font-medium block">Sin Nombre / Omitidas</span>
                  <span className="text-lg font-black text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {invalidCount}
                  </span>
                </div>
              </div>

              {/* Column Mapping Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Mapeo de Columnas del Excel</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        Auto-detectado
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Asocia las columnas de tu hoja a los campos del directorio eclesiástico
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span>Nombre Completo *</span>
                      <span className="text-rose-500 font-bold">(Requerido)</span>
                    </label>
                    <select
                      value={mapping.fullNameCol}
                      onChange={(e) => updateMappingField('fullNameCol', e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">-- Seleccionar Columna --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Document Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Cédula / Documento Identidad
                    </label>
                    <select
                      value={mapping.documentNumberCol}
                      onChange={(e) => updateMappingField('documentNumberCol', e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">-- No incluir / Ninguna --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Teléfono / Celular / WhatsApp
                    </label>
                    <select
                      value={mapping.phoneCol}
                      onChange={(e) => updateMappingField('phoneCol', e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">-- No incluir / Ninguna --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Correo Electrónico
                    </label>
                    <select
                      value={mapping.emailCol}
                      onChange={(e) => updateMappingField('emailCol', e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">-- No incluir / Ninguna --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ministry */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Ministerio o Cargo
                    </label>
                    <select
                      value={mapping.ministryCol}
                      onChange={(e) => updateMappingField('ministryCol', e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">-- No incluir (usar defecto) --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State / Active */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Estado (Activo / Inactivo)
                    </label>
                    <select
                      value={mapping.activeCol}
                      onChange={(e) => updateMappingField('activeCol', e.target.value)}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">-- Por defecto Todos Activos --</option>
                      {rawHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Options: Duplicate resolution and default ministry */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">
                  Opciones de Importación y Duplicados
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Si el miembro ya existe (por Cédula o Nombre idéntico):
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="duplicateStrategy"
                          checked={duplicateStrategy === 'update'}
                          onChange={() => updateStrategy('update')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span><strong>Actualizar datos</strong> con los nuevos valores del Excel</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="duplicateStrategy"
                          checked={duplicateStrategy === 'skip'}
                          onChange={() => updateStrategy('skip')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span><strong>Omitir duplicados</strong> (no modificar existentes)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="duplicateStrategy"
                          checked={duplicateStrategy === 'allow_duplicates'}
                          onChange={() => updateStrategy('allow_duplicates')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span><strong>Crear como nuevo</strong> de todas formas</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Ministerio por defecto si viene vacío:
                    </label>
                    <input
                      type="text"
                      value={defaultMinistry}
                      onChange={(e) => {
                        setDefaultMinistry(e.target.value);
                        computeParsedRows(rawDataRows, mapping, duplicateStrategy, e.target.value);
                      }}
                      placeholder="Miembro General"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Ej: Miembro General, Congregación, Feligrés
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Vista Previa de Filas</span>
                    <span className="text-xs font-normal text-slate-500">
                      (Mostrando primeras 15 de {parsedRows.length})
                    </span>
                  </h4>
                  <span className="text-xs font-bold text-emerald-700">
                    {rowsToImport.length} miembros listos para importar
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Estado</th>
                        <th className="py-2 px-3">Nombre Completo</th>
                        <th className="py-2 px-3">Documento</th>
                        <th className="py-2 px-3">Teléfono</th>
                        <th className="py-2 px-3">Correo</th>
                        <th className="py-2 px-3">Ministerio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 15).map((row) => {
                        let badge = null;
                        if (!row.isValid) {
                          badge = (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                              Omitida
                            </span>
                          );
                        } else if (row.isExisting) {
                          badge = (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              duplicateStrategy === 'skip'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {duplicateStrategy === 'skip' ? 'Omitir (Existe)' : 'Actualizar'}
                            </span>
                          );
                        } else {
                          badge = (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Nuevo
                            </span>
                          );
                        }

                        return (
                          <tr key={row.originalIndex} className={!row.isValid ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50'}>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{row.originalIndex}</td>
                            <td className="py-2 px-3">{badge}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{row.fullName}</td>
                            <td className="py-2 px-3 text-slate-600">{row.documentNumber || '-'}</td>
                            <td className="py-2 px-3 text-slate-600">{row.phone || '-'}</td>
                            <td className="py-2 px-3 text-slate-600">{row.email || '-'}</td>
                            <td className="py-2 px-3 text-slate-600">{row.ministry || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: IMPORTING PROGRESS */}
          {step === 'importing' && (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">
                Importando feligresía a la base de datos...
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Registrando {rowsToImport.length} miembros en Firestore con verificación de consistencia.
              </p>

              <div className="max-w-md mx-auto bg-slate-100 rounded-full h-3 overflow-hidden mt-4">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETED SUMMARY */}
          {step === 'completed' && (
            <div className="py-8 px-4 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <div>
                <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  ¡Importación Completada con Éxito!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  La base de datos de miembros ha sido actualizada satisfactoriamente en el sistema.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-center">
                  <span className="text-[11px] text-slate-500 block">Total Procesados</span>
                  <span className="text-xl font-black text-slate-900">{importedStats.total}</span>
                </div>
                <div className="text-center border-x border-slate-200">
                  <span className="text-[11px] text-emerald-700 font-medium block">Nuevos Creados</span>
                  <span className="text-xl font-black text-emerald-600">+{importedStats.created}</span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-blue-700 font-medium block">Actualizados</span>
                  <span className="text-xl font-black text-blue-600">{importedStats.updated}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Finalizar y Ver Directorio
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        {step !== 'importing' && step !== 'completed' && (
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {step === 'preview' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={rowsToImport.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <span>Confirmar e Importar ({rowsToImport.length} Miembros)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
