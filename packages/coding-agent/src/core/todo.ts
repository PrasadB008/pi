export interface TodoItem {
	text: string;
	done: boolean;
}

export type TodoCommandResult = { ok: true; items: TodoItem[] } | { ok: false; message: string };

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | clear]";

/**
 * Apply the arguments of a /todo command (the text after "/todo") to a list.
 * Returns a new list and never mutates the input. Item numbers are 1-based.
 */
export function applyTodoCommand(items: readonly TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	const separator = trimmed.search(/\s/);
	const subcommand = separator === -1 ? trimmed : trimmed.slice(0, separator);
	const argument = separator === -1 ? "" : trimmed.slice(separator).trim();
	const copy = items.map((item) => ({ ...item }));

	switch (subcommand) {
		case "":
			return { ok: true, items: copy };
		case "add":
			if (!argument) {
				return { ok: false, message: TODO_USAGE };
			}
			copy.push({ text: argument, done: false });
			return { ok: true, items: copy };
		case "done": {
			const item = /^\d+$/.test(argument) ? copy[Number(argument) - 1] : undefined;
			if (!item) {
				return { ok: false, message: `No todo item ${argument || "(missing number)"}. ${TODO_USAGE}` };
			}
			item.done = true;
			return { ok: true, items: copy };
		}
		case "clear":
			return { ok: true, items: [] };
		default:
			return { ok: false, message: TODO_USAGE };
	}
}
