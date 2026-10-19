import { execFile } from "node:child_process";
import { type Dirent, promises as fsp } from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TodoItem {
	/** Path relative to the scanned directory, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Trimmed source line containing the TODO comment. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped because `maxResults` was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	maxResults?: number;
	maxFileBytes?: number;
}

const DEFAULT_MAX_RESULTS = 200;
const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;
const MAX_TEXT_LENGTH = 160;
const SKIPPED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "coverage"]);

// A TODO counts only when it follows a comment marker on the same line.
const TODO_COMMENT = /(?:\/\/|\/\*|<!--|#|--|;|^\s*\*)[^\n]*?\bTODO\b/;

/** Returns the trimmed line when it holds a TODO comment, otherwise undefined. */
export function matchTodoLine(line: string): string | undefined {
	if (!TODO_COMMENT.test(line)) return undefined;
	const trimmed = line.trim();
	return trimmed.length > MAX_TEXT_LENGTH ? `${trimmed.slice(0, MAX_TEXT_LENGTH - 3)}...` : trimmed;
}

async function listWithGit(cwd: string): Promise<string[] | undefined> {
	try {
		const { stdout } = await execFileAsync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
			cwd,
			maxBuffer: 64 * 1024 * 1024,
		});
		return stdout.split("\0").filter((file) => file.length > 0);
	} catch {
		return undefined;
	}
}

async function listWithWalk(root: string): Promise<string[]> {
	const files: string[] = [];
	const walk = async (dir: string): Promise<void> => {
		let entries: Dirent[];
		try {
			entries = await fsp.readdir(path.join(root, dir), { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const relative = dir ? `${dir}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				if (!SKIPPED_DIRECTORIES.has(entry.name)) await walk(relative);
			} else if (entry.isFile()) {
				files.push(relative);
			}
		}
	};
	await walk("");
	return files;
}

/** Lists TODO comments under `cwd`, honoring .gitignore when `cwd` is inside a git repository. */
export async function scanTodos(cwd: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
	const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
	const files = ((await listWithGit(cwd)) ?? (await listWithWalk(cwd))).sort();
	const items: TodoItem[] = [];

	for (const file of files) {
		const absolute = path.join(cwd, file);
		let content: string;
		try {
			const stat = await fsp.stat(absolute);
			if (!stat.isFile() || stat.size > maxFileBytes) continue;
			content = await fsp.readFile(absolute, "utf8");
		} catch {
			continue;
		}
		if (content.includes("\0")) continue;

		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const text = matchTodoLine(lines[i]);
			if (text === undefined) continue;
			if (items.length >= maxResults) return { items, truncated: true };
			items.push({ file: file.split(path.sep).join("/"), line: i + 1, text });
		}
	}
	return { items, truncated: false };
}

/** Formats scan results as plain text grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const lines: string[] = [`Found ${result.items.length}${result.truncated ? "+" : ""} TODO comment(s):`];
	let currentFile: string | undefined;
	for (const item of result.items) {
		if (item.file !== currentFile) {
			currentFile = item.file;
			lines.push("", item.file);
		}
		lines.push(`  ${item.line}: ${item.text}`);
	}
	if (result.truncated) lines.push("", "Results truncated.");
	return lines.join("\n");
}
