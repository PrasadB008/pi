import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TODO_USAGE, TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("reports an empty list", () => {
		const todo = new TodoList();
		const result = todo.run("");
		expect(result.isError).toBe(false);
		expect(result.lines[0]).toContain("No todo items");
	});

	it("adds, lists, completes, reopens, removes and clears items", () => {
		const todo = new TodoList();
		expect(todo.run("write tests").lines).toEqual(["Added todo 1: write tests"]);
		todo.run("ship it");
		expect(todo.run("").lines).toEqual(["1. [ ] write tests", "2. [ ] ship it"]);

		expect(todo.run("done 1").lines).toEqual(["Done: write tests"]);
		expect(todo.run("").lines[0]).toBe("1. [x] write tests");

		expect(todo.run("undone 1").lines).toEqual(["Reopened: write tests"]);
		expect(todo.getItems()[0].done).toBe(false);

		expect(todo.run("remove 1").lines).toEqual(["Removed: write tests"]);
		expect(todo.getItems().map((item) => item.text)).toEqual(["ship it"]);

		expect(todo.run("clear").lines).toEqual(["Cleared 1 todo item"]);
		expect(todo.getItems()).toHaveLength(0);
	});

	it("rejects invalid indexes and arguments", () => {
		const todo = new TodoList();
		todo.run("one");
		expect(todo.run("done 5")).toEqual({ lines: ["No todo item 5"], isError: true });
		expect(todo.run("done")).toEqual({ lines: [TODO_USAGE], isError: true });
		expect(todo.run("remove abc")).toEqual({ lines: [TODO_USAGE], isError: true });
		expect(todo.run("clear everything")).toEqual({ lines: [TODO_USAGE], isError: true });
		expect(todo.getItems()).toHaveLength(1);
	});
});
