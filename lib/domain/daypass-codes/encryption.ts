import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const algorithm = "aes-256-gcm";
const ivByteLength = 12;
const keyByteLength = 32;

function readKeyVersion() {
  const version = process.env.DAYPASS_CODE_ENCRYPTION_KEY_VERSION ?? "v1";

  if (!version || version.includes(":")) {
    throw new Error("DAYPASS_CODE_ENCRYPTION_KEY_VERSION is invalid.");
  }

  return version;
}

function decodeKey(value: string) {
  const trimmed = value.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  const base64 = Buffer.from(trimmed, "base64");

  if (base64.length === keyByteLength) {
    return base64;
  }

  throw new Error("DAYPASS_CODE_ENCRYPTION_KEY must be a 32-byte key encoded as base64 or 64-character hex.");
}

function getEncryptionKey() {
  const key = process.env.DAYPASS_CODE_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("DAYPASS_CODE_ENCRYPTION_KEY is required before Daypass code fulfilment.");
  }

  const decoded = decodeKey(key);

  if (decoded.length !== keyByteLength) {
    throw new Error("DAYPASS_CODE_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }

  return decoded;
}

export type EncryptedDaypassCode = {
  encryptedCode: string;
  encryptionKeyVersion: string;
};

export function encryptDaypassCode(plainCode: string): EncryptedDaypassCode {
  const key = getEncryptionKey();
  const encryptionKeyVersion = readKeyVersion();
  const iv = randomBytes(ivByteLength);
  const cipher = createCipheriv(algorithm, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainCode, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const encryptedCode = [
    "aes-256-gcm",
    encryptionKeyVersion,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");

  return {
    encryptedCode,
    encryptionKeyVersion,
  };
}

export function decryptDaypassCode(encryptedCode: string) {
  const [encodedAlgorithm, encryptionKeyVersion, encodedIv, encodedAuthTag, encodedCiphertext] = encryptedCode.split(":");

  if (encodedAlgorithm !== algorithm || !encryptionKeyVersion || !encodedIv || !encodedAuthTag || !encodedCiphertext) {
    throw new Error("Encrypted Daypass code payload is invalid.");
  }

  if (encryptionKeyVersion !== readKeyVersion()) {
    throw new Error("Encrypted Daypass code key version is not active.");
  }

  const key = getEncryptionKey();
  const decipher = createDecipheriv(algorithm, key, Buffer.from(encodedIv, "base64url"));
  decipher.setAuthTag(Buffer.from(encodedAuthTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
