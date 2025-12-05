import { createTRPCRouter } from "../trpc";
import { movesRouter } from "./moves.router";
import { housingRouter } from "./housing.router";
import { servicesRouter } from "./services.router";
import { financialRouter } from "./financial.router";
import { operationsRouter } from "./operations.router";
import { employeesRouter } from "./employees.router";
import { employersRouter } from "./employers.router";
import { companiesRouter } from "./companies.router";
import { vendorsRouter } from "./vendors.router";
import { chatRouter } from "./chat.router";
import { conversationsRouter } from "./conversations.router";
import { usersRouter } from "./users.router";
import { searchRouter } from "./search.router";

export const appRouter = createTRPCRouter({
  moves: movesRouter,
  housing: housingRouter,
  services: servicesRouter,
  financial: financialRouter,
  operations: operationsRouter,
  employees: employeesRouter,
  employers: employersRouter,
  companies: companiesRouter,
  vendors: vendorsRouter,
  chat: chatRouter, // Keep for backward compatibility during migration
  conversations: conversationsRouter, // New move-centric conversations
  users: usersRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;

