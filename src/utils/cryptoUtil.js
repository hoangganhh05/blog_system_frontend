/**
 * Web Crypto API AES-256-CBC Encryption Utility
 * Compatible with Spring Boot Java Cipher: AES/CBC/PKCS5Padding
 */

const SECRET_KEY_STR = "BlogVietSecureKey2026AES256Secret"; // 32 bytes (256 bits)
const INIT_VECTOR_STR = "BlogVietInitVec1"; // 16 bytes (128 bits)

let cachedKey = null;

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
  const binary = window.atob(base64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getCryptoKey() {
  if (cachedKey) return cachedKey;
  const keyBytes = new TextEncoder().encode(SECRET_KEY_STR);
  cachedKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
  return cachedKey;
}

/**
 * Encrypt plaintext string into Base64 ciphertext (AES-256-CBC)
 */
export async function encryptData(plainText) {
  if (plainText === null || plainText === undefined) return plainText;
  try {
    const textToEncrypt = typeof plainText === "object" ? JSON.stringify(plainText) : String(plainText);
    const key = await getCryptoKey();
    const ivBytes = new TextEncoder().encode(INIT_VECTOR_STR);
    const encodedData = new TextEncoder().encode(textToEncrypt);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-CBC", iv: ivBytes },
      key,
      encodedData
    );

    return bufferToBase64(encryptedBuffer);
  } catch (err) {
    console.warn("[CRYPTO ERROR] Lỗi mã hóa payload:", err);
    return plainText;
  }
}

/**
 * Decrypt Base64 ciphertext back to plaintext or parsed JSON object
 */
export async function decryptData(cipherText) {
  if (!cipherText || typeof cipherText !== "string") return cipherText;
  try {
    const key = await getCryptoKey();
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
    console.warn("[CRYPTO WARNING] Không thể giải mã chuỗi:", err);
    return cipherText;
  }
}

export default {
  encryptData,
  decryptData,
};
