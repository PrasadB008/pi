import { describe, it, expect } from "vitest";
import { createTodoExtension } from "../src/extensions/todo/index.ts";

describe("todo extension", () => {
	it("adds and lists todos", async () => {
		const todos: string[] = [];
		const mockPi = {
			registerCommand: (name: string, config: { description: string; handler: (args: string) => Promise<string> }) => {
				if (name === "todo") {
					// Store the handler for testing
					(mockPi as any).todoHandler = config.handler;
				}
			},
		};

		const factory = createTodoExtension();
		factory(mockPi as any);

		const handler = (mockPi as any).todoHandler;
		expect(handler).toBeDefined();

		// Test listing empty todos
		let result = await handler("");
		expect(result).toBe("No todos yet.");

		// Test adding first todo
		result = await handler("Buy milk");
		expect(result).toBe("Added: Buy milk");

		// Test adding second todo
		result = await handler("Fix bug in parser");
		expect(result).toBe("Added: Fix bug in parser");

		// Test listing todos
		result = await handler("");
		expect(result).toBe("1. Buy milk\n2. Fix bug in parser");

		// Test adding third todo
		result = await handler("Review PR");
		expect(result).toBe("Added: Review PR");

		// Test listing all three todos
		result = await handler("");
		expect(result).toBe("1. Buy milk\n2. Fix bug in parser\n3. Review PR");
	});
});
