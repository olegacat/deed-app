import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell, Card, Field, StatusPill, inputCls } from "@/components/admin/AdminShell";
import { fmtDate, updateJurisdiction, useAdminStore, type JurisdictionRule } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/jurisdictions")({
  head: () => ({
    meta: [
      { title: "Jurisdiction & Rate Management — Deed Copilot Internal" },
      { name: "description", content: "Edit transfer-tax rates, county overrides, required forms and Live/Beta status for every state." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Jurisdiction & Rate Management — Deed Copilot Internal" },
      { property: "og:description", content: "Internal rate table editor for all 50 states plus DC." },
    ],
  }),
  component: Jurisdictions,
});

function Jurisdictions() {
  const { jurisdictions } = useAdminStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "beta">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const list = useMemo(
    () =>
      jurisdictions
        .filter((j) => (filter === "all" ? true : j.status === filter))
        .filter((j) => `${j.name} ${j.code}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [jurisdictions, q, filter],
  );

  useEffect(() => {
    if (!selected && list.length > 0) setSelected(list[0]?.code ?? null);
  }, [list, selected]);

  const current = jurisdictions.find((j) => j.code === selected) ?? null;

  return (
    <AdminShell title="Jurisdiction & rate management" subtitle="Changes save immediately — no deploy, no reload.">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card
          title={`States (${list.length})`}
          action={
            <div className="flex gap-1">
              {(["all", "live", "beta"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-sm border px-2 py-1 text-[11px] capitalize ${filter === f ? "border-ring bg-muted font-medium" : "border-border text-muted-foreground"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search state or code…"
            className={inputCls}
          />
          <div className="mt-3 max-h-[28rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 pb-2 font-medium">State</th>
                  <th className="px-3 pb-2 font-medium">Status</th>
                  <th className="px-3 pb-2 text-right font-medium">Counties</th>
                  <th className="px-3 pb-2 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((j) => (
                  <tr
                    key={j.code}
                    onClick={() => setSelected(j.code)}
                    className={`cursor-pointer transition-colors hover:bg-muted ${
                      selected === j.code ? "bg-primary/10 shadow-[inset_2px_0_0_0_var(--color-primary)]" : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      {j.name} <span className="text-xs text-muted-foreground">{j.code}</span>
                    </td>
                    <td className="px-3 py-2"><StatusPill status={j.status === "live" ? "Live" : "Beta"} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{j.countyCount}</td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">{fmtDate(j.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {current ? <Editor key={current.code} j={current} /> : (
          <Card title="Edit jurisdiction">
            <p className="text-sm text-muted-foreground">Select a state on the left to edit its rates, forms and status.</p>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}

function Editor({ j }: { j: JurisdictionRule }) {
  const [status, setStatus] = useState(j.status);
  const [baseRate, setBaseRate] = useState(j.baseRate);
  const [formula, setFormula] = useState(j.formula);
  const [overrides, setOverrides] = useState(j.overrides);
  const [forms, setForms] = useState(j.forms);
  const [saved, setSaved] = useState(false);

  const dirty =
    status !== j.status ||
    baseRate !== j.baseRate ||
    formula !== j.formula ||
    JSON.stringify(overrides) !== JSON.stringify(j.overrides) ||
    JSON.stringify(forms) !== JSON.stringify(j.forms);

  function save() {
    const changes: string[] = [];
    if (status !== j.status) changes.push(`status → ${status}`);
    if (baseRate !== j.baseRate) changes.push("base rate");
    if (formula !== j.formula) changes.push("formula");
    if (JSON.stringify(overrides) !== JSON.stringify(j.overrides)) changes.push("county overrides");
    if (JSON.stringify(forms) !== JSON.stringify(j.forms)) changes.push("required forms");
    updateJurisdiction(j.code, { status, baseRate, formula, overrides, forms }, `Updated ${changes.join(", ")}`);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Card
      title={`${j.name} (${j.code})`}
      action={
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Live</span>
          <button
            type="button"
            aria-pressed={status === "live"}
            onClick={() => setStatus(status === "live" ? "beta" : "live")}
            className={`h-5 w-9 rounded-full transition-colors ${status === "live" ? "bg-success" : "bg-muted-foreground/40"}`}
          >
            <span className={`block h-4 w-4 rounded-full bg-card transition-transform ${status === "live" ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
          <StatusPill status={status === "live" ? "Live" : "Beta"} />
        </label>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Base transfer-tax rate">
          <input value={baseRate} onChange={(e) => setBaseRate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="County count (read-only)">
          <input value={j.countyCount} readOnly className={`${inputCls} bg-muted`} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Formula">
          <textarea value={formula} onChange={(e) => setFormula(e.target.value)} rows={2} className={inputCls} />
        </Field>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">County-specific overrides</p>
        <div className="space-y-2">
          {overrides.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={o.county}
                onChange={(e) => setOverrides(overrides.map((x, k) => (k === i ? { ...x, county: e.target.value } : x)))}
                placeholder="County"
                className={`${inputCls} max-w-[10rem]`}
              />
              <input
                value={o.rule}
                onChange={(e) => setOverrides(overrides.map((x, k) => (k === i ? { ...x, rule: e.target.value } : x)))}
                placeholder="Override rule"
                className={inputCls}
              />
              <button onClick={() => setOverrides(overrides.filter((_, k) => k !== i))} className="rounded-sm border border-border px-2 text-xs hover:bg-muted">
                Remove
              </button>
            </div>
          ))}
          <button onClick={() => setOverrides([...overrides, { county: "", rule: "" }])} className="rounded-sm border border-border px-2 py-1 text-xs hover:bg-muted">
            + Add override
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Required forms</p>
        <div className="space-y-2">
          {forms.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input value={f} onChange={(e) => setForms(forms.map((x, k) => (k === i ? e.target.value : x)))} className={inputCls} />
              <button onClick={() => setForms(forms.filter((_, k) => k !== i))} className="rounded-sm border border-border px-2 text-xs hover:bg-muted">
                Remove
              </button>
            </div>
          ))}
          <button onClick={() => setForms([...forms, ""])} className="rounded-sm border border-border px-2 py-1 text-xs hover:bg-muted">
            + Add form
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={!dirty}
          className="rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Save changes
        </button>
        {saved ? <span className="text-xs text-success">Saved — live for all users immediately.</span> : null}
        {dirty && !saved ? <span className="text-xs text-muted-foreground">Unsaved changes</span> : null}
      </div>

      <div className="mt-5 border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Changelog</p>
        <ul className="space-y-1.5 text-xs">
          {j.changelog.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="w-32 shrink-0 text-muted-foreground">{new Date(c.at).toLocaleString()}</span>
              <span className="w-52 shrink-0 truncate">{c.by}</span>
              <span>{c.what}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}