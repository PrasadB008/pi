export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export type TodoCommandResult = { ok: true; message: string } | { ok: false; message: string };

export const TODO_USAGE = "Usage: /todo [list] | /todo add <text> | /todo done <number>";

/** In-memory todo list for one interactive session. Ids are 1-based and never reused. */
export class TodoList {
	private items: TodoItem[] = [];
	private nextId = 1;

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	add(text: string): TodoItem {
		const item: TodoItem = { id: this.nextId++, text: text.trim(), done: false };
		this.items.push(item);
		return item;
	}

	complete(id: number): TodoItem | undefined {
		const item = this.items.find((candidate) => candidate.id === id);
		if (item) item.done = true;
		return item;
	}

	format(): string {
		if (this.items.length === 0) return "No todos. Add one with /todo add <text>";
		return this.items.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.id}. ${item.text}`).join("\n");
	}

	/** Run the argument string that follows "/todo" and return the message to show. */
	run(args: string): TodoCommandResult {
		const trimmed = args.trim();
		if (trimmed === "" || trimmed === "list") return { ok: true, message: this.format() };

		const [subcommand, ...rest] = trimmed.split(/\s+/);
		const argument = trimmed.slice(subcommand.length).trim();

		if (subcommand === "add") {
			if (!argument) return { ok: false, message: "Todo text is required. Usage: /todo add <text>" };
			const item = this.add(argument);
			return { ok: true, message: `Added todo ${item.id}: ${item.text}` };
		}

		if (subcommand === "done" || subcommand === "complete") {
			if (rest.length !== 1 || !/^\d+$/.test(rest[0])) {
				return { ok: false, message: "A todo number is required. Usage: /todo done <number>" };
			}
			const id = Number(rest[0]);
			const existing = this.items.find((candidate) => candidate.id === id);
			if (!existing) return { ok: false, message: `No todo with number ${id}` };
			if (existing.done) return { ok: true, message: `Todo ${id} is already done` };
			this.complete(id);
			return { ok: true, message: `Completed todo ${id}: ${existing.text}` };
		}

		return { ok: false, message: `Unknown /todo subcommand "${subcommand}". ${TODO_USAGE}` };
	}
}
