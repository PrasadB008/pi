import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, parseTodoArgument, TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		const command = BUILTIN_SLASH_COMMANDS.find((c) => c.name === "todo");
		expect(command?.argumentHint).toBe("<text>");
	});

	it("extracts the argument from the command text", () => {
		expect(parseTodoArgument("/todo")).toBe("");
		expect(parseTodoArgument("/todo   ")).toBe("");
		expect(parseTodoArgument("/todo write tests ")).toBe("write tests");
	});

	it("adds items and lists them in order", () => {
		const todos = new TodoList();
		expect(todos.list()).toEqual([]);
		expect(todos.add("first")).toBe("first");
		expect(todos.add("  second  ")).toBe("second");
		expect(todos.list()).toEqual(["first", "second"]);
	});

	it("ignores empty text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});

	it("formats items as a numbered list", () => {
		expect(formatTodoList(["a", "b"])).toBe("1. a\n2. b");
	});
});
