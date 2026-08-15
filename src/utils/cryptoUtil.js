/**
 * Robust Web Crypto AES-256-CBC Encryption Utility with Graceful Fallback
 * Compatible with Spring Boot Java Cipher: AES/CBC/PKCS5Padding
 */

const SECRET_KEY_STR = "BlogVietSecureKey2026AES256Secret"; // 32 bytes (256 bits)
const INIT_VECTOR_STR = "BlogVietInitVec1"; // 16 bytes (128 bits)

let cachedKey = null;

function hasSubtleCrypto() {
  return typeof window !== "undefined" && window.crypto && Boolean(window.crypto.subtle);
}

// Helper Base64 encode/decode
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const cleaned = base64.trim().replace(/\s/g, "");
  const binary = window.atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getCryptoKey() {
  if (cachedKey) return cachedKey;
  if (!hasSubtleCrypto()) return null;

  try {
    const keyBytes = new TextEncoder().encode(SECRET_KEY_STR);
    cachedKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
    );
    return cachedKey;
  } catch (e) {
    console.warn("[CRYPTO KEY IMPORT ERROR]", e);
    return null;
  }
}

/**
 * Encrypt plaintext into Base64 ciphertext (AES-256-CBC)
 * Returns { success: boolean, data: string }
 */
export async function encryptData(plainText) {
  if (plainText === null || plainText === undefined) {
    return { success: false, data: plainText };
  }

  if (!hasSubtleCrypto()) {
    // Subtle Crypto not available (e.g. non-https or older mobile webview)
    return { success: false, data: plainText };
  }

  try {
    const key = await getCryptoKey();
    if (!key) return { success: false, data: plainText };

    const textToEncrypt = typeof plainText === "object" ? JSON.stringify(plainText) : String(plainText);
    const ivBytes = new TextEncoder().encode(INIT_VECTOR_STR);
    const encodedData = new TextEncoder().encode(textToEncrypt);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-CBC", iv: ivBytes },
      key,
      encodedData
    );

    const base64 = bufferToBase64(encryptedBuffer);
    return { success: true, data: base64 };
  } catch (err) {
    console.warn("[CRYPTO ENCRYPT ERROR]", err);
    return { success: false, data: plainText };
  }
}

/**
 * Decrypt Base64 ciphertext back to plaintext or parsed JSON object
 */
export async function decryptData(cipherText) {
  if (!cipherText || typeof cipherText !== "string") return cipherText;

  // If text is not Base64-like, return as is
  if (cipherText.trim().startsWith("{") || cipherText.trim().startsWith("[")) {
    try {
      return JSON.parse(cipherText);
    } catch {
      return cipherText;
    }
  }

  if (!hasSubtleCrypto()) {
    return cipherText;
  }

  try {
    const key = await getCryptoKey();
    if (!key) return cipherText;

    const ivBytes = new TextEncoder().encode(INIT_VECTOR_STR);
    const cipherBuffer = base64ToBuffer(cipherText);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-CBC", iv: ivBytes },
      key,
      cipherBuffer
    );

    const decodedString = new TextDecoder().decode(decryptedBuffer);
    try {
      return JSON.parse(decodedString);
    } catch {
      return decodedString;
    }
  } catch (err) {
    console.warn("[CRYPTO DECRYPT WARNING]", err);
    return cipherText;
  }
}

export default {
  encryptData,
  decryptData,
  hasSubtleCrypto,
};
