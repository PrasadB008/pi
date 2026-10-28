import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { runTodoCommand } from "../src/core/todo-command.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("reports an empty list", () => {
		expect(runTodoCommand([], "/todo")).toContain("No todo items");
	});

	it("adds items and lists them in order", () => {
		const items: string[] = [];
		expect(runTodoCommand(items, "/todo write tests")).toBe("Todo added (1): write tests");
		expect(runTodoCommand(items, "/todo   update docs  ")).toBe("Todo added (2): update docs");
		expect(items).toEqual(["write tests", "update docs"]);
		expect(runTodoCommand(items, "/todo")).toBe("Todo:\n  1. write tests\n  2. update docs");
	});

	it("does not mutate the list when listing", () => {
		const items = ["a"];
		runTodoCommand(items, "/todo");
		expect(items).toEqual(["a"]);
	});
});
