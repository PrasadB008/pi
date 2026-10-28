import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** 1-based line number */
	line: number;
	kind: "TODO" | "FIXME";
	text: string;
}

export interface FileTodos {
	/** Path relative to the scanned root, using forward slashes */
	file: string;
	items: TodoItem[];
}

const IGNORED_DIRS = new Set([
	".git",
	".hg",
	".svn",
	"node_modules",
	"dist",
	"build",
	"out",
	"coverage",
	".next",
	".cache",
	".venv",
	"venv",
	"__pycache__",
	"target",
]);

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_TEXT_LENGTH = 200;

// Matches TODO or FIXME as a whole word inside a comment (// # /* * -- ; <!-- %).
const TODO_PATTERN = /(?:\/\/|\/\*|\*|#|--|;|<!--|%)\s*.*?\b(TODO|FIXME)\b[\s:(-]*(.*)$/;

/** Extract a TODO/FIXME item from one line, or undefined if the line has none. */
export function parseTodoLine(lineText: string, lineNumber: number): TodoItem | undefined {
	const match = TODO_PATTERN.exec(lineText);
	if (!match) return undefined;
	let text = match[2].replace(/\*\/\s*$/, "").replace(/-->\s*$/, "").trim();
	if (text.length > MAX_TEXT_LENGTH) text = `${text.slice(0, MAX_TEXT_LENGTH - 3)}...`;
	return { line: lineNumber, kind: match[1] as TodoItem["kind"], text };
}

/** Scan file content and return the TODO/FIXME items it contains. */
export function scanContent(content: string): TodoItem[] {
	const items: TodoItem[] = [];
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const item = parseTodoLine(lines[i], i + 1);
		if (item) items.push(item);
	}
	return items;
}

function collectFiles(dir: string, files: string[]): void {
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (!IGNORED_DIRS.has(entry.name)) collectFiles(full, files);
		} else if (entry.isFile()) {
			files.push(full);
		}
	}
}

/**
 * Find TODO and FIXME comments in text files under root.
 * Skips VCS/dependency/build directories, binary files and files over 1 MB.
 */
export function findTodos(root: string): FileTodos[] {
	const files: string[] = [];
	collectFiles(root, files);
	const results: FileTodos[] = [];
	for (const file of files) {
		let content: string;
		try {
			if (fs.statSync(file).size > MAX_FILE_BYTES) continue;
			const buffer = fs.readFileSync(file);
			if (buffer.includes(0)) continue;
			content = buffer.toString("utf-8");
		} catch {
			continue;
		}
		const items = scanContent(content);
		if (items.length > 0) {
			results.push({ file: path.relative(root, file).split(path.sep).join("/"), items });
		}
	}
	return results;
}

/** Format results grouped by file, one `line: KIND text` row per item. */
export function formatTodos(results: FileTodos[]): string {
	if (results.length === 0) return "No TODO or FIXME comments found.";
	const total = results.reduce((sum, r) => sum + r.items.length, 0);
	const lines: string[] = [`${total} TODO/FIXME comment${total === 1 ? "" : "s"} in ${results.length} file${results.length === 1 ? "" : "s"}`];
	for (const result of results) {
		lines.push("", result.file);
		for (const item of result.items) {
			lines.push(`  ${item.line}: ${item.kind}${item.text ? ` ${item.text}` : ""}`);
		}
	}
	return lines.join("\n");
}
