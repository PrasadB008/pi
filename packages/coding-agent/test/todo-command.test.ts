import { beforeEach, describe, expect, it } from "vitest";

/**
 * Todo list manager for the session.
 */
class TodoManager {
	private items: string[] = [];

	/**
	 * Add a todo item.
	 */
	addItem(text: string): void {
		this.items.push(text);
	}

	/**
	 * Get all todo items.
	 */
	getItems(): readonly string[] {
		return this.items;
	}

	/**
	 * Clear all todo items.
	 */
	clear(): void {
		this.items = [];
	}
}

describe("TodoManager", () => {
	let manager: TodoManager;

	beforeEach(() => {
		manager = new TodoManager();
	});

	it("should start with an empty list", () => {
		expect(manager.getItems()).toEqual([]);
	});

	it("should add a todo item", () => {
		manager.addItem("Buy groceries");
		expect(manager.getItems()).toEqual(["Buy groceries"]);
	});

	it("should add multiple todo items", () => {
		manager.addItem("Buy groceries");
		manager.addItem("Write tests");
		manager.addItem("Review PR");
		expect(manager.getItems()).toEqual(["Buy groceries", "Write tests", "Review PR"]);
	});

	it("should clear all todo items", () => {
		manager.addItem("Buy groceries");
		manager.addItem("Write tests");
		manager.clear();
		expect(manager.getItems()).toEqual([]);
	});

	it("should preserve order of items", () => {
		manager.addItem("First");
		manager.addItem("Second");
		manager.addItem("Third");
		const items = manager.getItems();
		expect(items[0]).toBe("First");
		expect(items[1]).toBe("Second");
		expect(items[2]).toBe("Third");
	});
});
