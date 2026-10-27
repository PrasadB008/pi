import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("starts empty", () => {
		const todos = new TodoList();
		expect(todos.list()).toEqual([]);
		expect(todos.format()).toEqual([]);
	});

	it("adds trimmed items and lists them numbered in order", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe("write tests");
		expect(todos.add("open PR")).toBe("open PR");
		expect(todos.list()).toEqual(["write tests", "open PR"]);
		expect(todos.format()).toEqual(["1. write tests", "2. open PR"]);
	});

	it("ignores empty or whitespace-only text", () => {
		const todos = new TodoList();
		expect(todos.add("")).toBeUndefined();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
