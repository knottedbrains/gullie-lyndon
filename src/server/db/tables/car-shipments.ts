import { pgTable, text, timestamp, uuid, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { serviceStatusEnum } from "../enums";

export const carShipments = pgTable("car_shipments", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  vin: text("vin"),
  quoteAmount: decimal("quote_amount", { precision: 10, scale: 2 }),
  vendorName: text("vendor_name"),
  desiredShipDate: timestamp("desired_ship_date"),
  pickupDate: timestamp("pickup_date"),
  pickupTime: timestamp("pickup_time"),
  pickupLocation: text("pickup_location"),
  dropoffDate: timestamp("dropoff_date"),
  dropoffTime: timestamp("dropoff_time"),
  dropoffLocation: text("dropoff_location"),
  status: serviceStatusEnum("status").default("pending").notNull(),
  dayOfIssue: boolean("day_of_issue").default(false).notNull(),
  issueDescription: text("issue_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

