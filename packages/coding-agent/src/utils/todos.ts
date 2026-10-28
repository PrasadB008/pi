import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const TODO_PATTERN = /\b(TODO|FIXME)\b[:(\s-]*(.*)$/;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FILES = 20000;
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".venv", "target"]);

export interface TodoItem {
	/** Path relative to the scanned directory, using forward slashes. */
	file: string;
	line: number;
	kind: "TODO" | "FIXME";
	text: string;
}

/** Find a TODO or FIXME marker in one line of text. */
export function matchTodo(lineText: string): { kind: "TODO" | "FIXME"; text: string } | undefined {
	const match = TODO_PATTERN.exec(lineText);
	if (!match) return undefined;
	return { kind: match[1] as "TODO" | "FIXME", text: match[2].trim() };
}

/** Extract all TODO/FIXME items from file content. Returns nothing for binary content. */
export function extractTodos(file: string, content: string): TodoItem[] {
	if (content.includes("\0")) return [];
	const items: TodoItem[] = [];
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const found = matchTodo(lines[i]);
		if (found) items.push({ file, line: i + 1, ...found });
	}
	return items;
}

async function listWithGit(cwd: string): Promise<string[] | undefined> {
	try {
		const { stdout } = await execFileAsync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
			cwd,
			maxBuffer: 64 * 1024 * 1024,
		});
		return stdout.split("\0").filter((entry) => entry.length > 0);
	} catch {
		return undefined;
	}
}

async function listWithWalk(root: string): Promise<string[]> {
	const files: string[] = [];
	const pending = [""];
	while (pending.length > 0 && files.length < MAX_FILES) {
		const relDir = pending.pop()!;
		let entries;
		try {
			entries = await readdir(path.join(root, relDir), { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) pending.push(rel);
			} else if (entry.isFile()) {
				files.push(rel);
			}
		}
	}
	return files;
}

/**
 * Scan a directory for TODO and FIXME comments. Uses git to respect .gitignore when the
 * directory is in a git repository, otherwise walks the tree skipping common build directories.
 */
export async function findTodos(cwd: string): Promise<TodoItem[]> {
	const files = ((await listWithGit(cwd)) ?? (await listWithWalk(cwd))).slice(0, MAX_FILES);
	const items: TodoItem[] = [];
	for (const file of files.sort()) {
		const absolute = path.join(cwd, file);
		try {
			const info = await stat(absolute);
			if (!info.isFile() || info.size > MAX_FILE_BYTES) continue;
			items.push(...extractTodos(file, await readFile(absolute, "utf8")));
		} catch {
			// Unreadable or removed since listing; skip.
		}
	}
	return items;
}

/** Format TODO items as markdown grouped by file. */
export function formatTodos(items: TodoItem[], limit = 500): string {
	if (items.length === 0) return "No TODO or FIXME comments found.";
	const shown = items.slice(0, limit);
	const lines: string[] = [`${items.length} outstanding item${items.length === 1 ? "" : "s"}`, ""];
	let currentFile: string | undefined;
	for (const item of shown) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(`**${item.file}**`, "");
			currentFile = item.file;
		}
		lines.push(`- \`${item.line}\` ${item.kind}${item.text ? `: ${item.text}` : ""}`);
	}
	if (items.length > shown.length) {
		lines.push("", `... and ${items.length - shown.length} more not shown.`);
	}
	return lines.join("\n");
}
