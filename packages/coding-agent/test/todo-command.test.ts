import { describe, it, expect, beforeEach, vi } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import type { Agent } from "../src/core/agent.ts";
import type { SettingsManager } from "../src/core/settings-manager.ts";
import type { ExtensionRunner } from "../src/core/extensions/runner.ts";

describe("todo command", () => {
	let session: AgentSession;
	let mockAgent: Agent;
	let mockSettingsManager: SettingsManager;
	let mockExtensionRunner: ExtensionRunner;
	let emittedMessages: Array<{ role: string; content: string }> = [];

	beforeEach(() => {
		emittedMessages = [];

		// Mock the extension runner to capture emitted messages
		mockExtensionRunner = {
			emitMessage: vi.fn((msg) => {
				emittedMessages.push(msg);
			}),
			emitError: vi.fn(),
			emitInput: vi.fn(async () => ({ action: "pass" })),
			hasHandlers: vi.fn(() => false),
			getCommand: vi.fn(() => undefined),
			createCommandContext: vi.fn(() => ({})),
		} as any;

		// Mock the agent
		mockAgent = {
			id: "test-agent",
		} as any;

		// Mock the settings manager
		mockSettingsManager = {
			getImageAutoResize: vi.fn(() => true),
		} as any;

		// Create a session with mocked dependencies
		session = new AgentSession(mockAgent, mockSettingsManager, mockExtensionRunner);
	});

	it("should add a todo item when /todo is called with text", async () => {
		await session.prompt("/todo Buy groceries", { expandPromptTemplates: true });

		expect(emittedMessages).toHaveLength(1);
		expect(emittedMessages[0].content).toBe("Added todo: Buy groceries");
	});

	it("should list todos when /todo is called without arguments", async () => {
		await session.prompt("/todo Buy groceries", { expandPromptTemplates: true });
		emittedMessages = [];

		await session.prompt("/todo", { expandPromptTemplates: true });

		expect(emittedMessages).toHaveLength(1);
		expect(emittedMessages[0].content).toContain("Todos:");
		expect(emittedMessages[0].content).toContain("1. Buy groceries");
	});

	it("should show 'No todos yet' when listing empty todos", async () => {
		await session.prompt("/todo", { expandPromptTemplates: true });

		expect(emittedMessages).toHaveLength(1);
		expect(emittedMessages[0].content).toBe("No todos yet.");
	});

	it("should add multiple todos and list them in order", async () => {
		await session.prompt("/todo First task", { expandPromptTemplates: true });
		await session.prompt("/todo Second task", { expandPromptTemplates: true });
		emittedMessages = [];

		await session.prompt("/todo", { expandPromptTemplates: true });

		expect(emittedMessages).toHaveLength(1);
		expect(emittedMessages[0].content).toContain("1. First task");
		expect(emittedMessages[0].content).toContain("2. Second task");
	});

	it("should trim whitespace from todo items", async () => {
		await session.prompt("/todo   Trimmed task   ", { expandPromptTemplates: true });

		expect(emittedMessages).toHaveLength(1);
		expect(emittedMessages[0].content).toBe("Added todo: Trimmed task");
	});
});
