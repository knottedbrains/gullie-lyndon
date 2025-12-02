export const PRE_MOVE_WORKFLOW = `
PRE-MOVE WORKFLOW (Most automatable phase)

1A. INITIATION & SETUP
Automation Targets:
1A.1 Employer Move Creation (Preferred Future Flow)
- Employers create or upload moves directly in Gullie.
- Required fields: Employee full name, Email, Phone number, Origin city, Destination city, Office location, Program / policy details, Target move date.
- Platform validates required fields.

1A.2 Temporary Backstop (Current Email-Initiated Flow)
- Auto-parse inbound client email -> infer and populate: Employee contact data, Origin, Destination, Budget or program type.
- Auto-create move record and send: Employee welcome email, Employer confirmation, Calendar link for optional call.

1A.3 Employee First Login Experience
- On first login, show Welcome Screen with: Employer name, Employee name, Summary of relocation program.
- Prompt employee to: Review and confirm profile data, See "What's covered / what's not covered", Proceed into service selection or AI-guided intake.

1A.4 Service Universe & Policy-Driven Choices
- Auto-configure visible services based on employer program/policy.
- Track exceptions: Log requests not covered by policy as "exception request" for approval.

1B. NEEDS DISCOVERY (EMPLOYEE & FAMILY PROFILE)
Automation Targets:
1B.1 Structured Lifestyle Intake via Platform
- AI-driven questionnaire collects: Household composition, Must-have vs nice-to-have criteria, Commute tolerances, Budget sensitivity.
- Output is a structured profile for matching logic.

1B.2 Match Categories for Housing
- Categorize results: Optimal match, Strong match, Essential match.

1B.3 Required Document Checklist & Milestones
- Auto-generate document checklist based on selected services and Country/state rules.
- Show service milestones and dependencies.
`;

