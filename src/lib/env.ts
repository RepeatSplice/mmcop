export function isProduction(): boolean {
	return import.meta.env.PROD;
}

export function requireEnv(name: string): string {
	const value = import.meta.env[name];
	if (!value || typeof value !== "string") {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

export function getSiteUrl(): string {
	return process.env.SITE_URL || import.meta.env.SITE_URL || "https://monarch-dayz.com";
}

/** Hostname (no protocol/path) for the admin subdomain, e.g. "admin.monarch-dayz.com". */
export function getAdminHost(): string {
	// process.env is read at runtime; import.meta.env is baked at build time
	return process.env.ADMIN_HOST || import.meta.env.ADMIN_HOST || "";
}

export function hasAdminHost(): boolean {
	return Boolean(getAdminHost().trim());
}

export function getEmailFrom(): string {
	return import.meta.env.EMAIL_FROM || "enquiries@monarch-dayz.com";
}

export function getContactNotifyEmail(): string {
	return import.meta.env.CONTACT_NOTIFY_EMAIL || "careers@monarch-modding.com";
}

export function hasResendApiKey(): boolean {
	return Boolean(import.meta.env.RESEND_API_KEY?.trim());
}

// Steam OAuth
export function getSteamApiKey(): string {
	return requireEnv("STEAM_API_KEY");
}

// Discord OAuth
export function getDiscordClientId(): string {
	return requireEnv("DISCORD_CLIENT_ID");
}

export function getDiscordClientSecret(): string {
	return requireEnv("DISCORD_CLIENT_SECRET");
}

export function getDiscordRedirectUri(): string {
	return import.meta.env.DISCORD_REDIRECT_URI || "http://localhost:4321/api/auth/discord/callback";
}

// Stripe
export function getStripeSecretKey(): string {
	return requireEnv("STRIPE_SECRET_KEY");
}

export function getStripePublishableKey(): string {
	return requireEnv("STRIPE_PUBLISHABLE_KEY");
}

export function getStripeWebhookSecret(): string {
	return requireEnv("STRIPE_WEBHOOK_SECRET");
}

// Cloudflare R2
export function hasR2(): boolean {
	return Boolean(
		import.meta.env.R2_ACCOUNT_ID?.trim() &&
		import.meta.env.R2_ACCESS_KEY_ID?.trim() &&
		import.meta.env.R2_SECRET_ACCESS_KEY?.trim() &&
		import.meta.env.R2_BUCKET?.trim(),
	);
}

export function getR2AccountId(): string {
	return requireEnv("R2_ACCOUNT_ID");
}

export function getR2AccessKeyId(): string {
	return requireEnv("R2_ACCESS_KEY_ID");
}

export function getR2SecretAccessKey(): string {
	return requireEnv("R2_SECRET_ACCESS_KEY");
}

export function getR2Bucket(): string {
	return requireEnv("R2_BUCKET");
}

// Support stack — all optional; widgets are silently omitted when not set
export function getChatwootBaseUrl(): string {
	return import.meta.env.CHATWOOT_BASE_URL || "";
}

export function getChatwootWidgetToken(): string {
	return import.meta.env.CHATWOOT_WIDGET_TOKEN || "";
}

export function getElevenLabsAgentId(): string {
	return import.meta.env.ELEVENLABS_AGENT_ID || "";
}

// Algolia search — all optional; search falls back to in-process if not set
export function getAlgoliaAppId(): string {
	return import.meta.env.ALGOLIA_APP_ID || "";
}

export function getAlgoliaSearchKey(): string {
	return import.meta.env.ALGOLIA_SEARCH_KEY || "";
}

export function getAlgoliaAdminKey(): string {
	return import.meta.env.ALGOLIA_ADMIN_KEY || "";
}

export function hasAlgolia(): boolean {
	return Boolean(import.meta.env.ALGOLIA_APP_ID?.trim() && import.meta.env.ALGOLIA_SEARCH_KEY?.trim());
}

// Cloudflare Turnstile (contact form bot protection)
export function getTurnstileSiteKey(): string {
	return import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "";
}

export function getTurnstileSecretKey(): string {
	return import.meta.env.TURNSTILE_SECRET_KEY || "";
}

export function hasTurnstile(): boolean {
	return Boolean(getTurnstileSiteKey().trim() && getTurnstileSecretKey().trim());
}

