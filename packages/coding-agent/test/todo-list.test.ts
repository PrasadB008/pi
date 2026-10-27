import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds trimmed items and returns their 1-based numbers", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests  ")).toBe(1);
		expect(todos.add("ship it")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("formats an empty list with a hint and a populated list as numbered lines", () => {
		const todos = new TodoList();
		expect(todos.format()).toBe("No todo items. Use /todo <text> to add one.");
		todos.add("first");
		todos.add("second");
		expect(todos.format()).toBe("Todo list:\n1. first\n2. second");
	});

	it("clears items", () => {
		const todos = new TodoList();
		todos.add("x");
		todos.clear();
		expect(todos.list()).toEqual([]);
	});

	it("ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});
});

describe("/todo built-in command", () => {
	it("is registered", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
