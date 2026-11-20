// Security & Password Management utilities for Ekklesia Church Treasury
import { UserRoleId, UserCredential, ChurchConfig } from '../types/treasury';

export const DEFAULT_INITIAL_PASSWORD = '1234';

// Fixed salt for cryptographic consistency across devices
const SECURITY_SALT = 'ekklesia_iglesia_treasury_salt_v1_2026';

/**
 * Computes a secure SHA-256 hash of the password with salt
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const normalized = plainPassword.trim();
  const textToHash = `${SECURITY_SALT}:${normalized}`;
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Deterministic fallback if Web Crypto is unavailable in non-secure context
  let hash = 0;
  for (let i = 0; i < textToHash.length; i++) {
    const char = textToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `fallback_h_${Math.abs(hash).toString(16)}`;
}

/**
 * Verifies if an entered password matches the stored hash.
 * Also supports direct comparison if initial default password was checked.
 */
export async function verifyPassword(enteredPassword: string, storedHash: string): Promise<boolean> {
  if (!enteredPassword || !storedHash) return false;
  const computedHash = await hashPassword(enteredPassword);
  return computedHash === storedHash;
}

/**
 * Pre-computed default hash for '1234' with the salt
 */
export const DEFAULT_PASSWORD_HASH_PROMISE = hashPassword(DEFAULT_INITIAL_PASSWORD);

/**
 * Generates initial default credentials for all 4 official church roles
 */
export async function generateInitialCredentials(config: ChurchConfig): Promise<Record<UserRoleId, UserCredential>> {
  const defaultHash = await hashPassword(DEFAULT_INITIAL_PASSWORD);
  const now = new Date().toISOString();

  return {
    tesorero: {
      roleId: 'tesorero',
      roleName: 'Tesorero Principal',
      userName: config.tesoreroName || 'Maryuri Heredia',
      passwordHash: defaultHash,
      isDefault: true,
      updatedAt: now,
    },
    auxiliar1: {
      roleId: 'auxiliar1',
      roleName: 'Auxiliar 1',
      userName: config.auxiliar1Name || 'Ahuivi Vazques',
      passwordHash: defaultHash,
      isDefault: true,
      updatedAt: now,
    },
    auxiliar2: {
      roleId: 'auxiliar2',
      roleName: 'Auxiliar 2',
      userName: config.auxiliar2Name || 'Yesica Alfaro',
      passwordHash: defaultHash,
      isDefault: true,
      updatedAt: now,
    },
    pastor: {
      roleId: 'pastor',
      roleName: 'Pastor / Revisor',
      userName: config.pastorName || 'Pr. Ronald Nuñez',
      passwordHash: defaultHash,
      isDefault: true,
      updatedAt: now,
    },
  };
}
