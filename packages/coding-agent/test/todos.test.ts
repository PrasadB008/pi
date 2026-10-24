import { describe, expect, it } from "vitest";
import { SessionManager } from "../src/core/session-manager.ts";
import { EMPTY_TODO_STATE, reconstructTodoState, runTodosCommand, TODOS_ENTRY_TYPE } from "../src/core/todos.ts";

describe("runTodosCommand", () => {
	it("lists an empty state", () => {
		const result = runTodosCommand(EMPTY_TODO_STATE, "");
		expect(result.state).toBeUndefined();
		expect(result.message).toContain("No todos");
	});

	it("adds, completes, reopens and removes items", () => {
		const added = runTodosCommand(EMPTY_TODO_STATE, "add write tests");
		expect(added.state?.items).toEqual([{ id: 1, text: "write tests", done: false }]);

		const done = runTodosCommand(added.state!, "done 1");
		expect(done.state?.items[0].done).toBe(true);
		expect(runTodosCommand(done.state!, "").message).toContain("[x] #1 write tests");

		const reopened = runTodosCommand(done.state!, "undo #1");
		expect(reopened.state?.items[0].done).toBe(false);

		const removed = runTodosCommand(reopened.state!, "rm 1");
		expect(removed.state).toEqual({ items: [], nextId: 2 });
	});

	it("reports errors without changing state", () => {
		expect(runTodosCommand(EMPTY_TODO_STATE, "add").isError).toBe(true);
		expect(runTodosCommand(EMPTY_TODO_STATE, "done 5").isError).toBe(true);
		expect(runTodosCommand(EMPTY_TODO_STATE, "rm abc").isError).toBe(true);
		expect(runTodosCommand(EMPTY_TODO_STATE, "bogus").isError).toBe(true);
	});

	it("clears all items", () => {
		const added = runTodosCommand(EMPTY_TODO_STATE, "add a");
		const cleared = runTodosCommand(added.state!, "clear");
		expect(cleared.state?.items).toEqual([]);
	});
});

describe("reconstructTodoState", () => {
	it("uses the latest snapshot on the branch and follows forks", () => {
		const session = SessionManager.inMemory();
		const first = runTodosCommand(EMPTY_TODO_STATE, "add one").state!;
		const firstId = session.appendCustomEntry(TODOS_ENTRY_TYPE, first);
		const second = runTodosCommand(first, "add two").state!;
		session.appendCustomEntry(TODOS_ENTRY_TYPE, second);

		expect(reconstructTodoState(session.getBranch()).items).toHaveLength(2);
		expect(reconstructTodoState(session.getBranch(firstId)).items).toHaveLength(1);
	});

	it("ignores malformed entries", () => {
		const session = SessionManager.inMemory();
		session.appendCustomEntry(TODOS_ENTRY_TYPE, { items: "nope" });
		expect(reconstructTodoState(session.getBranch())).toEqual(EMPTY_TODO_STATE);
	});
});
