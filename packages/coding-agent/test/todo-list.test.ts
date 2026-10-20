import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TODO_USAGE, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("is registered as a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todo")).toBe(true);
	});

	it("lists when called without arguments", () => {
		expect(new TodoList().run("  ")).toEqual({ kind: "list" });
	});

	it("adds items and numbers them from 1", () => {
		const todos = new TodoList();
		todos.run("write tests");
		const result = todos.run("fix bug");
		expect(result).toEqual({ kind: "added", item: { text: "fix bug", done: false }, index: 2 });
		expect(todos.getItems().map((i) => i.text)).toEqual(["write tests", "fix bug"]);
	});

	it("marks an item done and rejects bad numbers", () => {
		const todos = new TodoList();
		todos.run("a");
		expect(todos.run("done 1")).toMatchObject({ kind: "toggled", index: 1 });
		expect(todos.getItems()[0]?.done).toBe(true);
		expect(todos.run("done 5")).toEqual({ kind: "error", message: "No todo #5" });
		expect(todos.run("done")).toEqual({ kind: "error", message: TODO_USAGE });
		expect(todos.run("done x")).toEqual({ kind: "error", message: TODO_USAGE });
	});

	it("clears all items", () => {
		const todos = new TodoList();
		todos.run("a");
		todos.run("b");
		expect(todos.run("clear")).toEqual({ kind: "cleared", count: 2 });
		expect(todos.getItems()).toHaveLength(0);
	});
});
