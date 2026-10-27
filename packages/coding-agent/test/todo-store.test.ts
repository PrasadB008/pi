import { describe, it, expect, beforeEach } from "vitest";
import { TodoStore } from "../src/core/todo-store.ts";

describe("TodoStore", () => {
	let store: TodoStore;

	beforeEach(() => {
		store = new TodoStore();
	});

	it("should add items to the store", () => {
		const item = store.addItem("Test todo");
		expect(item.text).toBe("Test todo");
		expect(item.id).toBeDefined();
		expect(item.createdAt).toBeDefined();
	});

	it("should list items in creation order", () => {
		store.addItem("First");
		store.addItem("Second");
		store.addItem("Third");

		const items = store.getItems();
		expect(items).toHaveLength(3);
		expect(items[0].text).toBe("First");
		expect(items[1].text).toBe("Second");
		expect(items[2].text).toBe("Third");
	});

	it("should clear all items", () => {
		store.addItem("Item 1");
		store.addItem("Item 2");
		expect(store.getItems()).toHaveLength(2);

		store.clear();
		expect(store.getItems()).toHaveLength(0);
	});

	it("should return empty array when no items", () => {
		const items = store.getItems();
		expect(items).toEqual([]);
	});

	it("should assign unique IDs to items", () => {
		const item1 = store.addItem("First");
		const item2 = store.addItem("Second");
		const item3 = store.addItem("Third");

		expect(item1.id).not.toBe(item2.id);
		expect(item2.id).not.toBe(item3.id);
		expect(item1.id).not.toBe(item3.id);
	});
});
