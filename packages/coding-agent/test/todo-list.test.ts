import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("starts empty", () => {
		const todos = new TodoList();
		expect(todos.list()).toEqual([]);
		expect(todos.format()).toEqual([]);
	});

	it("adds items in order and lists them numbered", () => {
		const todos = new TodoList();
		expect(todos.add("write tests")).toBe(1);
		expect(todos.add("  update docs  ")).toBe(2);
		expect(todos.list()).toEqual(["write tests", "update docs"]);
		expect(todos.format()).toEqual(["1. write tests", "2. update docs"]);
	});

	it("ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBe(0);
		expect(todos.list()).toEqual([]);
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
