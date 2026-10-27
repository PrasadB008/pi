import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/modes/interactive/todo-list.ts";

describe("TodoList", () => {
	it("starts empty", () => {
		expect(new TodoList().list()).toEqual([]);
	});

	it("adds trimmed items in order", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe("write tests");
		todos.add("ship it");
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
