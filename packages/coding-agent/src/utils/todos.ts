import { spawn } from "child_process";
import { ensureTool } from "./tools-manager.ts";

export interface TodoItem {
	/** Path relative to the scanned directory, using the separators ripgrep reports. */
	file: string;
	line: number;
	/** Marker keyword that matched, e.g. TODO or FIXME. */
	tag: string;
	/** Trimmed source line text. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when more matches existed than `limit`. */
	truncated: boolean;
}

const TODO_PATTERN = "\\b(TODO|FIXME|HACK|XXX)\\b";
const TODO_TAG_REGEX = /\b(TODO|FIXME|HACK|XXX)\b/;
const MAX_TEXT_LENGTH = 200;
export const DEFAULT_TODO_LIMIT = 200;

/**
 * Parse ripgrep `--no-heading --line-number` output (`path:line:text`) into todo items.
 * Lines that do not match the format are ignored.
 */
export function parseTodoLines(output: string): TodoItem[] {
	const items: TodoItem[] = [];
	for (const rawLine of output.split(/\r?\n/)) {
		const match = /^(.+?):(\d+):(.*)$/.exec(rawLine);
		if (!match) continue;
		const text = match[3].trim();
		const tag = TODO_TAG_REGEX.exec(text)?.[1];
		if (!tag) continue;
		items.push({
			file: match[1],
			line: Number.parseInt(match[2], 10),
			tag,
			text: text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH - 3)}...` : text,
		});
	}
	return items;
}

/**
 * Scan a directory for TODO, FIXME, HACK and XXX markers using ripgrep.
 * Respects .gitignore. Throws if ripgrep is unavailable or fails.
 */
export async function scanTodos(cwd: string, limit: number = DEFAULT_TODO_LIMIT): Promise<TodoScanResult> {
	const rgPath = await ensureTool("rg");
	if (!rgPath) {
		throw new Error("ripgrep (rg) is not available");
	}

	const args = [
		"--no-heading",
		"--line-number",
		"--color=never",
		"--hidden",
		"--glob",
		"!.git",
		"--max-columns",
		"1000",
		"-e",
		TODO_PATTERN,
		"--sort",
		"path",
		".",
	];

	const output = await new Promise<string>((resolve, reject) => {
		const child = spawn(rgPath, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
		let stdout = "";
		let stderr = "";
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk: string) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk: string) => {
			stderr += chunk;
		});
		child.on("error", (error) => reject(new Error(`Failed to run ripgrep: ${error.message}`)));
		child.on("close", (code) => {
			// Exit code 1 means no matches.
			if (code === 0 || code === 1) {
				resolve(stdout);
			} else {
				reject(new Error(stderr.trim() || `ripgrep exited with code ${code}`));
			}
		});
	});

	const items = parseTodoLines(output).map((item) => ({ ...item, file: item.file.replace(/^\.[\\/]/, "") }));
	return { items: items.slice(0, limit), truncated: items.length > limit };
}
