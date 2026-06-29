import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { requireEnv } from "./env";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
	const raw = requireEnv("TOTP_ENCRYPTION_KEY");
	return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plain: string): string {
	const iv = randomBytes(12);
	const key = getKey();
	const cipher = createCipheriv(ALGO, key, iv);
	const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(payload: string): string {
	const buf = Buffer.from(payload, "base64");
	const iv = buf.subarray(0, 12);
	const tag = buf.subarray(12, 28);
	const data = buf.subarray(28);
	const decipher = createDecipheriv(ALGO, getKey(), iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function randomToken(bytes = 32): string {
	return randomBytes(bytes).toString("base64url");
}
