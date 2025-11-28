import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { db } from "./db";

export const createTRPCContext = async () => {
  return {
    db,
    // Add auth context here when ready
    // user: await getUser(),
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const subscriptionProcedure = t.procedure;

