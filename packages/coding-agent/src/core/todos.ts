import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned directory, with forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker as written in the source, upper-cased (TODO or FIXME). */
	tag: string;
	/** Text after the marker. May be empty. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped early because a limit was hit. */
	truncated: boolean;
}

const MAX_FILES = 20000;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_ITEMS = 500;
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo"]);

// Marker must be a whole word followed by ":", "(", whitespace or end of line, so identifiers
// such as `todoList` or `TODOS_PATH` do not match.
const TODO_PATTERN = /\b(TODO|FIXME)\b(?:\([^)]*\))?[:\s]*(.*)$/;

/** Extract TODO/FIXME markers from the text of one file. */
export function findTodosInText(file: string, content: string): TodoItem[] {
	const items: TodoItem[] = [];
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const match = TODO_PATTERN.exec(lines[i]);
		if (!match) continue;
		items.push({
			file,
			line: i + 1,
			tag: match[1],
			text: match[2].replace(/\s*(\*\/|-->)\s*$/, "").trim(),
		});
	}
	return items;
}

function listWithGit(cwd: string): Promise<string[] | undefined> {
	return new Promise((resolve) => {
		execFile(
			"git",
			["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
			{ cwd, maxBuffer: 64 * 1024 * 1024 },
			(error, stdout) => {
				if (error) {
					resolve(undefined);
					return;
				}
				resolve(stdout.split("\0").filter((entry) => entry.length > 0));
			},
		);
	});
}

function listWithWalk(cwd: string): string[] {
	const files: string[] = [];
	const stack = [""];
	while (stack.length > 0 && files.length < MAX_FILES) {
		const rel = stack.pop() as string;
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(path.join(cwd, rel), { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			const childRel = rel ? `${rel}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) stack.push(childRel);
			} else if (entry.isFile()) {
				files.push(childRel);
			}
		}
	}
	return files;
}

/**
 * Scan a directory for TODO and FIXME comments. Uses `git ls-files` (tracked plus untracked,
 * excluding gitignored files) when cwd is in a git repository, otherwise walks the directory
 * and skips common build and dependency folders. Binary and very large files are skipped.
 */
export async function scanTodos(cwd: string): Promise<TodoScanResult> {
	const gitFiles = await listWithGit(cwd);
	let files = gitFiles ?? listWithWalk(cwd);
	let truncated = false;
	if (files.length > MAX_FILES) {
		files = files.slice(0, MAX_FILES);
		truncated = true;
	}
	files.sort();

	const items: TodoItem[] = [];
	for (const file of files) {
		const fullPath = path.join(cwd, file);
		let content: string;
		try {
			const stat = fs.statSync(fullPath);
			if (!stat.isFile() || stat.size > MAX_FILE_BYTES) continue;
			const buffer = fs.readFileSync(fullPath);
			if (buffer.includes(0)) continue;
			content = buffer.toString("utf-8");
		} catch {
			continue;
		}
		for (const item of findTodosInText(file, content)) {
			if (items.length >= MAX_ITEMS) return { items, truncated: true };
			items.push(item);
		}
	}
	return { items, truncated };
}

/** Format scan results as Markdown, grouped by file. */
export function formatTodosMarkdown(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const group = byFile.get(item.file);
		if (group) group.push(item);
		else byFile.set(item.file, [item]);
	}
	const sections: string[] = [];
	for (const [file, items] of byFile) {
		const lines = items.map((item) => `- \`${item.line}\` **${item.tag}** ${item.text}`.trimEnd());
		sections.push(`**${file}**\n\n${lines.join("\n")}`);
	}
	const count = result.items.length;
	const summary = `${count}${result.truncated ? "+" : ""} outstanding in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`;
	const footer = result.truncated ? "\n\nResults truncated; narrow the search by working in a subdirectory." : "";
	return `${summary}\n\n${sections.join("\n\n")}${footer}`;
}
