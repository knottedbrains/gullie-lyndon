#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMovesServer } from "./moves-server.js";
import { createHousingServer } from "./housing-server.js";
import { createServicesServer } from "./services-server.js";
import { createFinancialServer } from "./financial-server.js";
import { createOperationsServer } from "./operations-server.js";

async function main() {
  const serverName = process.argv[2];

  let server;
  switch (serverName) {
    case "moves":
      server = await createMovesServer();
      break;
    case "housing":
      server = await createHousingServer();
      break;
    case "services":
      server = await createServicesServer();
      break;
    case "financial":
      server = await createFinancialServer();
      break;
    case "operations":
      server = await createOperationsServer();
      break;
    default:
      console.error(`Unknown server: ${serverName}`);
      console.error("Available servers: moves, housing, services, financial, operations");
      process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${serverName} MCP server running on stdio`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

