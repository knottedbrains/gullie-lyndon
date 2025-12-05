import { z } from "zod";

export const serviceTypeSchema = z.enum([
  "temporary_housing",
  "permanent_housing",
  "hhg",
  "car_shipment",
  "flight",
  "dsp_orientation",
  "immigration_visa",
  "children_education",
  "pet_relocation",
  "banking_finance",
  "healthcare",
  "insurance",
  "other",
]);

export const serviceStatusSchema = z.enum([
  "pending",
  "quoted",
  "approved",
  "booked",
  "in_progress",
  "completed",
  "cancelled",
  "exception",
]);

export const listServicesSchema = z.object({
  moveId: z.string().uuid().optional(),
  type: serviceTypeSchema.optional(),
  status: serviceStatusSchema.optional(),
  vendorId: z.string().uuid().optional(),
});

export const createHhgQuoteSchema = z.object({
  moveId: z.string().uuid(),
  vendorName: z.string().min(1),
  quoteAmount: z.string(),
  budget: z.string().optional(),
  withinBudget: z.boolean(),
  inventory: z.record(z.unknown()).optional(),
});

export const createCarShipmentSchema = z.object({
  moveId: z.string().uuid(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number(),
  vin: z.string().optional(),
  desiredShipDate: z.coerce.date().optional(),
});

export const createFlightSchema = z.object({
  moveId: z.string().uuid(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  departureDate: z.coerce.date().optional(),
  returnDate: z.coerce.date().optional(),
  airline: z.string().optional(),
  class: z.string().optional(),
  price: z.string().optional(),
});

export const bookFlightSchema = z.object({
  id: z.string().uuid(),
  bookingReference: z.string().min(1),
});

export const createImmigrationVisaSchema = z.object({
  moveId: z.string().uuid(),
  visaType: z.enum(["h1b", "l1", "e2", "o1", "tn", "green_card", "work_permit", "dependent_visa", "other"]),
  country: z.string().min(1),
  applicantName: z.string().min(1),
  applicantPassportNumber: z.string().optional(),
  includeDependents: z.boolean().optional(),
  dependents: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    passportNumber: z.string().optional(),
    visaType: z.string().optional(),
  })).optional(),
});

export const createChildEducationSchema = z.object({
  moveId: z.string().uuid(),
  childName: z.string().min(1),
  age: z.number().min(0).max(18),
  gradeLevel: z.enum(["preschool", "kindergarten", "elementary", "middle_school", "high_school"]),
  currentSchool: z.string().optional(),
  preferredSchoolType: z.enum(["public", "private", "international", "montessori", "waldorf", "charter"]).optional(),
  specialNeeds: z.string().optional(),
});

export const createPetRelocationSchema = z.object({
  moveId: z.string().uuid(),
  petName: z.string().min(1),
  petType: z.enum(["dog", "cat", "bird", "reptile", "small_mammal", "other"]),
  breed: z.string().optional(),
  age: z.number().optional(),
  weight: z.string().optional(),
  destinationCountry: z.string().min(1),
  microchipNumber: z.string().optional(),
});

export const createBankingFinanceSchema = z.object({
  moveId: z.string().uuid(),
  accountType: z.enum(["checking", "savings", "investment", "credit_card"]),
  bankName: z.string().optional(),
  taxIdRequired: z.boolean().optional(),
  taxIdType: z.string().optional(),
});

export const createHealthcareSchema = z.object({
  moveId: z.string().uuid(),
  insuranceType: z.enum(["health", "dental", "vision", "disability", "life"]),
  insuranceProvider: z.string().optional(),
  includeFamily: z.boolean().optional(),
  familyMembers: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    dateOfBirth: z.string().optional(),
  })).optional(),
});

export const createInsurancePolicySchema = z.object({
  moveId: z.string().uuid(),
  policyType: z.enum(["property", "renters", "auto", "health", "life", "disability", "umbrella"]),
  provider: z.string().optional(),
  premium: z.string().optional(),
  premiumFrequency: z.string().optional(),
  propertyAddress: z.string().optional(),
});

