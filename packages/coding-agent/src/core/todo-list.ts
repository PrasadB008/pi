/** In-memory todo list for the current interactive process. */
export class TodoList {
	private readonly items: string[] = [];

	/** Adds a trimmed item. Returns the new item count, or undefined when the text is empty. */
	add(text: string): number | undefined {
		const trimmed = text.trim();
		if (!trimmed) return undefined;
		this.items.push(trimmed);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}

	clear(): void {
		this.items.length = 0;
	}
}

/** Returns the argument of a `/todo` command, or undefined when text is not a `/todo` command. */
export function parseTodoCommand(text: string): string | undefined {
	if (text === "/todo") return "";
	if (text.startsWith("/todo ")) return text.slice("/todo ".length).trim();
	return undefined;
}

export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) return "No todo items. Add one with /todo <text>";
	return ["Todo:", ...items.map((item, index) => `${index + 1}. ${item}`)].join("\n");
}
