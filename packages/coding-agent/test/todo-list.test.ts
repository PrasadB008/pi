import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("registers /todo as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("parses /todo with and without text", () => {
		expect(parseTodoCommand("/todo")).toBe("");
		expect(parseTodoCommand("/todo  write tests ")).toBe("write tests");
		expect(parseTodoCommand("/todos")).toBeUndefined();
	});

	it("adds trimmed items and ignores empty text", () => {
		const list = new TodoList();
		expect(list.add("  first  ")).toBe(1);
		expect(list.add("   ")).toBeUndefined();
		expect(list.add("second")).toBe(2);
		expect(list.list()).toEqual(["first", "second"]);
	});

	it("formats an empty and a populated list", () => {
		expect(formatTodoList([])).toContain("No todo items");
		expect(formatTodoList(["a", "b"])).toBe("Todo:\n1. a\n2. b");
	});
});
