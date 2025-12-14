import { Kernel } from "@onkernel/sdk";
import { anthropic } from "@ai-sdk/anthropic";

export interface ComputerToolOptions {
  kernel: Kernel;
  sessionId: string;
  displayWidthPx?: number;
  displayHeightPx?: number;
  displayNumber?: number;
}

const DEFAULT_RESOLUTION = { width: 1024, height: 768 };

const wait = async (seconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

/**
 * Creates an Anthropic computer use tool that integrates with OnKernel browser automation.
 * 
 * @param options - Configuration options for the computer tool
 * @returns An Anthropic computer tool configured to use OnKernel browser API
 * 
 * @example
 *
 * import { Kernel } from "@onkernel/sdk";
 * import { createComputerTool } from "@onkernel/ai";
 * import { streamText } from "ai";
 * import { anthropic } from "@ai-sdk/anthropic";
 * 
 * const kernel = new Kernel();
 * const browser = await kernel.browsers.create({
 *   headless: false,
 *   viewport: { width: 1024, height: 768 }
 * });
 * 
 * const result = streamText({
 *   model: anthropic("claude-3-7-sonnet-20250219"),
 *   tools: {
 *     computer: createComputerTool({
 *       kernel,
 *       sessionId: browser.session_id,
 *       displayWidthPx: 1024,
 *       displayHeightPx: 768
 *     })
 *   },
 *   messages: [{ role: "user", content: "Navigate to google.com" }]
 * });
 *  */
export function computerTool(options: ComputerToolOptions) {
  const {
    kernel,
    sessionId,
    displayWidthPx = DEFAULT_RESOLUTION.width,
    displayHeightPx = DEFAULT_RESOLUTION.height,
    displayNumber = 1,
  } = options;

  return anthropic.tools.computer_20250124({
    displayWidthPx,
    displayHeightPx,
    displayNumber,
    execute: async ({
      action,
      coordinate,
      text,
      duration,
      scroll_amount,
      scroll_direction,
      start_coordinate,
    }) => {
      switch (action) {
        case "screenshot": {
          const response = await kernel.browsers.computer.captureScreenshot(
            sessionId
          );
          const blob = await response.blob();
          const buffer = Buffer.from(await blob.arrayBuffer());
          const base64Data = buffer.toString("base64");
          return {
            type: "image" as const,
            data: base64Data,
          };
        }

        case "wait": {
          if (!duration) throw new Error("Duration required for wait action");
          const actualDuration = Math.min(duration, 2);
          await wait(actualDuration);
          return {
            type: "text" as const,
            text: `Waited for ${actualDuration} seconds`,
          };
        }

        case "left_click": {
          if (!coordinate)
            throw new Error("Coordinate required for left click action");
          const [x, y] = coordinate;
          await kernel.browsers.computer.clickMouse(sessionId, {
            x,
            y,
            button: "left",
          });
          return { type: "text" as const, text: `Left clicked at ${x}, ${y}` };
        }

        case "double_click": {
          if (!coordinate)
            throw new Error("Coordinate required for double click action");
          const [x, y] = coordinate;
          await kernel.browsers.computer.clickMouse(sessionId, {
            x,
            y,
            button: "left",
            num_clicks: 2,
          });
          return {
            type: "text" as const,
            text: `Double clicked at ${x}, ${y}`,
          };
        }

        case "right_click": {
          if (!coordinate)
            throw new Error("Coordinate required for right click action");
          const [x, y] = coordinate;
          await kernel.browsers.computer.clickMouse(sessionId, {
            x,
            y,
            button: "right",
          });
          return { type: "text" as const, text: `Right clicked at ${x}, ${y}` };
        }

        case "mouse_move": {
          if (!coordinate)
            throw new Error("Coordinate required for mouse move action");
          const [x, y] = coordinate;
          await kernel.browsers.computer.moveMouse(sessionId, { x, y });
          return { type: "text" as const, text: `Moved mouse to ${x}, ${y}` };
        }

        case "type": {
          if (!text) throw new Error("Text required for type action");
          await kernel.browsers.computer.typeText(sessionId, { text });
          return { type: "text" as const, text: `Typed: ${text}` };
        }

        case "key": {
          if (!text) throw new Error("Key required for key action");
          await kernel.browsers.computer.pressKey(sessionId, {
            keys: [text],
          });
          return { type: "text" as const, text: `Pressed key: ${text}` };
        }

        case "scroll": {
          if (!scroll_direction)
            throw new Error("Scroll direction required for scroll action");
          if (!scroll_amount)
            throw new Error("Scroll amount required for scroll action");

          // Default to center of screen if no coordinate provided
          const scrollX = coordinate ? coordinate[0] : displayWidthPx / 2;
          const scrollY = coordinate ? coordinate[1] : displayHeightPx / 2;

          // Calculate delta based on direction and amount
          // scroll_amount is typically in "clicks" - convert to pixels (1 click ≈ 120 pixels)
          const pixelsPerClick = 120;
          let delta_x = 0;
          let delta_y = 0;

          switch (scroll_direction) {
            case "up":
              delta_y = -scroll_amount * pixelsPerClick;
              break;
            case "down":
              delta_y = scroll_amount * pixelsPerClick;
              break;
            case "left":
              delta_x = -scroll_amount * pixelsPerClick;
              break;
            case "right":
              delta_x = scroll_amount * pixelsPerClick;
              break;
          }

          await kernel.browsers.computer.scroll(sessionId, {
            x: scrollX,
            y: scrollY,
            delta_x,
            delta_y,
          });
          return {
            type: "text" as const,
            text: `Scrolled ${scroll_direction} by ${scroll_amount}`,
          };
        }

        case "left_click_drag": {
          if (!start_coordinate || !coordinate)
            throw new Error(
              "Start and end coordinates required for drag action"
            );
          const [startX, startY] = start_coordinate;
          const [endX, endY] = coordinate;

          await kernel.browsers.computer.dragMouse(sessionId, {
            path: [
              [startX, startY],
              [endX, endY],
            ],
            button: "left",
          });
          return {
            type: "text" as const,
            text: `Dragged mouse from ${startX}, ${startY} to ${endX}, ${endY}`,
          };
        }

        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    },
    experimental_toToolResultContent(result) {
      if (typeof result === "string") {
        return [{ type: "text", text: result }];
      }
      if (result.type === "image" && result.data) {
        return [
          {
            type: "image",
            data: result.data,
            mimeType: "image/png",
          },
        ];
      }
      if (result.type === "text" && result.text) {
        return [{ type: "text", text: result.text }];
      }
      throw new Error("Invalid result format");
    },
  });
}