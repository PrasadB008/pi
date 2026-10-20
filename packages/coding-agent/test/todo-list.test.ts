import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { runTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("shows an empty message when there are no todos", () => {
		const list = new TodoList();
		const result = runTodoCommand(list, "");
		expect(result.isError).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds, completes, lists and removes todos", () => {
		const list = new TodoList();
		expect(runTodoCommand(list, " write tests ").message).toBe("Added todo 1: write tests");
		runTodoCommand(list, "ship it");
		expect(runTodoCommand(list, "done 1").message).toBe("Done: write tests");
		expect(runTodoCommand(list, "").message).toBe("[x] 1. write tests\n[ ] 2. ship it");
		expect(runTodoCommand(list, "rm 1").message).toBe("Removed todo 1");
		expect(list.getItems().map((item) => item.id)).toEqual([2]);
	});

	it("reports errors for bad ids", () => {
		const list = new TodoList();
		expect(runTodoCommand(list, "done 7")).toEqual({ message: "No todo with id 7", isError: true });
		expect(runTodoCommand(list, "rm abc")).toEqual({ message: "Usage: /todo rm <id>", isError: true });
	});

	it("clears all todos and treats other text starting with a keyword as a new todo", () => {
		const list = new TodoList();
		runTodoCommand(list, "clear the kitchen");
		runTodoCommand(list, "second");
		expect(list.getItems()).toHaveLength(2);
		runTodoCommand(list, "clear");
		expect(list.getItems()).toHaveLength(0);
	});
});
