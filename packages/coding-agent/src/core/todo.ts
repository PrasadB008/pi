export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	/** Message lines to show to the user. */
	lines: string[];
	/** True when the input was invalid and the message is a usage warning. */
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [<text> | done <n> | undo <n> | remove <n> | clear]";

/** In-memory todo list for one interactive session. */
export class TodoList {
	private items: TodoItem[] = [];

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	/**
	 * Apply the argument string of a `/todo` command (everything after `/todo`).
	 */
	execute(args: string): TodoCommandResult {
		const input = args.trim();
		if (!input) return this.list();

		const match = /^(done|undo|remove|clear)(?:\s+(.*))?$/i.exec(input);
		if (!match) {
			this.items.push({ text: input, done: false });
			return { lines: [`Added todo ${this.items.length}: ${input}`], isError: false };
		}

		const action = match[1].toLowerCase();
		const rest = (match[2] ?? "").trim();

		if (action === "clear") {
			if (rest) return { lines: [TODO_USAGE], isError: true };
			const count = this.items.length;
			this.items = [];
			return { lines: [`Cleared ${count} todo${count === 1 ? "" : "s"}`], isError: false };
		}

		if (!/^\d+$/.test(rest)) return { lines: [TODO_USAGE], isError: true };
		const index = Number.parseInt(rest, 10) - 1;
		const item = this.items[index];
		if (!item) return { lines: [`No todo ${rest}`], isError: true };

		if (action === "remove") {
			this.items.splice(index, 1);
			return { lines: [`Removed todo ${rest}: ${item.text}`], isError: false };
		}
		item.done = action === "done";
		return { lines: [`Todo ${rest} ${item.done ? "done" : "reopened"}: ${item.text}`], isError: false };
	}

	private list(): TodoCommandResult {
		if (this.items.length === 0) {
			return { lines: ["No todos. Add one with /todo <text>"], isError: false };
		}
		const lines = this.items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`);
		return { lines, isError: false };
	}
}
