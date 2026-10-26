import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TodoItem {
	/** Path relative to the scanned directory, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker keyword as written, upper-cased (TODO, FIXME, ...). */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	maxItems?: number;
	maxFileSize?: number;
}

const DEFAULT_MAX_ITEMS = 500;
const DEFAULT_MAX_FILE_SIZE = 512 * 1024;
const MAX_TEXT_LENGTH = 200;
const SKIPPED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache"]);

// A marker counts only as a whole word in upper case, followed by ":", "(", whitespace or end of line.
const TODO_PATTERN = /\b(TODO|FIXME|XXX|HACK)\b(?:\([^)]*\))?:?[ \t]*(.*)$/;

/** Extract a todo marker from one line of text, or undefined if there is none. */
export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	let text = match[2].trim();
	// Drop a trailing block-comment terminator.
	text = text.replace(/\s*(\*\/|-->)\s*$/, "").trim();
	if (text.length > MAX_TEXT_LENGTH) text = `${text.slice(0, MAX_TEXT_LENGTH - 3)}...`;
	return { tag: match[1], text };
}

async function listFilesWithGit(cwd: string): Promise<string[] | undefined> {
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

function listFilesByWalking(cwd: string): string[] {
	const files: string[] = [];
	const walk = (relativeDir: string): void => {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(path.join(cwd, relativeDir), { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				if (!SKIPPED_DIRECTORIES.has(entry.name)) walk(relative);
			} else if (entry.isFile()) {
				files.push(relative);
			}
		}
	};
	walk("");
	return files;
}

/**
 * Find TODO/FIXME/XXX/HACK comments in the files under cwd.
 * Uses git to respect .gitignore when cwd is in a repository, otherwise walks the directory tree.
 * Binary and oversized files are skipped.
 */
export async function scanTodos(cwd: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
	const files = ((await listFilesWithGit(cwd)) ?? listFilesByWalking(cwd)).sort();
	const items: TodoItem[] = [];

	for (const file of files) {
		const fullPath = path.join(cwd, file);
		let content: string;
		try {
			const stat = fs.statSync(fullPath);
			if (!stat.isFile() || stat.size > maxFileSize) continue;
			const buffer = fs.readFileSync(fullPath);
			if (buffer.includes(0)) continue;
			content = buffer.toString("utf-8");
		} catch {
			continue;
		}
		if (!content.includes("TODO") && !content.includes("FIXME") && !content.includes("XXX") && !content.includes("HACK")) {
			continue;
		}
		const lines = content.split(/\r?\n/);
		for (let index = 0; index < lines.length; index++) {
			const parsed = parseTodoLine(lines[index]);
			if (!parsed) continue;
			if (items.length >= maxItems) return { items, truncated: true };
			items.push({ file: file.split(path.sep).join("/"), line: index + 1, ...parsed });
		}
	}
	return { items, truncated: false };
}
