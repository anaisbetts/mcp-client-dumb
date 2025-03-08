#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { findActualExecutable } from 'spawn-rx';
import { fileURLToPath } from 'url';

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if a prompt was provided as a command line argument
if (process.argv.length < 3) {
  console.error('Usage: node index.js "Your prompt here"');
  process.exit(1);
}

// Get the prompt from command line arguments
const userPrompt = process.argv.slice(2).join(' ');

async function main() {
  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
    process.exit(1);
  }

  try {
    // Start the MCP YouTube server process
    const serverPath = path.join(
      __dirname,
      '..',
      'node_modules',
      '@anaisbetts',
      'mcp-youtube',
      'lib',
      'index.mjs'
    );

    // Create MCP client with stdio transport
    const {cmd, args} = findActualExecutable('node', [serverPath])
    const transport = new StdioClientTransport({
      command: cmd, args
    });

    // Connect to the MCP server
    const mcpClient = new Client({
      name: "mcp-client",
      version: "0.0.1",
    });

    await mcpClient.connect(transport);

    // List available tools
    const tools = await mcpClient.listTools();
    console.log('Available tools:', tools.tools.map(tool => tool.name));

    // Convert MCP tools to Anthropic tool format
    const anthropicTools = tools.tools.map(tool => {
      return {
        name: tool.name,
        description: tool.description || "",
        input_schema: tool.inputSchema,
      };
    });

    // Create a message with Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      tools: anthropicTools,
      tool_choice: { type: 'auto' },
    });

    // Process the response and handle any tool calls
    let finalResponse = '';
    
    for (const content of response.content) {
      if (content.type === 'text') {
        finalResponse += content.text;
      } else if (content.type === 'tool_use') {
        console.log(`\nClaude is using tool: ${content.name}`);
        
        // Call the tool through MCP
        const toolResponse = await mcpClient.callTool({
          name: content.name,
          arguments: content.input as Record<string, unknown>,
        });
        
        // Check if the tool response has content
        const toolResponseContent: any = toolResponse.content || [];
        console.log(`\nTool response received: ${toolResponseContent[0]?.type === 'text' ? 'text' : 'other content type'}`);
        
        // Send the tool response back to Claude
        const followUpResponse = await anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
            {
              role: 'assistant',
              content: [
                { type: 'text', text: finalResponse },
                content,
              ],
            },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: content.id,
                  content: toolResponseContent,
                },
              ],
            },
          ],
          tools: anthropicTools,
          tool_choice: { type: 'auto' },
        });
        
        // Append the follow-up response
        for (const followUpContent of followUpResponse.content) {
          if (followUpContent.type === 'text') {
            finalResponse += followUpContent.text;
          }
        }
      }
    }

    // Print the final response
    console.log('\nClaude\'s Response:');
    console.log(finalResponse);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error).then(() => process.exit(0));
