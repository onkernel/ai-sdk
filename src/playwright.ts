import type Kernel from "@onkernel/sdk";
import type {
  PlaywrightExecuteResponse,
} from "@onkernel/sdk/resources/browsers/playwright";
import { tool } from "ai";
import { z } from "zod";

export type PlaywrightExecuteToolOptions = {
  client?: Kernel;
  sessionId?: string;
  toolDescription?: string;
};

export function playwrightExecuteTool(options: PlaywrightExecuteToolOptions) {
  const { client, sessionId, toolDescription } = options;
  if (!client) {
    throw new Error("playwrightExecuteTool: client is required");
  }
  if (!sessionId) {
    throw new Error("playwrightExecuteTool: sessionId is required");
  }

  return tool({
    description: toolDescription ??
      "Execute arbitrary Playwright code in an existing Kernel browser session. The code has access to `page`, `context`, and can optionally return a value that will be returned from the tool.",
    inputSchema: z
      .object({
        code: z
          .string()
          .min(1),
        timeout_sec: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional execution timeout in seconds (default 60)."),
      }),
    execute: async ({
      code,
      timeout_sec,
    }): Promise<PlaywrightExecuteResponse> => {
      return client.browsers.playwright.execute(sessionId, { code, timeout_sec });
    },
  });
}
