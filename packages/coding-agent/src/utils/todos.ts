import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const MAX_FILE_BYTES = 1024 * 1024;
const READ_BATCH_SIZE = 32;

export interface TodoItem {
	/** Path relative to the scanned directory, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Text after the TODO marker, may be empty. */
	text: string;
}

// A TODO marker that follows a comment opener (//, /*, *, #, --, <!--, ;), e.g. "// TODO(me): fix".
const TODO_PATTERN = /(?:\/\/|\/\*|\*|#|--|<!--|;)\s*TODO\b(?:\([^)]*\))?[:\s-]*(.*)$/;

/** Extract TODO comments from file content. */
export function parseTodos(content: string, file: string): TodoItem[] {
	const items: TodoItem[] = [];
	const lines = content.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const match = TODO_PATTERN.exec(lines[i] ?? "");
		if (!match) continue;
		const text = (match[1] ?? "").replace(/\s*(\*\/|-->)\s*$/, "").trim();
		items.push({ file, line: i + 1, text });
	}
	return items;
}

/**
 * Find TODO comments in the files of the git repository containing cwd
 * (tracked and untracked, respecting .gitignore).
 * Throws if cwd is not inside a git repository.
 */
export async function findTodos(cwd: string): Promise<TodoItem[]> {
	const { stdout } = await execFileAsync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
		cwd,
		maxBuffer: 64 * 1024 * 1024,
	});
	const files = [...new Set(stdout.split("\0").filter((f) => f.length > 0))];
	const items: TodoItem[] = [];

	for (let i = 0; i < files.length; i += READ_BATCH_SIZE) {
		const batch = files.slice(i, i + READ_BATCH_SIZE);
		const results = await Promise.all(
			batch.map(async (file): Promise<TodoItem[]> => {
				try {
					const fullPath = path.join(cwd, file);
					const stat = await fs.promises.stat(fullPath);
					if (!stat.isFile() || stat.size > MAX_FILE_BYTES) return [];
					const content = await fs.promises.readFile(fullPath, "utf-8");
					if (content.includes("\0")) return [];
					return parseTodos(content, file.split(path.sep).join("/"));
				} catch {
					return [];
				}
			}),
		);
		for (const result of results) items.push(...result);
	}
	return items;
}
