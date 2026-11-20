import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { IncomesView } from './components/IncomesView';
import { ExpensesView } from './components/ExpensesView';
import { ActasView } from './components/ActasView';
import { MembersView } from './components/MembersView';
import { DenominationalReportView } from './components/DenominationalReportView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { CashCountModal } from './components/CashCountModal';
import { ReceiptPrintModal } from './components/ReceiptPrintModal';
import { UserSelectionModal } from './components/UserSelectionModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';

import {
  Transaction,
  ActaConteo,
  Member,
  ChurchConfig,
  AppUserSession,
  UserRoleId,
  UserCredential,
} from './types/treasury';
import {
  DEFAULT_CHURCH_CONFIG,
} from './utils/constants';
import {
  initializeDatabaseIfEmpty,
  initializeUserCredentialsIfEmpty,
  subscribeToTransactions,
  subscribeToActas,
  subscribeToMembers,
  subscribeToChurchConfig,
  subscribeToUserCredentials,
  saveTransaction,
  deleteTransaction,
  saveActaConteo,
  deleteActaConteo,
  saveMember,
  saveMembersBatch,
  deleteMember,
  saveChurchConfig,
  saveUserCredential,
  clearAllTestData,
} from './services/treasuryService';
import { exportDenominationalExcel } from './utils/excelExport';

