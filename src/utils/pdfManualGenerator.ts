import { jsPDF } from 'jspdf';
import { ChurchConfig } from '../types/treasury';

export function generateUserManualPDF(config: ChurchConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2; // 174mm
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      addFooter();
      doc.addPage();
      y = margin + 5;
      addHeader();
    }
  };

  const addHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`${config.churchName.toUpperCase()} · ${config.denomination.toUpperCase()}`, margin, 12);
    doc.setFont('helvetica', 'normal');
    doc.text('MANUAL DE OPERACIÓN Y TESORERÍA ECLESIÁSTICA', pageWidth - margin, 12, { align: 'right' });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
  };

  const addFooter = () => {
    const pageNum = doc.getNumberOfPages();
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('Documento Confidencial · Solo para uso del equipo pastoral y tesorería', margin, pageHeight - 8);
    doc.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // ==========================================
  // PORTADA / PRIMERA PÁGINA
  // ==========================================
  
  // Decorative top banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setFillColor(217, 119, 6); // amber-600 accent bar
  doc.rect(0, 53, pageWidth, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text('GUÍA RÁPIDA DE INDUCCIÓN Y PRUEBAS', margin, 20);

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('MANUAL DEL USUARIO Y PROTOCOLO', margin, 29);
  doc.text('DE TESORERÍA ECLESIÁSTICA', margin, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Sistema de Gestión Contable en Tiempo Real · ${config.churchName}`, margin, 46);

  y = 66;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('DATOS DE LA CONGREGACIÓN:', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Iglesia: ${config.churchName}`, margin + 4, y + 13);
  doc.text(`• Denominación: ${config.denomination} (${config.district})`, margin + 4, y + 18);
  doc.text(`• Pastor Titular: ${config.pastorName}`, margin + 4, y + 23);
  doc.text(`• Tesorero(a) Principal: ${config.tesoreroName}`, margin + 85, y + 13);
  doc.text(`• Auxiliares: ${config.auxiliar1Name} / ${config.auxiliar2Name}`, margin + 85, y + 18);
  doc.text(`• Moneda / Sede Nal: ${config.currency} (${config.tithePercentageToDenomination}% Diezmo Sede)`, margin + 85, y + 23);

  y += 40;

  // Introducción
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. INTRODUCCIÓN Y PROPÓSITO DEL SISTEMA', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const introText = 
    'El sistema "Ekklesia Tesorería" fue diseñado para modernizar y transparentar la administración de los recursos del Reino de Dios. Permite que el Tesorero Principal y los Auxiliares de Tesorería registren simultáneamente desde sus celulares Android, tablets o computadores los conteos de culto, diezmos individuales, ofrendas de alfolí y egresos, eliminando las demoras de consolidación manual en papel y facilitando la entrega inmediata del informe oficial en Excel que exige la Sede Nacional.';
  
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.5 + 4;

  // Roles Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. ROLES Y ACCESO MULTIUSUARIO EN VIVO', margin, y);
  y += 6;

  const roles = [
    { title: 'Tesorero(a) Principal:', desc: 'Responsable de supervisar los libros, autorizar egresos, conciliar bancos y generar el informe Excel mensual para el presbiterio o distrito.' },
    { title: 'Auxiliares de Tesorería (1 y 2):', desc: 'Realizan el arqueo físico de billetes y monedas al terminar cada culto, firman como testigos el acta digital y digitan sobres de diezmo.' },
    { title: 'Pastor / Revisor Fiscal:', desc: 'Consulta en tiempo real el saldo disponible, audita actas de conteo y expide certificaciones de donación para feligreses.' }
  ];

  roles.forEach(r => {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`• ${r.title}`, margin + 2, y);
    y += 4.2;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(r.desc, contentWidth - 6);
    doc.text(splitDesc, margin + 6, y);
    y += splitDesc.length * 4 + 2;
  });

  y += 3;

  // Paso a Paso 1: Conteo de Culto
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. PROTOCOLO DEL CONTEO DE CULTO (ARQUEO EN VIVO)', margin, y);
  y += 6;

  const conteoSteps = [
    '1. Finalizado el servicio, los auxiliares designados y el tesorero ingresan a la app.',
    '2. Seleccionan su nombre en el menú superior derecho ("Usuario actual").',
    '3. Presionan el botón morado "Acta de Conteo" en la parte superior.',
    '4. Seleccionan el culto (ej: Culto Dominical Central, Culto de Oración, etc.).',
    '5. Conteo de Billetes y Monedas: En la calculadora digital, ingresan la cantidad de billetes por denominación ($100.000, $50.000, $20.000, $10.000, $5.000, $2.000) y monedas.',
    '6. Clasificación de Fondos: Ingresan el subtotal de Sobres de Diezmo, Ofrenda General de Alfolí y Ofrendas Especiales/Misiones.',
    '7. Verificación de Cuadre: La aplicación compara el Total Físico con el Total Declarado. Cuando la diferencia es $0 (cuadrado), el botón de guardar se activa.',
    '8. Generar Ingresos Automáticos: Al marcar la casilla "Generar automáticamente los registros de ingreso en el libro", el sistema traslada el dinero contado a la caja sin necesidad de redigitar.',
    '9. Guardar e Imprimir Acta: Al guardar, el acta queda sellada con los nombres de los 2 auxiliares y el tesorero, lista para imprimir o archivar en PDF.'
  ];

  conteoSteps.forEach(s => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    const splitS = doc.splitTextToSize(s, contentWidth - 4);
    doc.text(splitS, margin + 2, y);
    y += splitS.length * 3.8 + 1.5;
  });

  // Salto a página 2
  addFooter();
  doc.addPage();
  y = margin + 5;
  addHeader();

  // Sección 4: Registro de Diezmos y Ofrendas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. REGISTRO INDIVIDUAL DE DIEZMOS Y RECIBOS', margin, y);
  y += 6;

  const diezmoSteps = [
    '• Para registrar un sobre individual con nombre de hermano: Clic en el botón verde "+ Diezmo / Ofrenda".',
    '• Seleccione la categoría: Diezmo, Ofrenda General, Ofrenda Misionera, Pro-Templo o Primicias.',
    '• Buscador de Miembros: Al escribir las primeras letras del nombre o cédula, el sistema autocompleta el feligrés registrado en la base de datos.',
    '• Si la ofrenda es anónima o del alfolí común, presione el botón rápido "Anónimo / Alfolí".',
    '• Ingrese el monto ($), la forma de pago (Efectivo, Transferencia/QR, Consignación) y el número de sobre o recibo.',
    '• Impresión del Recibo Oficial: En el libro de ingresos, presione el icono de la impresora en cualquier movimiento para abrir el recibo pre-diseñado con versículo bíblico de gratitud (2 Corintios 9:7) y firma del tesorero.'
  ];

  diezmoSteps.forEach(ds => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    const splitDs = doc.splitTextToSize(ds, contentWidth - 4);
    doc.text(splitDs, margin + 2, y);
    y += splitDs.length * 3.8 + 1.5;
  });

  y += 4;

  // Sección 5: Egresos y Gastos
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('5. REGISTRO DE GASTOS Y SALIDAS DE CAJA', margin, y);
  y += 6;

  const egresoSteps = [
    '• Para registrar un egreso: Clic en el botón rojo "+ Gasto".',
    '• Categorías Contables: Servicios Públicos (Energía, Agua, Internet), Honorarios Pastorales / Obreros, Alquiler de Templo, Mantenimiento y Aseo, Ayuda Social / Misericordia, Papelería y Sonido.',
    '• Proveedor / Beneficiario: Ingrese a quién se le entrega el dinero.',
    '• Soporte: Digite el número de factura o comprobante legal.',
    '• Cada egreso genera automáticamente un Comprobante de Egreso formal imprimible.'
  ];

  egresoSteps.forEach(es => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    const splitEs = doc.splitTextToSize(es, contentWidth - 4);
    doc.text(splitEs, margin + 2, y);
    y += splitEs.length * 3.8 + 1.5;
  });

  y += 4;

  // Sección 6: Informe Denominacional y Excel
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('6. INFORME OFICIAL Y EXPORTACIÓN A EXCEL (.XLSX)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  const excelDesc = 
    'El módulo "Informe Denominacional" unifica la información de todo el mes o año y calcula automáticamente el aporte legal a la Sede Nacional (Diezmo de diezmos, configurable habitualmente al 10%). El archivo Excel descargable contiene 5 hojas de cálculo formateadas:';
  const splitEd = doc.splitTextToSize(excelDesc, contentWidth);
  doc.text(splitEd, margin, y);
  y += splitEd.length * 3.8 + 3;

  const sheets = [
    { name: '1. BALANCE Y SEDE NAL', desc: 'Resumen consolidado de ingresos, egresos, saldo en caja y liquidación del aporte a Sede Central con firmas.' },
    { name: '2. LIBRO DE INGRESOS', desc: 'Detalle cronológico de cada diezmo, ofrenda, culto, feligrés y comprobante.' },
    { name: '3. LIBRO DE EGRESOS', desc: 'Detalle de cada factura, proveedor, concepto y medio de pago.' },
    { name: '4. ACTAS DE ARQUEO', desc: 'Historial de actas de conteo con desglose de billetes y nombres de los auxiliares testigos.' },
    { name: '5. FELIGRESÍA', desc: 'Directorio de miembros y acumulado de aportes para auditoría pastoral.' }
  ];

  sheets.forEach(sh => {
    checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`• ${sh.name}: `, margin + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const splitSh = doc.splitTextToSize(sh.desc, contentWidth - 45);
    doc.text(splitSh, margin + 45, y);
    y += splitSh.length * 3.8 + 1.2;
  });

  y += 4;

  // Sección 7: Feligresía y Certificados de Donación
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('7. MEMBRESÍA Y CERTIFICADOS DE APORTES', margin, y);
  y += 6;

  const memDesc = [
    '• En la pestaña "Membresía / Feligresía", registre los hermanos con su documento de identidad, ministerio y teléfono.',
    '• Emisión de Certificado: Cuando un miembro requiera un comprobante para trámites tributarios o constancia personal, haga clic en "Certificado de Aportes". El sistema genera un documento formal membretado con el valor acumulado exacto, listo para firmar e imprimir.'
  ];

  memDesc.forEach(md => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    const splitMd = doc.splitTextToSize(md, contentWidth - 4);
    doc.text(splitMd, margin + 2, y);
    y += splitMd.length * 3.8 + 1.5;
  });

  // Salto a página 3
  addFooter();
  doc.addPage();
  y = margin + 5;
  addHeader();

  // Sección 8: Preguntas frecuentes y consejos de prueba
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('8. GUÍA PARA LA SESIÓN DE PRUEBA DEMO', margin, y);
  y += 6;

  const demoSteps = [
    {
      q: 'Paso 1: Abrir la app en dos dispositivos al mismo tiempo',
      a: 'Abra el enlace en un computador y simultáneamente en su celular Android (o en una ventana de incógnito). En uno seleccione "Tesorero Principal" y en el otro "Auxiliar 1".'
    },
    {
      q: 'Paso 2: Registrar un conteo de culto en tiempo real',
      a: 'Desde el celular del Auxiliar 1, abra "Acta de Conteo", digite varios billetes y guarde. Verá cómo en la pantalla del computador el saldo y los movimientos se actualizan inmediatamente sin recargar la página.'
    },
    {
      q: 'Paso 3: Probar la impresión de recibos',
      a: 'Vaya a "Ingresos", busque un registro y presione el icono de la impresora. Podrá guardarlo como PDF o imprimirlo en papel carta o tirilla.'
    },
    {
      q: 'Paso 4: Exportar el informe a Excel',
      a: 'Haga clic en el botón superior "Excel Denominacional". Abra el archivo .xlsx generado y verifique cómo todas las fórmulas de balance y porcentaje a Sede Nacional ya están calculadas.'
    },
    {
      q: 'Paso 5: Personalizar los datos de su congregación',
      a: 'Vaya a "Configuración Iglesia" para cambiar el nombre oficial de la iglesia, denominación, distrito, nombres de los auxiliares y pastor. Los cambios quedarán guardados en la nube.'
    }
  ];

  demoSteps.forEach(ds => {
    checkPageBreak(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(ds.q, margin + 2, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    const splitA = doc.splitTextToSize(ds.a, contentWidth - 6);
    doc.text(splitA, margin + 5, y);
    y += splitA.length * 3.8 + 3.5;
  });

  y += 6;

  // Sign-off Card
  checkPageBreak(35);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPROMISO DE INTEGRIDAD Y TRANSPARENCIA ECLESIÁSTICA', margin + 6, y + 8);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('"Procurando hacer las cosas honradamente, no sólo delante del Señor sino también', margin + 6, y + 14);
  doc.text('delante de los hombres." — 2 Corintios 8:21', margin + 6, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generado para: ${config.churchName} · ${config.denomination}`, margin + 6, y + 25);

  addFooter();

  // Trigger download
  const cleanName = config.churchName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  doc.save(`manual-de-uso-tesoreria-${cleanName}.pdf`);
}
