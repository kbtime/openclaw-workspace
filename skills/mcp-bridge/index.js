/**
 * MCP Bridge Skill
 * 
 * Bridges OpenClaw to MCP (Model Context Protocol) servers via HTTP gateway.
 * Gateway runs on 127.0.0.1:9712
 */

const BRIDGE_URL = 'http://127.0.0.1:9712';

// Whitelist of allowed server IDs
const ALLOWED_SERVERS = ['fs', 'vision', 'search', 'zread', 'reader'];

/**
 * List all tools available from an MCP server
 * @param {string} server_id - The MCP server ID (e.g., "fs")
 * @returns {Promise<object>} - List of tools with their schemas
 */
async function mcp_list_tools(server_id) {
    if (!ALLOWED_SERVERS.includes(server_id)) {
        throw new Error(`Server "${server_id}" not in whitelist. Allowed: ${ALLOWED_SERVERS.join(', ')}`);
    }
    
    const response = await fetch(`${BRIDGE_URL}/tools?server=${encodeURIComponent(server_id)}`);
    if (!response.ok) {
        throw new Error(`Failed to list tools: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * Call a tool on an MCP server
 * @param {string} server_id - The MCP server ID
 * @param {string} tool_name - The tool to call
 * @param {object} args - Tool arguments (optional)
 * @returns {Promise<object>} - Tool execution result
 */
async function mcp_call_tool(server_id, tool_name, args = {}) {
    if (!ALLOWED_SERVERS.includes(server_id)) {
        throw new Error(`Server "${server_id}" not in whitelist. Allowed: ${ALLOWED_SERVERS.join(', ')}`);
    }
    
    const response = await fetch(`${BRIDGE_URL}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            server: server_id,
            tool: tool_name,
            args: args
        })
    });
    
    if (!response.ok) {
        throw new Error(`Failed to call tool: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * List resources from an MCP server
 * @param {string} server_id - The MCP server ID
 * @returns {Promise<object>} - List of resources
 */
async function mcp_list_resources(server_id) {
    if (!ALLOWED_SERVERS.includes(server_id)) {
        throw new Error(`Server "${server_id}" not in whitelist. Allowed: ${ALLOWED_SERVERS.join(', ')}`);
    }
    
    const response = await fetch(`${BRIDGE_URL}/resources?server=${encodeURIComponent(server_id)}`);
    if (!response.ok) {
        throw new Error(`Failed to list resources: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * Read a resource from an MCP server
 * @param {string} server_id - The MCP server ID
 * @param {string} uri - The resource URI
 * @returns {Promise<object>} - Resource content
 */
async function mcp_read_resource(server_id, uri) {
    if (!ALLOWED_SERVERS.includes(server_id)) {
        throw new Error(`Server "${server_id}" not in whitelist. Allowed: ${ALLOWED_SERVERS.join(', ')}`);
    }
    
    const response = await fetch(`${BRIDGE_URL}/resource?server=${encodeURIComponent(server_id)}&uri=${encodeURIComponent(uri)}`);
    if (!response.ok) {
        throw new Error(`Failed to read resource: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

module.exports = {
    mcp_list_tools,
    mcp_call_tool,
    mcp_list_resources,
    mcp_read_resource
};
