# @onkernel/ai-sdk

Vercel AI SDK-compatible tools for the Onkernel Kernel SDK. This package exposes a Playwright execution tool wired to an existing Kernel browser session, so LLMs can browse and act via structured tools.

## Install

```bash
npm install @onkernel/ai-sdk zod
# Ensure your app depends on the Vercel AI SDK
npm install ai
```

> Note: `@onkernel/sdk` is a peer dependency; install it in your application.

## Usage

```ts
import { createKernelPlaywrightTools } from '@onkernel/ai-sdk';
import { createClient } from '@onkernel/sdk';
import { generateText } from 'ai';

// 1) Create Kernel client and start a browser session
const client = createClient({ apiKey: process.env.KERNEL_API_KEY! });
const { id: sessionId } = await client.browsers.start({ browser: 'chromium' });

// 2) Create tools for the AI SDK
const tools = createKernelPlaywrightTools({ client, sessionId });

// 3) Use with Vercel AI SDK
const result = await generateText({
  model, // your model
  prompt: 'Open example.com and click the first link',
  tools,
});
```

### Tool shape

The exported registry contains a single tool named `playwright_execute` by default. You can customize the name with the `toolName` option.

Parameters schema (Zod):

```ts
{
  steps: Array<{
    action: 'goto' | 'click' | 'fill' | 'type' | 'press' | 'waitForSelector' |
            'waitForTimeout' | 'screenshot' | 'evaluate' | 'hover' | 'check' |
            'uncheck' | 'selectOption';
    selector?: string;
    text?: string;
    url?: string;
    value?: unknown;
    options?: Record<string, unknown>;
    script?: string; // for evaluate
  }>,
  returnHtml?: boolean,
  screenshot?: 'none' | 'viewport' | 'full',
  timeoutMs?: number,
  metadata?: Record<string, unknown>,
}
```

The tool uses the Kernel SDK Playwright resource under `client.browsers.playwright` and calls its `execute` (or `run`) method with `{ sessionId, ... }`.

## API

```ts
function createKernelPlaywrightTools(options: {
  client: any;         // Kernel SDK client instance (@onkernel/sdk)
  sessionId: string;   // Existing browser session id
  toolName?: string;   // Optional custom tool name, default 'playwright_execute'
}): { [toolName: string]: ReturnType<typeof tool> }
```

## License

MIT © Onkernel
