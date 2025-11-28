import { pgEnum } from "drizzle-orm/pg-core";

export const moveStatusEnum = pgEnum("move_status", [
  "initiated",
  "intake_in_progress",
  "housing_search",
  "services_booked",
  "in_transit",
  "completed",
  "cancelled",
]);

export const serviceTypeEnum = pgEnum("service_type", [
  "temporary_housing",
  "permanent_housing",
  "hhg",
  "car_shipment",
  "flight",
  "dsp_orientation",
  "other",
]);

export const serviceStatusEnum = pgEnum("service_status", [
  "pending",
  "quoted",
  "approved",
  "booked",
  "in_progress",
  "completed",
  "cancelled",
  "exception",
]);

export const housingTypeEnum = pgEnum("housing_type", [
  "hotel",
  "serviced_apartment",
  "airbnb",
  "apartment",
  "condo",
  "single_family_home",
]);

export const policyCoverageEnum = pgEnum("policy_coverage", [
  "covered",
  "not_covered",
  "requires_approval",
]);

