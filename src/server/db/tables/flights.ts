import { pgTable, text, timestamp, uuid, boolean, decimal } from "drizzle-orm/pg-core";
import { moves } from "./moves";

export const flights = pgTable("flights", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureDate: timestamp("departure_date"),
  returnDate: timestamp("return_date"),
  airline: text("airline"),
  class: text("class"),
  price: decimal("price", { precision: 10, scale: 2 }),
  booked: boolean("booked").default(false).notNull(),
  bookingReference: text("booking_reference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

