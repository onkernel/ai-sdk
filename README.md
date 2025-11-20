# @onkernel/ai-sdk

Vercel AI SDK-compatible tools for the [Kernel](https://docs.onkernel.com) SDK. This package exposes a Playwright execution tool wired to an existing Kernel browser session, so LLMs can browse and act via structured tools.

## Install

```bash
npm install @onkernel/ai-sdk zod
# Ensure your app depends on the Vercel AI SDK and @onkernel/sdk
npm install ai @onkernel/sdk
```

> Note: `@onkernel/sdk` is a peer dependency; install it in your application.

## Usage

```ts
import { playwrightExecuteTool } from "@onkernel/ai-sdk";
import Kernel from "@onkernel/sdk";
import { generateText } from "ai";

// 1) Create Kernel client and start a browser session
const client = new Kernel({
  apiKey: process.env["KERNEL_API_KEY"], // optional, default env lookup
});
const browser = await client.browsers.create({ browser: "chromium" });
const sessionId = browser.session_id;
console.log(sessionId);

// 2) Create the Playwright execution tool
const playwrightTool = playwrightExecuteTool({ client, sessionId });

// 3) Use with Vercel AI SDK
const model = ...; // your AI model instance

const result = await generateText({
  model,
  prompt: "Open example.com and click the first link",
  tools: {
    playwright_execute: playwrightTool,
  },
});
```

### Tool shape

`playwrightExecuteTool` returns a single Vercel AI SDK tool instance.
The tool's input mirrors `PlaywrightExecuteParams` from the Kernel SDK:

```ts
{
  code: string;        // required JavaScript/TypeScript snippet
  timeout_sec?: number; // optional execution timeout in seconds (default 60)
}
```

Under the hood we call `client.browsers.playwright.execute(sessionId, { code, timeout_sec })`, so any code you can run through the SDK can be run via the tool.

## API

```ts
function playwrightExecuteTool(options: {
  client: Kernel; // Kernel SDK client instance (@onkernel/sdk)
  sessionId: string; // Existing browser session id
}): ReturnType<typeof tool>;
```

## Examples

Run the sample script in `examples/basic.ts` after exporting both `KERNEL_API_KEY`
and a model provider key (the example uses OpenAI):

```bash
export KERNEL_API_KEY=...
export OPENAI_API_KEY=...
pnpm exec tsx examples/basic.ts
```

The script mirrors the usage above: it starts a browser session, registers the
`playwright_execute` tool, calls `generateText` from the Vercel AI SDK (forcing the
model to invoke the tool), logs the model response/tool results, and then cleans up
the browser session.

## License

MIT © Kernel
