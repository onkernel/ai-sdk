import { anthropic } from "@ai-sdk/anthropic";
import { streamText, UIMessage } from "ai";
import { killBrowser } from "@/lib/kernel/utils";
import { createComputerTool } from "@/lib/kernel/tool";
import { prunedMessages } from "@/lib/utils";

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const {
    messages,
    sandboxId,
  }: {
    messages: UIMessage[];
    sandboxId: string;
  } = await req.json();

  try {
    // Log request to monitor token usage
    console.log(
      `[${new Date().toISOString()}] Chat request - Messages: ${
        messages.length
      }, SandboxId: ${sandboxId}`
    );

    const result = streamText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      system:
        "You are an autonomous agent with access to a computer. " +
        "Use the computer tool to help the user with their requests. " +
        "Do not provide conversational responses - just use the tools to complete the task. " +
        "Work silently and efficiently. Only use tools to perform actions. " +
        "If the browser opens with a setup wizard, YOU MUST IGNORE IT and move straight to the next step (e.g. input the url in the search bar).",
      messages: prunedMessages(messages),
      tools: {
        computer: createComputerTool(sandboxId),
      },
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    });

    // Create response stream
    const response = result.toDataStreamResponse({
      // @ts-expect-error - AI SDK type mismatch
      getErrorMessage(error) {
        console.error("Stream error:", error);

        return error;
      },
    });

    return response;
  } catch (error) {
    console.error("Chat API error:", error);

    // Force cleanup on error
    console.log(`killing browser with id: ${sandboxId}`);
    await killBrowser(sandboxId);

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
