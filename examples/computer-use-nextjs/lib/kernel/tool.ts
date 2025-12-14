import { anthropic } from "@ai-sdk/anthropic";
import { kernel, resolution } from ".";
import { computerTool } from "@onkernel/ai-sdk";

const wait = async (seconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

export const createComputerTool = (sessionId: string) =>
  computerTool({
    kernel,
    sessionId,
    displayWidthPx: resolution.x,
    displayHeightPx: resolution.y,
  });