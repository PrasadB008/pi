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
 * Longest part of a single output line that is kept in memory. Longer lines (for example minified files)
 * are cut; the text is shortened to MAX_TEXT_LENGTH anyway, and the path and line number come first.
 */
const MAX_PENDING_LINE_LENGTH = 64 * 1024;

/**
 * Scan a directory for TODO, FIXME, HACK and XXX markers using ripgrep.
 * Respects .gitignore (also outside a git repository). Output is parsed as it streams and ripgrep is
 * stopped as soon as more than `limit` matches have been seen. Throws if ripgrep is unavailable or fails,
 * or if `signal` is aborted.
 */
export async function scanTodos(
	cwd: string,
	limit: number = DEFAULT_TODO_LIMIT,
	signal?: AbortSignal,
): Promise<TodoScanResult> {
	const rgPath = await ensureTool("rg");
	if (!rgPath) {
		throw new Error("ripgrep (rg) is not available");
	}
	if (signal?.aborted) {
		throw new Error("TODO scan aborted");
	}

	const args = [
		"--no-heading",
		"--line-number",
		"--color=never",
		"--hidden",
		"--no-require-git",
		"--glob",
		"!.git",
		"-e",
		TODO_PATTERN,
		"--sort",
		"path",
		".",
	];

	return new Promise<TodoScanResult>((resolve, reject) => {
		const child = spawn(rgPath, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
		const items: TodoItem[] = [];
		let pending = "";
		let stderr = "";
		let stoppedEarly = false;
		let settled = false;

		const finish = (action: () => void) => {
			if (settled) return;
			settled = true;
			signal?.removeEventListener("abort", onAbort);
			action();
		};
		const onAbort = () => {
			child.kill();
			finish(() => reject(new Error("TODO scan aborted")));
		};
		signal?.addEventListener("abort", onAbort, { once: true });

		const handleLine = (line: string) => {
			if (stoppedEarly) return;
			const item = parseTodoLines(line)[0];
			if (!item) return;
			items.push({ ...item, file: item.file.replace(/^\.[\\/]/, "") });
			if (items.length > limit) {
				stoppedEarly = true;
				child.kill();
			}
		};

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk: string) => {
			if (stoppedEarly) return;
			const lines = (pending + chunk).split("\n");
			pending = lines.pop() ?? "";
			if (pending.length > MAX_PENDING_LINE_LENGTH) pending = pending.slice(0, MAX_PENDING_LINE_LENGTH);
			for (const line of lines) handleLine(line);
		});
		child.stderr.on("data", (chunk: string) => {
			if (stderr.length < MAX_PENDING_LINE_LENGTH) stderr += chunk;
		});
		child.on("error", (error) => finish(() => reject(new Error(`Failed to run ripgrep: ${error.message}`))));
		child.on("close", (code) => {
			if (!stoppedEarly && pending) handleLine(pending);
			finish(() => {
				// Exit code 1 means no matches. A killed child is expected when we stopped early.
				if (stoppedEarly || code === 0 || code === 1) {
					resolve({ items: items.slice(0, limit), truncated: items.length > limit });
				} else {
					reject(new Error(stderr.trim() || `ripgrep exited with code ${code}`));
				}
			});
		});
	});
}
