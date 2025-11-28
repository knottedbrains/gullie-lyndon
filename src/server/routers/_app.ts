import { createTRPCRouter } from "../trpc";
import { exampleRouter } from "./example";
import { movesRouter } from "./moves.router";
import { housingRouter } from "./housing.router";
import { servicesRouter } from "./services.router";
import { financialRouter } from "./financial.router";
import { operationsRouter } from "./operations.router";
import { employeesRouter } from "./employees.router";
import { employersRouter } from "./employers.router";
import { chatRouter } from "./chat.router";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  moves: movesRouter,
  housing: housingRouter,
  services: servicesRouter,
  financial: financialRouter,
  operations: operationsRouter,
  employees: employeesRouter,
  employers: employersRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;

