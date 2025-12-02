import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      // Extract cookies from request
      const cookieHeader = req.headers.get("cookie") || "";
      const cookies = new Map<string, string>();
      cookieHeader.split(";").forEach((cookie) => {
        const trimmed = cookie.trim();
        const equalIndex = trimmed.indexOf("=");
        if (equalIndex > 0) {
          const name = trimmed.substring(0, equalIndex);
          const value = trimmed.substring(equalIndex + 1);
          if (name && value) {
            cookies.set(name, decodeURIComponent(value));
          }
        }
      });
      
      const cookieGetter = {
        get: (name: string) => {
          const value = cookies.get(name);
          return value ? { value } : undefined;
        },
      };
      
      return createTRPCContext(cookieGetter);
    },
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
