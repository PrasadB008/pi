import { spawnProcessSync } from "./child-process.ts";

export interface TodoItem {
	/** Path relative to the searched directory */
	file: string;
	/** 1-based line number */
	line: number;
	/** Trimmed text of the matching line */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when more matches existed than `maxItems` */
	truncated: boolean;
	/** Set when the scan could not run (for example git is not installed) */
	error?: string;
}

const MAX_TEXT_LENGTH = 160;
const GREP_LINE_PATTERN = /^(.*?):(\d+):(.*)$/;

/**
 * Parse `git grep -n` output ("path:line:text") into todo items.
 */
export function parseTodoGrepOutput(output: string): TodoItem[] {
	const items: TodoItem[] = [];
	for (const rawLine of output.split("\n")) {
		const match = GREP_LINE_PATTERN.exec(rawLine);
		if (!match) continue;
		const text = (match[3] ?? "").trim();
		items.push({
			file: match[1] ?? "",
			line: Number.parseInt(match[2] ?? "0", 10),
			text: text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH - 3)}...` : text,
		});
	}
	return items;
}

/**
 * Find TODO and FIXME comments under `cwd`. Uses `git grep --no-index --exclude-standard`, which
 * respects .gitignore and also works for directories that are not git repositories.
 */
export function findTodos(cwd: string, maxItems = 200): TodoScanResult {
	const result = spawnProcessSync(
		"git",
		["grep", "--no-index", "--exclude-standard", "-n", "-I", "-w", "-E", "-e", "TODO|FIXME"],
		{ cwd, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 },
	);
	if (result.error) {
		return { items: [], truncated: false, error: result.error.message };
	}
	// git grep exits with 1 when nothing matched
	if (result.status !== 0 && result.status !== 1) {
		const message = (result.stderr ?? "").trim() || `git grep exited with status ${result.status}`;
		return { items: [], truncated: false, error: message };
	}
	const all = parseTodoGrepOutput(result.stdout ?? "");
	return { items: all.slice(0, maxItems), truncated: all.length > maxItems };
}

/**
 * Format scan results as plain text, grouped by file.
 */
export function formatTodos(result: TodoScanResult): string {
	if (result.error) return `Could not scan for TODOs: ${result.error}`;
	if (result.items.length === 0) return "No TODO or FIXME comments found.";
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of result.items) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(item.file);
			currentFile = item.file;
		}
		lines.push(`  ${item.line}: ${item.text}`);
	}
	if (result.truncated) {
		lines.push("", `Showing the first ${result.items.length} matches.`);
	}
	return lines.join("\n");
}
