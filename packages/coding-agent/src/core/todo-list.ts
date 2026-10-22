export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoResult {
	/** Lines to display to the user. */
	lines: string[];
	/** True when the lines describe a usage or input error. */
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [<text> | done <n> | undone <n> | remove <n> | clear]";

/** Session-scoped, in-memory todo list backing the /todo command. */
export class TodoList {
	private items: TodoItem[] = [];

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	/** Run the arguments of a `/todo` command (everything after `/todo`). */
	run(args: string): TodoResult {
		const trimmed = args.trim();
		if (!trimmed) return this.list();

		const match = /^(done|undone|remove|clear)(?:\s+(.*))?$/i.exec(trimmed);
		if (!match) return this.add(trimmed);

		const action = match[1].toLowerCase();
		const rest = (match[2] ?? "").trim();
		if (action === "clear") {
			if (rest) return { lines: [TODO_USAGE], isError: true };
			const count = this.items.length;
			this.items = [];
			return { lines: [`Cleared ${count} todo ${count === 1 ? "item" : "items"}`], isError: false };
		}

		if (!/^\d+$/.test(rest)) return { lines: [TODO_USAGE], isError: true };
		const index = Number.parseInt(rest, 10) - 1;
		const item = this.items[index];
		if (!item) return { lines: [`No todo item ${rest}`], isError: true };

		if (action === "remove") {
			this.items.splice(index, 1);
			return { lines: [`Removed: ${item.text}`], isError: false };
		}
		item.done = action === "done";
		return { lines: [`${item.done ? "Done" : "Reopened"}: ${item.text}`], isError: false };
	}

	private add(text: string): TodoResult {
		this.items.push({ text, done: false });
		return { lines: [`Added todo ${this.items.length}: ${text}`], isError: false };
	}

	private list(): TodoResult {
		if (this.items.length === 0) {
			return { lines: ["No todo items. Add one with /todo <text>"], isError: false };
		}
		return {
			lines: this.items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`),
			isError: false,
		};
	}
}
