import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";

export async function GET(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc/stream",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    responseMeta() {
      return {
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "text/event-stream",
          "Connection": "keep-alive",
        },
      };
    },
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC subscription failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });
}

export async function POST(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc/stream",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC subscription failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });
}
