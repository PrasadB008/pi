export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoResult {
	ok: boolean;
	message: string;
}

/** Session-local todo list backing the /todo slash command. */
export class TodoList {
	items: TodoItem[] = [];
	private nextId = 1;

	/** Apply the arguments of `/todo <args>`. Returns undefined when args is empty (list request). */
	run(args: string): TodoResult | undefined {
		const trimmed = args.trim();
		if (!trimmed) return undefined;
		if (trimmed === "clear") {
			this.items = [];
			this.nextId = 1;
			return { ok: true, message: "Cleared todos" };
		}
		const match = /^(done|undo|rm)\s+#?(\d+)$/.exec(trimmed);
		if (match) {
			const action = match[1];
			const id = Number(match[2]);
			const item = this.items.find((t) => t.id === id);
			if (!item) return { ok: false, message: `No todo #${id}` };
			if (action === "rm") {
				this.items = this.items.filter((t) => t.id !== id);
				return { ok: true, message: `Removed todo #${id}` };
			}
			item.done = action === "done";
			return { ok: true, message: `Todo #${id} ${item.done ? "done" : "reopened"}` };
		}
		const item: TodoItem = { id: this.nextId++, text: trimmed, done: false };
		this.items.push(item);
		return { ok: true, message: `Added todo #${item.id}: ${item.text}` };
	}

	/** Plain-text listing, one line per item after a summary header. */
	format(): string {
		if (this.items.length === 0) {
			return "No todos. Usage: /todo <text> | done <id> | undo <id> | rm <id> | clear";
		}
		const completed = this.items.filter((t) => t.done).length;
		const lines = this.items.map((t) => `${t.done ? "[x]" : "[ ]"} #${t.id} ${t.text}`);
		return [`Todos (${completed}/${this.items.length} done)`, ...lines].join("\n");
	}
}
