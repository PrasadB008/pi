import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TODO_USAGE, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("shows an empty hint when there are no todos", () => {
		const list = new TodoList();
		const result = list.run("");
		expect(result.error).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds and lists todos", () => {
		const list = new TodoList();
		expect(list.run("add write tests").message).toBe("Added todo #1: write tests");
		list.run("add ship it");
		expect(list.run("").message).toBe("Todos (0/2 done)\n[ ] #1 write tests\n[ ] #2 ship it");
	});

	it("toggles completion by id", () => {
		const list = new TodoList();
		list.run("add a");
		expect(list.run("done 1").message).toBe("Todo #1 completed");
		expect(list.getItems()[0]?.done).toBe(true);
		expect(list.run("done #1").message).toBe("Todo #1 reopened");
	});

	it("removes and clears todos without reusing ids", () => {
		const list = new TodoList();
		list.run("add a");
		list.run("add b");
		expect(list.run("rm 1").message).toBe("Removed todo #1");
		list.run("add c");
		expect(list.getItems().map((i) => i.id)).toEqual([2, 3]);
		expect(list.run("clear").message).toBe("Cleared 2 todos");
		expect(list.getItems()).toHaveLength(0);
	});

	it("reports errors for bad input", () => {
		const list = new TodoList();
		expect(list.run("add")).toEqual({ message: TODO_USAGE, error: true });
		expect(list.run("bogus")).toEqual({ message: TODO_USAGE, error: true });
		expect(list.run("done 9")).toEqual({ message: "Todo not found: 9", error: true });
		expect(list.run("rm")).toEqual({ message: "Todo not found: (no id)", error: true });
	});
});
