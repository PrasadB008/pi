import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, upper case (TODO or FIXME). */
	tag: string;
	/** Text after the marker. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when more matches exist than maxItems. */
	truncated: boolean;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo"]);
const MAX_FILE_BYTES = 512 * 1024;
const MAX_LINE_CHARS = 1000;
const MAX_TEXT_CHARS = 200;
const DEFAULT_MAX_ITEMS = 200;
const TODO_PATTERN = /\b(TODO|FIXME)\b:?\s*(.*)$/;

const SLASH_COMMENT = /\/\/|\/\*|^\s*\*/;
const HASH_COMMENT = /(?:^|\s)#/;
const DASH_COMMENT = /(?:^|\s)--(?:\s|$)/;
const HTML_COMMENT = /<!--/;

const COMMENT_STYLES_BY_EXTENSION: Record<string, RegExp[]> = {};
const COMMENT_STYLES_BY_NAME: Record<string, RegExp[]> = { Dockerfile: [HASH_COMMENT], Makefile: [HASH_COMMENT] };

function register(extensions: string[], styles: RegExp[]): void {
	for (const extension of extensions) COMMENT_STYLES_BY_EXTENSION[extension] = styles;
}

register(
	[".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".java", ".c", ".h", ".cc", ".cpp", ".hpp", ".cs"],
	[SLASH_COMMENT],
);
register([".go", ".rs", ".swift", ".kt", ".scala", ".dart", ".css", ".scss", ".less"], [SLASH_COMMENT]);
register([".php"], [SLASH_COMMENT, HASH_COMMENT]);
register([".vue", ".svelte"], [SLASH_COMMENT, HTML_COMMENT]);
register([".html", ".htm", ".xml", ".md", ".mdx"], [HTML_COMMENT]);
register([".py", ".rb", ".sh", ".bash", ".zsh", ".fish", ".yml", ".yaml", ".toml", ".pl", ".r", ".ex", ".exs"], [
	HASH_COMMENT,
]);
register([".sql", ".lua", ".hs"], [DASH_COMMENT]);

/** Compare strings by UTF-16 code units so ordering does not depend on the user's locale. */
function compareNames(a: string, b: string): number {
	if (a < b) return -1;
	return a > b ? 1 : 0;
}

/**
 * Scan a directory tree for TODO and FIXME markers inside comments.
 * Comment syntax is chosen by file extension; unknown file types are skipped.
 * Skips common build/vendor directories, symbolic links, large files and binary files.
 * Stops after maxItems matches and reports whether more exist.
 */
export async function findTodos(root: string, maxItems = DEFAULT_MAX_ITEMS): Promise<TodoScanResult> {
	const items: TodoItem[] = [];
	let truncated = false;

	const walk = async (dir: string): Promise<void> => {
		if (truncated) return;
		let entries: { name: string; isDirectory: boolean; isFile: boolean }[];
		try {
			const dirents = await readdir(dir, { withFileTypes: true });
			entries = dirents.map((entry) => ({
				name: entry.name,
				isDirectory: entry.isDirectory(),
				isFile: entry.isFile(),
			}));
		} catch {
			return;
		}
		entries.sort((a, b) => compareNames(a.name, b.name));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory) {
				if (!IGNORED_DIRS.has(entry.name)) await walk(fullPath);
			} else if (entry.isFile) {
				await scanFile(fullPath);
			}
		}
	};

	const scanFile = async (path: string): Promise<void> => {
		const styles = COMMENT_STYLES_BY_EXTENSION[extname(path).toLowerCase()] ?? COMMENT_STYLES_BY_NAME[basename(path)];
		if (!styles) return;
		let content: string;
		try {
			if ((await stat(path)).size > MAX_FILE_BYTES) return;
			content = await readFile(path, "utf-8");
		} catch {
			return;
		}
		if (content.includes("\0")) return;
		const file = relative(root, path).split("\\").join("/");
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			// Cap the scanned length so minified files stay cheap.
			const line = lines[i].length > MAX_LINE_CHARS ? lines[i].slice(0, MAX_LINE_CHARS) : lines[i];
			const commentStart = findCommentStart(line, styles);
			if (commentStart === -1) continue;
			const match = TODO_PATTERN.exec(line.slice(commentStart));
			if (!match) continue;
			if (items.length >= maxItems) {
				truncated = true;
				return;
			}
			items.push({
				file,
				line: i + 1,
				tag: match[1],
				text: match[2]
					.replace(/\*\/\s*$|-->\s*$/, "")
					.trim()
					.slice(0, MAX_TEXT_CHARS),
			});
		}
	};

	await walk(root);
	return { items, truncated };
}

/** Index of the first comment marker matching any of the given styles, or -1. */
function findCommentStart(line: string, styles: RegExp[]): number {
	let best = -1;
	for (const style of styles) {
		const match = style.exec(line);
		if (match && (best === -1 || match.index < best)) best = match.index;
	}
	return best;
}

/** Backslash-escape Markdown syntax and HTML-significant characters. */
function escapeMarkdown(value: string): string {
	return value.replace(/[\\`*_{}[\]()<>#+\-!|~&]/g, "\\$&");
}

/** Format todo items as Markdown grouped by file. */
export function formatTodos(result: TodoScanResult, maxItems = DEFAULT_MAX_ITEMS): string {
	const { items, truncated } = result;
	if (items.length === 0) return "No TODO or FIXME comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of items) {
		const list = byFile.get(item.file);
		if (list) list.push(item);
		else byFile.set(item.file, [item]);
	}
	const sections: string[] = [];
	for (const [file, list] of byFile) {
		const rows = list.map((item) => `- L${item.line} **${item.tag}** ${escapeMarkdown(item.text)}`.trimEnd());
		sections.push(`**${escapeMarkdown(file)}**\n${rows.join("\n")}`);
	}
	const summary = `${items.length} item${items.length === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`;
	const notice = truncated ? ` (limited to the first ${maxItems})` : "";
	return `${summary}${notice}\n\n${sections.join("\n\n")}`;
}
