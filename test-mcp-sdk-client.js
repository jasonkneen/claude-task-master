#!/usr/bin/env node

/**
 * Test MCP Client using the MCP SDK
 *
 * This script connects to the Task Master MCP server using the MCP SDK and tests its functionality.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from 'child_process';

async function main() {
  try {
    console.log('Starting MCP server process...');
    
    // Start the MCP server as a child process
    const serverProcess = spawn('node', ['bin/task-master-mcp.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });
    
    // Wait for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Creating MCP client...');
    
    // Create a transport that connects to the server
    const transport = new StdioClientTransport({
      process: serverProcess
    });
    
    // Create a client
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );
    
    // Connect to the server
    console.log('Connecting to MCP server...');
    await client.connect(transport);
    
    // List tools
    console.log('Listing tools...');
    try {
      const tools = await client.listTools();
      console.log('Tools:');
      console.log(JSON.stringify(tools, null, 2));
      
      // If the openDashboard tool is available, call it
      const openDashboardTool = tools.tools.find(tool => tool.name === 'openDashboard');
      if (openDashboardTool) {
        console.log('\nCalling openDashboard tool...');
        const result = await client.callTool({
          name: 'openDashboard',
          arguments: {}
        });
        console.log('Web interface URL:');
        console.log(result);
      } else {
        console.log('\nThe openDashboard tool is not available.');
      }
    } catch (error) {
      console.error(`Error listing tools: ${error.message}`);
    }
    
    // Keep the server running for a while so the user can access the web interface
    console.log('\nKeeping the server running for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Disconnect from the server
    console.log('Disconnecting from MCP server...');
    await client.disconnect();
    
    // Shut down the server
    console.log('Shutting down the server...');
    serverProcess.kill('SIGINT');
    
    console.log('Test completed');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();