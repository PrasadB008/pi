import { describe, expect, it } from "vitest";
import { SessionManager } from "../src/core/session-manager.ts";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import {
	addTodo,
	completeTodo,
	formatTodos,
	getTodosFromEntries,
	parseTodoArgs,
	TODO_ENTRY_TYPE,
	TODO_USAGE,
} from "../src/core/todo.ts";

describe("parseTodoArgs", () => {
	it("lists when there are no arguments or the argument is list", () => {
		expect(parseTodoArgs("")).toEqual({ type: "list" });
		expect(parseTodoArgs("  ")).toEqual({ type: "list" });
		expect(parseTodoArgs(" list ")).toEqual({ type: "list" });
	});

	it("parses add with the remaining text", () => {
		expect(parseTodoArgs(" add write the tests ")).toEqual({ type: "add", text: "write the tests" });
	});

	it("parses done and complete with a number", () => {
		expect(parseTodoArgs("done 3")).toEqual({ type: "done", id: 3 });
		expect(parseTodoArgs("complete 12")).toEqual({ type: "done", id: 12 });
	});

	it("rejects missing or malformed arguments", () => {
		expect(parseTodoArgs("add")).toEqual({ type: "invalid", message: TODO_USAGE });
		expect(parseTodoArgs("done")).toEqual({ type: "invalid", message: TODO_USAGE });
		expect(parseTodoArgs("done abc")).toEqual({ type: "invalid", message: TODO_USAGE });
		expect(parseTodoArgs("done 1 2")).toEqual({ type: "invalid", message: TODO_USAGE });
		expect(parseTodoArgs("remove 1")).toEqual({ type: "invalid", message: TODO_USAGE });
	});
});

describe("todo list operations", () => {
	it("assigns increasing ids and does not mutate the input", () => {
		const first = addTodo([], "a");
		const second = addTodo(first.todos, "b");
		expect(second.added).toEqual({ id: 2, text: "b", done: false });
		expect(first.todos).toHaveLength(1);
		expect(second.todos.map((t) => t.id)).toEqual([1, 2]);
	});

	it("completes an item and reports unknown or already-done items", () => {
		const { todos } = addTodo(addTodo([], "a").todos, "b");
		const result = completeTodo(todos, 2);
		expect(result?.alreadyDone).toBe(false);
		expect(result?.todos.map((t) => t.done)).toEqual([false, true]);
		expect(todos.every((t) => !t.done)).toBe(true);

		expect(completeTodo(result?.todos ?? [], 2)?.alreadyDone).toBe(true);
		expect(completeTodo(todos, 99)).toBeUndefined();
	});

	it("does not reuse the id of a completed item", () => {
		const one = addTodo([], "a").todos;
		const done = completeTodo(one, 1)?.todos ?? [];
		expect(addTodo(done, "b").added.id).toBe(2);
	});

	it("formats an empty list and a mixed list", () => {
		expect(formatTodos([])).toContain("No todos");
		const text = formatTodos([
			{ id: 1, text: "a", done: true },
			{ id: 2, text: "b", done: false },
		]);
		expect(text).toContain("Todos (1 open, 1 done)");
		expect(text).toContain("[x] 1. a");
		expect(text).toContain("[ ] 2. b");
	});
});

describe("todo persistence in the session", () => {
	it("restores the latest snapshot from the session branch", () => {
		const session = SessionManager.inMemory();
		expect(getTodosFromEntries(session.getBranch())).toEqual([]);

		const added = addTodo([], "first");
		session.appendCustomEntry(TODO_ENTRY_TYPE, added.todos);
		const completed = completeTodo(added.todos, 1);
		session.appendCustomEntry(TODO_ENTRY_TYPE, completed?.todos);

		expect(getTodosFromEntries(session.getBranch())).toEqual([{ id: 1, text: "first", done: true }]);
	});

	it("ignores other custom entries and malformed data", () => {
		const session = SessionManager.inMemory();
		session.appendCustomEntry(TODO_ENTRY_TYPE, [{ id: 1, text: "ok", done: false }, { id: "x" }, null]);
		session.appendCustomEntry("other", [{ id: 5, text: "nope", done: false }]);
		expect(getTodosFromEntries(session.getBranch())).toEqual([{ id: 1, text: "ok", done: false }]);
	});
});

describe("todo slash command registration", () => {
	it("is a builtin command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
