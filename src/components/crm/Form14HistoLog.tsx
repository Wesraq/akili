import logoLight from "@/assets/logo-akili.png";
import { BodySiteMap } from "@/components/crm/BodySiteMap";
import type { BodySiteMark } from "@/lib/body-sites";
import { cn } from "@/lib/utils";

/** Columns from AKILI LABS-FORM-14_Histo log.docx */
export const FORM14_COLUMNS = [
  "Date collected",
  "Date received",
  "MR number",
  "Patient name",
  "Age/sex",
  "Ward",
  "Specimen type",
  "Requesting doctor",
  "Delivered by",
  "Received by",
  "Lab number",
  "Contact number",
] as const;

export type Form14LogRow = {
  id: number;
  dateCollected?: string | null;
  dateReceived?: string | null;
  mrNumber?: string | null;
  patientName?: string | null;
  ageSex?: string | null;
  ward?: string | null;
  specimenType?: string | null;
  requestingDoctor?: string | null;
  deliveredBy?: string | null;
  receivedBy?: string | null;
  labNumber?: string | null;
  contactNumber?: string | null;
  specimenSites?: BodySiteMark[];
  ageSexHint?: string | null;
};

export type Form14EntryValues = {
  dateCollected: string;
  dateReceived: string;
  mrNumber: string;
  patientName: string;
  age: string;
  sex: string;
  ward: string;
  specimenType: string;
  requestingDoctor: string;
  deliveredBy: string;
  receivedBy: string;
  labNumber: string;
  contactNumber: string;
};

function Form14Chrome({
  children,
  className,
  footer = true,
}: {
  children: React.ReactNode;
  className?: string;
  footer?: boolean;
}) {
  return (
    <article
      className={cn(
        "border border-black/25 bg-[#fbfaf7] text-black shadow-sm print:border-black print:bg-white print:shadow-none",
        className,
      )}
    >
      <header className="border-b border-black/25 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <img
              src={logoLight}
              alt="AKILI LABS"
              width={40}
              height={40}
              className="size-10 object-contain"
            />
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase">AKILI LABS</p>
              <h2 className="mt-1 font-display text-base font-semibold tracking-tight sm:text-lg">
                HISTOPATHOLOGY SAMPLE RECEIPT LOG
              </h2>
              <p className="mt-0.5 text-[11px] text-black/65">FORM-14</p>
            </div>
          </div>
          <p className="text-xs text-black/70">
            Effective Date: <span className="font-medium text-black">01/09/25</span>
          </p>
        </div>
      </header>
      <div className="p-3 sm:p-4">{children}</div>
      {footer ? (
        <footer className="flex flex-wrap gap-6 border-t border-black/25 px-4 py-3 text-xs sm:px-5">
          <p className="min-w-[200px] flex-1">
            CHECKED BY:{" "}
            <span className="inline-block min-w-[10rem] border-b border-black/40 align-bottom">
              &nbsp;
            </span>
          </p>
          <p className="min-w-[200px] flex-1">
            AUTHORISED BY:{" "}
            <span className="inline-block min-w-[10rem] border-b border-black/40 align-bottom">
              &nbsp;
            </span>
          </p>
        </footer>
      ) : null}
    </article>
  );
}

