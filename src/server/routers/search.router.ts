import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { moves, employees, services, employers } from "../db/schema";
import { ilike, or, desc, eq, inArray } from "drizzle-orm";

/**
 * Simple fuzzy match score calculation
 * Returns a score between 0 and 1, where 1 is a perfect match
 */
function fuzzyScore(query: string, text: string): number {
  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase().trim();

  // Exact match
  if (textLower === queryLower) return 1.0;

  // Substring match
  if (textLower.includes(queryLower)) return 0.8;

  // Word-based matching
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 0);
  const textWords = textLower.split(/\s+/).filter((w) => w.length > 0);

  if (queryWords.length === 0) return 0;

  let matchedWords = 0;
  for (const queryWord of queryWords) {
    for (const textWord of textWords) {
      if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
        matchedWords++;
        break;
      }
    }
  }

  const wordScore = matchedWords / queryWords.length;

  // Character-based similarity (simple Levenshtein-like)
  let charMatches = 0;
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      charMatches++;
      queryIndex++;
    }
  }
  const charScore = charMatches / queryLower.length;

  // Combine scores
  return Math.max(wordScore * 0.6 + charScore * 0.4, 0);
}

export const searchRouter = createTRPCRouter({
  global: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;
      const queryLower = query.toLowerCase().trim();

      if (queryLower.length === 0) {
        return {
          moves: [],
          employees: [],
          services: [],
        };
      }

      // Fetch all relevant data
      const [allMoves, allEmployees, allServicesRaw] = await Promise.all([
        // Get moves with related data using query API
        ctx.db.query.moves.findMany({
          limit: 100, // Fetch more to filter
          orderBy: desc(moves.createdAt),
          with: {
            employee: true,
            employer: true,
          },
        }),
        // Get employees
        ctx.db
          .select()
          .from(employees)
          .where(
            or(
              ilike(employees.fullName, `%${query}%`),
              ilike(employees.email, `%${query}%`),
              ilike(employees.officeLocation, `%${query}%`)
            )
          )
          .limit(100),
        // Get services
        ctx.db
          .select()
          .from(services)
          .orderBy(desc(services.createdAt))
          .limit(100),
      ]);

      // Fetch related moves for services
      const moveIds = [...new Set(allServicesRaw.map(s => s.moveId))];
      const relatedMoves = moveIds.length > 0
        ? await Promise.all(
            moveIds.map(moveId =>
              ctx.db.query.moves.findFirst({
                where: eq(moves.id, moveId),
                with: { employee: true },
              }).catch(() => null)
            )
          )
        : [];

      // Combine services with their related moves
      const allServices = allServicesRaw.map(service => {
        const move = relatedMoves.find(m => m?.id === service.moveId);
        return {
          ...service,
          move: move || null,
        };
      });

      // Score and rank moves
      const scoredMoves = allMoves
        .map((move) => {
          const searchableText = [
            move.originCity,
            move.destinationCity,
            move.officeLocation,
            move.status,
            move.programType,
            move.employee?.fullName,
            move.employee?.email,
            move.employer?.name,
          ]
            .filter(Boolean)
            .join(" ");

          const score = fuzzyScore(query, searchableText);
          return { move, score };
        })
        .filter((item) => item.score > 0.1) // Minimum threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => ({
          id: item.move.id,
          type: "move" as const,
          title: `${item.move.employee?.fullName || "Employee"} - ${item.move.originCity} → ${item.move.destinationCity}`,
          subtitle: `${item.move.status} • ${item.move.employer?.name || ""}`,
          url: `/moves/${item.move.id}`,
          score: item.score,
        }));

      // Find moves for employees to get proper URLs
      const employeeIds = allEmployees.map(e => e.id);
      const employeeMoves = employeeIds.length > 0
        ? await ctx.db
            .select()
            .from(moves)
            .where(inArray(moves.employeeId, employeeIds))
            .catch(() => [])
        : [];

      // Score and rank employees
      const scoredEmployees = allEmployees
        .map((employee) => {
          const searchableText = [
            employee.fullName,
            employee.email,
            employee.phone,
            employee.officeLocation,
          ]
            .filter(Boolean)
            .join(" ");

          const score = fuzzyScore(query, searchableText);
          const employeeMove = employeeMoves.find(m => m.employeeId === employee.id);
          return { employee, score, move: employeeMove };
        })
        .filter((item) => item.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => ({
          id: item.employee.id,
          type: "employee" as const,
          title: item.employee.fullName,
          subtitle: `${item.employee.email} • ${item.employee.officeLocation}`,
          url: item.move ? `/moves/${item.move.id}` : `/moves`,
          score: item.score,
        }));

      // Score and rank services
      const scoredServices = allServices
        .map((service) => {
          const searchableText = [
            service.type,
            service.status,
            service.vendorName,
            service.move?.employee?.fullName,
            service.move?.originCity,
            service.move?.destinationCity,
          ]
            .filter(Boolean)
            .join(" ");

          const score = fuzzyScore(query, searchableText);
          return { service, score };
        })
        .filter((item) => item.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => ({
          id: item.service.id,
          type: "service" as const,
          title: `${item.service.type.replace(/_/g, " ")} - ${item.service.status}`,
          subtitle: `${item.service.move?.employee?.fullName || "Employee"} • ${item.service.vendorName || "No vendor"}`,
          url: `/services?moveId=${item.service.moveId}`,
          score: item.score,
        }));

      return {
        moves: scoredMoves,
        employees: scoredEmployees,
        services: scoredServices,
      };
    }),
});

