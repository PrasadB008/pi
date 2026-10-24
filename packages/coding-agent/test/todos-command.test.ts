import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { runTodosCommand, TODOS_USAGE, TodoStore } from "../src/core/todos.ts";

describe("/todos command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todos")).toBe(true);
	});

	it("shows an empty list message", () => {
		const store = new TodoStore();
		expect(runTodosCommand(store, "").message).toContain("No todos");
	});

	it("adds, completes, lists, removes and clears todos", () => {
		const store = new TodoStore();
		expect(runTodosCommand(store, " add write tests ").message).toBe("Added #1: write tests");
		runTodosCommand(store, "add ship it");

		expect(runTodosCommand(store, "done #1").message).toBe("Todo #1 completed");
		const list = runTodosCommand(store, "").message;
		expect(list).toContain("(1/2 done)");
		expect(list).toContain("- [x] #1 write tests");
		expect(list).toContain("- [ ] #2 ship it");

		expect(runTodosCommand(store, "done 1").message).toBe("Todo #1 reopened");
		expect(runTodosCommand(store, "rm 2").message).toBe("Removed #2");
		expect(runTodosCommand(store, "clear").message).toBe("Cleared 1 todos");
		expect(runTodosCommand(store, "add again").message).toBe("Added #1: again");
	});

	it("reports bad input", () => {
		const store = new TodoStore();
		expect(runTodosCommand(store, "add").message).toBe(TODOS_USAGE);
		expect(runTodosCommand(store, "done abc").message).toBe(TODOS_USAGE);
		expect(runTodosCommand(store, "bogus").message).toBe(TODOS_USAGE);
		expect(runTodosCommand(store, "done 9").message).toBe("Todo #9 not found");
		expect(runTodosCommand(store, "rm 9").message).toBe("Todo #9 not found");
	});
});
