import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { UserRoleId, UserCredential, ChurchConfig, AppUserSession } from '../types/treasury';
import { hashPassword, verifyPassword, DEFAULT_INITIAL_PASSWORD } from '../utils/security';
import { ChurchMoneyLogo } from './ChurchMoneyLogo';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChurchConfig;
  credentials: Record<UserRoleId, UserCredential>;
  onSaveCredential: (credential: UserCredential) => Promise<void>;
  currentSession?: AppUserSession;
  targetRoleId?: UserRoleId; // Pre-selected role to change
  isAdminManagement?: boolean; // If opened from Settings by Pastor/Tesorero
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  config,
  credentials,
  onSaveCredential,
  currentSession,
  targetRoleId = 'tesorero',
  isAdminManagement = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRoleId>(targetRoleId);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync selectedRole if targetRoleId changes
  React.useEffect(() => {
    if (targetRoleId) {
      setSelectedRole(targetRoleId);
    }
  }, [targetRoleId]);

  if (!isOpen) return null;

  const roleMeta: Record<UserRoleId, { roleName: UserCredential['roleName']; officialName: string; badgeColor: string }> = {
    tesorero: {
      roleName: 'Tesorero Principal',
      officialName: config.tesoreroName || 'Maryuri Heredia',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    auxiliar1: {
      roleName: 'Auxiliar 1',
      officialName: config.auxiliar1Name || 'Ahuivi Vazques',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    auxiliar2: {
      roleName: 'Auxiliar 2',
      officialName: config.auxiliar2Name || 'Yesica Alfaro',
      badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    },
    pastor: {
      roleName: 'Pastor / Revisor',
      officialName: config.pastorName || 'Pr. Ronald Nuñez',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
  };

  const currentCred = credentials[selectedRole];
  const targetUserMeta = roleMeta[selectedRole];

  const handleResetToDefault = async () => {
    if (!confirm(`¿Confirmas restablecer la contraseña de ${targetUserMeta.officialName} (${targetUserMeta.roleName}) a la clave inicial por defecto "${DEFAULT_INITIAL_PASSWORD}"?`)) {
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const defaultHash = await hashPassword(DEFAULT_INITIAL_PASSWORD);
      await onSaveCredential({
        roleId: selectedRole,
        roleName: targetUserMeta.roleName,
        userName: targetUserMeta.officialName,
        passwordHash: defaultHash,
        isDefault: true,
        updatedAt: new Date().toISOString(),
      });
      setSuccessMessage(`Contraseña restablecida exitosamente a "${DEFAULT_INITIAL_PASSWORD}".`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1800);
    } catch (e) {
      console.error(e);
      setErrorMessage('Error al restablecer la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las nuevas contraseñas no coinciden. Por favor verifica.');
      return;
    }

    // If not admin override, verify current password
    if (!isAdminManagement) {
      if (!currentPassword) {
        setErrorMessage('Por favor ingresa tu contraseña actual (o la clave inicial 1234).');
        return;
      }

      const isValidCurrent = currentCred?.passwordHash 
        ? await verifyPassword(currentPassword, currentCred.passwordHash)
        : (currentPassword === DEFAULT_INITIAL_PASSWORD);

      if (!isValidCurrent) {
        setErrorMessage('La contraseña actual es incorrecta. Si es tu primer ingreso, la contraseña inicial es 1234.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const newHash = await hashPassword(newPassword);
      await onSaveCredential({
        roleId: selectedRole,
        roleName: targetUserMeta.roleName,
        userName: targetUserMeta.officialName,
        passwordHash: newHash,
        isDefault: false,
        updatedAt: new Date().toISOString(),
      });

      setSuccessMessage('¡Contraseña personal actualizada y sincronizada con éxito!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Error saving password:', err);
      setErrorMessage('Error al guardar la nueva contraseña. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100 flex flex-col my-auto">
        
        {/* Header */}
        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900/90 p-4 sm:p-5 border-b border-slate-700/70">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {isAdminManagement ? 'Gestión de Contraseña' : 'Cambiar Mi Contraseña Personal'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAdminManagement 
                    ? 'Asignar o restablecer contraseña del equipo'
                    : 'Protege tu acceso a las operaciones de tesorería'}
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">

          {/* User selector if Admin, or target badge if self */}
          {isAdminManagement ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Seleccionar Miembro del Equipo:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as UserRoleId);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="tesorero">Tesorero Principal — {config.tesoreroName || 'Maryuri Heredia'}</option>
                <option value="auxiliar1">Auxiliar 1 — {config.auxiliar1Name || 'Ahuivi Vazques'}</option>
                <option value="auxiliar2">Auxiliar 2 — {config.auxiliar2Name || 'Yesica Alfaro'}</option>
                <option value="pastor">Pastor / Revisor — {config.pastorName || 'Pr. Ronald Nuñez'}</option>
              </select>
            </div>
          ) : (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Usuario:</span>
                <span className="text-sm font-bold text-white block">{targetUserMeta.officialName}</span>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-1 ${targetUserMeta.badgeColor}`}>
                  {targetUserMeta.roleName}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                {currentCred?.isDefault ? (
                  <span className="text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 inline-block">
                    Clave Inicial (1234)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 inline-block">
                    Clave Personal
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Current Password Field (Only needed if NOT admin override) */}
          {!isAdminManagement && (
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Contraseña Actual *
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Si es tu primera vez, ingresa 1234"
                  className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-amber-500 focus:border-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                La contraseña inicial de fábrica de todos los perfiles es: <strong>1234</strong>
              </p>
            </div>
          )}

          {/* New Password Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Nueva Contraseña Personal *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres (números o letras)"
                className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-amber-500 focus:border-amber-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Confirmar Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="w-full p-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:ring-amber-500 focus:border-amber-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error & Success Feedback */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando contraseña...' : 'Guardar Nueva Contraseña'}</span>
            </button>

            {isAdminManagement && (
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={isSubmitting}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-amber-300 border border-slate-700 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restablecer a contraseña por defecto (1234)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-center text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
