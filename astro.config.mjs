// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
	site: process.env.SITE_URL || "https://monarch-dayz.com",
	output: "server",
	adapter: node({ mode: "standalone" }),
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		icon({
			include: {
				lucide: ["*"],
				"simple-icons": ["*"],
				"circle-flags": [
					"gb",
					"ie",
					"at",
					"be",
					"bg",
					"hr",
					"cy",
					"cz",
					"dk",
					"ee",
					"fi",
					"fr",
					"de",
					"gr",
					"hu",
					"is",
					"it",
					"lv",
					"li",
					"lt",
					"lu",
					"mt",
					"nl",
					"no",
					"pl",
					"pt",
					"ro",
					"sk",
					"si",
					"es",
					"se",
					"ch",
					"ua",
				],
			},
		}),
	],
});
