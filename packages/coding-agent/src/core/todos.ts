import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, with forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker as written, upper-cased (TODO, FIXME, ...). */
	tag: string;
	/** Text after the marker. May be empty. */
	text: string;
}

export interface FindTodosResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface FindTodosOptions {
	maxItems?: number;
	maxFileBytes?: number;
}

const IGNORED_DIRS = new Set([
	".git",
	"node_modules",
	"dist",
	"build",
	"out",
	"coverage",
	".next",
	".turbo",
	".cache",
	"target",
	"vendor",
	"__pycache__",
]);

const IGNORED_FILES = new Set([
	"package-lock.json",
	"yarn.lock",
	"pnpm-lock.yaml",
	"CHANGELOG.md",
]);

// A marker only counts when preceded by a comment-like prefix (//, #, /*, *, --, <!--, ;, %)
// so that identifiers like `findTodos` or prose like "a todo list" do not match.
const TODO_PATTERN = /(?:\/\/|\/\*|\*|#|--|<!--|;|%)\s*(TODO|FIXME|HACK|XXX)\b[\s:(\-]*(.*)$/i;

const DEFAULT_MAX_ITEMS = 500;
const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;

export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\*\/\s*$/, "").replace(/-->\s*$/, "").trim();
	return { tag: match[1].toUpperCase(), text };
}

/** Find TODO-style comments under root, skipping dependency, build and hidden-VCS directories. */
export function findTodos(root: string, options: FindTodosOptions = {}): FindTodosResult {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
	const items: TodoItem[] = [];
	let truncated = false;

	const walk = (dir: string): void => {
		if (truncated) return;
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(full);
			} else if (entry.isFile() && !IGNORED_FILES.has(entry.name)) {
				scanFile(full);
			}
		}
	};

	const scanFile = (file: string): void => {
		let content: string;
		try {
			if (fs.statSync(file).size > maxFileBytes) return;
			const buffer = fs.readFileSync(file);
			if (buffer.includes(0)) return; // binary
			content = buffer.toString("utf-8");
		} catch {
			return;
		}
		const relative = path.relative(root, file).split(path.sep).join("/");
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const parsed = parseTodoLine(lines[i]);
			if (!parsed) continue;
			if (items.length >= maxItems) {
				truncated = true;
				return;
			}
			items.push({ file: relative, line: i + 1, ...parsed });
		}
	};

	walk(root);
	return { items, truncated };
}

/** Format todos as Markdown grouped by file. */
export function formatTodosMarkdown(result: FindTodosResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const list = byFile.get(item.file);
		if (list) list.push(item);
		else byFile.set(item.file, [item]);
	}
	const sections: string[] = [];
	for (const [file, list] of byFile) {
		const rows = list.map((i) => `- \`${i.line}\` **${i.tag}** ${i.text}`.trimEnd());
		sections.push(`**${file}**\n\n${rows.join("\n")}`);
	}
	const summary = `${result.items.length} item${result.items.length === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}${result.truncated ? " (list truncated)" : ""}`;
	return `${summary}\n\n${sections.join("\n\n")}`;
}
