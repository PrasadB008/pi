export interface TodoItem {
	text: string;
	done: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | undo <n> | rm <n> | clear]";

export interface TodoResult {
	/** Markdown to show to the user. */
	message: string;
	isError: boolean;
}

/** Session-scoped, in-memory todo list backing the /todo command. */
export class TodoList {
	private items: TodoItem[] = [];

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	render(): string {
		if (this.items.length === 0) return "No todo items. Add one with `/todo add <text>`.";
		return this.items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
	}

	/** Execute the arguments that follow "/todo" (may be empty). */
	run(args: string): TodoResult {
		const trimmed = args.trim();
		if (!trimmed) return { message: this.render(), isError: false };

		const match = /^(\S+)\s*(.*)$/s.exec(trimmed);
		const subcommand = match?.[1] ?? "";
		const rest = match?.[2]?.trim() ?? "";

		switch (subcommand) {
			case "add": {
				if (!rest) return { message: TODO_USAGE, isError: true };
				this.items.push({ text: rest, done: false });
				return { message: `Added #${this.items.length}: ${rest}`, isError: false };
			}
			case "done":
			case "undo":
			case "rm": {
				const index = this.parseIndex(rest);
				if (index === undefined) return { message: `Invalid item number. ${TODO_USAGE}`, isError: true };
				const item = this.items[index];
				if (subcommand === "rm") {
					this.items.splice(index, 1);
					return { message: `Removed: ${item.text}`, isError: false };
				}
				item.done = subcommand === "done";
				return { message: `${item.done ? "Completed" : "Reopened"} #${index + 1}: ${item.text}`, isError: false };
			}
			case "clear": {
				this.items = [];
				return { message: "Cleared todo list.", isError: false };
			}
			default:
				return { message: TODO_USAGE, isError: true };
		}
	}

	private parseIndex(value: string): number | undefined {
		if (!/^\d+$/.test(value)) return undefined;
		const index = Number(value) - 1;
		return index >= 0 && index < this.items.length ? index : undefined;
	}
}
