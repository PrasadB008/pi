import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("reports an empty list", () => {
		const items: string[] = [];
		expect(applyTodoCommand(items, "/todo")).toContain("No todos");
		expect(items).toEqual([]);
	});

	it("adds items and lists them in order", () => {
		const items: string[] = [];
		expect(applyTodoCommand(items, "/todo write tests")).toBe("Todo added (1): write tests");
		expect(applyTodoCommand(items, "/todo   update docs  ")).toBe("Todo added (2): update docs");
		expect(items).toEqual(["write tests", "update docs"]);
		expect(applyTodoCommand(items, "/todo")).toBe("Todos:\n  1. write tests\n  2. update docs");
	});

	it("does not add anything for whitespace-only text", () => {
		const items: string[] = ["a"];
		expect(applyTodoCommand(items, "/todo   ")).toBe("Todos:\n  1. a");
		expect(items).toEqual(["a"]);
	});
});
