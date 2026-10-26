import { describe, expect, it } from "vitest";
import { createTodoManager } from "../src/core/todo-manager.ts";

describe("TodoManager", () => {
	it("adds items to the todo list", () => {
		const manager = createTodoManager();
		manager.add("Buy groceries");
		manager.add("Fix bug #123");

		const items = manager.list();
		expect(items).toEqual(["Buy groceries", "Fix bug #123"]);
	});

	it("returns empty list initially", () => {
		const manager = createTodoManager();
		expect(manager.list()).toEqual([]);
	});

	it("clears all items", () => {
		const manager = createTodoManager();
		manager.add("Item 1");
		manager.add("Item 2");
		manager.clear();

		expect(manager.list()).toEqual([]);
	});

	it("preserves order of items", () => {
		const manager = createTodoManager();
		manager.add("First");
		manager.add("Second");
		manager.add("Third");

		expect(manager.list()).toEqual(["First", "Second", "Third"]);
	});

	it("returns a copy of the list", () => {
		const manager = createTodoManager();
		manager.add("Item 1");

		const list1 = manager.list();
		list1.push("Item 2");

		const list2 = manager.list();
		expect(list2).toEqual(["Item 1"]);
	});
});
