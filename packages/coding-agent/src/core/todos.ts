import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { ensureTool } from "../utils/tools-manager.ts";

export const TODO_PATTERN = "\\b(TODO|FIXME)\\b";
export const DEFAULT_TODO_LIMIT = 200;
const MAX_TODO_TEXT_LENGTH = 200;

export interface TodoItem {
	/** Path relative to the searched directory, with forward slashes. */
	file: string;
	line: number;
	kind: "TODO" | "FIXME";
	/** The matching source line, trimmed and shortened. */
	text: string;
}

export interface TodoSearchResult {
	items: TodoItem[];
	/** True when more matches existed than the limit allowed. */
	limitReached: boolean;
}

/**
 * Parse one line of `rg --json` output into a TodoItem.
 * Returns undefined for non-match events and malformed lines.
 */
export function parseRipgrepTodoLine(jsonLine: string, cwd: string): TodoItem | undefined {
	let event: unknown;
	try {
		event = JSON.parse(jsonLine);
	} catch {
		return undefined;
	}
	if (typeof event !== "object" || event === null) return undefined;
	const { type, data } = event as { type?: unknown; data?: unknown };
	if (type !== "match" || typeof data !== "object" || data === null) return undefined;
	const {
		path: pathField,
		line_number: lineNumber,
		lines,
	} = data as {
		path?: { text?: unknown };
		line_number?: unknown;
		lines?: { text?: unknown };
	};
	if (typeof pathField?.text !== "string" || typeof lineNumber !== "number" || typeof lines?.text !== "string") {
		return undefined;
	}

	const normalizedCwd = cwd.replace(/\\/g, "/").replace(/\/+$/, "");
	let file = pathField.text.replace(/\\/g, "/");
	if (file.startsWith(`${normalizedCwd}/`)) file = file.slice(normalizedCwd.length + 1);
	else if (file.startsWith("./")) file = file.slice(2);

	let text = lines.text.replace(/[\r\n]+$/, "").trim();
	const kind = /\bFIXME\b/.test(text) && !/\bTODO\b/.test(text) ? "FIXME" : "TODO";
	if (text.length > MAX_TODO_TEXT_LENGTH) text = `${text.slice(0, MAX_TODO_TEXT_LENGTH)}...`;
	return { file, line: lineNumber, kind, text };
}

/**
 * Find TODO and FIXME comments under cwd using ripgrep (respects .gitignore).
 */
export async function findTodos(
	cwd: string,
	options: { limit?: number; signal?: AbortSignal } = {},
): Promise<TodoSearchResult> {
	const limit = Math.max(1, options.limit ?? DEFAULT_TODO_LIMIT);
	const { signal } = options;
	const rgPath = await ensureTool("rg");
	if (!rgPath) throw new Error("ripgrep (rg) is not available and could not be downloaded");
	if (signal?.aborted) throw new Error("Operation aborted");

	return new Promise<TodoSearchResult>((resolve, reject) => {
		const args = ["--json", "--line-number", "--color=never", "--hidden", "--glob", "!.git", "--", TODO_PATTERN, "."];
		const child = spawn(rgPath, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
		const rl = createInterface({ input: child.stdout });
		const items: TodoItem[] = [];
		let limitReached = false;
		let stderr = "";
		let aborted = false;

		const onAbort = () => {
			aborted = true;
			child.kill();
		};
		signal?.addEventListener("abort", onAbort, { once: true });
		child.stderr?.on("data", (chunk) => {
			stderr += chunk.toString();
		});

		rl.on("line", (line) => {
			if (limitReached) return;
			const item = parseRipgrepTodoLine(line, cwd);
			if (!item) return;
			if (items.length >= limit) {
				limitReached = true;
				child.kill();
				return;
			}
			items.push(item);
		});

		child.on("error", (error) => {
			rl.close();
			signal?.removeEventListener("abort", onAbort);
			reject(new Error(`Failed to run ripgrep: ${error.message}`));
		});
		child.on("close", (code) => {
			rl.close();
			signal?.removeEventListener("abort", onAbort);
			if (aborted) {
				reject(new Error("Operation aborted"));
				return;
			}
			if (!limitReached && code !== 0 && code !== 1) {
				reject(new Error(stderr.trim() || `ripgrep exited with code ${code}`));
				return;
			}
			items.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1));
			resolve({ items, limitReached });
		});
	});
}

/**
 * Format todos as Markdown grouped by file.
 */
export function formatTodosMarkdown(result: TodoSearchResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";

	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const group = byFile.get(item.file);
		if (group) group.push(item);
		else byFile.set(item.file, [item]);
	}

	const sections: string[] = [];
	for (const [file, fileItems] of byFile) {
		const rows = fileItems.map((item) => `- \`${item.line}\` ${item.text.replace(/`/g, "'")}`);
		sections.push(`**${file}**\n\n${rows.join("\n")}`);
	}

	const count = result.items.length;
	const summary = result.limitReached
		? `Showing the first ${count} TODO/FIXME comments across ${byFile.size} files (limit reached).`
		: `${count} TODO/FIXME comment${count === 1 ? "" : "s"} across ${byFile.size} file${byFile.size === 1 ? "" : "s"}.`;
	return `${summary}\n\n${sections.join("\n\n")}`;
}
