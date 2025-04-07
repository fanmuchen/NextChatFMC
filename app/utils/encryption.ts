import crypto from "crypto";

/**
 * Generate a random encryption key
 * @returns A random 32-byte key encoded as base64
 */
export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

/**
 * Encrypt data using a simple XOR cipher with the key
 * This is a simplified encryption for demonstration purposes
 * In production, use a more secure encryption method
 * @param data The data to encrypt
 * @param key The encryption key (base64 encoded)
 * @returns The encrypted data as a string
 */
export function encrypt(data: string, key: string): string {
  try {
    // Decode the key from base64
    const keyBytes = Uint8Array.from(atob(key), (c) => c.charCodeAt(0));

    // Convert the data to bytes
    const dataBytes = new TextEncoder().encode(data);

    // XOR each byte with the corresponding key byte
    const encryptedBytes = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encryptedBytes[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert to base64
    return btoa(String.fromCharCode.apply(null, Array.from(encryptedBytes)));
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data using the same XOR cipher
 * @param encryptedData The encrypted data as a base64 string
 * @param key The encryption key (base64 encoded)
 * @returns The decrypted data
 */
export function decrypt(encryptedData: string, key: string): string {
  try {
    // Decode the key from base64
    const keyBytes = Uint8Array.from(atob(key), (c) => c.charCodeAt(0));

    // Decode the encrypted data from base64
    const encryptedBytes = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0),
    );

    // XOR each byte with the corresponding key byte (XOR is its own inverse)
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert back to string
    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}
