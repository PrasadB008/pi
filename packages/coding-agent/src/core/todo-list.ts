export interface TodoItem {
	text: string;
	done: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | remove <n> | clear]";

export type TodoCommandResult = { ok: true; items: TodoItem[]; changed: boolean } | { ok: false; error: string };

/** Parse persisted todo data, dropping malformed items. */
export function parseTodoItems(data: unknown): TodoItem[] {
	if (typeof data !== "object" || data === null) return [];
	const items = (data as { items?: unknown }).items;
	if (!Array.isArray(items)) return [];
	return items.flatMap((item: unknown) => {
		if (typeof item !== "object" || item === null) return [];
		const { text, done } = item as { text?: unknown; done?: unknown };
		return typeof text === "string" ? [{ text, done: done === true }] : [];
	});
}

/**
 * Apply the arguments of a /todo command (everything after "/todo") to a list.
 * An empty argument string only lists, so `changed` is false.
 */
export function applyTodoCommand(items: readonly TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (!trimmed) return { ok: true, items: [...items], changed: false };

	const [command, ...rest] = trimmed.split(/\s+/);
	const argument = rest.join(" ");

	const parseIndex = (): number | undefined => {
		if (!/^\d+$/.test(argument)) return undefined;
		const index = Number.parseInt(argument, 10);
		return index >= 1 && index <= items.length ? index - 1 : undefined;
	};

	switch (command) {
		case "add":
			if (!argument) return { ok: false, error: "Usage: /todo add <text>" };
			return { ok: true, items: [...items, { text: argument, done: false }], changed: true };
		case "done": {
			const index = parseIndex();
			if (index === undefined) return { ok: false, error: `Usage: /todo done <n> (1-${items.length})` };
			return {
				ok: true,
				items: items.map((item, i) => (i === index ? { ...item, done: !item.done } : item)),
				changed: true,
			};
		}
		case "remove": {
			const index = parseIndex();
			if (index === undefined) return { ok: false, error: `Usage: /todo remove <n> (1-${items.length})` };
			return { ok: true, items: items.filter((_, i) => i !== index), changed: true };
		}
		case "clear":
			return { ok: true, items: [], changed: true };
		default:
			return { ok: false, error: TODO_USAGE };
	}
}
