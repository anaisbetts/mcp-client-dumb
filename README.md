# MCP Client

The world's simplest example of a client for interacting with Claude AI using the Model Context Protocol (MCP) to enable tool usage with YouTube context.

## Overview

This project provides a command-line interface for sending prompts to Anthropic's Claude AI model while giving it access to YouTube-related tools through the Model Context Protocol. The client connects Claude to an MCP YouTube server, allowing the AI to retrieve and process information from YouTube videos when responding to user prompts.

## Prerequisites

- Node.js (v18+)
- Bun runtime
- Anthropic API key

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/anaisbetts/mcp-client.git
   cd mcp-client
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Set up your Anthropic API key:
   ```
   export ANTHROPIC_API_KEY=your_api_key_here
   ```
   
   On Windows, use:
   ```
   $env:ANTHROPIC_API_KEY=your_api_key_here
   ```

## Usage

Run the client with a prompt:

```
bun start "Your prompt here"
```

Example:

```
bun start "Find me information about the latest SpaceX launch from this YouTube video: https://www.youtube.com/watch?v=example"
```

## Development

- Run in development mode with hot reloading:
  ```
  bun dev
  ```

- Build the project:
  ```
  bun build
  ```

- Run TypeScript type checking:
  ```
  bun typecheck
  ```

- Run tests:
  ```
  bun test
  ```

## How It Works

1. The client initializes an Anthropic client with your API key
2. It starts an MCP YouTube server process
3. The client connects to the MCP server and retrieves available tools
4. These tools are converted to Anthropic's tool format
5. Your prompt is sent to Claude along with the available tools
6. If Claude uses a tool, the request is forwarded to the MCP server
7. The tool response is sent back to Claude for further processing
8. The final response is displayed in the console

## License

ISC

## Dependencies

- @anthropic-ai/sdk: For interacting with Claude AI
- @modelcontextprotocol/sdk: Model Context Protocol SDK
- @anaisbetts/mcp-youtube: YouTube tools for MCP
- spawn-rx: For spawning processes
