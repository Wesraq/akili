import { createFileRoute, redirect, useRouter, getRouteApi } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClinicalTest } from "@/crm/db/schema";
import {
  createClinicalTest,
  listAllClinicalTests,
  setClinicalTestActive,
  setClinicalTestPublished,
  updateClinicalTest,
} from "@/crm/fns/clinical-tests.server";
import { formatZmw } from "@/lib/clinical-menu";
import { cn } from "@/lib/utils";

const authedRoute = getRouteApi("/crm/_authed");

export const Route = createFileRoute("/crm/_authed/settings/tests")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: "/crm/settings" });
    }
  },
  loader: () => listAllClinicalTests(),
  head: () => ({ meta: [{ title: "Configure tariffs - AKILI LIMS" }] }),
  component: TariffsPage,
});

type EditorMode =
  | { kind: "create"; seed?: Partial<ClinicalTest> }
  | { kind: "edit"; test: ClinicalTest };

type SortKey =
  | "code"
  | "name"
  | "category"
  | "priceCashZmw"
  | "priceVatZmw"
  | "active"
  | "published";

function nextUniqueCode(base: string, existing: string[]) {
  const root = base.replace(/-COPY\d*$/i, "").slice(0, 32);
  let attempt = `${root}-COPY`;
  let n = 2;
  const upper = new Set(existing.map((code) => code.toUpperCase()));
  while (upper.has(attempt.toUpperCase())) {
    attempt = `${root}-COPY${n}`;
    n += 1;
  }
  return attempt;
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />;
  return dir === "asc" ? (
    <ArrowUp className="size-3.5" aria-hidden />
  ) : (
    <ArrowDown className="size-3.5" aria-hidden />
  );
}

