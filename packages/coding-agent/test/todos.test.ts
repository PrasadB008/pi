import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { formatTodosMarkdown, getTodosFromBranch } from "../src/core/todos.ts";

function toolResultEntry(id: string, toolName: string, details: unknown): SessionEntry {
	return {
		type: "message",
		id,
		parentId: null,
		timestamp: new Date(0).toISOString(),
		message: {
			role: "toolResult",
			toolCallId: id,
			toolName,
			content: [{ type: "text", text: "ok" }],
			details,
			isError: false,
			timestamp: 0,
		},
	} as SessionEntry;
}

describe("getTodosFromBranch", () => {
	it("returns an empty list when no todo tool result exists", () => {
		expect(getTodosFromBranch([toolResultEntry("a", "read", { todos: [] })])).toEqual([]);
	});

	it("uses the most recent todo tool result", () => {
		const entries = [
			toolResultEntry("a", "todo", { todos: [{ id: 1, text: "old", done: false }] }),
			toolResultEntry("b", "todo", {
				todos: [
					{ id: 1, text: "old", done: true },
					{ id: 2, text: "new", done: false },
				],
			}),
		];
		expect(getTodosFromBranch(entries).map((t) => t.id)).toEqual([1, 2]);
	});

	it("ignores malformed todo items", () => {
		const entries = [toolResultEntry("a", "todo", { todos: [{ id: 1, text: "ok", done: false }, { id: "x" }] })];
		expect(getTodosFromBranch(entries)).toHaveLength(1);
	});
});

describe("formatTodosMarkdown", () => {
	it("renders an empty message", () => {
		expect(formatTodosMarkdown([])).toBe("No todos on the current branch.");
	});

	it("renders a checklist with a completion count", () => {
		const text = formatTodosMarkdown([
			{ id: 1, text: "a", done: true },
			{ id: 2, text: "b", done: false },
		]);
		expect(text).toBe("1/2 completed\n\n- [x] #1 a\n- [ ] #2 b");
	});
});
