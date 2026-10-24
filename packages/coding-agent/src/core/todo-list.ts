export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoResult {
	/** Message to show the user. */
	message: string;
	/** True when the message is a usage or input error. */
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | undo <n> | rm <n> | clear]";

/** Small in-memory todo list backing the /todo command. */
export class TodoList {
	private items: TodoItem[] = [];

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	format(): string {
		if (this.items.length === 0) return "No todos. Add one with /todo add <text>";
		return this.items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
	}

	/** Run the arguments that follow "/todo". */
	run(args: string): TodoResult {
		const trimmed = args.trim();
		if (!trimmed || trimmed === "list") return { message: this.format(), isError: false };

		const match = /^(\S+)\s*([\s\S]*)$/.exec(trimmed);
		const command = match?.[1] ?? "";
		const rest = (match?.[2] ?? "").trim();

		switch (command) {
			case "add": {
				if (!rest) return { message: TODO_USAGE, isError: true };
				this.items.push({ text: rest, done: false });
				return { message: `Added todo ${this.items.length}: ${rest}`, isError: false };
			}
			case "done":
			case "undo": {
				const index = this.parseIndex(rest);
				if (index === undefined) return { message: this.indexError(rest), isError: true };
				const done = command === "done";
				this.items[index].done = done;
				return { message: `${done ? "Completed" : "Reopened"} todo ${index + 1}: ${this.items[index].text}`, isError: false };
			}
			case "rm":
			case "remove": {
				const index = this.parseIndex(rest);
				if (index === undefined) return { message: this.indexError(rest), isError: true };
				const [removed] = this.items.splice(index, 1);
				return { message: `Removed todo ${index + 1}: ${removed.text}`, isError: false };
			}
			case "clear": {
				this.items = [];
				return { message: "Cleared all todos", isError: false };
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

	private indexError(value: string): string {
		if (!value) return TODO_USAGE;
		return `No todo numbered ${value}`;
	}
}
