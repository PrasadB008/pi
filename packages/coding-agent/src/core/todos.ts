import { spawn } from "node:child_process";
import path from "node:path";
import { createInterface } from "node:readline";

export interface TodoItem {
	/** Path relative to the searched directory, with forward slashes. */
	file: string;
	line: number;
	/** Marker found in the comment, upper-cased (TODO, FIXME, HACK or XXX). */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export const TODO_MAX_ITEMS = 200;
const TODO_PATTERN = "\\b(TODO|FIXME|HACK|XXX)\\b";
const TODO_LINE_REGEX = /\b(TODO|FIXME|HACK|XXX)\b(?:\([^)]*\))?[\s:-]*(.*)$/;
const MAX_TEXT_LENGTH = 160;

/** Extract a TodoItem from one matched source line, or undefined if no marker is present. */
export function parseTodoLine(file: string, line: number, lineText: string): TodoItem | undefined {
	const match = TODO_LINE_REGEX.exec(lineText);
	if (!match) return undefined;
	let text = match[2].trim().replace(/\s*(\*\/|-->)\s*$/, "");
	if (text.length > MAX_TEXT_LENGTH) text = `${text.slice(0, MAX_TEXT_LENGTH)}...`;
	return { file, line, tag: match[1], text };
}

export interface FindTodosResult {
	items: TodoItem[];
	/** True when the search stopped at the limit. */
	limitReached: boolean;
}

/**
 * Find TODO/FIXME/HACK/XXX markers under `cwd` with ripgrep (respects .gitignore).
 * `rgPath` is the ripgrep binary to run.
 */
export function findTodos(rgPath: string, cwd: string, limit = TODO_MAX_ITEMS): Promise<FindTodosResult> {
	return new Promise((resolve, reject) => {
		const child = spawn(rgPath, ["--json", "--line-number", "--color=never", "--", TODO_PATTERN, cwd], {
			stdio: ["ignore", "pipe", "pipe"],
		});
		const rl = createInterface({ input: child.stdout });
		const items: TodoItem[] = [];
		let stderr = "";
		let limitReached = false;
		let killedDueToLimit = false;

		child.stderr?.on("data", (chunk) => {
			stderr += chunk.toString();
		});
		rl.on("line", (raw) => {
			if (limitReached || !raw.trim()) return;
			let event: {
				type?: string;
				data?: { path?: { text?: string }; line_number?: number; lines?: { text?: string } };
			};
			try {
				event = JSON.parse(raw);
			} catch {
				return;
			}
			if (event.type !== "match") return;
			const filePath = event.data?.path?.text;
			const lineNumber = event.data?.line_number;
			const lineText = event.data?.lines?.text;
			if (!filePath || typeof lineNumber !== "number" || lineText === undefined) return;
			const relative = path.relative(cwd, filePath).replace(/\\/g, "/");
			const item = parseTodoLine(relative || path.basename(filePath), lineNumber, lineText.replace(/\r?\n$/, ""));
			if (!item) return;
			items.push(item);
			if (items.length >= limit) {
				limitReached = true;
				killedDueToLimit = true;
				child.kill();
			}
		});
		child.on("error", (error) => {
			rl.close();
			reject(new Error(`Failed to run ripgrep: ${error.message}`));
		});
		child.on("close", (code) => {
			rl.close();
			if (!killedDueToLimit && code !== 0 && code !== 1) {
				reject(new Error(stderr.trim() || `ripgrep exited with code ${code}`));
				return;
			}
			resolve({ items, limitReached });
		});
	});
}

/** Format items as Markdown grouped by file. */
export function formatTodosMarkdown(result: FindTodosResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const list = byFile.get(item.file) ?? [];
		list.push(item);
		byFile.set(item.file, list);
	}
	const sections: string[] = [];
	for (const [file, list] of byFile) {
		const rows = list.map((item) => `- \`${item.line}\` **${item.tag}** ${item.text}`.trimEnd());
		sections.push(`### ${file}\n\n${rows.join("\n")}`);
	}
	let out = sections.join("\n\n");
	if (result.limitReached) out += `\n\n_Showing the first ${result.items.length} items._`;
	return out;
}
