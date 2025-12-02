export const SERVICES_WORKFLOW = `
SERVICES WORKFLOW

1C.2 Household Goods (HHG / Furniture Moving)
Automation Targets:
- Auto-trigger survey link to employee when HHG service is selected.
- Auto-ingest mover quotes into a normalized comparison view.
- Apply guardrails: If quote <= budget show to employee; If no quotes <= budget flag to employer.
- Auto-capture employee selection -> send structured "proceed" order to vendor.
- Automatically track required data for insurance and confirmation.
- Automated reminders to employee and vendor around: Final address confirmation, Delivery date windows.

1C.3 Car Shipment
Automation Targets:
- Standard car shipment request form -> vendor integration or automated email.
- Auto-store quotes and map them to move record.
- Auto-forward approved quote and shipment details to vendor (Pickup window, dropoff location, contact info).
- Notification and escalation logic for delays, status updates, and issues.

1C.4 Flights
Automation Targets:
- Flight API integration.
- Show 2-3 options that satisfy employer rules first, employee preferences second.
- Approval workflow and virtual card for payment.

1C.5 Orientation / Settling-In Services
Automation Targets:
- Maintain a city knowledgebase with local guidance.
- Auto-generate an orientation plan and recommended DSP tasks per city.
- Quote multiple DSP providers unless employer has a preferred partner.
- Auto-send introduction package to chosen DSP.

1C.6 Visa / Immigration (When Included)
Automation Targets:
- Immigration partner integration or structured milestone template per country.
- Auto-generated timeline with dependency markers.
- Automatic reminders for document collection and appointment deadlines.
`;

