import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoArgument, TodoList } from "../src/core/todo-list.ts";

describe("todo list", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("parses the argument after /todo", () => {
		expect(parseTodoArgument("/todo")).toBe("");
		expect(parseTodoArgument("/todo   buy milk  ")).toBe("buy milk");
	});

	it("adds trimmed items and ignores empty text", () => {
		const list = new TodoList();
		expect(list.add("  write tests ")).toBe("write tests");
		expect(list.add("   ")).toBeUndefined();
		expect(list.list()).toEqual(["write tests"]);
	});

	it("formats numbered items and an empty hint", () => {
		expect(formatTodoList(["a", "b"])).toBe("1. a\n2. b");
		expect(formatTodoList([])).toContain("No todos yet");
	});
});
