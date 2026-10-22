/**
 * Handles `/todo <text>` (add an item) and `/todo` (list items).
 * Mutates `items` when an item is added and returns the message to show.
 */
export function runTodoCommand(items: string[], text: string): string {
	const item = text.replace(/^\/todo\s*/, "").trim();
	if (item) {
		items.push(item);
		return `Todo added (#${items.length}): ${item}`;
	}
	if (items.length === 0) {
		return "No todo items. Use /todo <text> to add one.";
	}
	return `Todo:\n${items.map((todo, index) => `${index + 1}. ${todo}`).join("\n")}`;
}
