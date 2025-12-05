import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { userRoleEnum } from "../enums";
import { employers } from "./core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("employee"),
  employerId: uuid("employer_id").references(() => employers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

