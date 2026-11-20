import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  Users, 
  Landmark, 
  DollarSign, 
  CheckCircle2, 
  RefreshCw,
  ShieldCheck,
  Percent,
  Smartphone,
  Trash2,
  LogOut,
  Lock,
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import { ChurchConfig, AppUserSession, UserRoleId, UserCredential } from '../types/treasury';
import { testConnection } from '../firebase/config';
import { ChurchMoneyLogo } from './ChurchMoneyLogo';

interface SettingsViewProps {
  config: ChurchConfig;
  session?: AppUserSession;
  credentials: Record<UserRoleId, UserCredential>;
  onSaveConfig: (updated: ChurchConfig) => Promise<void>;
  onSaveCredential: (credential: UserCredential) => Promise<void>;
  onOpenChangePasswordModal: (roleId: UserRoleId, isAdmin: boolean) => void;
  onClearAllData?: () => Promise<void>;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  session,
  credentials,
  onSaveConfig,
  onSaveCredential,
  onOpenChangePasswordModal,
  onClearAllData,
  onLogout,
}) => {
  const [formData, setFormData] = useState<ChurchConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isUpdatingApp, setIsUpdatingApp] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    if (confirm('¿Confirmas que deseas vaciar todas las transacciones, actas de conteo y feligreses de prueba para comenzar con la aplicación 100% limpia? (Los datos de la iglesia se mantendrán intactos)')) {
      try {
        setIsClearing(true);
        if (onClearAllData) await onClearAllData();
        localStorage.removeItem('ekklesia_active_session');
        localStorage.removeItem('ekklesia_session_identified');
        alert('Base de datos vaciada con éxito. La aplicación está lista para sus pruebas reales.');
        window.location.reload();
      } catch (e) {
        console.error(e);
        alert('Error al vaciar los datos.');
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleForceUpdateApp = async () => {
    setIsUpdatingApp(true);
    setUpdateMsg('Limpiando cachés y sincronizando última versión...');
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }
      localStorage.removeItem('ekklesia_app_version');
      setUpdateMsg('¡Caché limpiada con éxito! Recargando app...');
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch {
      window.location.reload();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error al guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestDb = async () => {
    setTestResult('Verificando conexión en la nube...');
    const ok = await testConnection();
    if (ok) {
      setTestResult('Conexión con base de datos en tiempo real: ACTIVA Y OPERATIVA');
    } else {
      setTestResult('Conectando en segundo plano...');
    }
  };

  // Role authorization check: Only Tesorero Principal and Pastor / Revisor have access to configuration
  const hasConfigAccess = session?.role === 'Tesorero Principal' || session?.role === 'Pastor / Revisor';

  if (!hasConfigAccess) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Acceso Restringido</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Configuración Protegida de la Iglesia
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              Las opciones de configuración institucional están disponibles exclusivamente para el <strong>Tesorero(a) Principal</strong> y el <strong>Pastor / Revisor</strong> para garantizar el control y la seguridad eclesiástica.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tu sesión actual:</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">{session?.name || 'Usuario'}</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700">
                {session?.role || 'Auxiliar'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              Tu perfil cuenta con autorización para conteo de ofrendas, registro de actas de culto, ingresos y gastos, pero no para modificar autoridades de la iglesia ni parámetros contables globales.
            </p>
          </div>

          {onLogout && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition-colors shadow-xs"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                Cerrar Sesión / Ingresar con otro perfil
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          Configuración Institucional de la Iglesia y Tesorería
        </h2>
        <p className="text-xs text-slate-500">
          Personalice los datos de su denominación, equipo de tesorería y parámetros contables
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuración guardada y sincronizada correctamente en la nube.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        
        {/* Section 1: Church Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Identidad de la Congregación</h3>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Logotipo Oficial:</span>
              <ChurchMoneyLogo size="sm" variant="badge" logoUrl={formData.logoUrl} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Nombre Oficial de la Iglesia *
              </label>
              <input
                type="text"
                value={formData.churchName}
                onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500 font-semibold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Denominación o Misión Eclesiástica *
              </label>
              <input
                type="text"
                value={formData.denomination}
                onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                placeholder="Ej: Asambleas de Dios, Iglesia Bautista, Cuadrangular..."
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Distrito, Presbiterio o Zona
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Ej: Distrito Central / Zona 3"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Ruta del Logotipo Oficial de la Iglesia
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="/assets/aistudio/logo_CDD5_45ac2aa5.png"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-500 font-mono text-[11px] text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: '/assets/aistudio/logo_CDD5_45ac2aa5.png' })}
                  className="shrink-0 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                  title="Restaurar logotipo oficial subido"
                >
                  Restaurar Logo CDD
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Logotipo oficial configurado: <span className="font-semibold text-slate-600">Casa de Dios - Iglesias Bíblicas Misioneras</span>
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Church Officers / Treasury Team */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Equipo de Tesorería y Liderazgo</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pastor Titular (Para actas e informes) *
              </label>
              <input
                type="text"
                value={formData.pastorName}
                onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tesorero Principal *
              </label>
              <input
                type="text"
                value={formData.tesoreroName}
                onChange={(e) => setFormData({ ...formData, tesoreroName: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Auxiliar 1 de Tesorería *
              </label>
              <input
                type="text"
                value={formData.auxiliar1Name}
                onChange={(e) => setFormData({ ...formData, auxiliar1Name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Auxiliar 2 de Tesorería
              </label>
              <input
                type="text"
                value={formData.auxiliar2Name}
                onChange={(e) => setFormData({ ...formData, auxiliar2Name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2.5: User Passwords & Security Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Seguridad y Contraseñas del Equipo de Tesorería</h3>
                <p className="text-[11px] text-slate-500">
                  Cada usuario tiene su propia contraseña personal para proteger el registro de diezmos y arqueos
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protección ABAC Activa</span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                roleId: 'tesorero' as UserRoleId,
                roleName: 'Tesorero Principal',
                personName: formData.tesoreroName || 'Maryuri Heredia',
                badge: 'text-amber-700 bg-amber-50 border-amber-200',
              },
              {
                roleId: 'auxiliar1' as UserRoleId,
                roleName: 'Auxiliar 1',
                personName: formData.auxiliar1Name || 'Ahuivi Vazques',
                badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
              },
              {
                roleId: 'auxiliar2' as UserRoleId,
                roleName: 'Auxiliar 2',
                personName: formData.auxiliar2Name || 'Yesica Alfaro',
                badge: 'text-teal-700 bg-teal-50 border-teal-200',
              },
              {
                roleId: 'pastor' as UserRoleId,
                roleName: 'Pastor / Revisor',
                personName: formData.pastorName || 'Pr. Ronald Nuñez',
                badge: 'text-indigo-700 bg-indigo-50 border-indigo-200',
              },
            ].map((member) => {
              const cred = credentials?.[member.roleId];
              const isDefault = cred ? cred.isDefault : true;
              return (
                <div
                  key={member.roleId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {member.roleName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {member.personName}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${member.badge}`}>
                          {member.roleName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        {isDefault ? (
                          <span className="text-amber-700 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Usando clave inicial de fábrica (1234)
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Contraseña personal establecida y activa
                          </span>
                        )}
                        {cred?.updatedAt && (
                          <span className="text-slate-400 text-[10px] hidden md:inline">
                            · Actualizada: {new Date(cred.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenChangePasswordModal(member.roleId, true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-xs transition-colors shadow-2xs cursor-pointer active:scale-95 shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Asignar / Cambiar Contraseña</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Recomendación eclesiástica:</strong> Por seguridad, al entregar la aplicación a un auxiliar o pastor nuevo, solicítele ingresar con la clave inicial <strong>1234</strong> y pulsar inmediatamente <em>"Cambiar mi contraseña"</em> para definir su propia clave secreta.
            </p>
          </div>
        </div>

        {/* Section 3: Financial Parameters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Landmark className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Parámetros Financieros y Denominacionales</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Moneda de la Iglesia
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-emerald-500 font-medium bg-white"
              >
                <option value="COP">COP - Pesos Colombianos ($)</option>
                <option value="USD">USD - Dólares Americanos ($)</option>
                <option value="MXN">MXN - Pesos Mexicanos ($)</option>
                <option value="PEN">PEN - Soles Peruanos (S/)</option>
                <option value="EUR">EUR - Euros (€)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Porcentaje de Diezmo a Sede Nacional (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tithePercentageToDenomination}
                  onChange={(e) => setFormData({ ...formData, tithePercentageToDenomination: Number(e.target.value) })}
                  className="w-full p-2.5 pr-8 border border-slate-300 rounded-lg focus:ring-emerald-500 font-medium"
                />
                <Percent className="w-4 h-4 absolute right-2.5 top-3 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Calculado sobre la suma total de Diezmos y Ofrendas para entregar a la sede nacional / distrito.
              </p>
            </div>
          </div>
        </div>

        {/* User Session & Logout Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">Sesión Activa de Tesorería</h4>
                {session && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Conectado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {session ? (
                  <>Operando como <strong className="text-slate-800">{session.name}</strong> ({session.role}).</>
                ) : (
                  'Para cambiar de usuario es necesario cerrar la sesión actual.'
                )}
              </p>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>

        {/* Cloud Status Card */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Sincronización en la Nube Activa</h4>
              <p className="text-[11px] text-slate-400">
                Los auxiliares y tesorero ven los mismos datos en tiempo real desde celulares o computadores.
              </p>
              {testResult && (
                <span className="text-[10px] text-emerald-400 font-medium block mt-1">
                  {testResult}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestDb}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Probar Estado</span>
          </button>
        </div>

        {/* Mobile App PWA Cache & Update Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/40 border border-amber-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900">Versión del Celular / Aplicación Móvil</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  v2.2 (Limpio · Multi-Usuario · Edición)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Si tu celular aún muestra la versión anterior con manuales, pulsa este botón para borrar la memoria temporal y forzar la actualización inmediata.
              </p>
              {updateMsg && (
                <span className="text-[11px] text-amber-700 font-bold block mt-1 animate-pulse">
                  {updateMsg}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleForceUpdateApp}
            disabled={isUpdatingApp}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdatingApp ? 'animate-spin' : ''}`} />
            <span>{isUpdatingApp ? 'Actualizando...' : 'Actualizar App en Celular'}</span>
          </button>
        </div>

        {/* Clean Database / Reset Test Data Card */}
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Limpieza y Puesta a Cero de Pruebas</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Vacía las transacciones, actas de conteo y miembros de prueba para dejar la aplicación lista y limpia para las pruebas oficiales de la iglesia.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearData}
            disabled={isClearing}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isClearing ? 'Limpiando...' : 'Vaciar Datos de Prueba'}</span>
          </button>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios de Configuración'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
