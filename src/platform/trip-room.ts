import { DurableObject } from "cloudflare:workers";
import type { TripEvent } from "@/domain/types";
import { z } from "zod";

interface SocketAttachment {
  userId: string;
  displayName: string;
  joinedAt: number;
}

interface Lease {
  itemId: string;
  token: string;
  userId: string;
  displayName: string;
  expiresAt: number;
}

type ClientMessage =
  | { type: "lease.acquire"; itemId: string }
  | { type: "lease.renew"; itemId: string; token: string }
  | { type: "lease.release"; itemId: string; token: string }
  | { type: "entity.committed"; event: TripEvent };

const LEASE_MS = 30_000;
const mutationSchema = z.object({
  itemId: z.string().min(1),
  lockToken: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  patch: z.object({
    notes: z.string().max(4_000).nullable().optional(),
    startMinute: z.number().int().min(0).max(1439).nullable().optional(),
    durationMinutes: z.number().int().min(1).max(2_880).optional(),
    reservationStatus: z.enum(["none", "needed", "pending", "confirmed", "cancelled"]).optional(),
    needsDecision: z.boolean().optional(),
  }),
});

export class TripRoom extends DurableObject<CloudflareEnv> {
  private readonly leases = new Map<string, Lease>();

  constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env);
    for (const socket of this.ctx.getWebSockets()) {
      const attachment = socket.deserializeAttachment() as SocketAttachment | null;
      if (attachment) socket.serializeAttachment(attachment);
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method === "PATCH") return this.commitMutation(request);
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("WebSocket upgrade required", { status: 426 });
    }
    const userId = request.headers.get("X-Nightthread-User-Id");
    const displayName = request.headers.get("X-Nightthread-User-Name");
    if (!userId || !displayName) return new Response("Unauthorized", { status: 401 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const attachment: SocketAttachment = { userId, displayName, joinedAt: Date.now() };
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(attachment);
    this.broadcast({ type: "presence.joined", userId, displayName });
    server.send(JSON.stringify({ type: "room.ready", leases: this.activeLeases() }));
    return new Response(null, { status: 101, webSocket: client });
  }

  private async commitMutation(request: Request): Promise<Response> {
    const actorId = request.headers.get("X-Nightthread-User-Id");
    if (!actorId) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const parsed = mutationSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "INVALID_MUTATION" }, { status: 400 });
    const { itemId, lockToken, expectedVersion, patch } = parsed.data;
    this.expireLeases();
    const lease = this.leases.get(itemId);
    if (!lease || lease.token !== lockToken || lease.userId !== actorId) {
      return Response.json({ error: "LOCK_REQUIRED" }, { status: 409 });
    }
    const columns: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown): void => { columns.push(`${column} = ?${values.length + 1}`); values.push(value); };
    if ("notes" in patch) add("notes", patch.notes ?? null);
    if ("startMinute" in patch) add("start_minute", patch.startMinute ?? null);
    if (patch.durationMinutes !== undefined) add("duration_minutes", patch.durationMinutes);
    if (patch.reservationStatus !== undefined) add("reservation_status", patch.reservationStatus);
    if (patch.needsDecision !== undefined) add("needs_decision", patch.needsDecision ? 1 : 0);
    if (columns.length === 0) return Response.json({ error: "EMPTY_MUTATION" }, { status: 400 });
    columns.push("version = version + 1", `updated_at = ?${values.length + 1}`);
    values.push(Date.now(), itemId, expectedVersion);
    const result = await this.env.DB.prepare(
      `update itinerary_items set ${columns.join(", ")} where id = ?${values.length - 1} and version = ?${values.length} and deleted_at is null returning version`,
    ).bind(...values).first<{ version: number }>();
    if (!result) return Response.json({ error: "STALE_VERSION", refresh: true }, { status: 409 });
    this.leases.delete(itemId);
    const event: TripEvent = { type: "entity.patch", entityKind: "itinerary_item", entityId: itemId, version: result.version };
    this.broadcast({ type: "entity.committed", event });
    this.broadcast({ type: "lease.released", itemId });
    return Response.json({ version: result.version });
  }

  webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer): void {
    if (typeof raw !== "string") return;
    const actor = socket.deserializeAttachment() as SocketAttachment;
    let message: ClientMessage;
    try {
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      socket.send(JSON.stringify({ type: "error", code: "INVALID_MESSAGE" }));
      return;
    }

    this.expireLeases();
    if (message.type === "lease.acquire") {
      const existing = this.leases.get(message.itemId);
      if (existing && existing.userId !== actor.userId) {
        socket.send(JSON.stringify({ type: "lease.denied", lease: existing }));
        return;
      }
      const lease: Lease = {
        itemId: message.itemId,
        token: crypto.randomUUID(),
        userId: actor.userId,
        displayName: actor.displayName,
        expiresAt: Date.now() + LEASE_MS,
      };
      this.leases.set(message.itemId, lease);
      this.broadcast({ type: "lease.changed", lease });
      return;
    }
    if (message.type === "lease.renew") {
      const lease = this.leases.get(message.itemId);
      if (lease?.token !== message.token || lease.userId !== actor.userId) {
        socket.send(JSON.stringify({ type: "lease.rejected", itemId: message.itemId }));
        return;
      }
      lease.expiresAt = Date.now() + LEASE_MS;
      this.broadcast({ type: "lease.changed", lease });
      return;
    }
    if (message.type === "lease.release") {
      const lease = this.leases.get(message.itemId);
      if (lease?.token === message.token && lease.userId === actor.userId) {
        this.leases.delete(message.itemId);
        this.broadcast({ type: "lease.released", itemId: message.itemId });
      }
      return;
    }
    if (message.type === "entity.committed") {
      this.broadcast({ type: "entity.committed", event: message.event });
    }
  }

  webSocketClose(socket: WebSocket): void {
    this.disconnect(socket);
  }

  webSocketError(socket: WebSocket): void {
    this.disconnect(socket);
  }

  private disconnect(socket: WebSocket): void {
    const actor = socket.deserializeAttachment() as SocketAttachment | null;
    if (!actor) return;
    for (const [itemId, lease] of this.leases) {
      if (lease.userId === actor.userId) {
        this.leases.delete(itemId);
        this.broadcast({ type: "lease.released", itemId });
      }
    }
    this.broadcast({ type: "presence.left", userId: actor.userId });
  }

  private activeLeases(): Lease[] {
    this.expireLeases();
    return [...this.leases.values()];
  }

  private expireLeases(): void {
    const now = Date.now();
    for (const [itemId, lease] of this.leases) {
      if (lease.expiresAt <= now) {
        this.leases.delete(itemId);
        this.broadcast({ type: "lease.released", itemId });
      }
    }
  }

  private broadcast(payload: object): void {
    const message = JSON.stringify(payload);
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        socket.close(1011, "Delivery failed");
      }
    }
  }
}
