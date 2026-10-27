import { beforeEach, describe, expect, it } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { createTestAgent } from "./utilities.ts";

describe("Todo command", () => {
	let session: AgentSession;

	beforeEach(async () => {
		const agent = await createTestAgent();
		session = new AgentSession(agent, {});
	});

	it("should add a todo item", () => {
		session.addTodoItem("Fix bug in parser");
		const items = session.getTodoItems();
		expect(items).toHaveLength(1);
		expect(items[0]).toBe("Fix bug in parser");
	});

	it("should add multiple todo items", () => {
		session.addTodoItem("First task");
		session.addTodoItem("Second task");
		session.addTodoItem("Third task");
		const items = session.getTodoItems();
		expect(items).toHaveLength(3);
		expect(items).toEqual(["First task", "Second task", "Third task"]);
	});

	it("should return empty array when no items", () => {
		const items = session.getTodoItems();
		expect(items).toHaveLength(0);
	});

	it("should clear all todo items", () => {
		session.addTodoItem("Task 1");
		session.addTodoItem("Task 2");
		session.clearTodoItems();
		const items = session.getTodoItems();
		expect(items).toHaveLength(0);
	});

	it("should preserve order of todo items", () => {
		const tasks = ["Alpha", "Beta", "Gamma", "Delta"];
		tasks.forEach((task) => session.addTodoItem(task));
		const items = session.getTodoItems();
		expect(items).toEqual(tasks);
	});
});
