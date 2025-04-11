#!/usr/bin/env node

/**
 * Test MCP Client using HTTP transport
 *
 * This script connects to the Task Master MCP server using HTTP transport and tests its functionality.
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

async function main() {
  try {
    console.log('Starting MCP server process...');
    
    // Start the MCP server as a child process
    const serverProcess = spawn('node', ['bin/task-master-mcp.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });
    
    // Wait for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the web interface URL from the server output
    let webInterfaceUrl = null;
    const outputHandler = (data) => {
      const output = data.toString();
      const match = output.match(/MCP HTTP endpoint available at (http:\/\/localhost:\d+\/mcp)/);
      if (match) {
        webInterfaceUrl = match[1];
        console.log(`Found MCP HTTP endpoint: ${webInterfaceUrl}`);
        serverProcess.stdout.removeListener('data', outputHandler);
      }
    };
    serverProcess.stdout.on('data', outputHandler);
    
    // Wait for the web interface URL to be found
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!webInterfaceUrl) {
      console.log('Could not find MCP HTTP endpoint in server output. Using default URL.');
      webInterfaceUrl = 'http://localhost:8080/mcp';
    }
    
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
    
    const initializeResponse = await fetch(webInterfaceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(initializeRequest)
    });
    
    if (!initializeResponse.ok) {
      throw new Error(`HTTP error: ${initializeResponse.status}`);
    }
    
    const initializeResult = await initializeResponse.json();
    console.log('Initialize response:');
    console.log(JSON.stringify(initializeResult, null, 2));
    
    // Send an initialized notification
    console.log('\nSending initialized notification...');
    const initializedNotification = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    };
    
    await fetch(webInterfaceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(initializedNotification)
    });
    
    // List tools
    console.log('\nListing tools...');
    const listToolsRequest = createRequest('tools/list');
    
    const listToolsResponse = await fetch(webInterfaceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(listToolsRequest)
    });
    
    if (!listToolsResponse.ok) {
      throw new Error(`HTTP error: ${listToolsResponse.status}`);
    }
    
    const listToolsResult = await listToolsResponse.json();
    console.log('Tools:');
    console.log(JSON.stringify(listToolsResult, null, 2));
    
    // Check if the openDashboard tool is available
    if (listToolsResult.result && listToolsResult.result.tools) {
      const tools = listToolsResult.result.tools;
      const openDashboardTool = tools.find(tool => tool.name === 'openDashboard');
      
      if (openDashboardTool) {
        console.log('\nCalling openDashboard tool...');
        const openDashboardRequest = createRequest('tools/call', {
          name: 'openDashboard',
          arguments: {}
        });
        
        const openDashboardResponse = await fetch(webInterfaceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(openDashboardRequest)
        });
        
        if (!openDashboardResponse.ok) {
          throw new Error(`HTTP error: ${openDashboardResponse.status}`);
        }
        
        const openDashboardResult = await openDashboardResponse.json();
        console.log('Web interface URL:');
        console.log(openDashboardResult.result);
        
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