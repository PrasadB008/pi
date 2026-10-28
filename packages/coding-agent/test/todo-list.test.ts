import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoItems, parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("parses the argument text", () => {
		expect(parseTodoCommand("/todo")).toBe("");
		expect(parseTodoCommand("/todo   write tests  ")).toBe("write tests");
	});

	it("adds items, ignores empty text, and formats a numbered list", () => {
		const list = new TodoList();
		expect(list.add("  first ")).toBe("first");
		expect(list.add("   ")).toBeUndefined();
		list.add("second");
		expect(list.getItems()).toEqual(["first", "second"]);
		expect(formatTodoItems(list.getItems())).toBe("1. first\n2. second");
	});
});
