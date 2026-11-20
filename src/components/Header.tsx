import React from 'react';
import { 
  Download, 
  LogOut,
  KeyRound
} from 'lucide-react';
import { ChurchConfig, AppUserSession } from '../types/treasury';
import { PWAInstallButton } from './PWAInstallButton';
import { ChurchMoneyLogo } from './ChurchMoneyLogo';

interface HeaderProps {
  config: ChurchConfig;
  session: AppUserSession;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  onOpenIncomeModal?: () => void;
  onOpenExpenseModal?: () => void;
  onOpenCashCountModal?: () => void;
  onExportExcel: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  session,
  onLogout,
  onOpenChangePassword,
  onExportExcel,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner / Church Info - Compact mobile layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          
          {/* Church Branding & Mini Live Status */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <ChurchMoneyLogo size="sm" variant="badge" logoUrl={config.logoUrl} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-sm sm:text-base lg:text-lg text-white leading-tight truncate max-w-[160px] xs:max-w-[220px] sm:max-w-none">
                  {config.churchName}
                </h1>
                {/* Reduced live indicator */}
                <span 
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0"
                  title="En vivo · Conexión sincronizada con la nube"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="hidden xs:inline">En vivo</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:flex items-center gap-1.5 mt-0.5 truncate">
                <span>{config.denomination}</span>
                <span>·</span>
                <span>{config.district}</span>
              </p>
            </div>
          </div>

          {/* Active User Display & Logout Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Active User Pill (Locked during active session) */}
            <div 
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 shadow-xs"
              title={`Sesión iniciada como: ${session.name} (${session.role})`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></div>
              <div className="text-left leading-tight">
                <span className="block text-[9px] text-slate-400 font-normal leading-none">
                  {session.role === 'Tesorero Principal' ? 'Tesorero' : session.role.split(' ')[0]}
                </span>
                <span className="font-semibold text-white text-xs truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[220px] block">
                  {session.name}
                </span>
              </div>
            </div>

            {/* Change personal password button */}
            {onOpenChangePassword && (
              <button
                type="button"
                onClick={onOpenChangePassword}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Cambiar mi contraseña personal"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Clave</span>
              </button>
            )}

            {/* Logout button (to change user, one must log out first) */}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Cerrar sesión actual para cambiar de usuario"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="hidden xs:inline sm:hidden">Salir</span>
            </button>

            {/* Desktop Only Actions */}
            <button
              type="button"
              onClick={onExportExcel}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Descargar libro en Excel oficial de la denominación"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Excel</span>
            </button>

            <div className="hidden md:block">
              <PWAInstallButton />
            </div>

          </div>
        </div>
      </div>

      {/* Navigation Tabs - Slim and thumb-friendly */}
      <nav className="border-t border-slate-800/80 bg-slate-900/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex space-x-1.5 sm:space-x-3 overflow-x-auto py-1.5 sm:py-2 scrollbar-none text-xs sm:text-sm font-medium">
            {[
              { id: 'dashboard', label: 'Tablero General' },
              { id: 'incomes', label: 'Ingresos (Diezmos y Ofrendas)' },
              { id: 'expenses', label: 'Egresos (Gastos)' },
              { id: 'actas', label: 'Actas de Conteo de Cultos' },
              { id: 'members', label: 'Membresía / Feligresía' },
              { id: 'report', label: 'Informes y Balances (Por Fechas)' },
              ...((session?.role === 'Tesorero Principal' || session?.role === 'Pastor / Revisor')
                ? [{ id: 'settings', label: 'Configuración Iglesia' }]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};
