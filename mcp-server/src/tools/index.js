/**
 * tools/index.js
 * Export all Task Master CLI tools for MCP server
 */

import logger from "../logger.js";
import { registerListTasksTool } from "./listTasks.js";
import { registerShowTaskTool } from "./showTask.js";
import { registerSetTaskStatusTool } from "./setTaskStatus.js";
import { registerExpandTaskTool } from "./expandTask.js";
import { registerNextTaskTool } from "./nextTask.js";
import { registerAddTaskTool } from "./addTask.js";
import { getWebInterfaceUrlTool, setServerInstanceAccessor } from "./getWebInterfaceUrl.js"; // Added

/**
 * Register all Task Master tools with the MCP server
 * @param {Object} taskMasterServer - The main TaskMasterMCPServer instance
 */
export function registerTaskMasterTools(taskMasterServer) {
  const server = taskMasterServer.server; // Get the FastMCP instance

  // Provide the getWebInterfaceUrl tool with a way to access the main server instance
  setServerInstanceAccessor(() => taskMasterServer);
  registerListTasksTool(server);
  registerShowTaskTool(server);
  registerSetTaskStatusTool(server);
  registerExpandTaskTool(server);
  registerNextTaskTool(server);
  registerAddTaskTool(server);
  server.addTool(getWebInterfaceUrlTool); // Added: Register the new tool
}

export default {
  registerTaskMasterTools,
};
