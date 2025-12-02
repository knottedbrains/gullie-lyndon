export const FINANCIAL_WORKFLOW = `
FINANCIAL WORKFLOW

1C.7 Tax (Income Tax & Gross-Up – Pre-Move Stage)
Automation Targets:
- Auto-create a tax intro package containing standardized required fields.
- Automatically send to tax partner upon move creation if tax is included in policy.

3A. Invoicing (Post-Move)
Automation Targets:
- Vendor and partner portal to upload invoices against specific moves and services.
- OCR + classification engine to tag: vendor, service type, date, amount, taxability.
- Auto-build employer invoice packet with: Vendor receipts, Service summary sheet, Gullie fee, Gross-up summary.
- Auto-push invoice to Stripe or integrated billing system.
- Automatic reminders and dunning logic for unpaid invoices.

3B. Tax Gross-Up Execution (Post-Move)
Automation Targets:
- Internal gross-up calculator using: Service type, Service cost, Country and state rules, Employee income band.
- Auto-generate gross-up summary and send to tax partner for confirmation.
- Auto-send final approved gross-up summary to employer and incorporate in final invoice.
`;

