import { authenticator } from "otplib";
import bcrypt from "bcrypt";
import QRCode from "qrcode";
import { decryptSecret, encryptSecret } from "../crypto";

authenticator.options = { window: 1 };

export function generateTotpSecret(): string {
	return authenticator.generateSecret();
}

export async function getTotpQrDataUrl(email: string, secret: string): Promise<string> {
	const otpauth = authenticator.keyuri(email, "Monarch Admin", secret);
	return QRCode.toDataURL(otpauth);
}

export function verifyTotpCode(secretPlain: string, code: string): boolean {
	return authenticator.verify({ token: code.replace(/\s/g, ""), secret: secretPlain });
}

export function encryptTotpForStorage(secret: string): string {
	return encryptSecret(secret);
}

export function decryptTotpFromStorage(enc: string): string {
	return decryptSecret(enc);
}

export async function generateBackupCodes(): Promise<{ plain: string[]; hashedJson: string }> {
	const plain = Array.from({ length: 8 }, () =>
		Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
	);
	const hashed = await Promise.all(plain.map((c) => bcrypt.hash(c, 10)));
	return { plain, hashedJson: JSON.stringify(hashed) };
}

export async function consumeBackupCode(hashedJson: string | null, code: string): Promise<{ ok: boolean; nextHash: string | null }> {
	if (!hashedJson) return { ok: false, nextHash: null };
	const hashes: string[] = JSON.parse(hashedJson);
	const normalized = code.trim().toUpperCase();
	for (let i = 0; i < hashes.length; i++) {
		if (await bcrypt.compare(normalized, hashes[i])) {
			hashes.splice(i, 1);
			return { ok: true, nextHash: hashes.length ? JSON.stringify(hashes) : null };
		}
	}
	return { ok: false, nextHash: hashedJson };
}
