export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	/** Markdown to show the user. */
	message: string;
}

/**
 * Small in-memory todo list backing the built-in /todos command.
 * State lives for the lifetime of the process; it is not written to the session.
 */
export class TodoStore {
	private items: TodoItem[] = [];
	private nextId = 1;

	list(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	add(text: string): TodoItem {
		const item: TodoItem = { id: this.nextId++, text, done: false };
		this.items.push(item);
		return item;
	}

	toggle(id: number): TodoItem | undefined {
		const item = this.items.find((todo) => todo.id === id);
		if (item) item.done = !item.done;
		return item;
	}

	remove(id: number): boolean {
		const index = this.items.findIndex((todo) => todo.id === id);
		if (index === -1) return false;
		this.items.splice(index, 1);
		return true;
	}

	clear(): number {
		const count = this.items.length;
		this.items = [];
		this.nextId = 1;
		return count;
	}
}

export const TODOS_USAGE = "Usage: /todos [add <text> | done <id> | rm <id> | clear]";

function formatList(items: ReadonlyArray<TodoItem>): string {
	if (items.length === 0) return `No todos. Add one with \`/todos add <text>\`.`;
	const done = items.filter((item) => item.done).length;
	const lines = items.map((item) => `- [${item.done ? "x" : " "}] #${item.id} ${item.text}`);
	return [`**Todos** (${done}/${items.length} done)`, "", ...lines].join("\n");
}

function parseId(arg: string): number | undefined {
	const match = /^#?(\d+)$/.exec(arg.trim());
	return match ? Number(match[1]) : undefined;
}

/** Run the arguments of `/todos` (text after the command name) against a store. */
export function runTodosCommand(store: TodoStore, args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (trimmed === "" || trimmed === "list") return { message: formatList(store.list()) };

	const spaceIndex = trimmed.search(/\s/);
	const sub = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
	const rest = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex).trim();

	switch (sub) {
		case "add": {
			if (!rest) return { message: TODOS_USAGE };
			const item = store.add(rest);
			return { message: `Added #${item.id}: ${item.text}` };
		}
		case "done":
		case "toggle": {
			const id = parseId(rest);
			if (id === undefined) return { message: TODOS_USAGE };
			const item = store.toggle(id);
			if (!item) return { message: `Todo #${id} not found` };
			return { message: `Todo #${id} ${item.done ? "completed" : "reopened"}` };
		}
		case "rm":
		case "remove": {
			const id = parseId(rest);
			if (id === undefined) return { message: TODOS_USAGE };
			return { message: store.remove(id) ? `Removed #${id}` : `Todo #${id} not found` };
		}
		case "clear":
			return { message: `Cleared ${store.clear()} todos` };
		default:
			return { message: TODOS_USAGE };
	}
}
