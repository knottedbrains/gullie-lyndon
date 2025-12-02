import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  experimental: {
    adapter: "nextjs",
  },
  paths: {
    tools: "src/server/tools",
    prompts: "src/prompts",
    resources: "src/resources",
  },
};

export default config;