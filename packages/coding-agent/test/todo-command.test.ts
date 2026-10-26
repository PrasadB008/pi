import { describe, expect, it } from "vitest";

/**
 * Parse a todo command and return the command name and arguments.
 */
function parseTodoCommand(text: string): { command: string; args: string } {
	const spaceIndex = text.indexOf(" ");
	const command = spaceIndex === -1 ? text.slice(1) : text.slice(1, spaceIndex);
	const args = spaceIndex === -1 ? "" : text.slice(spaceIndex + 1);
	return { command, args };
}

/**
 * Manage a todo list for a session.
 */
class TodoList {
	private items: string[] = [];

	add(item: string): void {
		this.items.push(item);
	}

	list(): string[] {
		return [...this.items];
	}

	clear(): void {
		this.items = [];
	}
}

describe("todo command", () => {
	it("parses /todo command without arguments", () => {
		const result = parseTodoCommand("/todo");
		expect(result.command).toBe("todo");
		expect(result.args).toBe("");
	});

	it("parses /todo command with arguments", () => {
		const result = parseTodoCommand("/todo fix bug in parser");
		expect(result.command).toBe("todo");
		expect(result.args).toBe("fix bug in parser");
	});

	it("adds items to todo list", () => {
		const todoList = new TodoList();
		todoList.add("implement feature");
		todoList.add("write tests");
		expect(todoList.list()).toEqual(["implement feature", "write tests"]);
	});

	it("lists empty todo list", () => {
		const todoList = new TodoList();
		expect(todoList.list()).toEqual([]);
	});

	it("clears todo list", () => {
		const todoList = new TodoList();
		todoList.add("item 1");
		todoList.add("item 2");
		todoList.clear();
		expect(todoList.list()).toEqual([]);
	});

	it("handles multiple todo items in sequence", () => {
		const todoList = new TodoList();
		const items = ["fix bug", "add tests", "update docs", "refactor code"];
		for (const item of items) {
			todoList.add(item);
		}
		expect(todoList.list()).toEqual(items);
	});

	it("preserves order of todo items", () => {
		const todoList = new TodoList();
		todoList.add("first");
		todoList.add("second");
		todoList.add("third");
		const list = todoList.list();
		expect(list[0]).toBe("first");
		expect(list[1]).toBe("second");
		expect(list[2]).toBe("third");
	});
});
