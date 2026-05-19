import "server-only";

import { randomInt } from "crypto";

import { encryptDaypassCode } from "@/lib/domain/daypass-codes/encryption";
import { hashDaypassCode, normalizeDaypassCode } from "@/lib/domain/daypass-codes/hashCode";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codeLength = 20;

export type GeneratedFriendCodeRecord = {
  code_hash: string;
  code_last4: string;
  encrypted_code: string;
  encryption_key_version: string;
};

export type GeneratedFriendCode = {
  plainCode: string;
  record: GeneratedFriendCodeRecord;
};

function randomCodeBody() {
  let value = "";

  for (let index = 0; index < codeLength; index += 1) {
    value += alphabet[randomInt(alphabet.length)];
  }

  return value;
}

function formatCode(body: string) {
  return `MON-${body.match(/.{1,5}/g)?.join("-") ?? body}`;
}

export function generateDaypassCodes(friendCodeCount: number): GeneratedFriendCode[] {
  if (!Number.isInteger(friendCodeCount) || friendCodeCount < 0 || friendCodeCount > 9) {
    throw new Error("Invalid friend Daypass code count.");
  }

  return Array.from({ length: friendCodeCount }, () => {
    const plainCode = formatCode(randomCodeBody());
    const normalizedCode = normalizeDaypassCode(plainCode);
    const encrypted = encryptDaypassCode(normalizedCode);

    return {
      plainCode,
      record: {
        code_hash: hashDaypassCode(normalizedCode),
        code_last4: normalizedCode.slice(-4),
        encrypted_code: encrypted.encryptedCode,
        encryption_key_version: encrypted.encryptionKeyVersion,
      },
    };
  });
}
