import type { SessionEntry } from "./session-manager.ts";

/** Custom entry type used to persist the todo list in the session file. */
export const TODO_ENTRY_TYPE = "todo";

export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	/** Todo list after the command. */
	items: TodoItem[];
	/** True when the list changed and should be persisted. */
	changed: boolean;
	/** Text to show to the user. */
	message: string;
	/** True when the message is a usage or input error. */
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | undo <n> | rm <n> | clear]";

function isTodoItem(value: unknown): value is TodoItem {
	if (typeof value !== "object" || value === null) return false;
	const item = value as Record<string, unknown>;
	return typeof item.text === "string" && typeof item.done === "boolean";
}

/**
 * Read the current todo list from session entries (ordered root to leaf).
 * Each todo entry stores a full snapshot, so the last one wins.
 */
export function readTodos(entries: ReadonlyArray<SessionEntry>): TodoItem[] {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type !== "custom" || entry.customType !== TODO_ENTRY_TYPE) continue;
		const data = entry.data as { items?: unknown } | undefined;
		if (!data || !Array.isArray(data.items)) return [];
		return data.items.filter(isTodoItem).map((item) => ({ text: item.text, done: item.done }));
	}
	return [];
}

export function formatTodos(items: ReadonlyArray<TodoItem>): string {
	if (items.length === 0) return "No todos. Add one with /todo add <text>";
	const doneCount = items.filter((item) => item.done).length;
	const lines = items.map((item, index) => `${index + 1}. [${item.done ? "x" : " "}] ${item.text}`);
	return [`Todos (${doneCount}/${items.length} done)`, ...lines].join("\n");
}

function fail(items: TodoItem[], message: string): TodoCommandResult {
	return { items, changed: false, message, isError: true };
}

function parseIndex(items: TodoItem[], arg: string): number | undefined {
	if (!/^\d+$/.test(arg)) return undefined;
	const index = Number.parseInt(arg, 10) - 1;
	return index >= 0 && index < items.length ? index : undefined;
}

/** Apply the arguments of `/todo` (text after the command name) to a todo list. */
export function runTodoCommand(items: ReadonlyArray<TodoItem>, args: string): TodoCommandResult {
	const current = items.map((item) => ({ ...item }));
	const trimmed = args.trim();
	if (!trimmed || trimmed === "list") {
		return { items: current, changed: false, message: formatTodos(current), isError: false };
	}

	const match = /^(\S+)\s*([\s\S]*)$/.exec(trimmed);
	const subcommand = match?.[1].toLowerCase() ?? "";
	const rest = match?.[2].trim() ?? "";

	switch (subcommand) {
		case "add": {
			if (!rest) return fail(current, TODO_USAGE);
			const next = [...current, { text: rest.replace(/\s*[\r\n]+\s*/g, " "), done: false }];
			return { items: next, changed: true, message: `Added todo ${next.length}: ${rest}`, isError: false };
		}
		case "done":
		case "undo": {
			const index = parseIndex(current, rest);
			if (index === undefined) return fail(current, `No todo ${rest || "(missing number)"}. ${TODO_USAGE}`);
			const done = subcommand === "done";
			current[index].done = done;
			return {
				items: current,
				changed: true,
				message: `${done ? "Completed" : "Reopened"} todo ${index + 1}: ${current[index].text}`,
				isError: false,
			};
		}
		case "rm":
		case "remove": {
			const index = parseIndex(current, rest);
			if (index === undefined) return fail(current, `No todo ${rest || "(missing number)"}. ${TODO_USAGE}`);
			const [removed] = current.splice(index, 1);
			return { items: current, changed: true, message: `Removed todo ${index + 1}: ${removed.text}`, isError: false };
		}
		case "clear": {
			if (current.length === 0) return { items: current, changed: false, message: formatTodos(current), isError: false };
			return { items: [], changed: true, message: `Cleared ${current.length} todo(s)`, isError: false };
		}
		default:
			return fail(current, TODO_USAGE);
	}
}
