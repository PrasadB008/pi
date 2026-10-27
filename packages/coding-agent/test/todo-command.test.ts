import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { runTodoCommand } from "../src/core/todo-command.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("lists an empty list when called alone", () => {
		expect(runTodoCommand("/todo", [])).toEqual({ kind: "list", items: [] });
	});

	it("adds items in order and lists them", () => {
		const first = runTodoCommand("/todo write tests", []);
		expect(first).toEqual({ kind: "added", items: ["write tests"], added: "write tests" });
		const second = runTodoCommand("/todo   ship it  ", first.items);
		expect(second.items).toEqual(["write tests", "ship it"]);
		expect(runTodoCommand("/todo", second.items)).toEqual({ kind: "list", items: ["write tests", "ship it"] });
	});

	it("does not mutate the input list", () => {
		const items = ["a"];
		runTodoCommand("/todo b", items);
		expect(items).toEqual(["a"]);
	});
});
