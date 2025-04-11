/**
 * Test MCP Client
 *
 * This script connects to the Task Master MCP server and tests its functionality.
 * It will:
 * 1. Connect to the MCP server
 * 2. List available tools and resources
 * 3. Try to use a tool
 */

// Using built-in fetch API

async function main() {
  try {
    // The MCP server now uses a dynamic port, so we need to use the stdio transport
    // to communicate with it and get the web interface URL
    console.log('Connecting to MCP server via stdio...');
    
    // For testing purposes, we'll use a hardcoded URL
    // In a real application, you would use the MCP client to call the openDashboard tool
    // and get the URL from the response
    const serverUrl = 'http://localhost:8080'; // Using port 8080 which is safe on macOS
    console.log(`Using web interface URL: ${serverUrl}`);
    
    // Test if the server is running by making a simple HTTP request
    try {
      const response = await fetch(serverUrl);
      console.log(`Server responded with status: ${response.status}`);
      const text = await response.text();
      console.log(`Response body: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    } catch (error) {
      console.error(`Error connecting to server: ${error.message}`);
      return;
    }
    
    // Skip the API endpoint test since we're focusing on the MCP endpoint
    
    // Try to make a JSON-RPC request to the MCP server
    console.log('\nTrying to make a JSON-RPC request to the MCP server...');
    try {
      const rpcResponse = await fetch(`${serverUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        })
      });
      
      console.log(`RPC responded with status: ${rpcResponse.status}`);
      const rpcData = await rpcResponse.text();
      console.log(`RPC response: ${rpcData}`);
    } catch (error) {
      console.error(`Error making RPC request: ${error.message}`);
    }
    
    console.log('\nTest completed');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();