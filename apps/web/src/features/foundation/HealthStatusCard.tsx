import { useEffect, useState } from "react";

import type { ApiHealthResponse } from "@grammarian/shared";

import { Button } from "@/components/ui/button";
import { fetchHealthStatus } from "@/lib/api";

type HealthState =
  | { status: "loading" }
  | { data: ApiHealthResponse; status: "ready" }
  | { message: string; status: "error" };

export function HealthStatusCard() {
  const [healthState, setHealthState] = useState<HealthState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();

    void loadHealthStatus(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  async function loadHealthStatus(signal?: AbortSignal) {
    setHealthState({ status: "loading" });

    try {
      const health = await fetchHealthStatus(signal);
      setHealthState({ data: health, status: "ready" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setHealthState({
        message:
          error instanceof Error
            ? error.message
            : "The API is not reachable yet.",
        status: "error",
      });
    }
  }

  return (
    <section
      id="workspace-status"
      className="rounded-[1.75rem] border border-slate-950/10 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Workspace status
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            API connectivity
          </h2>
        </div>
        <Button onClick={() => void loadHealthStatus()} size="sm" variant="ghost">
          Refresh
        </Button>
      </div>

      {healthState.status === "loading" ? (
        <div className="mt-6 rounded-2xl bg-slate-100 px-4 py-6 text-sm text-slate-600">
          Checking the API health endpoint...
        </div>
      ) : null}

      {healthState.status === "error" ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
          <p className="font-medium">The web shell could not reach the API.</p>
          <p className="mt-2">{healthState.message}</p>
        </div>
      ) : null}

      {healthState.status === "ready" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <StatusTile label="Service" value={healthState.data.appName} />
          <StatusTile label="Environment" value={healthState.data.environment} />
          <StatusTile label="Version" value={healthState.data.version} />
          <StatusTile
            label="Uptime"
            value={`${healthState.data.uptimeSeconds}s`}
          />
          <StatusTile label="Status" value={healthState.data.status} />
          <StatusTile
            label="Checked at"
            value={new Date(healthState.data.timestamp).toLocaleTimeString()}
          />
        </div>
      ) : null}
    </section>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

