import { describe, expect, it } from "vitest";
import type { SessionEntry } from "../src/core/session-manager.ts";
import { formatTodos, getTodos, TODO_ENTRY_TYPE } from "../src/core/todo.ts";

function customEntry(customType: string, data: unknown): SessionEntry {
	return {
		type: "custom",
		id: Math.random().toString(36).slice(2),
		parentId: null,
		timestamp: new Date().toISOString(),
		customType,
		data,
	} as SessionEntry;
}

describe("todo", () => {
	it("collects todo entries in order and ignores other entries", () => {
		const entries = [
			customEntry(TODO_ENTRY_TYPE, { text: "first" }),
			customEntry("other", { text: "ignored" }),
			customEntry(TODO_ENTRY_TYPE, { text: 42 }),
			customEntry(TODO_ENTRY_TYPE, undefined),
			customEntry(TODO_ENTRY_TYPE, { text: "second" }),
		];
		expect(getTodos(entries)).toEqual(["first", "second"]);
	});

	it("formats a numbered list", () => {
		expect(formatTodos(["a", "b"])).toBe("Todos:\n1. a\n2. b");
	});

	it("formats a usage hint when empty", () => {
		expect(formatTodos([])).toContain("Usage: /todo <text>");
	});
});
