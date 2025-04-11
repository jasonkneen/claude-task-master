#!/usr/bin/env node

/**
 * Simple MCP Server
 *
 * This script creates a simple MCP server with a single tool.
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";

// Create a new FastMCP server
const server = new FastMCP({
  name: "Simple MCP Server",
  version: "1.0.0",
});

// Add a simple tool
server.addTool({
  name: "hello",
  description: "Say hello",
  parameters: z.object({
    name: z.string().optional().describe("Name to greet"),
  }),
  execute: async (args, { log }) => {
    const name = args.name || "World";
    log.info(`Saying hello to ${name}`);
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${name}!`,
        },
      ],
    };
  },
});

// Start the server
server.start({
  transportType: "stdio",
  silent: false, // Show ping messages
});

console.log("Simple MCP server started");