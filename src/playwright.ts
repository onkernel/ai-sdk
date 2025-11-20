import { tool } from "ai";
import { z } from "zod";

export interface CreateKernelPlaywrightToolsOptions {
  client: any; // Kernel SDK client instance
  sessionId: string;
  toolName?: string; // default: "playwright_execute"
}

export type PlaywrightExecuteInput = z.infer<typeof playwrightParameters>;

const playwrightParameters = z
  .object({
    steps: z
      .array(
        z.object({
          action: z
            .enum([
              "goto",
              "click",
              "fill",
              "type",
              "press",
              "waitForSelector",
              "waitForTimeout",
              "screenshot",
              "evaluate",
              "hover",
              "check",
              "uncheck",
              "selectOption",
            ])
            .describe("Playwright action to perform"),
          selector: z.string().optional().describe("CSS/XPath selector"),
          text: z.string().optional().describe("Text to type or fill"),
          url: z.string().optional().describe("URL to navigate to"),
          value: z.any().optional().describe("Generic value/argument"),
          options: z.record(z.any()).optional().describe("Action options"),
          script: z.string().optional().describe("JS for evaluate"),
        })
      )
      .nonempty()
      .describe("Sequential steps to run"),
    returnHtml: z
      .boolean()
      .optional()
      .describe("Return page HTML after actions"),
    screenshot: z
      .enum(["none", "viewport", "full"]) // viewport = default page.screenshot()
      .optional()
      .default("none")
      .describe("Include screenshot in the result"),
    timeoutMs: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Overall execution timeout in ms"),
    metadata: z
      .record(z.any())
      .optional()
      .describe("Additional metadata to pass through"),
  })
  .describe("Structured Playwright steps to execute via Kernel SDK.");

export function createKernelPlaywrightTools(options: CreateKernelPlaywrightToolsOptions) {
  const { client, sessionId, toolName = "playwright_execute" } = options;

  if (!client) {
    throw new Error("createKernelPlaywrightTools: client is required");
  }
  if (!sessionId) {
    throw new Error("createKernelPlaywrightTools: sessionId is required");
  }

  const playwrightTool = tool({
    description:
      "Execute Playwright actions in an existing Kernel browser session.",
    parameters: playwrightParameters,
    execute: async (input: PlaywrightExecuteInput): Promise<any> => {
      const payload = {
        sessionId,
        steps: input.steps,
        returnHtml: input.returnHtml,
        screenshot: input.screenshot,
        timeoutMs: input.timeoutMs,
        metadata: input.metadata,
      };

      const resource = client?.browsers?.playwright ?? client?.playwright;
      if (!resource) {
        throw new Error("Kernel client missing browsers.playwright resource");
      }

      const maybeExecute =
        resource.execute ?? resource.run ?? resource.perform ?? resource.call;

      if (typeof maybeExecute !== "function") {
        // Fall back to generic HTTP-like methods if exposed by the SDK
        if (typeof client?.request === "function") {
          return await client.request("browsers.playwright.execute", payload);
        }
        if (typeof client?.post === "function") {
          return await client.post("/browsers/playwright/execute", payload);
        }
        throw new Error(
          "Kernel Playwright resource has no callable execute/run method"
        );
      }

      return await maybeExecute.call(resource, payload);
    },
  });

  return {
    [toolName]: playwrightTool,
  } as const;
}