export default function App() {
  // Global Church Data State
  const [config, setConfig] = useState<ChurchConfig>(DEFAULT_CHURCH_CONFIG);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [actas, setActas] = useState<ActaConteo[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // User credentials & personal passwords state
  const [credentials, setCredentials] = useState<Record<UserRoleId, UserCredential>>(() => ({
    tesorero: {
      roleId: 'tesorero',
      roleName: 'Tesorero Principal',
      userName: DEFAULT_CHURCH_CONFIG.tesoreroName,
      passwordHash: '',
      isDefault: true,
      updatedAt: new Date().toISOString(),
    },
    auxiliar1: {
      roleId: 'auxiliar1',
      roleName: 'Auxiliar 1',
      userName: DEFAULT_CHURCH_CONFIG.auxiliar1Name,
      passwordHash: '',
      isDefault: true,
      updatedAt: new Date().toISOString(),
    },
    auxiliar2: {
      roleId: 'auxiliar2',
      roleName: 'Auxiliar 2',
      userName: DEFAULT_CHURCH_CONFIG.auxiliar2Name,
      passwordHash: '',
      isDefault: true,
      updatedAt: new Date().toISOString(),
    },
    pastor: {
      roleId: 'pastor',
      roleName: 'Pastor / Revisor',
      userName: DEFAULT_CHURCH_CONFIG.pastorName,
      passwordHash: '',
      isDefault: true,
      updatedAt: new Date().toISOString(),
    },
  }));

  // Password modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordTargetRole, setChangePasswordTargetRole] = useState<UserRoleId>('tesorero');
  const [changePasswordIsAdmin, setChangePasswordIsAdmin] = useState(false);

  // User identification requirement on entering the app
  const [isUserIdentified, setIsUserIdentified] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('ekklesia_session_identified');
      const savedSession = localStorage.getItem('ekklesia_active_session');
      return savedAuth === 'true' && Boolean(savedSession);
    } catch {
      return false;
    }
  });

  // Active Session (User & Role) persisted in localStorage
  const [session, setSession] = useState<AppUserSession>(() => {
    try {
      const saved = localStorage.getItem('ekklesia_active_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.role) return parsed;
      }
    } catch {}
    return {
      name: DEFAULT_CHURCH_CONFIG.tesoreroName || 'Tesorero Principal',
      role: 'Tesorero Principal',
      roleId: 'tesorero',
    };
  });

  const handleSessionChange = (newSession: AppUserSession) => {
    setSession(newSession);
    try {
      localStorage.setItem('ekklesia_active_session', JSON.stringify(newSession));
    } catch (e) {
      console.warn('Failed to save session to localStorage:', e);
    }
  };

  const handleSelectUser = (newSession: AppUserSession, rememberDevice: boolean) => {
    setSession(newSession);
    setIsUserIdentified(true);
    try {
      localStorage.setItem('ekklesia_active_session', JSON.stringify(newSession));
      if (rememberDevice) {
        localStorage.setItem('ekklesia_session_identified', 'true');
      } else {
        localStorage.removeItem('ekklesia_session_identified');
      }
    } catch (e) {
      console.warn('Failed to save session to localStorage:', e);
    }
  };

  const handleLogout = () => {
    setIsUserIdentified(false);
    try {
      localStorage.removeItem('ekklesia_session_identified');
      localStorage.removeItem('ekklesia_active_session');
    } catch (e) {
      console.warn('Failed to clear session from localStorage:', e);
    }
  };

  // Active View Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Role permissions: Only Tesorero Principal and Pastor / Revisor can access Settings
  const canAccessSettings = session.role === 'Tesorero Principal' || session.role === 'Pastor / Revisor';

  useEffect(() => {
    if (!canAccessSettings && activeTab === 'settings') {
      setActiveTab('dashboard');
    }
  }, [canAccessSettings, activeTab]);

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCashCountModalOpen, setIsCashCountModalOpen] = useState(false);
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  // Initialize and connect real-time Firestore listeners
  useEffect(() => {
    let unsubscribeTx: (() => void) | undefined;
    let unsubscribeActas: (() => void) | undefined;
    let unsubscribeMembers: (() => void) | undefined;
    let unsubscribeConfig: (() => void) | undefined;
    let unsubscribeCreds: (() => void) | undefined;

    async function setupRealtimeSync() {
      try {
        await initializeDatabaseIfEmpty();

        unsubscribeConfig = subscribeToChurchConfig((newConfig) => {
          setConfig(newConfig);
          // Update active session name if matching a role
          setSession((prev) => {
            let updatedName = prev.name;
            if (prev.role === 'Tesorero Principal') updatedName = newConfig.tesoreroName || prev.name;
            else if (prev.role === 'Auxiliar 1') updatedName = newConfig.auxiliar1Name || prev.name;
            else if (prev.role === 'Auxiliar 2') updatedName = newConfig.auxiliar2Name || prev.name;
            else if (prev.role === 'Pastor / Revisor') updatedName = newConfig.pastorName || prev.name;

            const updated = { ...prev, name: updatedName };
            try {
              localStorage.setItem('ekklesia_active_session', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        });

        // Initialize and listen to user credentials
        const initCreds = await initializeUserCredentialsIfEmpty(config);
        setCredentials((prev) => ({ ...prev, ...initCreds }));

        unsubscribeCreds = subscribeToUserCredentials((newCreds) => {
          setCredentials((prev) => ({ ...prev, ...newCreds }));
        });

        unsubscribeTx = subscribeToTransactions((txList) => {
          setTransactions(txList);
          setIsLoading(false);
        });

        unsubscribeActas = subscribeToActas((actasList) => {
          setActas(actasList);
        });

        unsubscribeMembers = subscribeToMembers((membersList) => {
          setMembers(membersList);
        });
      } catch (err) {
        console.warn('Realtime subscription initialized with local fallback:', err);
        setIsLoading(false);
      }
    }

    setupRealtimeSync();

    return () => {
      if (unsubscribeTx) unsubscribeTx();
      if (unsubscribeActas) unsubscribeActas();
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeConfig) unsubscribeConfig();
      if (unsubscribeCreds) unsubscribeCreds();
    };
  }, []);

  // Save Credential Handler (Personal Password update)
  const handleSaveCredential = async (credential: UserCredential) => {
    setCredentials((prev) => ({ ...prev, [credential.roleId]: credential }));
    await saveUserCredential(credential);
  };

  // Open Change Password Modal
  const handleOpenChangePassword = (roleId?: UserRoleId, isAdmin = false) => {
    let target: UserRoleId = 'tesorero';
    if (roleId) {
      target = roleId;
    } else if (session.roleId) {
      target = session.roleId;
    } else {
      if (session.role === 'Auxiliar 1') target = 'auxiliar1';
      else if (session.role === 'Auxiliar 2') target = 'auxiliar2';
      else if (session.role === 'Pastor / Revisor') target = 'pastor';
      else target = 'tesorero';
    }
    setChangePasswordTargetRole(target);
    setChangePasswordIsAdmin(isAdmin);
    setIsChangePasswordOpen(true);
  };

  // Save Transaction Handler
  const handleSaveTransaction = async (tx: Transaction) => {
    // Optimistic local update
    setTransactions((prev) => [tx, ...prev.filter((t) => t.id !== tx.id)]);
    setTransactionToEdit(null);
    await saveTransaction(tx);
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await deleteTransaction(id);
  };

  // Open Edit Transaction Handler
  const handleOpenEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    if (tx.type === 'income') {
      setIsIncomeModalOpen(true);
    } else {
      setIsExpenseModalOpen(true);
    }
  };

  // Delete Member Handler
  const handleDeleteMember = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    await deleteMember(id);
  };

  // Delete Acta Handler
  const handleDeleteActa = async (id: string) => {
    setActas((prev) => prev.filter((a) => a.id !== id));
    await deleteActaConteo(id);
  };

  // Clear all test data handler
  const handleClearAllData = async () => {
    if (!canAccessSettings) {
      alert('Acceso no autorizado: Solo el Tesorero Principal y el Pastor Revisor pueden vaciar los datos.');
      return;
    }
    setTransactions([]);
    setActas([]);
    setMembers([]);
    await clearAllTestData();
  };

  // Save Acta Conteo Handler (with optional automatic transaction generation)
  const handleSaveActa = async (acta: ActaConteo, autoCreateTransactions: boolean) => {
    setActas((prev) => [acta, ...prev.filter((a) => a.id !== acta.id)]);
    await saveActaConteo(acta);

    if (autoCreateTransactions) {
      // 1. If tithes registered in acta
      if (acta.totalDiezmos > 0) {
        const titheTx: Transaction = {
          id: `tx-${Date.now()}-diezmos`,
          type: 'income',
          category: 'diezmo',
          amount: acta.totalDiezmos,
          date: acta.date,
          serviceName: acta.serviceName,
          memberOrPayee: 'Sobres de Diezmo (Arqueo de Culto)',
          paymentMethod: 'efectivo',
          receiptNumber: `ACTA-${acta.id.slice(-4)}-DZ`,
          description: `Consolidado de diezmos contados en acta #${acta.id.slice(-4)}`,
          recordedBy: session.name,
          recordedByRole: session.role,
          recordedByUid: acta.recordedByUid,
          status: 'aprobado',
          actaId: acta.id,
          createdAt: new Date().toISOString(),
        };
        await saveTransaction(titheTx);
      }

      // 2. If general offerings registered in acta
      if (acta.totalOfrendas > 0) {
        const ofrendaTx: Transaction = {
          id: `tx-${Date.now()}-ofrendas`,
          type: 'income',
          category: 'ofrenda_general',
          amount: acta.totalOfrendas,
          date: acta.date,
          serviceName: acta.serviceName,
          memberOrPayee: 'Alfolí General / Feligresía',
          paymentMethod: 'efectivo',
          receiptNumber: `ACTA-${acta.id.slice(-4)}-OF`,
          description: `Recolección de ofrendas de alfolí según acta #${acta.id.slice(-4)}`,
          recordedBy: session.name,
          recordedByRole: session.role,
          recordedByUid: acta.recordedByUid,
          status: 'aprobado',
          actaId: acta.id,
          createdAt: new Date().toISOString(),
        };
        await saveTransaction(ofrendaTx);
      }

      // 3. If special offerings (missions/pro-templo)
      if (acta.totalEspeciales > 0) {
        const especialTx: Transaction = {
          id: `tx-${Date.now()}-especiales`,
          type: 'income',
          category: 'ofrenda_misionera',
          amount: acta.totalEspeciales,
          date: acta.date,
          serviceName: acta.serviceName,
          memberOrPayee: 'Fondos Especiales / Misiones',
          paymentMethod: 'efectivo',
          receiptNumber: `ACTA-${acta.id.slice(-4)}-ESP`,
          description: `Ofrendas especiales contadas en acta #${acta.id.slice(-4)}`,
          recordedBy: session.name,
          recordedByRole: session.role,
          recordedByUid: acta.recordedByUid,
          status: 'aprobado',
          actaId: acta.id,
          createdAt: new Date().toISOString(),
        };
        await saveTransaction(especialTx);
      }
    }
  };

  // Save Member Handler
  const handleSaveMember = async (member: Member) => {
    setMembers((prev) => [...prev.filter((m) => m.id !== member.id), member]);
    await saveMember(member);
  };

  // Batch import members from Excel
  const handleImportMembers = async (importedList: Member[]) => {
    setMembers((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      importedList.forEach((item) => {
        map.set(item.id, item);
      });
      return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
    });
    await saveMembersBatch(importedList);
  };

  // Save Church Config Handler
  const handleSaveConfig = async (newConfig: ChurchConfig) => {
    if (!canAccessSettings) {
      alert('Acceso no autorizado: Solo el Tesorero Principal y el Pastor Revisor pueden modificar la configuración.');
      return;
    }
    setConfig(newConfig);
    await saveChurchConfig(newConfig);
  };

  // Batch import transactions from Excel
  const handleImportTransactions = async (importedList: Transaction[]) => {
    setTransactions((prev) => [...importedList, ...prev]);
    for (const item of importedList) {
      await saveTransaction(item);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Universal Church Header */}
      <Header
        config={config}
        session={session}
        onLogout={handleLogout}
        onOpenChangePassword={() => handleOpenChangePassword(undefined, false)}
        onOpenIncomeModal={() => {
          setTransactionToEdit(null);
          setIsIncomeModalOpen(true);
        }}
        onOpenExpenseModal={() => {
          setTransactionToEdit(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenCashCountModal={() => setIsCashCountModalOpen(true)}
        onExportExcel={() => exportDenominationalExcel(transactions, actas, members, config)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            actas={actas}
            config={config}
            onOpenIncomeModal={() => {
              setTransactionToEdit(null);
              setIsIncomeModalOpen(true);
            }}
            onOpenExpenseModal={() => {
              setTransactionToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenCashCountModal={() => setIsCashCountModalOpen(true)}
            onSelectTransactionForPrint={(tx) => setSelectedTxForPrint(tx)}
            onGoToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'incomes' && (
          <IncomesView
            transactions={transactions}
            config={config}
            onOpenIncomeModal={() => {
              setTransactionToEdit(null);
              setIsIncomeModalOpen(true);
            }}
            onSelectTransactionForPrint={(tx) => setSelectedTxForPrint(tx)}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleOpenEditTransaction}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            transactions={transactions}
            config={config}
            onOpenExpenseModal={() => {
              setTransactionToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            onSelectTransactionForPrint={(tx) => setSelectedTxForPrint(tx)}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleOpenEditTransaction}
          />
        )}

        {activeTab === 'actas' && (
          <ActasView
            actas={actas}
            config={config}
            onOpenCashCountModal={() => setIsCashCountModalOpen(true)}
            onDeleteActa={handleDeleteActa}
          />
        )}

        {activeTab === 'members' && (
          <MembersView
            members={members}
            transactions={transactions}
            config={config}
            onSaveMember={handleSaveMember}
            onImportMembers={handleImportMembers}
            onDeleteMember={handleDeleteMember}
          />
        )}

        {activeTab === 'report' && (
          <DenominationalReportView
            transactions={transactions}
            actas={actas}
            members={members}
            config={config}
            onImportTransactions={handleImportTransactions}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            config={config}
            session={session}
            credentials={credentials}
            onSaveConfig={handleSaveConfig}
            onSaveCredential={handleSaveCredential}
            onOpenChangePasswordModal={(roleId, isAdmin) => handleOpenChangePassword(roleId, isAdmin)}
            onClearAllData={handleClearAllData}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isIncomeModalOpen}
        initialType="income"
        transactionToEdit={transactionToEdit}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setTransactionToEdit(null);
        }}
        members={members}
        config={config}
        session={session}
        onSaveTransaction={handleSaveTransaction}
      />

      <TransactionModal
        isOpen={isExpenseModalOpen}
        initialType="expense"
        transactionToEdit={transactionToEdit}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setTransactionToEdit(null);
        }}
        members={members}
        config={config}
        session={session}
        onSaveTransaction={handleSaveTransaction}
      />

      <CashCountModal
        isOpen={isCashCountModalOpen}
        onClose={() => setIsCashCountModalOpen(false)}
        config={config}
        session={session}
        onSaveActa={handleSaveActa}
      />

      <ReceiptPrintModal
        isOpen={!!selectedTxForPrint}
        onClose={() => setSelectedTxForPrint(null)}
        transaction={selectedTxForPrint}
        config={config}
      />

      {/* Mandatory User Login / Shift Start Modal on App Entry */}
      <UserSelectionModal
        isOpen={!isUserIdentified}
        config={config}
        currentSession={session}
        credentials={credentials}
        onSelectUser={handleSelectUser}
        onOpenChangePassword={(roleId) => handleOpenChangePassword(roleId, false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        config={config}
        credentials={credentials}
        onSaveCredential={handleSaveCredential}
        currentSession={session}
        targetRoleId={changePasswordTargetRole}
        isAdminManagement={changePasswordIsAdmin}
      />

      {/* Simple Footer */}
      <footer className="print:hidden border-t border-slate-200/80 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <strong>{config.churchName}</strong> · Tesorería Eclesiástica en Tiempo Real
          </div>
          <div>
            Formato oficial compatible con Excel denominacional y arqueo multi-usuario
          </div>
        </div>
      </footer>

    </div>
  );
}
