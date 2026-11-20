import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Transaction, ActaConteo, Member, ChurchConfig, UserRoleId, UserCredential } from '../types/treasury';
import {
  DEFAULT_CHURCH_CONFIG,
} from '../utils/constants';
import { generateInitialCredentials } from '../utils/security';

const TX_COLLECTION = 'transactions';
const ACTAS_COLLECTION = 'actasConteo';
const MEMBERS_COLLECTION = 'members';
const CONFIG_COLLECTION = 'churchConfig';
const CREDENTIALS_COLLECTION = 'userCredentials';
const CONFIG_DOC_ID = 'main_config';

/**
 * Ensures church configuration exists in Firestore. Never seeds fake transactions or fake members.
 */
export async function initializeDatabaseIfEmpty(): Promise<void> {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      await setDoc(configRef, DEFAULT_CHURCH_CONFIG);
      console.log('Default church configuration initialized in Firestore.');
    } else {
      const data = configSnap.data() as Partial<ChurchConfig>;
      if (!data.logoUrl || data.logoUrl === '/logo.jpg') {
        await setDoc(configRef, { logoUrl: '/assets/aistudio/logo_CDD5_45ac2aa5.png' }, { merge: true });
      }
    }
  } catch (error) {
    console.warn('Initial config check bypassed or completed:', error);
  }
}

/**
 * Subscribes to Transactions in real-time.
 */
export function subscribeToTransactions(
  callback: (transactions: Transaction[]) => void
): () => void {
  try {
    const colRef = collection(db, TX_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Transaction[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Transaction);
        });
        // Sort descending by date / createdAt
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(list);
      },
      (error) => {
        console.warn('Realtime subscription error for transactions (offline/reconnecting):', error);
      }
    );
  } catch (error) {
    console.warn('Failed to start transactions subscription:', error);
    return () => {};
  }
}

/**
 * Subscribes to Actas de Conteo in real-time.
 */
export function subscribeToActas(
  callback: (actas: ActaConteo[]) => void
): () => void {
  try {
    const colRef = collection(db, ACTAS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: ActaConteo[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as ActaConteo);
        });
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(list);
      },
      (error) => {
        console.warn('Realtime subscription error for actas (offline/reconnecting):', error);
      }
    );
  } catch (error) {
    console.warn('Failed to start actas subscription:', error);
    return () => {};
  }
}

/**
 * Subscribes to Members in real-time.
 */
export function subscribeToMembers(
  callback: (members: Member[]) => void
): () => void {
  try {
    const colRef = collection(db, MEMBERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Member[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Member);
        });
        list.sort((a, b) => a.fullName.localeCompare(b.fullName));
        callback(list);
      },
      (error) => {
        console.warn('Realtime subscription error for members (offline/reconnecting):', error);
      }
    );
  } catch (error) {
    console.warn('Failed to start members subscription:', error);
    return () => {};
  }
}

/**
 * Subscribes to Church Config in real-time.
 */
export function subscribeToChurchConfig(
  callback: (config: ChurchConfig) => void
): () => void {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as ChurchConfig);
        } else {
          callback(DEFAULT_CHURCH_CONFIG);
        }
      },
      (error) => {
        console.warn('Realtime subscription error for config (offline/reconnecting):', error);
      }
    );
  } catch (error) {
    console.warn('Failed to start config subscription:', error);
    return () => {};
  }
}

/**
 * Save or update a Transaction
 */
