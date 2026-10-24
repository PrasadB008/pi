export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <id> | rm <id> | clear]";

export interface TodoResult {
	/** Message to show the user. */
	message: string;
	/** True when the input was invalid and the message is a warning. */
	error: boolean;
}

/** Small in-memory todo list backing the /todo command. */
export class TodoList {
	private items: TodoItem[] = [];
	private nextId = 1;

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	/** Run the argument string that follows "/todo" and return what to show. */
	run(args: string): TodoResult {
		const trimmed = args.trim();
		if (!trimmed) return { message: this.format(), error: false };

		const match = /^(\S+)\s*([\s\S]*)$/.exec(trimmed);
		const command = match?.[1]?.toLowerCase() ?? "";
		const rest = match?.[2]?.trim() ?? "";

		switch (command) {
			case "add": {
				if (!rest) return { message: TODO_USAGE, error: true };
				const item: TodoItem = { id: this.nextId++, text: rest, done: false };
				this.items.push(item);
				return { message: `Added todo #${item.id}: ${item.text}`, error: false };
			}
			case "done":
			case "toggle": {
				const item = this.findById(rest);
				if (!item) return { message: `Todo not found: ${rest || "(no id)"}`, error: true };
				item.done = !item.done;
				return { message: `Todo #${item.id} ${item.done ? "completed" : "reopened"}`, error: false };
			}
			case "rm":
			case "remove": {
				const item = this.findById(rest);
				if (!item) return { message: `Todo not found: ${rest || "(no id)"}`, error: true };
				this.items = this.items.filter((i) => i !== item);
				return { message: `Removed todo #${item.id}`, error: false };
			}
			case "clear": {
				const count = this.items.length;
				this.items = [];
				return { message: `Cleared ${count} todo${count === 1 ? "" : "s"}`, error: false };
			}
			default:
				return { message: TODO_USAGE, error: true };
		}
	}

	format(): string {
		if (this.items.length === 0) return "No todos. Add one with /todo add <text>";
		const completed = this.items.filter((i) => i.done).length;
		const lines = this.items.map((i) => `[${i.done ? "x" : " "}] #${i.id} ${i.text}`);
		return `Todos (${completed}/${this.items.length} done)\n${lines.join("\n")}`;
	}

	private findById(raw: string): TodoItem | undefined {
		const id = Number.parseInt(raw.replace(/^#/, ""), 10);
		if (Number.isNaN(id)) return undefined;
		return this.items.find((i) => i.id === id);
	}
}
