import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import * as path from "node:path";
import { spawnProcess, waitForChildProcess } from "./child-process.ts";

export interface TodoItem {
	/** Path relative to the scanned directory, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	tag: "TODO" | "FIXME";
	/** Text after the tag, trimmed. May be empty. */
	text: string;
}

export interface FindTodosResult {
	items: TodoItem[];
	/** True when scanning stopped at `maxItems`. */
	truncated: boolean;
}

export interface FindTodosOptions {
	maxItems?: number;
	signal?: AbortSignal;
}

const DEFAULT_MAX_ITEMS = 500;
const MAX_FILE_BYTES = 1024 * 1024;
const BINARY_SNIFF_BYTES = 8192;
const SKIPPED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".venv", "__pycache__"]);
const SKIPPED_FILES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lock", "bun.lockb"]);

// A tag only counts when it follows a comment marker, so string literals such as "TODO" are ignored.
const TODO_PATTERN = /(?:\/\/|\/\*|\*|#|--|<!--|;|%)\s*(TODO|FIXME)\b(?:\([^)]*\))?[\s:-]*(.*)$/;

/** Extract a TODO/FIXME comment from one line of text. */
export function parseTodoLine(line: string): { tag: "TODO" | "FIXME"; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\s*(?:\*\/|-->)\s*$/, "").trim();
	return { tag: match[1] as "TODO" | "FIXME", text };
}

/** List files not ignored by git. Returns undefined when `cwd` is not a git work tree or git is unavailable. */
async function listGitFiles(cwd: string): Promise<string[] | undefined> {
	try {
		const child = spawnProcess("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
		});
		const chunks: Buffer[] = [];
		child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
		child.stderr.resume();
		const code = await waitForChildProcess(child);
		if (code !== 0) return undefined;
		return Buffer.concat(chunks)
			.toString("utf8")
			.split("\0")
			.filter((file) => file.length > 0);
	} catch {
		return undefined;
	}
}

async function walkFiles(root: string, dir: string, out: string[], signal?: AbortSignal): Promise<void> {
	if (signal?.aborted) return;
	let entries: Dirent[];
	try {
		entries = await readdir(path.join(root, dir), { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const relative = dir ? `${dir}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			if (!SKIPPED_DIRS.has(entry.name)) await walkFiles(root, relative, out, signal);
		} else if (entry.isFile()) {
			out.push(relative);
		}
	}
}

/**
 * Find TODO and FIXME comments under `cwd`. Uses git to honor .gitignore when possible,
 * otherwise walks the directory tree skipping common dependency and build folders.
 */
export async function findTodos(cwd: string, options: FindTodosOptions = {}): Promise<FindTodosResult> {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const files = (await listGitFiles(cwd)) ?? [];
	if (files.length === 0) await walkFiles(cwd, "", files, options.signal);
	files.sort();

	const items: TodoItem[] = [];
	for (const file of files) {
		if (options.signal?.aborted) break;
		if (SKIPPED_FILES.has(path.basename(file))) continue;
		const fullPath = path.join(cwd, file);
		let content: string;
		try {
			const info = await stat(fullPath);
			if (!info.isFile() || info.size > MAX_FILE_BYTES) continue;
			const buffer = await readFile(fullPath);
			if (buffer.subarray(0, BINARY_SNIFF_BYTES).includes(0)) continue;
			content = buffer.toString("utf8");
		} catch {
			continue;
		}
		if (!content.includes("TODO") && !content.includes("FIXME")) continue;
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const parsed = parseTodoLine(lines[i]);
			if (!parsed) continue;
			if (items.length >= maxItems) return { items, truncated: true };
			items.push({ file: file.split(path.sep).join("/"), line: i + 1, ...parsed });
		}
	}
	return { items, truncated: false };
}
