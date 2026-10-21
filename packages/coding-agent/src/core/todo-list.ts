export interface TodoItem {
	text: string;
	done: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | remove <n> | clear]";

export interface TodoResult {
	/** Message to show. */
	message: string;
	/** True when the message reports a usage or input error. */
	isError: boolean;
}

/** In-memory todo list for one interactive session. */
export class TodoList {
	private items: TodoItem[] = [];

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	/** Run the arguments that follow `/todo` and return the text to display. */
	run(args: string): TodoResult {
		const trimmed = args.trim();
		if (!trimmed) {
			return { message: this.format(), isError: false };
		}

		const match = /^(\S+)\s*([\s\S]*)$/.exec(trimmed);
		const subcommand = (match?.[1] ?? "").toLowerCase();
		const rest = (match?.[2] ?? "").trim();

		switch (subcommand) {
			case "add": {
				if (!rest) return { message: "Usage: /todo add <text>", isError: true };
				this.items.push({ text: rest, done: false });
				return { message: `Added todo ${this.items.length}: ${rest}`, isError: false };
			}
			case "done": {
				const index = this.parseIndex(rest);
				if (index === undefined) return this.invalidIndex("done");
				const item = this.items[index];
				item.done = true;
				return { message: `Completed todo ${index + 1}: ${item.text}`, isError: false };
			}
			case "remove": {
				const index = this.parseIndex(rest);
				if (index === undefined) return this.invalidIndex("remove");
				const [removed] = this.items.splice(index, 1);
				return { message: `Removed todo ${index + 1}: ${removed.text}`, isError: false };
			}
			case "clear": {
				this.items = [];
				return { message: "Cleared todo list", isError: false };
			}
			default:
				return { message: TODO_USAGE, isError: true };
		}
	}

	private parseIndex(value: string): number | undefined {
		if (!/^\d+$/.test(value)) return undefined;
		const index = Number.parseInt(value, 10) - 1;
		return index >= 0 && index < this.items.length ? index : undefined;
	}

	private invalidIndex(subcommand: string): TodoResult {
		return {
			message:
				this.items.length === 0
					? "Todo list is empty"
					: `Usage: /todo ${subcommand} <n> (n is 1-${this.items.length})`,
			isError: true,
		};
	}

	private format(): string {
		if (this.items.length === 0) return "Todo list is empty. Add one with /todo add <text>";
		const lines = this.items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`);
		return `Todo:\n${lines.join("\n")}`;
	}
}
