/**
 * task-resources.js
 *
 * This module handles the registration of task-related resources for the MCP server.
 */

import logger from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Register task resources in the MCP server
 * @param {Object} server - The FastMCP server instance
 */
export function registerTaskResources(server) {
  logger.info('Registering task resources in MCP server');
  
  // Register task resources for different statuses
  registerTaskStatusResource(server, 'current', null);
  registerTaskStatusResource(server, 'completed', 'done');
  registerTaskStatusResource(server, 'pending', 'pending');
  registerTaskStatusResource(server, 'in-progress', 'in-progress');
  
  // Register a resource listing all available task resources
  server.addResource({
    uri: "tasks://index",
    content: {
      type: "application/json",
      data: {
        resources: [
          { name: "Current Tasks", uri: "tasks://current", description: "All tasks regardless of status" },
          { name: "Completed Tasks", uri: "tasks://completed", description: "Tasks with status 'done'" },
          { name: "Pending Tasks", uri: "tasks://pending", description: "Tasks with status 'pending'" },
          { name: "In-Progress Tasks", uri: "tasks://in-progress", description: "Tasks with status 'in-progress'" }
        ]
      }
    },
    metadata: {
      name: "Available Task Resources",
      category: "index"
    }
  });
  
  logger.info('Registered tasks index: tasks://index');
}

/**
 * Register a task resource for a specific status
 * @param {Object} server - The FastMCP server instance
 * @param {string} resourceName - The name of the resource (e.g., 'current', 'completed')
 * @param {string|null} status - The status to filter by, or null for all tasks
 */
function registerTaskStatusResource(server, resourceName, status) {
  // Load real tasks from tasks.json - no fallback, we MUST show actual tasks
  const tasksPath = path.resolve(process.cwd(), 'tasks/tasks.json');
  let realTasks = [];
  
  try {
    // Force reload the file every time to ensure latest data
    logger.info(`Loading real tasks from: ${tasksPath}`);
    const tasksContent = fs.readFileSync(tasksPath, 'utf8');
    const tasksData = JSON.parse(tasksContent);
    
    if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
      throw new Error('Invalid tasks.json format - tasks array not found');
    }
    
    // Convert tasks to the required format for the dashboard
    realTasks = tasksData.tasks.map(task => ({
      id: String(task.id),
      title: task.title,
      status: task.status,
      priority: task.priority,
      dependencies: task.dependencies ? task.dependencies.map(String) : []
    }));
    
    logger.info(`Successfully loaded ${realTasks.length} tasks from tasks.json`);
    console.log(`TASKS LOADED: ${realTasks.length} tasks found in ${tasksPath}`);
  } catch (error) {
    logger.error(`Error loading tasks from ${tasksPath}: ${error.message}`);
    logger.error('Falling back to empty task list');
    realTasks = [];
  }
  
  // Filter tasks by status if specified
  const filteredTasks = status
    ? realTasks.filter(task => task.status === status)
    : realTasks;
  
  // Provide the tasks as JSON data
  server.addResource({
    uri: `tasks://${resourceName}`,
    content: {
      type: "application/json",
      data: {
        tasks: filteredTasks,
        metadata: {
          count: filteredTasks.length,
          status: status,
          resourceName: resourceName
        }
      }
    },
    metadata: {
      name: `${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} Tasks`,
      category: "tasks",
      count: filteredTasks.length
    }
  });
  
  logger.info(`Registered task resource: tasks://${resourceName}`);
}