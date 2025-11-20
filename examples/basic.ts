import { openai } from '@ai-sdk/openai';
import Kernel from "@onkernel/sdk";
import { generateText } from "ai";
import { writeFileSync } from "fs";
import { playwrightExecuteTool } from "../src";

async function main() {
  const kernelApiKey = process.env.KERNEL_API_KEY;
  if (!kernelApiKey) {
    throw new Error(
      "Set KERNEL_API_KEY in your environment before running this example."
    );
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error(
      "Set OPENAI_API_KEY (or update the example to use another provider)."
    );
  }

  const model = openai("gpt-5.1");
  const client = new Kernel({ apiKey: kernelApiKey });
  const browser = await client.browsers.create({});
  console.log("Started browser session:", browser.session_id);

  const playwrightTool = playwrightExecuteTool({
    client,
    sessionId: browser.session_id,
  });

  try {
    const result = await generateText({
      model,
      prompt:
        "Use the Playwright tool to open https://example.com, read the H1 text, and summarize the page.",
      tools: {
        "playwright_execute": playwrightTool,
      },
    });

    console.log("LLM response:", result.text);
    const screenshot = await client.browsers.computer.captureScreenshot(browser.session_id);
    writeFileSync("screenshot.png", Buffer.from(await screenshot.arrayBuffer()));
    if (result.toolResults.length) {
      console.dir(result.toolResults, { depth: null });
    }
  } finally {
    await client.browsers.deleteByID(browser.session_id);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