function TariffsPage() {
  const tests = Route.useLoaderData();
  const { lab } = authedRoute.useRouteContext();
  const currency = lab.currency || "USD";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "published" | "unpublished">(
    "published",
  );
  const [sortKey, setSortKey] = useState<SortKey>("category");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editor, setEditor] = useState<EditorMode | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const test of tests) {
      counts.set(test.category, (counts.get(test.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tests]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = tests.filter((test) => {
      if (category !== "all" && test.category !== category) return false;
      if (status === "active" && !test.active) return false;
      if (status === "inactive" && test.active) return false;
      if (status === "published" && !test.published) return false;
      if (status === "unpublished" && test.published) return false;
      if (!needle) return true;
      return (
        test.code.toLowerCase().includes(needle) ||
        test.name.toLowerCase().includes(needle) ||
        test.category.toLowerCase().includes(needle)
      );
    });

    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === "priceCashZmw") return (a.priceCashZmw - b.priceCashZmw) * dir;
      if (sortKey === "priceVatZmw") return (a.priceVatZmw - b.priceVatZmw) * dir;
      if (sortKey === "active") return (Number(a.active) - Number(b.active)) * dir;
      if (sortKey === "published") return (Number(a.published) - Number(b.published)) * dir;
      return String(a[sortKey]).localeCompare(String(b[sortKey])) * dir;
    });
    return rows;
  }, [tests, query, category, status, sortKey, sortDir]);

  const publishedCount = tests.filter((test) => test.published && test.active).length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function openDuplicate(test: ClinicalTest) {
    setEditor({
      kind: "create",
      seed: {
        ...test,
        code: nextUniqueCode(test.code, tests.map((row) => row.code)),
        name: `${test.name} (copy)`,
        active: true,
        published: false,
      },
    });
  }

  function exportCsv() {
    const header = [
      "code",
      "name",
      "category",
      "sampleType",
      "turnaround",
      "priceCashZmw",
      "priceVatZmw",
      "active",
      "published",
    ];
    const lines = [
      header.join(","),
      ...filtered.map((test) =>
        [
          test.code,
          test.name,
          test.category,
          test.sampleType,
          test.turnaround,
          test.priceCashZmw.toFixed(2),
          test.priceVatZmw.toFixed(2),
          test.active ? "1" : "0",
          test.published ? "1" : "0",
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `akili-tariffs-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} tariffs`);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      code: String(form.get("code") ?? ""),
      name: String(form.get("name") ?? ""),
      category: String(form.get("category") ?? ""),
      sampleType: String(form.get("sampleType") ?? "") || "As advised by lab",
      turnaround: String(form.get("turnaround") ?? "") || "Ask lab",
      priceCashZmw: Number(form.get("priceCashZmw") ?? 0),
      priceVatZmw: Number(form.get("priceVatZmw") ?? 0),
      resultUnit: String(form.get("resultUnit") ?? ""),
      referenceRange: String(form.get("referenceRange") ?? ""),
      active: form.get("active") === "on",
      published: form.get("published") === "on",
    };
    setPending(true);
    try {
      if (editor.kind === "create") {
        await createClinicalTest({ data: payload });
        toast.success("Tariff added");
      } else {
        await updateClinicalTest({
          data: { id: editor.test.id, ...payload },
        });
        toast.success("Tariff updated — website will show published prices");
      }
      setEditor(null);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save tariff");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(test: ClinicalTest) {
    try {
      await setClinicalTestActive({ data: { id: test.id, active: !test.active } });
      toast.success(test.active ? "Removed from lab ordering" : "Available for lab ordering");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function togglePublished(test: ClinicalTest) {
    try {
      await setClinicalTestPublished({ data: { id: test.id, published: !test.published } });
      toast.success(test.published ? "Unpublished from website" : "Published to website");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  const draft =
    editor?.kind === "edit"
      ? editor.test
      : editor?.kind === "create"
        ? editor.seed
        : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold">Configure tariffs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {publishedCount} published on website · {tests.length} total · edits sync to /services
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/services" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden />
              View website menu
            </a>
          </Button>
          <Button type="button" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
          <Button type="button" onClick={() => setEditor({ kind: "create" })}>
            <Plus className="size-4" aria-hidden />
            Add tariff
          </Button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors",
              category === "all"
                ? "border-primary bg-primary-soft text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            All · {tests.length}
          </button>
          {categories.slice(0, 12).map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setCategory(item.name)}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors",
                category === item.name
                  ? "border-primary bg-primary-soft text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {item.name} · {item.count}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search code or name…"
            className="pl-9"
            aria-label="Search tariffs"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as "all" | "active" | "inactive" | "published" | "unpublished")
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="published">On website</SelectItem>
            <SelectItem value="unpublished">Not on website</SelectItem>
            <SelectItem value="active">Lab-order active</SelectItem>
            <SelectItem value="inactive">Lab-order inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {(
                [
                  ["code", "Code", ""],
                  ["name", "Name", ""],
                  ["category", "Category", "hidden md:table-cell"],
                  ["priceCashZmw", "Cash", "text-right"],
                  ["priceVatZmw", "VAT incl.", "text-right"],
                  ["published", "Web", ""],
                  ["active", "Lab", ""],
                ] as const
              ).map(([key, label, className]) => (
                <TableHead key={key} className={className}>
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 hover:text-foreground",
                      (key === "priceCashZmw" || key === "priceVatZmw") && "w-full justify-end",
                    )}
                  >
                    {label}
                    <SortIcon active={sortKey === key} dir={sortDir} />
                  </button>
                </TableHead>
              ))}
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((test) => (
              <TableRow key={test.id} className={!test.active ? "opacity-60" : undefined}>
                <TableCell className="font-mono text-xs font-medium">{test.code}</TableCell>
                <TableCell className="font-medium">{test.name}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {test.category}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatZmw(test.priceCashZmw, currency)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatZmw(test.priceVatZmw, currency)}
                </TableCell>
                <TableCell>
                  <Badge variant={test.published ? "secondary" : "outline"}>
                    {test.published ? "Live" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={test.active ? "secondary" : "outline"}>
                    {test.active ? "On" : "Off"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditor({ kind: "edit", test })}
                      aria-label={`Edit ${test.code}`}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => openDuplicate(test)}
                      aria-label={`Duplicate ${test.code}`}
                    >
                      <Copy className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void togglePublished(test)}
                    >
                      {test.published ? "Hide" : "Publish"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void toggleActive(test)}
                    >
                      {test.active ? "Lab off" : "Lab on"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  No tariffs match these filters. Run <code className="text-xs">npm run crm:seed</code>{" "}
                  to import the Excel menu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editor?.kind === "edit"
                ? "Edit tariff"
                : editor?.seed
                  ? "Duplicate tariff"
                  : "Add tariff"}
            </DialogTitle>
            <DialogDescription>
              Published tariffs appear on the public services page. Lab-order active controls LIMS
              ordering.
            </DialogDescription>
          </DialogHeader>

          <form
            key={editor?.kind === "edit" ? editor.test.id : `create-${draft?.code ?? "new"}`}
            onSubmit={(event) => void onSubmit(event)}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  placeholder="H001"
                  defaultValue={draft?.code ?? ""}
                  className="font-mono uppercase"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  required
                  placeholder="Haematology"
                  defaultValue={draft?.category ?? ""}
                  list="tariff-categories"
                />
                <datalist id="tariff-categories">
                  {categories.map((item) => (
                    <option key={item.name} value={item.name} />
                  ))}
                </datalist>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Full Blood Count"
                  defaultValue={draft?.name ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceCashZmw">Cash ({currency})</Label>
                <Input
                  id="priceCashZmw"
                  name="priceCashZmw"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={draft?.priceCashZmw ?? 0}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceVatZmw">VAT inclusive ({currency})</Label>
                <Input
                  id="priceVatZmw"
                  name="priceVatZmw"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={draft?.priceVatZmw ?? 0}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sampleType">Sample</Label>
                <Input
                  id="sampleType"
                  name="sampleType"
                  placeholder="EDTA blood"
                  defaultValue={draft?.sampleType ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="turnaround">Turnaround</Label>
                <Input
                  id="turnaround"
                  name="turnaround"
                  placeholder="24 hours"
                  defaultValue={draft?.turnaround ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resultUnit">Default result unit</Label>
                <Input
                  id="resultUnit"
                  name="resultUnit"
                  placeholder="g/dL"
                  defaultValue={draft?.resultUnit ?? ""}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="referenceRange">Reference range</Label>
                <Input
                  id="referenceRange"
                  name="referenceRange"
                  placeholder="e.g. 12.0 – 15.0"
                  defaultValue={draft?.referenceRange ?? ""}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="published"
                  value="on"
                  defaultChecked={draft?.published ?? true}
                />
                Publish on website
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  value="on"
                  defaultChecked={draft?.active ?? true}
                />
                Available for lab orders
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditor(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : editor?.kind === "edit" ? "Save & sync website" : "Add tariff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
