// Data encryption utilities for sensitive user data
// Note: This is client-side encryption for additional security layer
// Server-side encryption should also be implemented

export class DataEncryption {
  private static instance: DataEncryption;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {}

  static getInstance(): DataEncryption {
    if (!DataEncryption.instance) {
      DataEncryption.instance = new DataEncryption();
    }
    return DataEncryption.instance;
  }

  // Generate encryption key from user password (in production, use proper key derivation)
  async generateKey(password: string): Promise<void> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('NeuroLiftSalt'), // In production, use unique salt per user
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt sensitive data
  async encryptData(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  }

  // Decrypt sensitive data
  async decryptData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.encryptionKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt data. Invalid key or corrupted data.');
    }
  }

  // Check if encryption is supported
  isSupported(): boolean {
    return typeof crypto !== 'undefined' &&
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.subtle.encrypt === 'function';
  }

  // Clear encryption key (for logout)
  clearKey(): void {
    this.encryptionKey = null;
  }

  // Generate secure random string for additional entropy
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const dataEncryption = DataEncryption.getInstance();