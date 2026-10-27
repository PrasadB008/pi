import { describe, expect, it } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { createInMemoryModelRegistry, getModelRuntime } from "./model-runtime-test-utils.ts";
import { createTestResourceLoader } from "./utilities.ts";

describe("Todo command", () => {
	async function createSession() {
		const resourceLoader = createTestResourceLoader();
		const modelRegistry = createInMemoryModelRegistry();
		const modelRuntime = getModelRuntime(modelRegistry);
		const authStorage = new AuthStorage(resourceLoader);
		const settingsManager = new SettingsManager(resourceLoader);
		const sessionManager = new SessionManager(resourceLoader, authStorage, settingsManager);

		const session = new AgentSession(
			resourceLoader,
			modelRegistry,
			modelRuntime,
			authStorage,
			settingsManager,
			sessionManager,
		);

		return session;
	}

	it("should start with empty todo list", async () => {
		const session = await createSession();
		expect(session.getTodoItems()).toEqual([]);
	});

	it("should add todo items", async () => {
		const session = await createSession();
		session.addTodoItem("First task");
		session.addTodoItem("Second task");

		const items = session.getTodoItems();
		expect(items).toEqual(["First task", "Second task"]);
	});

	it("should maintain todo items order", async () => {
		const session = await createSession();
		session.addTodoItem("Task 1");
		session.addTodoItem("Task 2");
		session.addTodoItem("Task 3");

		const items = session.getTodoItems();
		expect(items[0]).toBe("Task 1");
		expect(items[1]).toBe("Task 2");
		expect(items[2]).toBe("Task 3");
	});

	it("should return read-only array", async () => {
		const session = await createSession();
		session.addTodoItem("Task 1");

		const items = session.getTodoItems();
		expect(Array.isArray(items)).toBe(true);
		// Verify it's read-only by checking if it's frozen or a copy
		const originalLength = items.length;
		// @ts-expect-error - testing that the array is read-only
		items.push("Should not work");
		expect(session.getTodoItems().length).toBe(originalLength);
	});
});
