// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
	// Optional: set to your live origin so language links use a public URL for Google Translate
	// (localhost in `u=` is usually rejected with "Can't translate this page").
	// site: 'https://your-domain.example',
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		icon({
			include: {
				lucide: ['*'],
				'simple-icons': ['*'],
				'circle-flags': [
					'gb',
					'ie',
					'at',
					'be',
					'bg',
					'hr',
					'cy',
					'cz',
					'dk',
					'ee',
					'fi',
					'fr',
					'de',
					'gr',
					'hu',
					'is',
					'it',
					'lv',
					'li',
					'lt',
					'lu',
					'mt',
					'nl',
					'no',
					'pl',
					'pt',
					'ro',
					'sk',
					'si',
					'es',
					'se',
					'ch',
					'ua',
				],
			},
		}),
	],
});
