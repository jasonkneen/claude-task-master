HE #!/usr/bin/env node

/**
 * Test MCP Client using FastMCP with stdio transport
 *
 * This script connects to the Task Master MCP server using FastMCP with stdio transport
 * and tests its functionality. This is the recommended way to communicate with the MCP server.
 */

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

// Function to create a JSON-RPC request
function createRequest(method, params = {}) {
  return {
    jsonrpc: '2.0',
    id: randomUUID(),
    method,
    params
  };
}

// Function to send a request to the MCP server and wait for a response
async function sendRequest(serverProcess, request) {
  return new Promise((resolve, reject) => {
    const requestId = request.id;
    let responseData = '';
    
    // Set up a listener for the server's response
    const dataHandler = (data) => {
      const dataStr = data.toString();
      responseData += dataStr;
      
      // Try to parse each line as JSON
      const lines = responseData.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const response = JSON.parse(line);
          if (response.id === requestId) {
            // We found our response, clean up and resolve
            serverProcess.stdout.removeListener('data', dataHandler);
            resolve(response);
            return;
          }
        } catch (error) {
          // Not valid JSON or not our response, continue
        }
      }
    };
    
    // Listen for data from the server
    serverProcess.stdout.on('data', dataHandler);
    
    // Send the request to the server
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    
    // Set a timeout to prevent hanging
    setTimeout(() => {
      serverProcess.stdout.removeListener('data', dataHandler);
      reject(new Error('Request timed out'));
    }, 10000);
  });
}

async function main() {
  try {
    console.log('Starting MCP server process...');
    
    // Start the MCP server as a child process
    const serverProcess = spawn('node', ['bin/task-master-mcp.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });
    
    // Wait for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send an initialize request
    console.log('Sending initialize request...');
    const initializeRequest = createRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
    
    const initializeResponse = await sendRequest(serverProcess, initializeRequest);
    console.log('Initialize response:');
    console.log(JSON.stringify(initializeResponse, null, 2));
    
    // Send an initialized notification
    console.log('\nSending initialized notification...');
    const initializedNotification = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    };
    serverProcess.stdin.write(JSON.stringify(initializedNotification) + '\n');
    
    // List tools
    console.log('\nListing tools...');
    const listToolsRequest = createRequest('tools/list');
    const listToolsResponse = await sendRequest(serverProcess, listToolsRequest);
    console.log('Tools:');
    console.log(JSON.stringify(listToolsResponse, null, 2));
    
    // Check if the openDashboard tool is available
    if (listToolsResponse.result && listToolsResponse.result.tools) {
      const tools = listToolsResponse.result.tools;
      const openDashboardTool = tools.find(tool => tool.name === 'openDashboard');
      
      if (openDashboardTool) {
        console.log('\nCalling openDashboard tool...');
        const openDashboardRequest = createRequest('tools/call', {
          name: 'openDashboard',
          arguments: {}
        });
        
        const openDashboardResponse = await sendRequest(serverProcess, openDashboardRequest);
        console.log('Web interface URL:');
        console.log(openDashboardResponse.result);
        
        // Keep the server running for a while so the user can access the web interface
        console.log('\nKeeping the server running for 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('\nThe openDashboard tool is not available.');
      }
    }
    
    // Shut down the server
    console.log('\nShutting down the server...');
    serverProcess.kill('SIGINT');
    
    console.log('Test completed');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();