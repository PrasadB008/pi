import { describe, expect, it } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("reports an empty list", () => {
		expect(new TodoList().handle("/todo")).toContain("No todo items");
	});

	it("adds items and lists them in order", () => {
		const todo = new TodoList();
		expect(todo.handle("/todo write tests")).toBe("Todo added (1): write tests");
		expect(todo.handle("/todo   open PR  ")).toBe("Todo added (2): open PR");
		expect(todo.handle("/todo")).toBe("Todo:\n1. write tests\n2. open PR");
	});
});
