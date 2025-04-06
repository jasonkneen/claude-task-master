import { FastMCP } from "fastmcp";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import fs from "fs";
import express from "express";
import cors from "cors";
import findFreePort from "find-free-port";
import logger from "./logger.js";
import { registerTaskMasterTools } from "./tools/index.js";
import { registerRooResources } from "./mcp-resources.js";
import { listTasksLogic } from "./tools/listTasks.js"; // Added for API endpoint
import { showTaskLogic } from "./tools/showTask.js"; // Added for API endpoint

// Load environment variables
dotenv.config();

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main MCP server class that integrates with Task Master
 */
class TaskMasterMCPServer {
  /**
   * @typedef {Object} TaskMasterMCPServerOptions
   * @property {string} [projectName] - The project name to use in resource variables
   * @property {boolean} [enableRooResources=true] - Whether to enable Roo resources
   */
  
  /**
   * Create a new TaskMasterMCPServer
   * @param {TaskMasterMCPServerOptions} options - Server options
   */
  constructor(options = {}) {
    this.options = {
      projectName: options.projectName || 'Task Master',
      enableRooResources: options.enableRooResources !== false
    };
    
    // Get version from package.json using synchronous fs
    const packagePath = path.join(__dirname, "../../package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    this.serverOptions = {
      name: "Task Master MCP Server",
      version: packageJson.version,
    };

    this.server = new FastMCP(this.serverOptions);
    this.webApp = express();
    this.webPort = null;
    this.httpServer = null; // Added: Placeholder for the HTTP server instance
    this.initialized = false;

    // this.server.addResource({});

    // this.server.addResourceTemplate({});

    // Bind methods
    this.init = this.init.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);

