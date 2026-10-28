/**
 * Apply a `/todo` command line to a todo list.
 *
 * `/todo <text>` appends <text> to `items`; `/todo` alone only lists them.
 * Mutates `items` and returns the message to show the user.
 */
export function applyTodoCommand(items: string[], text: string): string {
	const item = text.replace(/^\/todo\s*/, "").trim();
	if (item) {
		items.push(item);
		return `Todo added (${items.length}): ${item}`;
	}
	if (items.length === 0) {
		return "No todos. Add one with /todo <text>";
	}
	return ["Todos:", ...items.map((todo, index) => `  ${index + 1}. ${todo}`)].join("\n");
}
