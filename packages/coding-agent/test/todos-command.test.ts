import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { runTodosCommand, TodoStore } from "../src/core/todos.ts";

describe("/todos command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((c) => c.name === "todos")).toBe(true);
	});

	it("lists an empty store", () => {
		const result = runTodosCommand(new TodoStore(), "");
		expect(result.isError).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds, completes, reopens and removes todos", () => {
		const store = new TodoStore();
		expect(runTodosCommand(store, "add write tests").message).toBe("Added #1: write tests");
		runTodosCommand(store, "add ship it");

		expect(runTodosCommand(store, "done #1").message).toBe("Completed #1: write tests");
		expect(runTodosCommand(store, "").message).toBe("- [x] #1: write tests\n- [ ] #2: ship it\n\n1/2 completed");

		expect(runTodosCommand(store, "undo 1").message).toBe("Reopened #1: write tests");
		expect(runTodosCommand(store, "remove 2").message).toBe("Removed #2");
		expect(store.list()).toHaveLength(1);

		runTodosCommand(store, "clear");
		expect(store.list()).toHaveLength(0);
	});

	it("reports usage problems and unknown ids as errors", () => {
		const store = new TodoStore();
		expect(runTodosCommand(store, "add").isError).toBe(true);
		expect(runTodosCommand(store, "done abc").isError).toBe(true);
		expect(runTodosCommand(store, "done 9").message).toBe("No todo #9");
		expect(runTodosCommand(store, "bogus").isError).toBe(true);
	});
});
