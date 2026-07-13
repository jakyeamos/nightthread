export interface ProviderTelemetry { requestId: string; provider: string; operation: string; ok: boolean; latencyMs: number }

export async function recordProviderTelemetry(env: CloudflareEnv, event: ProviderTelemetry): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(`insert into provider_usage_daily (provider,operation,utc_date,request_count,failure_count,last_request_at) values (?1,?2,?3,1,?4,?5) on conflict(provider,operation,utc_date) do update set request_count=request_count+1,failure_count=failure_count+excluded.failure_count,last_request_at=excluded.last_request_at`).bind(event.provider, event.operation, date, event.ok ? 0 : 1, Date.now()).run();
  console.log(JSON.stringify({ type: "provider_health", ...event }));
}
