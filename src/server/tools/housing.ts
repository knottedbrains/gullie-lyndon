import { z } from "zod";
import { createTool, callTRPCProcedure } from "./builder";
import {
  createHousingOptionSchema,
  listHousingSchema,
  searchHousingSchema,
  selectHousingSchema,
} from "../schemas/housing";

export const searchHousingTool = createTool("search_housing")
  .describe("Search for housing options for a move")
  .input(searchHousingSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.housing.search, args, false);
  });

export const listHousingOptionsTool = createTool("list_housing_options")
  .describe("List housing options with filters")
  .input(listHousingSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.housing.list, args, false);
  });

export const createHousingOptionTool = createTool("create_housing_option")
  .describe("Create a new housing option")
  .input(createHousingOptionSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.housing.create, args, true);
  });

export const selectHousingTool = createTool("select_housing")
  .describe("Select a housing option for a move")
  .input(selectHousingSchema)
  .handler(async (args, { trpc }) => {
    return await callTRPCProcedure(trpc.housing.select, args, true);
  });

export const housingTools = [
  searchHousingTool,
  listHousingOptionsTool,
  createHousingOptionTool,
  selectHousingTool,
];
