export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	/** Plain-text message to show the user. */
	message: string;
	/** True when the command could not be applied. */
	isError: boolean;
}

/** In-memory, session-scoped todo list driven by the /todo command. */
export class TodoList {
	private items: TodoItem[] = [];

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	/** Apply the argument string that follows "/todo". */
	run(args: string): TodoCommandResult {
		const trimmed = args.trim();
		if (!trimmed) return { message: this.format(), isError: false };

		if (trimmed === "clear") {
			this.items = [];
			return { message: "Todo list cleared", isError: false };
		}

		const match = /^(done|undo|remove)(?:\s+(.*))?$/.exec(trimmed);
		if (match) {
			const action = match[1];
			const arg = (match[2] ?? "").trim();
			if (!/^\d+$/.test(arg)) {
				return { message: `Usage: /todo ${action} <number>`, isError: true };
			}
			const index = Number.parseInt(arg, 10) - 1;
			const item = this.items[index];
			if (!item) {
				return { message: `No todo item ${arg}`, isError: true };
			}
			if (action === "remove") {
				this.items.splice(index, 1);
				return { message: `Removed: ${item.text}`, isError: false };
			}
			item.done = action === "done";
			return { message: `${action === "done" ? "Done" : "Reopened"}: ${item.text}`, isError: false };
		}

		this.items.push({ text: trimmed, done: false });
		return { message: `Added: ${trimmed}`, isError: false };
	}

	format(): string {
		if (this.items.length === 0) return "No todo items. Add one with /todo <text>";
		return this.items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
	}
}
