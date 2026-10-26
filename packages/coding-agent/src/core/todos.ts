import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned directory, with forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, upper-cased (TODO or FIXME). */
	tag: "TODO" | "FIXME";
	/** Text following the marker, trimmed. May be empty. */
	text: string;
}

export interface FindTodosResult {
	items: TodoItem[];
	/** True when more matches existed than `maxItems`. */
	truncated: boolean;
}

const TODO_PATTERN = /\b(TODO|FIXME)\b\s*(?:\([^)]*\))?\s*:?\s*(.*)$/;
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".next", ".turbo"]);
const MAX_FILE_BYTES = 1024 * 1024;
const DEFAULT_MAX_ITEMS = 500;

/** List candidate files: tracked and untracked-but-not-ignored when in a git repo, otherwise a directory walk. */
function listFiles(cwd: string): string[] {
	try {
		const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
			cwd,
			encoding: "utf8",
			maxBuffer: 64 * 1024 * 1024,
			stdio: ["ignore", "pipe", "ignore"],
		});
		return out.split("\0").filter((file) => file.length > 0);
	} catch {
		return walk(cwd, "");
	}
}

function walk(root: string, relDir: string): string[] {
	const files: string[] = [];
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(path.join(root, relDir), { withFileTypes: true });
	} catch {
		return files;
	}
	for (const entry of entries) {
		const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			if (!IGNORED_DIRS.has(entry.name)) files.push(...walk(root, rel));
		} else if (entry.isFile()) {
			files.push(rel);
		}
	}
	return files;
}

/** Find TODO and FIXME comments under `cwd`. Binary and very large files are skipped. */
export function findTodos(cwd: string, maxItems: number = DEFAULT_MAX_ITEMS): FindTodosResult {
	const items: TodoItem[] = [];
	const files = listFiles(cwd).sort();

	for (const file of files) {
		const fullPath = path.join(cwd, file);
		let content: string;
		try {
			const stat = fs.statSync(fullPath);
			if (!stat.isFile() || stat.size > MAX_FILE_BYTES) continue;
			const buffer = fs.readFileSync(fullPath);
			if (buffer.subarray(0, 8000).includes(0)) continue;
			content = buffer.toString("utf8");
		} catch {
			continue;
		}

		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const match = TODO_PATTERN.exec(lines[i]);
			if (!match) continue;
			if (items.length >= maxItems) return { items, truncated: true };
			items.push({
				file: file.split(path.sep).join("/"),
				line: i + 1,
				tag: match[1] as TodoItem["tag"],
				text: match[2].trim(),
			});
		}
	}

	return { items, truncated: false };
}

/** Format todos as Markdown grouped by file. */
export function formatTodosMarkdown(result: FindTodosResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";

	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const list = byFile.get(item.file);
		if (list) list.push(item);
		else byFile.set(item.file, [item]);
	}

	const sections: string[] = [];
	for (const [file, list] of byFile) {
		const rows = list.map((item) => `- \`${item.line}\` **${item.tag}** ${item.text}`.trimEnd());
		sections.push(`### ${file}\n\n${rows.join("\n")}`);
	}

	const summary = `${result.items.length} outstanding item${result.items.length === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}${result.truncated ? " (results truncated)" : ""}`;
	return `${summary}\n\n${sections.join("\n\n")}`;
}
