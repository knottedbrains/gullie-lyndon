# MCP Servers for Gullie AgentMail

This project includes Model Context Protocol (MCP) servers for each workflow, allowing AI agents to interact with the relocation system through standardized tools.

## Available MCP Servers

1. **gullie-moves** - Move management and lifecycle
2. **gullie-housing** - Housing search and booking
3. **gullie-services** - Service management (HHG, car, flights, DSP)
4. **gullie-financial** - Invoices and tax calculations
5. **gullie-operations** - Policy exceptions, check-ins, service breaks

## Setup

Each MCP server connects to the tRPC API endpoints, so make sure your Next.js dev server is running:

```bash
npm run dev
```

## Running MCP Servers

You can run each server individually:

```bash
npm run mcp:moves
npm run mcp:housing
npm run mcp:services
npm run mcp:financial
npm run mcp:operations
```

## Configuration

The MCP servers are configured in `mcp-config.json`. To use them with an MCP client (like Claude Desktop), add this to your MCP configuration:

```json
{
  "mcpServers": {
    "gullie-moves": {
      "command": "npm",
      "args": ["run", "mcp:moves", "--prefix", "/path/to/gullie-agentmail"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/gullie_agentmail"
      }
    }
  }
}
```

## Tools Available

Each server exposes tools that map to tRPC endpoints:

### Moves Server
- `list_moves` - List all moves with filters
- `get_move` - Get move details
- `create_move` - Create new move
- `update_move_status` - Update move status
- `update_lifestyle_intake` - Update lifestyle preferences

### Housing Server
- `search_housing` - Search housing options
- `list_housing_options` - List with filters
- `create_housing_option` - Add new option
- `select_housing` - Select an option

### Services Server
- `list_services` - List all services
- `create_hhg_quote` - Create HHG quote
- `create_car_shipment` - Create car shipment
- `create_flight` - Create flight booking
- `book_flight` - Book a flight

### Financial Server
- `list_invoices` - List invoices
- `create_invoice` - Create invoice
- `calculate_tax_grossup` - Calculate tax gross-up

### Operations Server
- `list_policy_exceptions` - List exceptions
- `create_policy_exception` - Create exception
- `update_exception_status` - Approve/deny
- `list_check_ins` - List check-ins
- `create_check_in` - Schedule check-in
- `report_service_break` - Report issue

## Usage with AI Agents

These MCP servers allow AI agents to:
- Automate move workflows
- Search and book housing
- Manage services end-to-end
- Handle financial operations
- Process policy exceptions
- Coordinate day-of-move activities

All operations go through the tRPC API, ensuring type safety and consistency.

