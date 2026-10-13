# AKILI LABS LIMS

Internal laboratory information system for clients, appointments, lab/clinical records, equipment supply orders, and invoicing.

UI patterns are inspired by LabKey Sample Manager (dashboard insights, dense grids, tabbed accession detail, event timeline) — implemented natively on Vite + SQLite.

## Start

```bash
npm run crm:seed   # first time: creates admin + clinical test catalogue
npm run dev
```

Open **http://localhost:8080/crm** (or the port Vite prints).

Default admin (override via env — see `.env.example`):

- Email: `admin@akililabs.local`
- Password: `AkiliAdmin1!`

## Data

SQLite file: `data/akili.db` (gitignored). Back up this file regularly.

## Clinical workflow

1. **Register** patient / facility (`/crm/clients`) — assigns Lab MRN (`AKL-#####`)
2. **Accession** (`/crm/lab-orders`) — creates accession ID (`ACC-YYYY-#####`) + specimen row
3. **Receive / reject** specimen on the order Specimens tab
4. **Bench** — enter results, submit for validation
5. **Release** — second staff validates; client email + printable report
6. **Invoice** — from Billing tab or order actions

## Modules

- `/crm/login` — staff sign-in
- `/crm` — workboard (insights, job queue, recent accessions)
- `/crm/leads` — website enquiries (quote / contact / collection)
- `/crm/clients` — patient / client registry
- `/crm/appointments` — scheduling
- `/crm/lab-orders` — accessioning, specimens, results, timeline, billing
- `/crm/equipment-orders` — equipment quotes & fulfilment (printable quotes)
- `/crm/invoices` — invoices from lab or equipment orders (print via browser)
- `/crm/tariffs` — staff tariff reference (read-only active prices)
- `/crm/reports` — revenue, test volume and lead funnel CSV exports
- `/crm/settings` — LIMS settings hub
  - `/crm/settings/profile` — my profile & password
  - `/crm/settings/organisation` — lab identity, contacts, currency, document footers (admin)
  - `/crm/settings/users` — staff accounts (admin)
  - `/crm/settings/tests` — configure tariffs / clinical menu (admin)
  - `/crm/settings/audit` — activity log with filters and deep links (admin)

Website services menu (`/services`) and homepage featured prices load from published tariffs in SQLite — edit in the portal and refresh the site.

Auth RPC lives in `src/crm/auth.ts` (client-safe). Cookie/session DB code is in `*.server.ts` modules loaded only inside server handlers.
