import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds items in order and lists them", () => {
		const todos = new TodoList();
		expect(todos.list()).toEqual([]);
		expect(todos.add("write tests")).toBe(1);
		expect(todos.add("  ship it  ")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	it("ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBe(0);
		expect(todos.list()).toEqual([]);
	});

	it("returns a copy from list()", () => {
		const todos = new TodoList();
		todos.add("a");
		todos.list().push("b");
		expect(todos.list()).toEqual(["a"]);
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
