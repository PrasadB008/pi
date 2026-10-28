import type { Dirent } from "node:fs";
import { open, readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export type TodoKind = "TODO" | "FIXME";

export interface TodoItem {
	line: number;
	kind: TodoKind;
	text: string;
}

export interface TodoFileResult {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	items: TodoItem[];
}

export interface TodoScanResult {
	files: TodoFileResult[];
	/** True when the scan stopped early because a file or item limit was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	/** Maximum file size to read, in bytes. Default 1 MB. */
	maxFileSize?: number;
	/** Maximum number of files to read. Default 5000. */
	maxFiles?: number;
	/** Maximum number of TODO/FIXME items to collect. Default 1000. */
	maxItems?: number;
}

const SKIPPED_DIRECTORIES = new Set([
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
]);

// A comment marker followed (later on the same line) by TODO or FIXME.
const TODO_PATTERN = /(?:\/\/|\/\*|^\s*\*|#|<!--|--|;)[^\n]*?\b(TODO|FIXME)\b[\s:()-]*(.*)$/;

/** Find TODO/FIXME comments in the lines of one file's content. */
export function findTodosInText(content: string): TodoItem[] {
	const items: TodoItem[] = [];
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const match = TODO_PATTERN.exec(lines[i]);
		if (!match) continue;
		const text = match[2].replace(/\s*(\*\/|-->)\s*$/, "").trim();
		items.push({ line: i + 1, kind: match[1] as TodoKind, text });
	}
	return items;
}

async function isBinary(path: string): Promise<boolean> {
	const handle = await open(path, "r");
	try {
		const buffer = Buffer.alloc(512);
		const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
		return buffer.subarray(0, bytesRead).includes(0);
	} finally {
		await handle.close();
	}
}

/**
 * Scan a directory tree for TODO and FIXME comments.
 * Skips VCS/build directories, symlinks, binary files and files over the size limit.
 */
export async function scanTodos(root: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxFileSize = options.maxFileSize ?? 1024 * 1024;
	const maxFiles = options.maxFiles ?? 5000;
	const maxItems = options.maxItems ?? 1000;

	const files: TodoFileResult[] = [];
	let filesRead = 0;
	let itemCount = 0;
	let truncated = false;

	async function walk(dir: string): Promise<void> {
		if (truncated) return;
		let entries: Dirent[];
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!SKIPPED_DIRECTORIES.has(entry.name)) await walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;
			if (filesRead >= maxFiles) {
				truncated = true;
				return;
			}
			try {
				const info = await stat(fullPath);
				if (info.size > maxFileSize || info.size === 0) continue;
				filesRead++;
				if (await isBinary(fullPath)) continue;
				const items = findTodosInText(await readFile(fullPath, "utf8"));
				if (items.length === 0) continue;
				const room = maxItems - itemCount;
				const kept = items.slice(0, room);
				itemCount += kept.length;
				files.push({ file: relative(root, fullPath).split("\\").join("/"), items: kept });
				if (items.length > room) truncated = true;
			} catch {
				// Unreadable file: skip it.
			}
		}
	}

	await walk(root);
	return { files, truncated };
}

/** Format scan results as plain text, grouped by file with line numbers. */
export function formatTodos(result: TodoScanResult): string {
	if (result.files.length === 0) return "No TODO or FIXME comments found.";
	const lines: string[] = [];
	for (const file of result.files) {
		lines.push(file.file);
		for (const item of file.items) {
			lines.push(`  ${item.line}: ${item.kind}${item.text ? ` ${item.text}` : ""}`);
		}
		lines.push("");
	}
	if (result.truncated) lines.push("Results truncated: scan limit reached.");
	return lines.join("\n").trimEnd();
}
