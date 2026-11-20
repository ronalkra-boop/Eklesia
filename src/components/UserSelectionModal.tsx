import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ChurchConfig, AppUserSession, UserRoleId, UserCredential } from '../types/treasury';
import { ChurchMoneyLogo } from './ChurchMoneyLogo';
import { verifyPassword, DEFAULT_INITIAL_PASSWORD } from '../utils/security';

interface UserSelectionModalProps {
  isOpen: boolean;
  config: ChurchConfig;
  currentSession: AppUserSession;
  credentials: Record<UserRoleId, UserCredential>;
  onSelectUser: (session: AppUserSession, rememberDevice: boolean) => void;
  onOpenChangePassword?: (roleId: UserRoleId) => void;
}

// Helper to extract clean initials from full person name
function getInitials(name: string, fallback: string): string {
  if (!name) return fallback;
  const clean = name.replace(/^(pr\.|pastor|hno\.|hna\.|diacono)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return fallback;
}

export const UserSelectionModal: React.FC<UserSelectionModalProps> = ({
  isOpen,
  config,
  currentSession,
  credentials,
  onSelectUser,
  onOpenChangePassword,
}) => {
  const [rememberOnDevice, setRememberOnDevice] = useState(true);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  // The 4 authorized official profiles established in Church Configuration
  const roleProfiles: {
    roleId: UserRoleId;
    role: AppUserSession['role'];
    name: string;
    scope: string;
    roleBadgeColor: string;
    avatarColor: string;
    defaultInitials: string;
  }[] = [
    {
      roleId: 'tesorero',
      role: 'Tesorero Principal',
      name: config.tesoreroName || 'Maryuri Heredia',
      scope: 'Caja Mayor · Balances · Configuración',
      roleBadgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      avatarColor: 'from-amber-500 to-amber-700 text-slate-950',
      defaultInitials: 'TP',
    },
    {
      roleId: 'auxiliar1',
      role: 'Auxiliar 1',
      name: config.auxiliar1Name || 'Ahuivi Vazques',
      scope: 'Recepción diezmos · Arqueos de culto',
      roleBadgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      avatarColor: 'from-emerald-500 to-emerald-700 text-slate-950',
      defaultInitials: 'A1',
    },
    {
      roleId: 'auxiliar2',
      role: 'Auxiliar 2',
      name: config.auxiliar2Name || 'Yesica Alfaro',
      scope: 'Apoyo conteo · Sobres y recibos',
      roleBadgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      avatarColor: 'from-teal-500 to-teal-700 text-slate-950',
      defaultInitials: 'A2',
    },
    {
      roleId: 'pastor',
      role: 'Pastor / Revisor',
      name: config.pastorName || 'Pr. Ronald Nuñez',
      scope: 'Supervisión pastoral · Auditoría · Configuración',
      roleBadgeColor: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
      avatarColor: 'from-indigo-500 to-indigo-700 text-white',
      defaultInitials: 'PR',
    },
  ];

  const activeProfile = selectedProfileIndex !== null ? roleProfiles[selectedProfileIndex] : null;
  const activeCred = activeProfile ? credentials[activeProfile.roleId] : null;

  const handleSelectProfile = (index: number) => {
    setSelectedProfileIndex(index);
    setPasswordInput('');
    setErrorMessage(null);
  };

  const handleBackToList = () => {
    setSelectedProfileIndex(null);
    setPasswordInput('');
    setErrorMessage(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    if (!passwordInput.trim()) {
      setErrorMessage('Por favor ingresa tu contraseña para acceder.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage(null);

      let isValid = false;
      if (activeCred?.passwordHash) {
        isValid = await verifyPassword(passwordInput, activeCred.passwordHash);
      } else {
        // Fallback default
        isValid = passwordInput.trim() === DEFAULT_INITIAL_PASSWORD;
      }

      if (!isValid) {
        setErrorMessage('Contraseña incorrecta. Si es tu primer ingreso, la contraseña inicial es 1234.');
        setIsVerifying(false);
        return;
      }

      // Valid password! Proceed to login
      const chosenName = activeProfile.name.trim() || activeProfile.role;
      onSelectUser(
        {
          name: chosenName,
          role: activeProfile.role,
          roleId: activeProfile.roleId,
        },
        rememberOnDevice
      );
    } catch (err) {
      console.error('Password verification error:', err);
      setErrorMessage('Error al verificar la contraseña. Inténtalo nuevamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100 flex flex-col my-auto">
        
        {/* Top Header Card */}
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900/90 p-4 sm:p-5 border-b border-slate-700/70">
          <div className="flex items-center gap-3">
            <ChurchMoneyLogo size="md" variant="badge" logoUrl={config.logoUrl} className="w-12 h-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-0.5">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>Ingreso Seguro a Tesorería</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                {config.churchName}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {config.denomination} {config.district ? `· ${config.district}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Guidance banner */}
          <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="leading-tight text-[11px] sm:text-xs">
              {activeProfile 
                ? `Ingresa tu contraseña personal para acceder como ${activeProfile.role}.`
                : 'Selecciona tu usuario e ingresa tu contraseña personal.'}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 space-y-3">
          
          {/* STEP 1: Select Profile */}
          {!activeProfile ? (
            <>
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Equipo de Tesorería Autorizado
                </span>
                <span className="text-[11px] text-amber-400 font-medium">
                  Toca para identificarte
                </span>
              </div>

              {/* Profiles List */}
              <div className="space-y-2">
                {roleProfiles.map((item, idx) => {
                  const isCurrent = currentSession?.role === item.role && currentSession?.name === item.name;
                  const initials = getInitials(item.name, item.defaultInitials);
                  const cred = credentials[item.roleId];

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectProfile(idx)}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between group cursor-pointer shadow-xs active:scale-[0.99] ${
                        isCurrent
                          ? 'bg-slate-800/95 border-amber-500/70 ring-1 ring-amber-500/30'
                          : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.avatarColor} font-black text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                          {initials}
                        </div>

                        {/* Member details */}
                        <div className="min-w-0 flex-1 pr-1">
                          <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug break-words">
                            {item.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${item.roleBadgeColor}`}>
                              {item.role}
                            </span>
                            {cred?.isDefault ? (
                              <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                                • Clave inicial (1234)
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                                • Clave personal activa
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Clean Touch Arrow */}
                      <div className="ml-1.5 shrink-0 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                        <div className="w-7 h-7 rounded-full bg-slate-700/70 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Initial Password Hint */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-[11px] text-amber-300">
                💡 <strong>Contraseña inicial por defecto:</strong> <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">1234</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Cada usuario puede cambiarla por su contraseña personal después de ingresar.</span>
              </div>
            </>
          ) : (
            /* STEP 2: Password Entry for Selected User */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              {/* Back button */}
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Elegir otro usuario</span>
              </button>

              {/* User Selected Badge Card */}
              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${activeProfile.avatarColor} font-black text-sm flex items-center justify-center shrink-0 shadow-sm`}>
                  {getInitials(activeProfile.name, activeProfile.defaultInitials)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-medium block">Ingresando como:</span>
                  <div className="text-base font-bold text-white truncate leading-tight">
                    {activeProfile.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${activeProfile.roleBadgeColor}`}>
                      {activeProfile.role}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {activeProfile.scope}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    Contraseña Personal:
                  </label>
                  {activeCred?.isDefault && (
                    <span className="text-[10px] text-amber-400 font-medium">
                      Clave inicial: 1234
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={activeCred?.isDefault ? "Ingresa 1234 o tu contraseña" : "Ingresa tu contraseña personal"}
                    autoFocus
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder:text-slate-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
              >
                <Lock className="w-4 h-4" />
                <span>{isVerifying ? 'Verificando contraseña...' : 'Ingresar a Tesorería'}</span>
              </button>

              {/* Change Password Link */}
              {onOpenChangePassword && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenChangePassword(activeProfile.roleId)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer transition-colors"
                  >
                    ¿Deseas cambiar tu contraseña personal?
                  </button>
                </div>
              )}

            </form>
          )}

          {/* Remember Choice Toggle */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={rememberOnDevice}
                onChange={(e) => setRememberOnDevice(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-700"
              />
              <span className="text-[11px] sm:text-xs">Recordar usuario en este celular</span>
            </label>
          </div>

        </div>

      </div>
    </div>
  );
};
