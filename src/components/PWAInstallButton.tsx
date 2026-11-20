import React, { useState } from 'react';
import { Smartphone, Download, Share2, PlusSquare, CheckCircle2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running inside standalone app, do not show button
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>App Móvil Activa</span>
      </div>
    );
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        title="Instalar como App en tu celular o computador"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm transition-all transform active:scale-95 cursor-pointer"
      >
        <Smartphone className="w-3.5 h-3.5 animate-pulse" />
        <span>Instalar App Celular</span>
      </button>

      {/* Guide Modal for Mobile / PWA installation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Instalar Ekklesia en tu Celular</h3>
                <p className="text-xs text-slate-400">Sin descargar de Play Store ni gastar memoria</p>
              </div>
            </div>

            <div className="space-y-4 my-5 text-sm">
              {/* Instructions for Android */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">🤖</span>
                  <span>En Android (Google Chrome):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 ml-1">
                  <li>Abre el enlace de la aplicación en <strong>Chrome</strong>.</li>
                  <li>Toca los <strong>3 puntos verticales</strong> (⋮) arriba a la derecha.</li>
                  <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</li>
                  <li>¡Listo! Aparecerá con el icono oficial en tu menú de apps.</li>
                </ol>
              </div>

              {/* Instructions for iPhone / iPad */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center gap-2 font-semibold text-sky-400 text-sm mb-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-xs">🍎</span>
                  <span>En iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 ml-1">
                  <li>Abre el enlace de la aplicación en el navegador <strong>Safari</strong>.</li>
                  <li>Toca el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" /> (el cuadro con una flecha hacia arriba).</li>
                  <li>Desliza hacia abajo y presiona <strong>"Agregar al inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" />.</li>
                  <li>Toca <strong>"Agregar"</strong> arriba a la derecha.</li>
                </ol>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200/90 mb-5">
              💡 <strong>Ventaja:</strong> Funciona a pantalla completa, con acceso instantáneo con un toque, guarda tus datos en tiempo real y no ocupa espacio en tu teléfono.
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 py-2.5 text-sm font-semibold text-white transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
