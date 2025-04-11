#!/usr/bin/env node

/**
 * Simple MCP Client
 *
 * This script connects to the simple MCP server and tests its functionality.
 */

import { spawn } from 'child_process';

// Start the MCP server as a child process
const serverProcess = spawn('node', ['simple-mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Wait for the server to start
setTimeout(() => {
  // Send a listTools request
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: '1',
    method: 'tools/list',
    params: {}
  };
  
  console.log('Sending listTools request...');
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Listen for the response
  serverProcess.stdout.on('data', (data) => {
    const dataStr = data.toString();
    console.log('Received data:', dataStr);
    
    try {
      const response = JSON.parse(dataStr);
      if (response.id === '1') {
        console.log('Tools:');
        console.log(JSON.stringify(response.result, null, 2));
        
        // If we got a successful response, try to call the hello tool
        if (response.result && response.result.tools) {
          const helloTool = response.result.tools.find(tool => tool.name === 'hello');
          if (helloTool) {
            console.log('\nCalling hello tool...');
            const callToolRequest = {
              jsonrpc: '2.0',
              id: '2',
              method: 'tools/call',
              params: {
                name: 'hello',
                arguments: {
                  name: 'MCP'
                }
              }
            };
            
            serverProcess.stdin.write(JSON.stringify(callToolRequest) + '\n');
          }
        }
      } else if (response.id === '2') {
        console.log('Hello tool response:');
        console.log(JSON.stringify(response.result, null, 2));
        
        // Shut down the server
        serverProcess.kill('SIGINT');
      }
    } catch (error) {
      // Not valid JSON or not our response, continue
    }
  });
  
  // Set a timeout to prevent hanging
  setTimeout(() => {
    console.log('Timeout reached, shutting down...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  }, 5000);
}, 2000);