    // Setup logging
    this.logger = logger;
  }

  /**
   * Initialize the MCP server with necessary tools and routes
   */
  async init() {
    if (this.initialized) return;

    // Register Task Master tools
    registerTaskMasterTools(this);
    
    // Register Roo resources if enabled
    if (this.options.enableRooResources) {
      registerRooResources(this.server, {
        projectName: this.options.projectName
      });
    }

    // Configure Express middleware
    this.webApp.use(cors()); // Enable CORS
    this.webApp.use(express.json()); // Enable JSON body parsing

    // --- Web UI Serving Strategy ---
    // Determine if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      this.logger.info('Running in development mode');
      
      // In development mode, we'll use Vite's development server middleware
      try {
        // Dynamically import Vite
        const { createServer } = await import('vite');
        
        // Create Vite server in middleware mode
        const vite = await createServer({
          root: path.join(__dirname, '../web-ui'),
          server: { middlewareMode: true },
          appType: 'spa'
        });
        
        // Use Vite's connect instance as middleware
        this.webApp.use(vite.middlewares);
        
        this.logger.info('Vite development server middleware initialized');
      } catch (error) {
        this.logger.error(`Failed to initialize Vite development server: ${error.message}`);
        this.logger.info('Falling back to static file serving');
        
        // Fall back to static file serving
        const webUiBuildPath = path.join(__dirname, '../web-ui/dist');
        if (fs.existsSync(webUiBuildPath)) {
          this.logger.info(`Serving static files from: ${webUiBuildPath}`);
          this.webApp.use(express.static(webUiBuildPath));
        } else {
          this.logger.warn(`Web UI build directory not found: ${webUiBuildPath}`);
          this.webApp.get('/', (req, res) => {
            res.status(404).send('Web UI not built. Run build command in mcp-server/web-ui.');
          });
        }
      }
    } else {
      // In production mode, serve static files
      const webUiBuildPath = path.join(__dirname, '../web-ui/dist');
      if (fs.existsSync(webUiBuildPath)) {
        this.logger.info(`Serving static files from: ${webUiBuildPath}`);
        this.webApp.use(express.static(webUiBuildPath));
      } else {
        this.logger.warn(`Web UI build directory not found: ${webUiBuildPath}`);
        this.webApp.get('/', (req, res) => {
          res.status(404).send('Web UI not built. Run build command in mcp-server/web-ui.');
        });
      }
      
      // --- SPA Fallback Route (Serve AFTER specific API routes and static files) ---
      // This ensures that direct navigation to frontend routes works correctly
      if (process.env.NODE_ENV === 'production') {
        const webUiBuildPath = path.join(__dirname, '../web-ui/dist');
        if (fs.existsSync(webUiBuildPath)) {
          this.webApp.get('*', (req, res) => {
            // Check if the request looks like an API call or a file request first
            if (req.path.startsWith('/api/') || req.path.includes('.')) {
              // Let 404 handler deal with it if static middleware didn't find it
              res.status(404).send('Not found');
            } else {
              // Otherwise, serve index.html for SPA routing
              res.sendFile(path.join(webUiBuildPath, 'index.html'));
            }
          });
        }
      }
    }

    // --- API Routes ---
    this.webApp.get('/api/tasks', async (req, res) => {
      try {
        this.logger.info(`API Request: GET /api/tasks, Query: ${JSON.stringify(req.query)}`);
        const args = {
          status: req.query.status,
          withSubtasks: req.query.withSubtasks === 'true',
          file: req.query.file,
          projectRoot: req.query.projectRoot || process.cwd(),
          format: 'json'
        };
        const tasksJson = await listTasksLogic(args, this.logger);
        res.json(tasksJson);
      } catch (error) {
        this.logger.error(`API Error (GET /api/tasks): ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
      }
    });

this.webApp.get('/api/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  try {
    this.logger.info(`API Request: GET /api/tasks/${taskId}, Query: ${JSON.stringify(req.query)}`);
    const args = {
      id: taskId,
      file: req.query.file,
      projectRoot: req.query.projectRoot || process.cwd(),
      format: 'json'
    };
    const taskJson = await showTaskLogic(args, this.logger);
    res.json(taskJson);
  } catch (error) {
    this.logger.error(`API Error (GET /api/tasks/${taskId}): ${error.message}`);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: 'Task not found', details: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch task details', details: error.message });
    }
  }
});

// TODO: Add GET /api/tasks/next endpoint later
// TODO: Add PUT /api/tasks/:id/status endpoint later

// --- SPA Fallback Route (Serve AFTER specific API routes and static files) ---
// This ensures that direct navigation to frontend routes works correctly
// Only needed when serving static files (not when proxying to dev server)
try {
  const devServerPort = process.env.DEV_SERVER_PORT || 5173;
  const devServerUrl = `http://localhost:${devServerPort}`;
  const http = await import('http');
  
  // Quick check if dev server is running
  const devServerRunning = await new Promise((resolve) => {
    const req = http.get(devServerUrl, () => {
      resolve(true);
    }).on('error', () => {
      resolve(false);
    });
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
  
  // Only set up SPA fallback if dev server is NOT running
  if (!devServerRunning) {
    const webUiBuildPath = path.join(__dirname, '../web-ui/dist');
    if (fs.existsSync(webUiBuildPath)) {
      this.webApp.get('*', (req, res) => {
        // Check if the request looks like an API call or a file request first
        if (req.path.startsWith('/api/') || req.path.includes('.')) {
          // Let 404 handler deal with it if static middleware didn't find it
          res.status(404).send('Not found');
        } else {
          // Otherwise, serve index.html for SPA routing
          res.sendFile(path.join(webUiBuildPath, 'index.html'));
        }
      });
    }
  }
} catch (error) {
  this.logger.error(`Error setting up SPA fallback: ${error.message}`);
}
    // TODO: Add static file serving here later

    this.initialized = true;

    return this;
  }

  /**
   * Start the MCP server
   */
  async start() {
    if (!this.initialized) {
      await this.init();
    }

    // Find a free port and start the Express web server
    try {
      // Find a free port (e.g., starting from 3000)
      const [freePort] = await findFreePort(3000);
      this.webPort = freePort;

      // Start the Express server
      this.httpServer = this.webApp.listen(this.webPort, () => {
        this.logger.info(`Web interface available at http://localhost:${this.webPort}`);
      });

      this.httpServer.on('error', (error) => {
        this.logger.error(`Failed to start web server on port ${this.webPort}:`, error);
        // Decide how to handle this - maybe exit or continue without web UI?
        // For now, just log the error.
      });

    } catch (error) {
      this.logger.error('Failed to find free port or start web server:', error);
      // Decide how to handle this - maybe exit or continue without web UI?
      // For now, just log the error.
    }

    // Start the FastMCP server
    await this.server.start({
      transportType: "stdio",
    });

    return this;
  }

  /**
   * Stop the MCP server
   */
  async stop() {
    // Stop the HTTP server first
    if (this.httpServer) {
      await new Promise((resolve, reject) => {
        this.httpServer.close((err) => {
          if (err) {
            this.logger.error('Error stopping web server:', err);
            return reject(err);
          }
          this.logger.info('Web server stopped.');
          resolve();
        });
      });
      this.httpServer = null;
      this.webPort = null;
    }

    // Stop the FastMCP server
    if (this.server) {
      await this.server.stop();
    }
  }
}

export default TaskMasterMCPServer;
