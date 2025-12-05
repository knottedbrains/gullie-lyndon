import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  services,
  hhgQuotes,
  carShipments,
  flights,
  dspRequests,
  immigrationVisas,
  childrenEducation,
  petRelocations,
  bankingFinance,
  healthcare,
  insurancePolicies,
  moves,
  vendors,
} from "../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  bookFlightSchema,
  createCarShipmentSchema,
  createFlightSchema,
  createHhgQuoteSchema,
  createImmigrationVisaSchema,
  createChildEducationSchema,
  createPetRelocationSchema,
  createBankingFinanceSchema,
  createHealthcareSchema,
  createInsurancePolicySchema,
  listServicesSchema,
  serviceStatusSchema,
} from "../schemas/services";

export const servicesRouter = createTRPCRouter({
  list: publicProcedure
    .input(listServicesSchema)
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.moveId) {
        conditions.push(eq(services.moveId, input.moveId));
      }
      if (input.type) {
        conditions.push(eq(services.type, input.type));
      }
      if (input.status) {
        conditions.push(eq(services.status, input.status));
      }
      if (input.vendorId) {
        conditions.push(eq(services.vendorId, input.vendorId));
      }

      // Role-based filtering
      if (ctx.user) {
        if (ctx.user.role === "vendor") {
          // For vendors, filter by vendorId
          // Note: This assumes vendor users have a vendorId - would need to be added to users table
          // For now, we'll filter by vendorName matching the user's name or email
          // In production, you'd link users to vendors via vendorId
        } else if (ctx.user.role === "company" && ctx.user.employerId) {
          // For companies, filter services by their moves
          // This requires a join with moves table
          const companyMoves = await ctx.db
            .select({ id: moves.id })
            .from(moves)
            .where(eq(moves.employerId, ctx.user.employerId));
          
          if (companyMoves.length > 0) {
            const moveIds = companyMoves.map(m => m.id);
            conditions.push(inArray(services.moveId, moveIds));
          } else {
            // No moves for this company, return empty
            return [];
          }
        }
      }

      const result = await ctx.db
        .select()
        .from(services)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(services.createdAt));
      return result;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [service] = await ctx.db
        .select()
        .from(services)
        .where(eq(services.id, input.id))
        .limit(1);
      if (!service) {
        throw new Error("Service not found");
      }
      return service;
    }),

  // HHG Quotes
  hhgQuotes: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(hhgQuotes)
          .where(eq(hhgQuotes.moveId, input.moveId))
          .orderBy(desc(hhgQuotes.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(createHhgQuoteSchema)
      .mutation(async ({ ctx, input }) => {
        const [newQuote] = await ctx.db
          .insert(hhgQuotes)
          .values({
            moveId: input.moveId,
            vendorName: input.vendorName,
            quoteAmount: input.quoteAmount,
            budget: input.budget,
            withinBudget: input.withinBudget,
            inventory: input.inventory,
          })
          .returning();
        return newQuote;
      }),

    select: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(hhgQuotes)
          .set({
            selected: true,
            updatedAt: new Date(),
          })
          .where(eq(hhgQuotes.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("HHG quote not found");
        }
        return updated;
      }),
  }),

  // Car Shipments
  carShipments: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(carShipments)
          .where(eq(carShipments.moveId, input.moveId))
          .orderBy(desc(carShipments.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(createCarShipmentSchema)
      .mutation(async ({ ctx, input }) => {
        const [newShipment] = await ctx.db
          .insert(carShipments)
          .values({
            moveId: input.moveId,
            make: input.make,
            model: input.model,
            year: input.year,
            vin: input.vin,
            desiredShipDate: input.desiredShipDate,
          })
          .returning();
        return newShipment;
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          status: serviceStatusSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(carShipments)
          .set({
            status: input.status,
            updatedAt: new Date(),
          })
          .where(eq(carShipments.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("Car shipment not found");
        }
        return updated;
      }),
  }),

  // Flights
  flights: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(flights)
          .where(eq(flights.moveId, input.moveId))
          .orderBy(desc(flights.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(createFlightSchema)
      .mutation(async ({ ctx, input }) => {
        const [newFlight] = await ctx.db
          .insert(flights)
          .values({
            moveId: input.moveId,
            origin: input.origin,
            destination: input.destination,
            departureDate: input.departureDate,
            returnDate: input.returnDate,
            airline: input.airline,
            class: input.class,
            price: input.price,
          })
          .returning();
        return newFlight;
      }),

    book: publicProcedure
      .input(bookFlightSchema)
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(flights)
          .set({
            booked: true,
            bookingReference: input.bookingReference,
            updatedAt: new Date(),
          })
          .where(eq(flights.id, input.id))
          .returning();
        if (!updated) {
          throw new Error("Flight not found");
        }
        return updated;
      }),
  }),

  // DSP Requests
  dsp: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(dspRequests)
          .where(eq(dspRequests.moveId, input.moveId))
          .orderBy(desc(dspRequests.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(
        z.object({
          moveId: z.string().uuid(),
          providerName: z.string().optional(),
          isPreferredProvider: z.boolean().default(false),
          arrivalDate: z.date().optional(),
          familySize: z.number().optional(),
          desiredNeighborhoods: z.array(z.string()).optional(),
          schoolNeeds: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [newRequest] = await ctx.db
          .insert(dspRequests)
          .values({
            moveId: input.moveId,
            providerName: input.providerName,
            isPreferredProvider: input.isPreferredProvider,
            arrivalDate: input.arrivalDate,
            familySize: input.familySize,
            desiredNeighborhoods: input.desiredNeighborhoods,
            schoolNeeds: input.schoolNeeds,
          })
          .returning();
        return newRequest;
      }),
  }),

  // Immigration & Visas
  immigrationVisas: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(immigrationVisas)
          .where(eq(immigrationVisas.moveId, input.moveId))
          .orderBy(desc(immigrationVisas.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(createImmigrationVisaSchema)
      .mutation(async ({ ctx, input }) => {
        const [newVisa] = await ctx.db
          .insert(immigrationVisas)
          .values({
            moveId: input.moveId,
            visaType: input.visaType,
            country: input.country,
            applicantName: input.applicantName,
            applicantPassportNumber: input.applicantPassportNumber,
            includeDependents: input.includeDependents ?? false,
            dependents: input.dependents,
          })
          .returning();
        return newVisa;
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          status: z.enum(["not_started", "documents_gathering", "application_submitted", "pending_approval", "approved", "rejected", "expired"]).optional(),
          applicationDate: z.coerce.date().optional(),
          approvalDate: z.coerce.date().optional(),
          expirationDate: z.coerce.date().optional(),
          lawyerName: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, applicationDate, approvalDate, expirationDate, status, lawyerName, notes } = input;
        const updateData: any = { updatedAt: new Date() };
        if (status !== undefined) updateData.status = status;
        if (lawyerName !== undefined) updateData.lawyerName = lawyerName;
        if (notes !== undefined) updateData.notes = notes;
        if (applicationDate !== undefined) updateData.applicationDate = applicationDate;
        if (approvalDate !== undefined) updateData.approvalDate = approvalDate;
        if (expirationDate !== undefined) updateData.expirationDate = expirationDate;

        const [updated] = await ctx.db
          .update(immigrationVisas)
          .set(updateData)
          .where(eq(immigrationVisas.id, id))
          .returning();
        if (!updated) {
          throw new Error("Immigration visa record not found");
        }
        return updated;
      }),
  }),

  // Children & Education
  childrenEducation: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(childrenEducation)
          .where(eq(childrenEducation.moveId, input.moveId))
          .orderBy(desc(childrenEducation.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(createChildEducationSchema)
      .mutation(async ({ ctx, input }) => {
        const [newRecord] = await ctx.db
          .insert(childrenEducation)
          .values({
            moveId: input.moveId,
            childName: input.childName,
            age: input.age,
            gradeLevel: input.gradeLevel,
            currentSchool: input.currentSchool,
            preferredSchoolType: input.preferredSchoolType,
            specialNeeds: input.specialNeeds,
          })
          .returning();
        return newRecord;
      }),

    updateEnrollment: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          enrollmentStatus: z.enum(["researching", "applied", "waitlisted", "accepted", "enrolled", "declined"]),
          selectedSchool: z.string().optional(),
          enrollmentDate: z.coerce.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, enrollmentDate, enrollmentStatus, selectedSchool } = input;
        const updateData: any = { enrollmentStatus, updatedAt: new Date() };
        if (selectedSchool !== undefined) updateData.selectedSchool = selectedSchool;
        if (enrollmentDate !== undefined) updateData.enrollmentDate = enrollmentDate;

        const [updated] = await ctx.db
          .update(childrenEducation)
          .set(updateData)
          .where(eq(childrenEducation.id, id))
          .returning();
        if (!updated) {
          throw new Error("Child education record not found");
        }
        return updated;
      }),
  }),

  // Pet Relocations
  petRelocations: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(petRelocations)
          .where(eq(petRelocations.moveId, input.moveId))
          .orderBy(desc(petRelocations.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(createPetRelocationSchema)
      .mutation(async ({ ctx, input }) => {
        const [newPet] = await ctx.db
          .insert(petRelocations)
          .values({
            moveId: input.moveId,
            petName: input.petName,
            petType: input.petType,
            breed: input.breed,
            age: input.age,
            weight: input.weight,
            destinationCountry: input.destinationCountry,
            microchipNumber: input.microchipNumber,
          })
          .returning();
        return newPet;
      }),

    updateTransport: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          transportMethod: z.string().optional(),
          transportCompany: z.string().optional(),
          departureDate: z.coerce.date().optional(),
          arrivalDate: z.coerce.date().optional(),
          transportCost: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, departureDate, arrivalDate, transportMethod, transportCompany, transportCost } = input;
        const updateData: any = { updatedAt: new Date() };
        if (transportMethod !== undefined) updateData.transportMethod = transportMethod;
        if (transportCompany !== undefined) updateData.transportCompany = transportCompany;
        if (transportCost !== undefined) updateData.transportCost = transportCost;
        if (departureDate !== undefined) updateData.departureDate = departureDate;
        if (arrivalDate !== undefined) updateData.arrivalDate = arrivalDate;

        const [updated] = await ctx.db
          .update(petRelocations)
          .set(updateData)
          .where(eq(petRelocations.id, id))
          .returning();
        if (!updated) {
          throw new Error("Pet relocation record not found");
        }
        return updated;
      }),
  }),

  // Banking & Finance
  bankingFinance: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(bankingFinance)
          .where(eq(bankingFinance.moveId, input.moveId))
          .orderBy(desc(bankingFinance.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(createBankingFinanceSchema)
      .mutation(async ({ ctx, input }) => {
        const [newAccount] = await ctx.db
          .insert(bankingFinance)
          .values({
            moveId: input.moveId,
            accountType: input.accountType,
            bankName: input.bankName,
            taxIdRequired: input.taxIdRequired ?? false,
            taxIdType: input.taxIdType,
          })
          .returning();
        return newAccount;
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          accountOpened: z.boolean().optional(),
          taxIdReceived: z.boolean().optional(),
          payrollRoutingSetup: z.boolean().optional(),
          accountOpenDate: z.coerce.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, accountOpenDate, accountOpened, taxIdReceived, payrollRoutingSetup } = input;
        const updateData: any = { updatedAt: new Date() };
        if (accountOpened !== undefined) updateData.accountOpened = accountOpened;
        if (taxIdReceived !== undefined) updateData.taxIdReceived = taxIdReceived;
        if (payrollRoutingSetup !== undefined) updateData.payrollRoutingSetup = payrollRoutingSetup;
        if (accountOpenDate !== undefined) updateData.accountOpenDate = accountOpenDate;

        const [updated] = await ctx.db
          .update(bankingFinance)
          .set(updateData)
          .where(eq(bankingFinance.id, id))
          .returning();
        if (!updated) {
          throw new Error("Banking/finance record not found");
        }
        return updated;
      }),
  }),

  // Healthcare
  healthcare: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(healthcare)
          .where(eq(healthcare.moveId, input.moveId))
          .orderBy(desc(healthcare.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(createHealthcareSchema)
      .mutation(async ({ ctx, input }) => {
        const [newHealthcare] = await ctx.db
          .insert(healthcare)
          .values({
            moveId: input.moveId,
            insuranceType: input.insuranceType,
            insuranceProvider: input.insuranceProvider,
            includeFamily: input.includeFamily ?? false,
            familyMembers: input.familyMembers,
          })
          .returning();
        return newHealthcare;
      }),

    updateProvider: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          primaryCarePhysician: z.string().optional(),
          primaryCareClinic: z.string().optional(),
          primaryCareAppointmentDate: z.coerce.date().optional(),
          enrollmentCompleted: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, primaryCareAppointmentDate, primaryCarePhysician, primaryCareClinic, enrollmentCompleted } = input;
        const updateData: any = { updatedAt: new Date() };
        if (primaryCarePhysician !== undefined) updateData.primaryCarePhysician = primaryCarePhysician;
        if (primaryCareClinic !== undefined) updateData.primaryCareClinic = primaryCareClinic;
        if (enrollmentCompleted !== undefined) updateData.enrollmentCompleted = enrollmentCompleted;
        if (primaryCareAppointmentDate !== undefined) updateData.primaryCareAppointmentDate = primaryCareAppointmentDate;

        const [updated] = await ctx.db
          .update(healthcare)
          .set(updateData)
          .where(eq(healthcare.id, id))
          .returning();
        if (!updated) {
          throw new Error("Healthcare record not found");
        }
        return updated;
      }),
  }),

  // Insurance Policies
  insurancePolicies: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ moveId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db
          .select()
          .from(insurancePolicies)
          .where(eq(insurancePolicies.moveId, input.moveId))
          .orderBy(desc(insurancePolicies.createdAt));
        return result;
      }),

    create: publicProcedure
      .input(createInsurancePolicySchema)
      .mutation(async ({ ctx, input }) => {
        const [newPolicy] = await ctx.db
          .insert(insurancePolicies)
          .values({
            moveId: input.moveId,
            policyType: input.policyType,
            provider: input.provider,
            premium: input.premium,
            premiumFrequency: input.premiumFrequency,
            propertyAddress: input.propertyAddress,
          })
          .returning();
        return newPolicy;
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          quoteReceived: z.boolean().optional(),
          applicationSubmitted: z.boolean().optional(),
          policyIssued: z.boolean().optional(),
          policyActive: z.boolean().optional(),
          policyNumber: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        const [updated] = await ctx.db
          .update(insurancePolicies)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(insurancePolicies.id, id))
          .returning();
        if (!updated) {
          throw new Error("Insurance policy not found");
        }
        return updated;
      }),
  }),

  // Assign vendor to service (admin only)
  assignVendor: publicProcedure
    .input(
      z.object({
        serviceId: z.string().uuid(),
        vendorId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Access denied. Admin role required.");
      }

      // Verify vendor exists
      const [vendor] = await ctx.db
        .select()
        .from(vendors)
        .where(eq(vendors.id, input.vendorId))
        .limit(1);
      
      if (!vendor) {
        throw new Error("Vendor not found");
      }

      // Update service with vendor assignment
      const [updated] = await ctx.db
        .update(services)
        .set({
          vendorId: input.vendorId,
          vendorName: vendor.name, // Keep vendorName in sync for backward compatibility
          updatedAt: new Date(),
        })
        .where(eq(services.id, input.serviceId))
        .returning();

      if (!updated) {
        throw new Error("Service not found");
      }

      return updated;
    }),

  // Unassign vendor from service (admin only)
  unassignVendor: publicProcedure
    .input(
      z.object({
        serviceId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Access denied. Admin role required.");
      }

      // Update service to remove vendor assignment
      const [updated] = await ctx.db
        .update(services)
        .set({
          vendorId: null,
          updatedAt: new Date(),
        })
        .where(eq(services.id, input.serviceId))
        .returning();

      if (!updated) {
        throw new Error("Service not found");
      }

      return updated;
    }),
});
