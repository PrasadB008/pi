export interface TodoItem {
	text: string;
	done: boolean;
}

export type TodoCommandResult =
	| { kind: "list" }
	| { kind: "added"; item: TodoItem; index: number }
	| { kind: "toggled"; item: TodoItem; index: number }
	| { kind: "cleared"; count: number }
	| { kind: "error"; message: string };

export const TODO_USAGE = "Usage: /todo [<text> | done <n> | clear]";

/** In-memory todo list driven by the arguments of the /todo slash command. */
export class TodoList {
	private items: TodoItem[] = [];

	getItems(): ReadonlyArray<TodoItem> {
		return this.items;
	}

	/** Apply the text after "/todo" and report what happened. */
	run(args: string): TodoCommandResult {
		const trimmed = args.trim();
		if (!trimmed) return { kind: "list" };

		if (trimmed === "clear") {
			const count = this.items.length;
			this.items = [];
			return { kind: "cleared", count };
		}

		const doneMatch = /^done(?:\s+(.*))?$/.exec(trimmed);
		if (doneMatch) {
			const arg = doneMatch[1]?.trim() ?? "";
			if (!/^\d+$/.test(arg)) return { kind: "error", message: TODO_USAGE };
			const index = Number(arg);
			const item = this.items[index - 1];
			if (!item) return { kind: "error", message: `No todo #${index}` };
			item.done = true;
			return { kind: "toggled", item, index };
		}

		const item: TodoItem = { text: trimmed, done: false };
		this.items.push(item);
		return { kind: "added", item, index: this.items.length };
	}
}
