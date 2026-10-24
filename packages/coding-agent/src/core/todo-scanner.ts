/**
 * Scan a project for outstanding TODO / FIXME comments.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { execCommand } from "./exec.ts";

export interface TodoItem {
	/** Path relative to the scanned directory, with forward slashes */
	file: string;
	/** 1-based line number */
	line: number;
	tag: "TODO" | "FIXME";
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** Number of files whose content was searched */
	filesScanned: number;
}

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_LINE_LENGTH = 2000;
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo"]);

// A comment marker followed by the tag, e.g. "// TODO: x", "# FIXME(a) x", "* TODO x".
const TODO_PATTERN = /(?:\/\/|\/\*|\*|#|--|<!--|;)\s*(TODO|FIXME)\b(?:\([^)]*\))?[:\s]*(.*)$/;

async function listFilesWithGit(cwd: string): Promise<string[] | undefined> {
	const result = await execCommand("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], cwd, {
		timeout: 15000,
	});
	if (result.code !== 0 || result.killed) return undefined;
	return result.stdout.split("\0").filter((p) => p.length > 0);
}

async function listFilesByWalking(cwd: string, dir = ""): Promise<string[]> {
	let entries;
	try {
		entries = await readdir(join(cwd, dir), { withFileTypes: true });
	} catch {
		return [];
	}
	const files: string[] = [];
	for (const entry of entries) {
		const rel = dir ? `${dir}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			if (!IGNORED_DIRS.has(entry.name)) files.push(...(await listFilesByWalking(cwd, rel)));
		} else if (entry.isFile()) {
			files.push(rel);
		}
	}
	return files;
}

/** Extract TODO items from file content. Exported for testing. */
export function findTodosInText(file: string, content: string): TodoItem[] {
	const items: TodoItem[] = [];
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.length > MAX_LINE_LENGTH) continue;
		const match = TODO_PATTERN.exec(line);
		if (!match) continue;
		const text = match[2].replace(/\s*(\*\/|-->)\s*$/, "").trim();
		items.push({ file, line: i + 1, tag: match[1] as TodoItem["tag"], text });
	}
	return items;
}

/**
 * Find TODO/FIXME comments under cwd. Uses git to honor .gitignore when cwd is
 * in a git repository, otherwise walks the tree skipping common build/vendor dirs.
 */
export async function scanTodos(cwd: string): Promise<TodoScanResult> {
	const files = (await listFilesWithGit(cwd)) ?? (await listFilesByWalking(cwd));
	const items: TodoItem[] = [];
	let filesScanned = 0;

	for (const file of files.sort()) {
		let content: string;
		try {
			const path = join(cwd, file);
			const info = await stat(path);
			if (!info.isFile() || info.size > MAX_FILE_BYTES) continue;
			content = await readFile(path, "utf-8");
		} catch {
			continue;
		}
		if (content.includes("\0")) continue;
		filesScanned++;
		items.push(...findTodosInText(file, content));
	}

	return { items, filesScanned };
}
