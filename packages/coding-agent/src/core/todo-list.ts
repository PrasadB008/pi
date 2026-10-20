export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	/** Message to show the user. */
	message: string;
	/** True if the message is a usage or lookup error. */
	isError: boolean;
}

/** In-memory todo list for one interactive session. Not persisted. */
export class TodoList {
	private items: TodoItem[] = [];
	private nextId = 1;

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	add(text: string): TodoItem {
		const item: TodoItem = { id: this.nextId++, text, done: false };
		this.items.push(item);
		return item;
	}

	setDone(id: number): TodoItem | undefined {
		const item = this.items.find((entry) => entry.id === id);
		if (item) item.done = true;
		return item;
	}

	remove(id: number): boolean {
		const index = this.items.findIndex((entry) => entry.id === id);
		if (index === -1) return false;
		this.items.splice(index, 1);
		return true;
	}

	clear(): void {
		this.items = [];
	}

	format(): string {
		if (this.items.length === 0) return "No todos. Add one with /todo <text>";
		return this.items.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.id}. ${item.text}`).join("\n");
	}
}

function parseId(value: string): number | undefined {
	return /^\d+$/.test(value) ? Number(value) : undefined;
}

/** Run the arguments of a /todo command (text after "/todo") against a list. */
export function runTodoCommand(list: TodoList, args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (!trimmed) return { message: list.format(), isError: false };

	const [subcommand, ...rest] = trimmed.split(/\s+/);
	const arg = rest.join(" ");

	if (subcommand === "clear" && !arg) {
		list.clear();
		return { message: "Cleared all todos", isError: false };
	}

	if (subcommand === "done" || subcommand === "rm") {
		const id = parseId(arg);
		if (id === undefined) return { message: `Usage: /todo ${subcommand} <id>`, isError: true };
		if (subcommand === "done") {
			const item = list.setDone(id);
			if (!item) return { message: `No todo with id ${id}`, isError: true };
			return { message: `Done: ${item.text}`, isError: false };
		}
		if (!list.remove(id)) return { message: `No todo with id ${id}`, isError: true };
		return { message: `Removed todo ${id}`, isError: false };
	}

	const item = list.add(trimmed);
	return { message: `Added todo ${item.id}: ${item.text}`, isError: false };
}
