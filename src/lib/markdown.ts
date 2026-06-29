import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(md: string): string {
	const raw = marked.parse(md, { async: false }) as string;
	return sanitizeHtml(raw, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]),
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			a: ["href", "name", "target", "rel"],
			img: ["src", "alt", "title", "width", "height"],
		},
		allowedSchemes: ["http", "https", "mailto"],
	});
}
