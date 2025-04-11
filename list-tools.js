#!/usr/bin/env node

/**
 * Simple MCP Client to list tools
 */

import { spawn } from 'child_process';

// Start the MCP server as a child process
const serverProcess = spawn('node', ['bin/task-master-mcp.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Wait for the server to start
setTimeout(() => {
  // Send a listTools request
  const request = {
    jsonrpc: '2.0',
    id: '1',
    method: 'mcp/listTools',
    params: {}
  };
  
  console.log('Sending listTools request...');
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
  
  // Listen for the response
  serverProcess.stdout.on('data', (data) => {
    const dataStr = data.toString();
    console.log('Received data:', dataStr);
    
    try {
      const response = JSON.parse(dataStr);
      if (response.id === '1') {
        console.log('Tools:');
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