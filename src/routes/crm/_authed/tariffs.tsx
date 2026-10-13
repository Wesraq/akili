import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { listActiveTariffs } from "@/crm/fns/clinical-tests.server";
import { formatZmw } from "@/lib/clinical-menu";
import { cn } from "@/lib/utils";

const authedRoute = getRouteApi("/crm/_authed");

export const Route = createFileRoute("/crm/_authed/tariffs")({
  loader: () => listActiveTariffs(),
  head: () => ({ meta: [{ title: "Tariffs - AKILI LIMS" }] }),
  component: TariffsReferencePage,
});

function TariffsReferencePage() {
  const tests = Route.useLoaderData();
  const { user, lab } = authedRoute.useRouteContext();
  const currency = lab.currency || "USD";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

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
    const q = query.trim().toLowerCase();
    return tests.filter((test) => {
      if (category !== "all" && test.category !== category) return false;
      if (!q) return true;
      return (
        test.code.toLowerCase().includes(q) ||
        test.name.toLowerCase().includes(q) ||
        test.category.toLowerCase().includes(q)
      );
    });
  }, [tests, query, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">LIMS</p>
          <h1 className="mt-2 text-3xl font-semibold">Tariffs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Active clinical prices ({currency}) for reference when booking and quoting · {tests.length}{" "}
            tests
          </p>
        </div>
        {user.role === "admin" ? (
          <Button asChild variant="outline">
            <Link to="/crm/settings/tests">Configure tariffs</Link>
          </Button>
        ) : null}
      </div>

      {categories.length > 0 ? (
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
          {categories.map((item) => (
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
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search code, name or category…"
            className="pl-9"
            aria-label="Search tariffs"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item.name} value={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sample</TableHead>
              <TableHead>TAT</TableHead>
              <TableHead className="text-right">Cash ({currency})</TableHead>
              <TableHead className="text-right">VAT incl.</TableHead>
              <TableHead>Website</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No active tariffs match these filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-mono text-xs">{test.code}</TableCell>
                  <TableCell className="font-medium">{test.name}</TableCell>
                  <TableCell className="text-muted-foreground">{test.category}</TableCell>
                  <TableCell className="text-muted-foreground">{test.sampleType}</TableCell>
                  <TableCell className="text-muted-foreground">{test.turnaround}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatZmw(test.priceCashZmw, currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatZmw(test.priceVatZmw, currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={test.published ? "secondary" : "outline"}>
                      {test.published ? "published" : "internal"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