/** Multi-row receipt log — matches the paper FORM-14 table. */
export function Form14LogTable({
  rows,
  emptyLabel = "No histopathology entries yet.",
  onOpenRow,
}: {
  rows: Form14LogRow[];
  emptyLabel?: string;
  onOpenRow?: (id: number) => void;
}) {
  return (
    <Form14Chrome>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-[11px] leading-tight">
          <thead>
            <tr>
              {FORM14_COLUMNS.map((col) => (
                <th
                  key={col}
                  className="border border-black/30 bg-black/[0.04] px-1.5 py-2 text-left font-semibold uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={FORM14_COLUMNS.length}
                  className="border border-black/20 px-3 py-10 text-center text-sm text-black/55"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const cells = [
                  row.dateCollected || "—",
                  row.dateReceived || "—",
                  row.mrNumber || "—",
                  row.patientName || "—",
                  row.ageSex || "—",
                  row.ward || "—",
                  row.specimenType || "—",
                  row.requestingDoctor || "—",
                  row.deliveredBy || "—",
                  row.receivedBy || "—",
                  row.labNumber || "—",
                  row.contactNumber || "—",
                ];
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-black/[0.02]",
                      onOpenRow && "cursor-pointer",
                    )}
                    onClick={onOpenRow ? () => onOpenRow(row.id) : undefined}
                  >
                    {cells.map((value, index) => (
                      <td
                        key={`${row.id}-${FORM14_COLUMNS[index]}`}
                        className="border border-black/20 px-1.5 py-2 align-top text-black"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {rows.some((r) => r.specimenSites && r.specimenSites.length > 0) ? (
        <div className="mt-4 space-y-3 border-t border-black/15 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/70">
            Anatomical extraction sites
          </p>
          {rows
            .filter((r) => r.specimenSites && r.specimenSites.length > 0)
            .map((row) => (
              <div key={`sites-${row.id}`} className="rounded-sm border border-black/15 p-3">
                <p className="mb-2 text-xs font-medium">
                  Lab {row.labNumber || `#${row.id}`}
                  {row.patientName ? ` · ${row.patientName}` : ""}
                </p>
                <BodySiteMap
                  value={row.specimenSites ?? []}
                  sex={row.ageSexHint ?? row.ageSex}
                  readOnly
                  paper
                  compact
                />
              </div>
            ))}
        </div>
      ) : null}
    </Form14Chrome>
  );
}

function Form14Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1", className)}>
      <span className="text-[10px] font-semibold tracking-wide text-black/65 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

const fieldClass =
  "h-9 w-full rounded-none border border-black/30 bg-white px-2 text-sm text-black outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-black/[0.03]";

/** Single-accession FORM-14 worksheet with interactive male/female body maps. */
export function Form14EntryForm({
  values,
  onChange,
  specimenSites,
  onSitesChange,
  readOnly = false,
  children,
}: {
  values: Form14EntryValues;
  onChange: (field: keyof Form14EntryValues, value: string) => void;
  specimenSites: BodySiteMark[];
  onSitesChange?: ((sites: BodySiteMark[]) => void) | undefined;
  readOnly?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Form14Chrome>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Form14Field label="Date collected">
          <input
            type="date"
            className={fieldClass}
            value={values.dateCollected}
            disabled={readOnly}
            onChange={(e) => onChange("dateCollected", e.target.value)}
          />
        </Form14Field>
        <Form14Field label="Date received">
          <input type="text" className={fieldClass} value={values.dateReceived} disabled readOnly />
        </Form14Field>
        <Form14Field label="MR number">
          <input
            className={fieldClass}
            value={values.mrNumber}
            disabled={readOnly}
            onChange={(e) => onChange("mrNumber", e.target.value)}
          />
        </Form14Field>
        <Form14Field label="Patient name">
          <input className={fieldClass} value={values.patientName} disabled readOnly />
        </Form14Field>
        <Form14Field label="Age">
          <input
            className={fieldClass}
            value={values.age}
            disabled={readOnly}
            onChange={(e) => onChange("age", e.target.value)}
          />
        </Form14Field>
        <Form14Field label="Sex">
          <select
            className={fieldClass}
            value={values.sex}
            disabled={readOnly}
            onChange={(e) => onChange("sex", e.target.value)}
          >
            <option value="">Select</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </Form14Field>
        <Form14Field label="Ward">
          <input
            className={fieldClass}
            value={values.ward}
            disabled={readOnly}
            onChange={(e) => onChange("ward", e.target.value)}
          />
        </Form14Field>
        <Form14Field label="Specimen type">
          <input
            className={fieldClass}
            value={values.specimenType}
            disabled={readOnly}
            placeholder="Punch biopsy, excision, FNA…"
            onChange={(e) => onChange("specimenType", e.target.value)}
          />
        </Form14Field>
        <Form14Field label="Requesting doctor">
          <input
            className={fieldClass}
            value={values.requestingDoctor}
            disabled={readOnly}
            onChange={(e) => onChange("requestingDoctor", e.target.value)}
          />
        </Form14Field>
        <Form14Field label="Delivered by">
          <input
            className={fieldClass}
            value={values.deliveredBy}
            disabled={readOnly}
            onChange={(e) => onChange("deliveredBy", e.target.value)}
          />
        </Form14Field>
        <Form14Field label="Received by">
          <input
            className={fieldClass}
            value={values.receivedBy}
            disabled={readOnly}
            onChange={(e) => onChange("receivedBy", e.target.value)}
          />
        </Form14Field>
        <Form14Field label="Lab number">
          <input className={fieldClass} value={values.labNumber} disabled readOnly />
        </Form14Field>
        <Form14Field label="Contact number" className="sm:col-span-2">
          <input
            className={fieldClass}
            type="tel"
            value={values.contactNumber}
            disabled={readOnly}
            onChange={(e) => onChange("contactNumber", e.target.value)}
          />
        </Form14Field>
      </div>

      <div className="mt-5 border border-black/25 bg-white p-3">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide uppercase">
            Mark specimen extraction site(s)
          </p>
          <p className="text-[11px] text-black/60">
            Tap the matching figure — male / female · front / back
          </p>
        </div>
        <BodySiteMap
          value={specimenSites}
          {...(readOnly || !onSitesChange ? {} : { onChange: onSitesChange })}
          sex={values.sex}
          readOnly={readOnly}
          paper
        />
      </div>

      {children}
    </Form14Chrome>
  );
}
