export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	/** Text to show to the user. */
	message: string;
	/** True when the command was invalid or failed. */
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [list] | /todo add <text> | /todo done <number>";

/** In-memory todo list for one interactive session. Item ids are 1-based and never reused. */
export class TodoList {
	private items: TodoItem[] = [];
	private nextId = 1;

	add(text: string): TodoItem {
		const trimmed = text.trim();
		if (!trimmed) {
			throw new Error("Todo text cannot be empty");
		}
		const item: TodoItem = { id: this.nextId++, text: trimmed, done: false };
		this.items.push(item);
		return item;
	}

	/** Marks an item as done. Returns undefined when no item has that id. */
	complete(id: number): TodoItem | undefined {
		const item = this.items.find((candidate) => candidate.id === id);
		if (item) {
			item.done = true;
		}
		return item;
	}

	list(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	clear(): void {
		this.items = [];
		this.nextId = 1;
	}
}

export function formatTodoList(items: ReadonlyArray<TodoItem>): string {
	if (items.length === 0) {
		return "No todos. Add one with /todo add <text>";
	}
	const openCount = items.filter((item) => !item.done).length;
	const lines = items.map((item) => `${item.id}. [${item.done ? "x" : " "}] ${item.text}`);
	return [`Todos (${openCount} open, ${items.length - openCount} done):`, ...lines].join("\n");
}

/**
 * Handles the arguments of a `/todo` command (everything after "/todo").
 * Supported: "", "list", "add <text>", "done <n>" (alias "complete <n>").
 */
export function runTodoCommand(list: TodoList, args: string): TodoCommandResult {
	const trimmed = args.trim();
	const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(trimmed);
	const subcommand = match ? match[1].toLowerCase() : "list";
	const rest = match?.[2]?.trim() ?? "";

	switch (subcommand) {
		case "list":
			return { message: formatTodoList(list.list()), isError: false };
		case "add": {
			if (!rest) {
				return { message: "Usage: /todo add <text>", isError: true };
			}
			const item = list.add(rest);
			return { message: `Added todo ${item.id}: ${item.text}`, isError: false };
		}
		case "done":
		case "complete": {
			if (!/^\d+$/.test(rest)) {
				return { message: "Usage: /todo done <number>", isError: true };
			}
			const id = Number.parseInt(rest, 10);
			const item = list.complete(id);
			if (!item) {
				return { message: `No todo with number ${id}`, isError: true };
			}
			return { message: `Completed todo ${item.id}: ${item.text}`, isError: false };
		}
		default:
			return { message: TODO_USAGE, isError: true };
	}
}
