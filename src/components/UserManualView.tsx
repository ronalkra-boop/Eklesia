import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  BookOpen, 
  Users, 
  Calculator, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileSpreadsheet, 
  Award, 
  Settings, 
  Smartphone, 
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { ChurchConfig } from '../types/treasury';
import { ChurchMoneyLogo } from './ChurchMoneyLogo';
import { generateUserManualPDF } from '../utils/pdfManualGenerator';

interface UserManualViewProps {
  config: ChurchConfig;
  onOpenCashCountModal: () => void;
  onGoToTab: (tab: string) => void;
}

export const UserManualView: React.FC<UserManualViewProps> = ({
  config,
  onOpenCashCountModal,
  onGoToTab,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    try {
      generateUserManualPDF(config);
    } catch (err) {
      console.error(err);
      alert('Error al generar el documento PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Banner with Download and Print Buttons */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Guía de Inducción para el Equipo de Tesorería
            </span>
            <h1 className="text-lg sm:text-xl font-black text-white">
              Manual de Uso e Instructivo Operativo
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {config.churchName} · {config.denomination}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            title="Descargar archivo PDF completo para imprimir o enviar por WhatsApp"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generando PDF...' : 'Descargar Manual PDF'}</span>
          </button>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            title="Imprimir o guardar en PDF con el diálogo del navegador"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Manual Content Canvas (Print friendly) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-10 space-y-8 text-slate-800">
        
        {/* Header inside printable view */}
        <div className="border-b border-slate-200 pb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ChurchMoneyLogo size="lg" variant="badge" logoUrl={config.logoUrl} className="w-16 h-16 shadow-none border-slate-200" />
            <h2 className="text-xl font-black text-slate-900">{config.churchName}</h2>
          </div>
          <p className="text-xs font-medium text-slate-500">
            {config.denomination} · {config.district}
          </p>
          <div className="mt-3 inline-block px-4 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-800 uppercase tracking-wide">
            PROTOCOLO OPERATIVO Y MANUAL DE USUARIO
          </div>
        </div>

        {/* Section 1: Intro & Objective */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-1 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs">1</span>
            <h3>Propósito del Sistema y Filosofía de Transparencia</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 text-justify">
            Esta aplicación web de tesorería fue concebida para brindar <strong>transparencia absoluta, agilidad y orden</strong> en la administración de los recursos financieros de la congregación. Permite el trabajo simultáneo del <strong>Tesorero Principal</strong> y de los <strong>Auxiliares de Tesorería</strong> en tiempo real, conectando celulares Android, tablets o computadores directamente a la nube de Firebase, eliminando cuadernos manuales y facilitando la emisión inmediata de informes para la Sede Nacional.
          </p>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 italic">
            "Procurando hacer las cosas honradamente, no sólo delante del Señor sino también delante de los hombres." — 2 Corintios 8:21
          </div>
        </section>

        {/* Section 2: Roles and Multiple Devices */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-1 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs">2</span>
            <h3>Roles y Acceso en Vivo desde Cualquier Dispositivo</h3>
          </div>
          <p className="text-xs text-slate-600">
            No se requiere instalar nada desde tiendas de aplicaciones. Cualquier miembro del equipo puede abrir el enlace en Google Chrome o Safari desde su teléfono o computador. En la esquina superior derecha, cada usuario puede cambiar su perfil activo:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                Tesorero Principal
              </span>
              <p className="text-slate-500 text-[11px]">
                Titular: <strong>{config.tesoreroName}</strong>. Supervisa libros contables, autoriza gastos, descarga el informe Excel y concilia arqueos de culto.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                Auxiliares 1 y 2
              </span>
              <p className="text-slate-500 text-[11px]">
                Titulares: <strong>{config.auxiliar1Name}</strong> y <strong>{config.auxiliar2Name}</strong>. Realizan el conteo físico de ofrendas y firman como testigos el acta de culto.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Pastor / Revisor Fiscal
              </span>
              <p className="text-slate-500 text-[11px]">
                Titular: <strong>{config.pastorName}</strong>. Audita en vivo el balance general, revisa actas y firma certificados de aportes de la congregación.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Service Cash Count (Arqueo de Culto) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-1 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs">3</span>
            <h3>Protocolo de Conteo y Arqueo de Culto (Paso a Paso)</h3>
          </div>
          
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <div>
                <strong>Reunión de Arqueo:</strong> Al finalizar el culto, dos o tres personas autorizadas se reúnen en la oficina de tesorería con los alfolíes y sobres.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <div>
                <strong>Abrir Calculadora Digital:</strong> En la barra superior, presione el botón morado <em>"Acta de Conteo"</em> y seleccione el culto (ej. Culto Dominical Central).
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <div>
                <strong>Conteo de Billetes y Monedas:</strong> Uno de los auxiliares cuenta en voz alta e ingresa la cantidad por denominación:
                <ul className="list-disc pl-5 mt-1 text-[11px] text-slate-600 space-y-0.5">
                  <li>Billetes de $100.000, $50.000, $20.000, $10.000, $5.000 y $2.000.</li>
                  <li>Monedas de $1.000, $500, $200, $100 y $50.</li>
                  <li>Transferencias electrónicas o códigos QR bancarios recibidos durante el culto.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
              <div>
                <strong>Distribución por Fondos:</strong> Ingrese el subtotal de Sobres de Diezmo, Ofrenda General de Alfolí y Ofrendas Especiales (Misiones / Pro-Templo).
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">5</span>
              <div>
                <strong>Semáforo de Cuadre:</strong> El sistema compara en vivo:
                <div className="mt-1 p-2 rounded-lg bg-slate-100 text-[11px] font-mono">
                  Diferencia = Total Efectivo Físico Arqueado - Total Clasificado por Fondos
                </div>
                Cuando la diferencia es exactamente <strong>$0</strong>, el indicador se ilumina en verde <em>("Cuadrado Perfecto")</em> y se desbloquea el guardado.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">6</span>
              <div>
                <strong>Generación Automática de Ingresos:</strong> Marque la casilla <em>"Generar automáticamente los registros de ingreso en el libro"</em> para que los diezmos y ofrendas pasen directamente al saldo general sin tener que redigitarlos uno a uno.
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Individual Incomes & Receipts */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-1 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs">4</span>
            <h3>Registro de Diezmos Individuales y Emisión de Recibos</h3>
          </div>
          
          <div className="space-y-2 text-xs text-slate-700">
            <p>
              Cuando un feligrés entrega su sobre con nombre o consigna por transferencia:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Haga clic en el botón verde <strong>"+ Diezmo / Ofrenda"</strong>.</li>
              <li>Escriba el nombre del hermano o el número de cédula; el buscador inteligente sugerirá los feligreses registrados en la congregación.</li>
              <li>Indique el valor y el número de sobre (ej. <code>SOB-104</code>).</li>
              <li>Presione <strong>"Guardar Ingreso"</strong>. El saldo se actualizará inmediatamente para todos los usuarios.</li>
              <li><strong>Impresión del Recibo Oficial:</strong> En la pestaña <em>"Ingresos"</em>, haga clic en el icono de impresora <Printer className="w-3.5 h-3.5 inline text-slate-500" /> para abrir el recibo formal de caja con sello de la iglesia, versículo bíblico y firmas.</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Members Directory & Excel Import */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-1 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">5</span>
            <h3>Directorio de Feligresía e Importación Masiva desde Excel</h3>
          </div>
          
          <div className="space-y-2 text-xs text-slate-700">
            <p>
              Para no registrar miembro por miembro si ya cuenta con un listado en Excel, el sistema incluye un asistente de importación inteligente:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Vaya a la pestaña <strong>"Membresía"</strong> y presione <strong>"Importar Excel"</strong>.</li>
              <li>Puede descargar la <strong>Plantilla Oficial (.xlsx)</strong> con las columnas estándar recomendadas.</li>
              <li>Arrastre o seleccione su archivo Excel (.xlsx, .xls o .csv). El sistema detecta automáticamente los nombres de columnas (Nombre, Cédula, Teléfono, Correo, Ministerio y Estado).</li>
              <li>Si un miembro ya existe por número de cédula o nombre, puede elegir entre <em>actualizar sus datos</em>, <em>omitir duplicados</em> o <em>crear como nuevo</em>.</li>
              <li>Revise la tabla interactiva con la vista previa antes de confirmar y presione <strong>"Confirmar e Importar"</strong>. Cientos de miembros se guardarán en lote en Firestore de manera ultrarrápida.</li>
            </ul>
          </div>
        </section>

        {/* Section 6: Expenses */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-1 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs">6</span>
            <h3>Registro de Egresos y Gastos Eclesiásticos</h3>
          </div>
          
          <div className="space-y-2 text-xs text-slate-700">
            <p>
              Toda salida de caja o banco debe contar con justificación eclesiástica:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Haga clic en el botón rojo <strong>"+ Gasto"</strong>.</li>
              <li>Elija la categoría: <em>Servicios Públicos, Honorarios Pastorales, Arriendo del Templo, Mantenimiento, Obra Social, Sonido o Papelería</em>.</li>
              <li>Digite el nombre del proveedor o beneficiario y el número de factura o comprobante.</li>
              <li>Cada egreso genera su respectivo <strong>Comprobante de Egreso</strong> firmado por el tesorero.</li>
            </ul>
          </div>
        </section>

        {/* Section 7: Denominational Excel Export */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-1 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs">7</span>
            <h3>Informe Oficial y Exportación a Excel Denominacional (.xlsx)</h3>
          </div>
          
          <p className="text-xs text-slate-600">
            Al finalizar el mes contable, la Sede Nacional y el Presbiterio requieren el balance consolidado. El sistema automatiza el 100% de esta tarea:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Estructura del Libro Excel Generado (5 Hojas):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div><strong>Hoja 1: Balance y Sede Nal:</strong> Resumen financiero, cálculo del {config.tithePercentageToDenomination}% de diezmos para sede central y espacios de firma.</div>
              <div><strong>Hoja 2: Libro de Ingresos:</strong> Registro detallado de cada ofrenda, diezmo, culto y medio de pago.</div>
              <div><strong>Hoja 3: Libro de Egresos:</strong> Gastos ordenados cronológicamente con comprobante y proveedor.</div>
              <div><strong>Hoja 4: Actas de Arqueo:</strong> Arqueos dominicales con el conteo de billetes y nombres de testigos.</div>
              <div><strong>Hoja 5: Feligresía:</strong> Directorio de miembros y total aportado en el año.</div>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Para descargarlo, presione en cualquier momento el botón <strong>"Excel Denominacional"</strong> en la cabecera o en la pestaña <em>"Informe Denominacional"</em>.
          </p>
        </section>

        {/* Section 8: Testing Guide */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-1 border-b border-slate-100">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs">8</span>
            <h3>Guía Rápida para Realizar Pruebas Demo</h3>
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl space-y-1">
              <strong className="text-emerald-900 block">Paso 1: Abrir la app en dos dispositivos simultáneos</strong>
              <p className="text-emerald-800 text-[11px]">
                Abra el enlace en un computador y a la vez en un teléfono celular (o ventana de incógnito). En el computador seleccione <em>"Tesorero Principal"</em> y en el celular <em>"Auxiliar 1"</em>.
              </p>
            </div>

            <div className="p-3 bg-indigo-50/60 border border-indigo-200/70 rounded-xl space-y-1">
              <strong className="text-indigo-900 block">Paso 2: Registrar un conteo de culto en vivo</strong>
              <p className="text-indigo-800 text-[11px]">
                Desde el celular del Auxiliar, haga clic en <em>"Acta de Conteo"</em>, digite billetes en la calculadora y guarde. Observe cómo en el computador el saldo y la tabla de movimientos se actualizan al instante sin presionar F5.
              </p>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-1">
              <strong className="text-amber-900 block">Paso 3: Descargar el Excel y emitir un certificado</strong>
              <p className="text-amber-800 text-[11px]">
                Descargue el libro Excel y verifique los cálculos automáticos. Luego vaya a <em>"Membresía"</em> y genere un Certificado de Donación con un clic.
              </p>
            </div>
          </div>
        </section>

        {/* Signatures footer */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 h-10 mb-1"></div>
            <strong className="block text-slate-900">{config.pastorName}</strong>
            <span className="text-[10px] text-slate-500">Pastor Titular</span>
          </div>
          <div>
            <div className="border-b border-slate-400 h-10 mb-1"></div>
            <strong className="block text-slate-900">{config.tesoreroName}</strong>
            <span className="text-[10px] text-slate-500">Tesorero Principal</span>
          </div>
          <div>
            <div className="border-b border-slate-400 h-10 mb-1"></div>
            <strong className="block text-slate-900">{config.auxiliar1Name}</strong>
            <span className="text-[10px] text-slate-500">Auxiliar 1 Testigo</span>
          </div>
        </div>

      </div>

    </div>
  );
};
