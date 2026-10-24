/**
 * Todos Extension
 *
 * Exposes /todos to list outstanding TODO/FIXME/HACK/XXX comments in git-tracked files.
 * Pick an entry to put its `path:line` reference into the editor.
 *
 * Usage: /todos [filter]   (filter is a case-insensitive substring of the path or text)
 */

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const execFileAsync = promisify(execFile);

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_RESULTS = 500;
const MARKER_RE = /\b(TODO|FIXME|HACK|XXX)\b(?:\([^)]*\))?:?\s*(.*)$/;

export interface TodoItem {
	file: string;
	line: number;
	marker: string;
	text: string;
}

/** Find marker comments in the text of one file. Exported for tests. */
export function findTodos(file: string, content: string): TodoItem[] {
	const items: TodoItem[] = [];
	const lines = content.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const match = MARKER_RE.exec(lines[i]);
		if (!match) continue;
		items.push({ file, line: i + 1, marker: match[1], text: match[2].replace(/\*\/\s*$/, "").trim() });
	}
	return items;
}

/** Format an item as one selectable line. Exported for tests. */
export function formatTodo(item: TodoItem): string {
	const text = item.text.length > 0 ? item.text : "(no description)";
	return `${item.file}:${item.line}  ${item.marker}: ${text}`;
}

async function scanRepo(cwd: string): Promise<TodoItem[]> {
	const { stdout } = await execFileAsync("git", ["ls-files", "-z"], { cwd, maxBuffer: 64 * 1024 * 1024 });
	const files = stdout.split("\0").filter((f) => f.length > 0);
	const items: TodoItem[] = [];
	for (const file of files) {
		let buf: Buffer;
		try {
			buf = await readFile(join(cwd, file));
		} catch {
			continue; // deleted in worktree, or unreadable
		}
		if (buf.length > MAX_FILE_BYTES || buf.includes(0)) continue; // skip large and binary files
		items.push(...findTodos(file, buf.toString("utf8")));
	}
	return items;
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("todos", {
		description: "List outstanding TODO/FIXME comments in the codebase",
		handler: async (args, ctx) => {
			let items: TodoItem[];
			try {
				items = await scanRepo(ctx.cwd);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`/todos failed (is this a git repository?): ${message}`, "error");
				return;
			}

			const filter = args.trim().toLowerCase();
			if (filter) {
				items = items.filter((item) => formatTodo(item).toLowerCase().includes(filter));
			}
			if (items.length === 0) {
				ctx.ui.notify(filter ? `No TODOs matching "${filter}"` : "No outstanding TODOs found", "info");
				return;
			}

			const total = items.length;
			const shown = items.slice(0, MAX_RESULTS);
			const lines = shown.map(formatTodo);
			const title = total > shown.length ? `TODOs (showing ${shown.length} of ${total})` : `TODOs (${total})`;

			if (!ctx.hasUI) {
				ctx.ui.notify(`${title}\n${lines.join("\n")}`, "info");
				return;
			}

			const choice = await ctx.ui.select(title, lines);
			if (choice === undefined) return;
			const item = shown[lines.indexOf(choice)];
			if (item) ctx.ui.setEditorText(`${item.file}:${item.line}`);
		},
	});
}
