import { type Dirent, promises as fs } from "node:fs";
import * as path from "node:path";

export interface TodoComment {
	line: number;
	kind: "TODO" | "FIXME";
	text: string;
}

export interface TodoFileResult {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	comments: TodoComment[];
}

export interface TodoScanResult {
	files: TodoFileResult[];
	total: number;
	/** True when scanning stopped at the comment limit. */
	truncated: boolean;
}

export interface ScanTodoOptions {
	/** Maximum number of comments to collect. Default 500. */
	maxComments?: number;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".cache"]);
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_TEXT_LENGTH = 160;

// A TODO or FIXME marker that follows a comment opener on the same line.
const TODO_PATTERN = /(?:\/\/|\/\*|^\s*\*|#|<!--|--|;)[^\n]*?\b(TODO|FIXME)\b/;

/** Find the TODO/FIXME comment on one line, if any. */
export function matchTodoLine(line: string): { kind: "TODO" | "FIXME"; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	let text = line.trim();
	if (text.length > MAX_TEXT_LENGTH) text = `${text.slice(0, MAX_TEXT_LENGTH - 3)}...`;
	return { kind: match[1] as "TODO" | "FIXME", text };
}

/** Scan a directory tree for TODO and FIXME comments, grouped by file. */
export async function scanTodoComments(root: string, options: ScanTodoOptions = {}): Promise<TodoScanResult> {
	const maxComments = options.maxComments ?? 500;
	const files: TodoFileResult[] = [];
	let total = 0;
	let truncated = false;

	const walk = async (dir: string): Promise<void> => {
		if (truncated) return;
		let entries: Dirent[];
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) await walk(fullPath);
			} else if (entry.isFile()) {
				await scanFile(fullPath);
			}
		}
	};

	const scanFile = async (fullPath: string): Promise<void> => {
		let buffer: Buffer;
		try {
			const stat = await fs.stat(fullPath);
			if (stat.size > MAX_FILE_BYTES) return;
			buffer = await fs.readFile(fullPath);
		} catch {
			return;
		}
		if (buffer.includes(0)) return; // binary
		const comments: TodoComment[] = [];
		const lines = buffer.toString("utf-8").split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const found = matchTodoLine(lines[i]);
			if (!found) continue;
			if (total >= maxComments) {
				truncated = true;
				break;
			}
			comments.push({ line: i + 1, kind: found.kind, text: found.text });
			total++;
		}
		if (comments.length > 0) {
			files.push({ file: path.relative(root, fullPath).split(path.sep).join("/"), comments });
		}
	};

	await walk(root);
	return { files, total, truncated };
}

/** Format scan results as plain text grouped by file. */
export function formatTodoScan(result: TodoScanResult): string {
	if (result.total === 0) return "No TODO or FIXME comments found.";
	const lines: string[] = [];
	for (const file of result.files) {
		lines.push(file.file);
		for (const comment of file.comments) {
			lines.push(`  ${comment.line}: ${comment.text}`);
		}
		lines.push("");
	}
	const fileCount = result.files.length;
	const summary = `${result.total} comment${result.total === 1 ? "" : "s"} in ${fileCount} file${fileCount === 1 ? "" : "s"}`;
	lines.push(result.truncated ? `${summary} (stopped at limit)` : summary);
	return lines.join("\n");
}