export async function saveTransaction(tx: Transaction): Promise<void> {
  const path = `${TX_COLLECTION}/${tx.id}`;
  try {
    const docRef = doc(db, TX_COLLECTION, tx.id);
    await setDoc(docRef, tx, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a Transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  const path = `${TX_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, TX_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save or update an Acta de Conteo
 */
export async function saveActaConteo(acta: ActaConteo): Promise<void> {
  const path = `${ACTAS_COLLECTION}/${acta.id}`;
  try {
    const docRef = doc(db, ACTAS_COLLECTION, acta.id);
    await setDoc(docRef, acta, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete an Acta de Conteo
 */
export async function deleteActaConteo(id: string): Promise<void> {
  const path = `${ACTAS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, ACTAS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Reset and clear all transactions, actas and members from Firestore
 */
export async function clearAllTestData(): Promise<void> {
  try {
    const batch = writeBatch(db);
    const txSnap = await getDocs(collection(db, TX_COLLECTION));
    txSnap.forEach((d) => batch.delete(d.ref));
    const actasSnap = await getDocs(collection(db, ACTAS_COLLECTION));
    actasSnap.forEach((d) => batch.delete(d.ref));
    const memSnap = await getDocs(collection(db, MEMBERS_COLLECTION));
    memSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'clearAllTestData');
  }
}

/**
 * Save or update a Member
 */
export async function saveMember(member: Member): Promise<void> {
  const path = `${MEMBERS_COLLECTION}/${member.id}`;
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, member.id);
    await setDoc(docRef, member, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Batch save or update multiple Members (chunks into batches of 400 for Firestore limits)
 */
export async function saveMembersBatch(membersList: Member[]): Promise<void> {
  if (!membersList || membersList.length === 0) return;
  const CHUNK_SIZE = 400;
  for (let i = 0; i < membersList.length; i += CHUNK_SIZE) {
    const chunk = membersList.slice(i, i + CHUNK_SIZE);
    try {
      const batch = writeBatch(db);
      for (const m of chunk) {
        const docRef = doc(db, MEMBERS_COLLECTION, m.id);
        batch.set(docRef, m, { merge: true });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `batch-members-${i}`);
    }
  }
}

/**
 * Delete a Member
 */
export async function deleteMember(id: string): Promise<void> {
  const path = `${MEMBERS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, MEMBERS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Update Church Config
 */
export async function saveChurchConfig(config: ChurchConfig): Promise<void> {
  const path = `${CONFIG_COLLECTION}/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Initializes default credentials in Firestore if missing
 */
export async function initializeUserCredentialsIfEmpty(config: ChurchConfig): Promise<Record<UserRoleId, UserCredential>> {
  const defaults = await generateInitialCredentials(config);
  try {
    const roleIds: UserRoleId[] = ['tesorero', 'auxiliar1', 'auxiliar2', 'pastor'];
    for (const rId of roleIds) {
      const docRef = doc(db, CREDENTIALS_COLLECTION, rId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, defaults[rId]);
      }
    }
  } catch (err) {
    console.warn('Initial user credentials check completed or offline:', err);
  }
  return defaults;
}

/**
 * Subscribes to User Credentials in real-time
 */
export function subscribeToUserCredentials(
  callback: (credentials: Record<UserRoleId, UserCredential>) => void
): () => void {
  try {
    const colRef = collection(db, CREDENTIALS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const credMap: Partial<Record<UserRoleId, UserCredential>> = {};
        snapshot.forEach((d) => {
          const data = d.data() as UserCredential;
          if (data.roleId) {
            credMap[data.roleId] = data;
          }
        });
        if (Object.keys(credMap).length > 0) {
          callback(credMap as Record<UserRoleId, UserCredential>);
        }
      },
      (error) => {
        console.warn('Realtime subscription error for user credentials (offline):', error);
      }
    );
  } catch (error) {
    console.warn('Failed to start user credentials subscription:', error);
    return () => {};
  }
}

/**
 * Save or update a User Credential (e.g. when changing personal password)
 */
export async function saveUserCredential(credential: UserCredential): Promise<void> {
  const path = `${CREDENTIALS_COLLECTION}/${credential.roleId}`;
  try {
    const docRef = doc(db, CREDENTIALS_COLLECTION, credential.roleId);
    await setDoc(docRef, {
      ...credential,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

