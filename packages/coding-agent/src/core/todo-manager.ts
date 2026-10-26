/**
 * Simple todo list manager for the session.
 */

export interface TodoManager {
	add(text: string): void;
	list(): string[];
	clear(): void;
}

export function createTodoManager(): TodoManager {
	const items: string[] = [];

	return {
		add(text: string): void {
			items.push(text);
		},
		list(): string[] {
			return [...items];
		},
		clear(): void {
			items.length = 0;
		},
	};
}
