export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export const TODOS_USAGE = "Usage: /todos [add <text> | done <id> | undo <id> | remove <id> | clear]";

export interface TodosCommandResult {
	/** Message to show the user. */
	message: string;
	/** True when the message reports a usage problem or unknown id. */
	isError: boolean;
}

/** Small in-memory todo list backing the built-in /todos command. */
export class TodoStore {
	private items: TodoItem[] = [];
	private nextId = 1;

	list(): readonly TodoItem[] {
		return this.items;
	}

	add(text: string): TodoItem {
		const item: TodoItem = { id: this.nextId++, text, done: false };
		this.items.push(item);
		return item;
	}

	setDone(id: number, done: boolean): TodoItem | undefined {
		const item = this.items.find((t) => t.id === id);
		if (item) item.done = done;
		return item;
	}

	remove(id: number): boolean {
		const index = this.items.findIndex((t) => t.id === id);
		if (index === -1) return false;
		this.items.splice(index, 1);
		return true;
	}

	clear(): void {
		this.items = [];
	}

	format(): string {
		if (this.items.length === 0) return "No todos. Add one with /todos add <text>.";
		const done = this.items.filter((t) => t.done).length;
		const lines = this.items.map((t) => `- [${t.done ? "x" : " "}] #${t.id}: ${t.text}`);
		return `${lines.join("\n")}\n\n${done}/${this.items.length} completed`;
	}
}

/** Run the arguments of `/todos <args>` against a store. */
export function runTodosCommand(store: TodoStore, args: string): TodosCommandResult {
	const trimmed = args.trim();
	if (trimmed === "" || trimmed === "list") return { message: store.format(), isError: false };

	const spaceIndex = trimmed.search(/\s/);
	const sub = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
	const rest = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex).trim();

	switch (sub) {
		case "add": {
			if (!rest) return { message: TODOS_USAGE, isError: true };
			const item = store.add(rest);
			return { message: `Added #${item.id}: ${item.text}`, isError: false };
		}
		case "done":
		case "undo": {
			const id = parseId(rest);
			if (id === undefined) return { message: TODOS_USAGE, isError: true };
			const item = store.setDone(id, sub === "done");
			if (!item) return { message: `No todo #${id}`, isError: true };
			return { message: `${sub === "done" ? "Completed" : "Reopened"} #${item.id}: ${item.text}`, isError: false };
		}
		case "remove": {
			const id = parseId(rest);
			if (id === undefined) return { message: TODOS_USAGE, isError: true };
			if (!store.remove(id)) return { message: `No todo #${id}`, isError: true };
			return { message: `Removed #${id}`, isError: false };
		}
		case "clear":
			store.clear();
			return { message: "Cleared all todos", isError: false };
		default:
			return { message: TODOS_USAGE, isError: true };
	}
}

function parseId(value: string): number | undefined {
	const match = /^#?(\d+)$/.exec(value);
	return match ? Number(match[1]) : undefined;
}
