/**
 * Major European markets for the language menu.
 * `googleTl` = Google Translate `tl` parameter (ISO 639-1). `null` = site default (English, no translation wrapper).
 * `flagCode` = ISO 3166-1 alpha-2 for `circle-flags:{code}` SVG icons.
 */
export interface EuropeanLocale {
	flagCode: string;
	label: string;
	/** Google Translate target language; null keeps current page without Google wrapper */
	googleTl: string | null;
}

export const europeanLocales: EuropeanLocale[] = [
	{ flagCode: "gb", label: "United Kingdom — English", googleTl: null },
	{ flagCode: "ie", label: "Ireland — English", googleTl: null },
	{ flagCode: "at", label: "Austria — Deutsch", googleTl: "de" },
	{ flagCode: "be", label: "Belgium — Nederlands", googleTl: "nl" },
	{ flagCode: "be", label: "Belgium — Français", googleTl: "fr" },
	{ flagCode: "bg", label: "Bulgaria — Български", googleTl: "bg" },
	{ flagCode: "hr", label: "Croatia — Hrvatski", googleTl: "hr" },
	{ flagCode: "cy", label: "Cyprus — Ελληνικά", googleTl: "el" },
	{ flagCode: "cz", label: "Czechia — Čeština", googleTl: "cs" },
	{ flagCode: "dk", label: "Denmark — Dansk", googleTl: "da" },
	{ flagCode: "ee", label: "Estonia — Eesti", googleTl: "et" },
	{ flagCode: "fi", label: "Finland — Suomi", googleTl: "fi" },
	{ flagCode: "fr", label: "France — Français", googleTl: "fr" },
	{ flagCode: "de", label: "Germany — Deutsch", googleTl: "de" },
	{ flagCode: "gr", label: "Greece — Ελληνικά", googleTl: "el" },
	{ flagCode: "hu", label: "Hungary — Magyar", googleTl: "hu" },
	{ flagCode: "is", label: "Iceland — Íslenska", googleTl: "is" },
	{ flagCode: "it", label: "Italy — Italiano", googleTl: "it" },
	{ flagCode: "lv", label: "Latvia — Latviešu", googleTl: "lv" },
	{ flagCode: "li", label: "Liechtenstein — Deutsch", googleTl: "de" },
	{ flagCode: "lt", label: "Lithuania — Lietuvių", googleTl: "lt" },
	{ flagCode: "lu", label: "Luxembourg — Français", googleTl: "fr" },
	{ flagCode: "mt", label: "Malta — English", googleTl: null },
	{ flagCode: "nl", label: "Netherlands — Nederlands", googleTl: "nl" },
	{ flagCode: "no", label: "Norway — Norsk", googleTl: "no" },
	{ flagCode: "pl", label: "Poland — Polski", googleTl: "pl" },
	{ flagCode: "pt", label: "Portugal — Português", googleTl: "pt" },
	{ flagCode: "ro", label: "Romania — Română", googleTl: "ro" },
	{ flagCode: "sk", label: "Slovakia — Slovenčina", googleTl: "sk" },
	{ flagCode: "si", label: "Slovenia — Slovenščina", googleTl: "sl" },
	{ flagCode: "es", label: "Spain — Español", googleTl: "es" },
	{ flagCode: "se", label: "Sweden — Svenska", googleTl: "sv" },
	{ flagCode: "ch", label: "Switzerland — Deutsch", googleTl: "de" },
	{ flagCode: "ch", label: "Switzerland — Français", googleTl: "fr" },
	{ flagCode: "ch", label: "Switzerland — Italiano", googleTl: "it" },
	{ flagCode: "ua", label: "Ukraine — Українська", googleTl: "uk" },
];
