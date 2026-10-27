import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { parseTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("parses /todo arguments", () => {
		expect(parseTodoCommand("/todo")).toBe("");
		expect(parseTodoCommand("/todo   write tests  ")).toBe("write tests");
		expect(parseTodoCommand("/todos")).toBeUndefined();
		expect(parseTodoCommand("hello")).toBeUndefined();
	});

	it("adds trimmed items in order and ignores blank text", () => {
		const list = new TodoList();
		expect(list.list()).toEqual([]);
		expect(list.add("  first ")).toBe(1);
		expect(list.add("second")).toBe(2);
		expect(list.add("   ")).toBeUndefined();
		expect(list.list()).toEqual(["first", "second"]);
	});
});
