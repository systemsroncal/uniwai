import { Fragment } from "react";
import { Check, Minus, X } from "lucide-react";
import {
  LANDING_PLAN_ORDER,
  PLAN_FEATURE_GROUPS,
  PLANS,
  type PlanFeatureCell,
  PlanTier,
} from "@uniwai/shared";

function FeatureValue({ value }: { value: PlanFeatureCell }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-emerald-600" aria-label="Incluido">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-slate-300" aria-label="No incluido">
        <X className="h-4 w-4" />
      </span>
    );
  }
  if (value === "—") {
    return (
      <span className="inline-flex items-center justify-center text-slate-300" aria-label="No aplica">
        <Minus className="h-4 w-4" />
      </span>
    );
  }
  return <span className="text-xs font-medium text-primary">{value}</span>;
}

export function PlanComparisonTable() {
  return (
    <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-muted/40 px-4 py-4 md:px-6">
        <h3 className="text-lg font-semibold text-primary">Comparativa detallada de planes</h3>
        <p className="mt-1 text-sm text-secondary">
          Genera leads, automatiza conversaciones, organiza tu pipeline y escala con IA segura.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="sticky left-0 z-10 bg-white px-4 py-3 font-semibold text-primary md:px-6">
                Característica
              </th>
              {LANDING_PLAN_ORDER.map((tier) => (
                <th
                  key={tier}
                  scope="col"
                  className={`px-3 py-3 text-center font-semibold ${
                    tier === PlanTier.PRO ? "bg-primary text-on-primary" : "text-primary"
                  }`}
                >
                  {PLANS[tier].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_FEATURE_GROUPS.map((group) => (
              <Fragment key={group.id}>
                <tr key={`${group.id}-title`} className="bg-muted/50">
                  <td
                    colSpan={LANDING_PLAN_ORDER.length + 1}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-secondary md:px-6"
                  >
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white px-4 py-3 font-normal text-secondary md:px-6"
                    >
                      {row.label}
                    </th>
                    {LANDING_PLAN_ORDER.map((tier) => (
                      <td
                        key={`${row.id}-${tier}`}
                        className={`px-3 py-3 text-center ${
                          tier === PlanTier.PRO ? "bg-primary/5" : ""
                        }`}
                      >
                        <FeatureValue value={row.values[tier]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-3 text-xs text-secondary md:px-6">
        Plan Custom disponible bajo cotización: límites negociables, white label e implementación asistida.
      </p>
    </div>
  );
}
