import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoArgument, TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("extracts the argument from the command line", () => {
		expect(parseTodoArgument("/todo")).toBe("");
		expect(parseTodoArgument("/todo   buy milk  ")).toBe("buy milk");
	});

	it("adds items and lists them in order", () => {
		const list = new TodoList();
		expect(list.format()).toBe("");
		expect(list.add("first")).toBe(1);
		expect(list.add("  second ")).toBe(2);
		expect(list.getItems()).toEqual(["first", "second"]);
		expect(list.format()).toBe("1. first\n2. second");
	});

	it("ignores empty text", () => {
		const list = new TodoList();
		expect(list.add("   ")).toBeUndefined();
		expect(list.getItems()).toEqual([]);
	});
});
