import { Buffer } from "node:buffer";
import EventEmitter from "node:events";
import {
  GatewayCloseCodes,
  GatewayDispatchEvents,
  type GatewayDispatchPayload,
  type GatewayIdentifyData,
  GatewayOpcodes,
  type GatewayPresenceUpdateData,
  type GatewayReceivePayload,
  type GatewayResumeData,
  type GatewaySendPayload,
  type GatewayVoiceStateUpdateData,
} from "discord-api-types/v10";
import WebSocket, { type RawData } from "ws";
import { GatewayError } from "../../errors/Gateway";
import {
  DEFAULT_HANDSHAKE_TIMEOUT,
  DEFAULT_HELLO_TIMEOUT,
  DEFAULT_READY_TIMEOUT,
  GATEWAY_ENCODING,
  GATEWAY_VERSION,
  getInitialSendRateLimitState,
  ImportantGatewayOpcodes,
  MAX_PAYLOAD_SIZE,
  SEND_RATE_LIMIT_MAX,
  SEND_RATE_LIMIT_WINDOW,
} from "./constants";
import { AsyncQueue } from "./structures/AsyncQueue";
import { DynamicBucket } from "./structures/DynamicBucket";
import type { IIdentifyThrottler } from "./throttling/IIdentifyThrottler";
import {
  type SendRateLimitState,
  type ShardData,
  type ShardHeart,
  ShardSocketCloseCodes,
  type WebSocketShardDestroyOptions,
  WebSocketShardDestroyRecovery,
  type WebSocketShardOptions,
  WebSocketShardStatus,
} from "./types";

/**
 * Event names emitted by {@link WebSocketShard}.
 */
export enum WebSocketShardEvents {
  Closed = "closed",
  Debug = "debug",
  Dispatch = "dispatch",
  Error = "error",
  HeartbeatComplete = "heartbeat",
  Hello = "hello",
  Ready = "ready",
  Resumed = "resumed",
  SocketError = "socketError",
}

/**
 * Strongly-typed event signatures emitted by {@link WebSocketShard}.
 */
export interface WebSocketShardEventsMap {
  [WebSocketShardEvents.Closed]: [code: number];
  [WebSocketShardEvents.Debug]: [message: string];
  [WebSocketShardEvents.Dispatch]: [payload: GatewayDispatchPayload];
  [WebSocketShardEvents.Error]: [error: Error];
  [WebSocketShardEvents.Hello]: [interval: number];
  [WebSocketShardEvents.Ready]: [];
  [WebSocketShardEvents.Resumed]: [];
  [WebSocketShardEvents.HeartbeatComplete]: [
    stats: { ackAt: number; heartbeatAt: number; latency: number },
  ];
  [WebSocketShardEvents.SocketError]: [error: Error];
}

/**
 * Robust gateway shard that combines djs's session/recovery model
 *
 * @remarks
 * - Honors Discord's `max_concurrency` via the injected
 *   {@link IIdentifyThrottler}.
 * - Caps non-priority sends to ~115/60s using {@link AsyncQueue} and a
 *   {@link DynamicBucket}.
 * - Detects zombied connections via missed heartbeat acks and recovers by
 *   resuming the session.
 *
 * @see {@link https://discord.com/developers/docs/topics/gateway}
 */
export class WebSocketShard extends EventEmitter<WebSocketShardEventsMap> {
  /** Stable shard id. */
  public readonly id: number;

  /** Persisted session/sequence data used to resume. */
  public readonly data: ShardData = {
    sequence: null,
    resumeGatewayURL: null,
    sessionId: null,
  };

  /** Heartbeat tracking state. */
  public readonly heart: ShardHeart = {
    interval: 41_250,
    ack: true,
    lastAck: 0,
    lastBeat: 0,
    intervalTimer: null,
    ackTimeout: null,
  };

  /** Last computed ping (ms). */
  public ping = 0;

  /** Number of replayed events since the last RESUME. */
  public replayedEvents = 0;

  private connection: WebSocket | null = null;
  private status: WebSocketShardStatus = WebSocketShardStatus.Idle;
  private readonly options: Required<
    Pick<WebSocketShardOptions, "helloTimeout" | "readyTimeout" | "handshakeTimeout">
  > &
    WebSocketShardOptions;

  private readonly throttler: IIdentifyThrottler;
  private readonly sendQueue = new AsyncQueue();
  private readonly bucket: DynamicBucket;
  private readonly offlineQueue: ((value?: unknown) => void)[] = [];
  private sendRateLimitState: SendRateLimitState = getInitialSendRateLimitState();
  private initialHeartbeatTimer: NodeJS.Timeout | null = null;
  private isAck = true;
  private failedDueToNetworkError = false;
  private destroyController: AbortController | null = null;

  /**
   * @param id - Shard id.
   * @param throttler - Identify throttler shared across shards.
   * @param options - Shard configuration.
   */
  public constructor(id: number, throttler: IIdentifyThrottler, options: WebSocketShardOptions) {
    super();
    this.id = id;
    this.throttler = throttler;
    this.options = {
      helloTimeout: DEFAULT_HELLO_TIMEOUT,
      readyTimeout: DEFAULT_READY_TIMEOUT,
      handshakeTimeout: DEFAULT_HANDSHAKE_TIMEOUT,
      ...options,
    };

    const safeRequests =
      SEND_RATE_LIMIT_MAX -
      Math.ceil(SEND_RATE_LIMIT_WINDOW / Math.max(this.heart.interval, 1)) * 2;

    this.bucket = new DynamicBucket({
      limit: Math.max(safeRequests, 1),
      refillInterval: SEND_RATE_LIMIT_WINDOW,
    });
  }

  /**
   * Current lifecycle status.
   */
  public get currentStatus(): WebSocketShardStatus {
    return this.status;
  }

  /**
   * Whether the shard considers its session resumable.
   */
  public get resumable(): boolean {
    return Boolean(
      this.data.resumeGatewayURL && this.data.sessionId && this.data.sequence !== null,
    );
  }

  /**
   * Whether the underlying WebSocket is currently open.
   */
  public get isOpen(): boolean {
    return this.connection?.readyState === WebSocket.OPEN;
  }

  /**
   * Latest known latency in milliseconds.
   */
  public get latency(): number {
    return this.heart.lastAck && this.heart.lastBeat
      ? this.heart.lastAck - this.heart.lastBeat
      : Number.POSITIVE_INFINITY;
  }

  /**
   * Establishes the WebSocket connection.
   */
  public async connect(): Promise<void> {
    if (this.status !== WebSocketShardStatus.Idle) {
      this.debug(`Tried to connect while status was ${WebSocketShardStatus[this.status]}`);
      return;
    }

    const url = this.buildGatewayURL();
    this.debug(`Connecting to ${url}`);
    this.status = WebSocketShardStatus.Connecting;
    this.failedDueToNetworkError = false;

    const ws = new WebSocket(url, {
      handshakeTimeout: this.options.handshakeTimeout,
    });

    this.connection = ws;
    this.destroyController = new AbortController();

    ws.on("open", () => this.onOpen());
    ws.on("message", (data, isBinary) => this.onMessage(data, isBinary));
    ws.on("close", (code, reason) => this.onClose(code, reason));
    ws.on("error", (error) => this.onError(error));
  }

  /**
   * Destroys the shard, optionally recovering via reconnect or resume.
   */
  public async destroy(options: WebSocketShardDestroyOptions = {}): Promise<void> {
    if (this.status === WebSocketShardStatus.Idle) {
      this.debug("Tried to destroy a shard that was already idle");
      return;
    }

    const code =
      options.code ??
      (options.recover === WebSocketShardDestroyRecovery.Resume
        ? ShardSocketCloseCodes.Resuming
        : ShardSocketCloseCodes.Normal);

    this.debug(
      `Destroying shard. code=${code} reason=${options.reason ?? "none"} recover=${
        options.recover === undefined ? "none" : WebSocketShardDestroyRecovery[options.recover]
      }`,
    );

    this.isAck = true;
    this.clearHeartbeat();
    this.destroyController?.abort();
    this.destroyController = null;

    if (options.recover !== WebSocketShardDestroyRecovery.Resume) {
      this.data.sequence = null;
      this.data.sessionId = null;
      this.data.resumeGatewayURL = null;
    }

    if (this.connection) {
      this.connection.removeAllListeners("message");
      this.connection.removeAllListeners("close");

      if (this.connection.readyState === WebSocket.OPEN) {
        await new Promise<void>((resolve) => {
          this.connection?.once("close", () => resolve());
          this.connection?.close(code, options.reason ?? "");
        });
        this.emit(WebSocketShardEvents.Closed, code);
      }

      this.connection.removeAllListeners();
      this.connection = null;
    }

    this.status = WebSocketShardStatus.Idle;

    this.options.onShardDisconnect?.({
      shardId: this.id,
      code,
      reason: options.reason ?? "",
    });

    if (options.recover !== undefined) {
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      await this.connect();
      this.options.onShardReconnect?.({ shardId: this.id });
    }
  }

  /**
   * Sends a payload, respecting rate limits and offline state.
   */
  public async send(payload: GatewaySendPayload): Promise<void> {
    if (!this.connection) {
      throw new Error("WebSocketShard is not connected");
    }

    const serialized = JSON.stringify(payload);
    if (Buffer.byteLength(serialized) > MAX_PAYLOAD_SIZE) {
      throw new Error(
        `Payload exceeds the maximum size of ${MAX_PAYLOAD_SIZE} bytes (${Buffer.byteLength(
          serialized,
        )} bytes)`,
      );
    }

    if (ImportantGatewayOpcodes.has(payload.op)) {
      this.connection.send(serialized);
      return;
    }

    if (!this.isOpen) {
      await new Promise((resolve) => this.offlineQueue.push(resolve));
    }

    await this.sendQueue.wait();

    try {
      await this.bucket.acquire();
      const now = Date.now();
      if (now >= this.sendRateLimitState.resetAt) {
        this.sendRateLimitState = getInitialSendRateLimitState();
      }

      if (this.sendRateLimitState.sent + 1 >= SEND_RATE_LIMIT_MAX) {
        const sleepFor = this.sendRateLimitState.resetAt - now + Math.random() * 1_500;
        this.debug(`Send rate limit hit, sleeping for ${sleepFor}ms`);
        await new Promise<void>((resolve) => setTimeout(resolve, sleepFor));
        this.sendRateLimitState = getInitialSendRateLimitState();
      }

      this.sendRateLimitState.sent++;
      this.connection?.send(serialized);
    } finally {
      this.sendQueue.shift();
    }
  }

  /**
   * Updates the presence for this shard.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway-events#update-presence}
   */
  public async updatePresence(data: GatewayPresenceUpdateData): Promise<void> {
    await this.send({ op: GatewayOpcodes.PresenceUpdate, d: data });
  }

  /**
   * Updates the voice state for this shard.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway-events#update-voice-state}
   */
  public async updateVoiceState(data: GatewayVoiceStateUpdateData): Promise<void> {
    await this.send({ op: GatewayOpcodes.VoiceStateUpdate, d: data });
  }

  /**
   * Builds the connection URL, preferring `resumeGatewayURL` when available.
   */
  private buildGatewayURL(): string {
    const base = this.data.resumeGatewayURL ?? this.options.gatewayURL;
    const url = new URL(base);
    url.searchParams.set("v", String(GATEWAY_VERSION));
    url.searchParams.set("encoding", GATEWAY_ENCODING);
    return url.href;
  }

  private onOpen(): void {
    this.debug("WebSocket open");
    this.sendRateLimitState = getInitialSendRateLimitState();
    this.flushOfflineQueue();
  }

  private flushOfflineQueue(): void {
    while (this.offlineQueue.length > 0) {
      const next = this.offlineQueue.shift();
      next?.();
    }
  }

  private onError(error: Error): void {
    this.failedDueToNetworkError = true;
    this.emit(WebSocketShardEvents.SocketError, error);
  }

  private onMessage(data: RawData, isBinary: boolean): void {
    let parsed: GatewayReceivePayload;
    try {
      const text = isBinary
        ? Buffer.isBuffer(data)
          ? data.toString("utf8")
          : Buffer.from(data as ArrayBuffer).toString("utf8")
        : data.toString();
      parsed = JSON.parse(text) as GatewayReceivePayload;
    } catch (error) {
      this.emit(WebSocketShardEvents.Error, error as Error);
      return;
    }

    this.handlePayload(parsed);
  }

  private handlePayload(payload: GatewayReceivePayload): void {
    if (payload.s !== null) {
      this.data.sequence = payload.s;
    }

    switch (payload.op) {
      case GatewayOpcodes.Hello: {
        this.heart.interval = payload.d.heartbeat_interval;
        this.emit(WebSocketShardEvents.Hello, this.heart.interval);
        this.scheduleInitialHeartbeat();
        if (this.resumable) {
          this.resume();
        } else {
          this.identify();
        }
        break;
      }

      case GatewayOpcodes.HeartbeatAck: {
        this.isAck = true;
        this.heart.ack = true;
        const ackAt = Date.now();
        this.heart.lastAck = ackAt;
        this.ping = ackAt - this.heart.lastBeat;
        if (this.heart.ackTimeout) {
          clearTimeout(this.heart.ackTimeout);
          this.heart.ackTimeout = null;
        }
        this.emit(WebSocketShardEvents.HeartbeatComplete, {
          ackAt,
          heartbeatAt: this.heart.lastBeat,
          latency: this.ping,
        });
        break;
      }

      case GatewayOpcodes.Heartbeat:
        this.heartbeat(true);
        break;

      case GatewayOpcodes.Reconnect:
        this.debug("Server requested reconnect");
        this.destroy({
          reason: "Told to reconnect by Discord",
          recover: WebSocketShardDestroyRecovery.Resume,
        });
        break;

      case GatewayOpcodes.InvalidSession: {
        const canResume = payload.d;
        this.debug(`Invalid session; resumable=${canResume}`);
        if (canResume && this.resumable) {
          this.resume();
        } else {
          this.destroy({
            reason: "Invalid session",
            recover: WebSocketShardDestroyRecovery.Reconnect,
          });
        }
        break;
      }

      case GatewayOpcodes.Dispatch: {
        if (this.status === WebSocketShardStatus.Resuming) {
          this.replayedEvents++;
        }

        switch (payload.t) {
          case GatewayDispatchEvents.Ready: {
            this.status = WebSocketShardStatus.Ready;
            this.data.sessionId = payload.d.session_id;
            this.data.resumeGatewayURL = payload.d.resume_gateway_url;
            this.emit(WebSocketShardEvents.Ready);
            break;
          }
          case GatewayDispatchEvents.Resumed: {
            this.status = WebSocketShardStatus.Ready;
            this.debug(`Resumed and replayed ${this.replayedEvents} events`);
            this.emit(WebSocketShardEvents.Resumed);
            break;
          }
          default:
            break;
        }

        this.emit(WebSocketShardEvents.Dispatch, payload);
        break;
      }
    }
  }

  private scheduleInitialHeartbeat(): void {
    if (this.initialHeartbeatTimer) {
      clearTimeout(this.initialHeartbeatTimer);
    }
    const jitter = Math.random();
    const wait = Math.floor(this.heart.interval * jitter);
    this.debug(`Scheduling initial heartbeat in ${wait}ms (jitter=${jitter.toFixed(3)})`);
    this.initialHeartbeatTimer = setTimeout(() => {
      this.initialHeartbeatTimer = null;
      this.heartbeat();
      this.heart.intervalTimer = setInterval(() => this.heartbeat(), this.heart.interval);
    }, wait);
  }

  private clearHeartbeat(): void {
    if (this.initialHeartbeatTimer) {
      clearTimeout(this.initialHeartbeatTimer);
      this.initialHeartbeatTimer = null;
    }
    if (this.heart.intervalTimer) {
      clearInterval(this.heart.intervalTimer);
      this.heart.intervalTimer = null;
    }
    if (this.heart.ackTimeout) {
      clearTimeout(this.heart.ackTimeout);
      this.heart.ackTimeout = null;
    }
  }

  /**
   * Sends a heartbeat. If the previous one was unacknowledged the connection
   * is treated as a zombie and resumed.
   */
  private async heartbeat(requested = false): Promise<void> {
    if (!this.isAck && !requested) {
      this.debug("Heartbeat ack missed; recovering via resume");
      await this.destroy({
        code: ShardSocketCloseCodes.ZombiedConnection,
        reason: "Zombie connection",
        recover: WebSocketShardDestroyRecovery.Resume,
      });
      return;
    }

    this.heart.ack = false;
    this.isAck = false;
    this.heart.lastBeat = Date.now();

    await this.send({
      op: GatewayOpcodes.Heartbeat,
      d: this.data.sequence,
    });

    if (this.heart.ackTimeout) {
      clearTimeout(this.heart.ackTimeout);
    }
    this.heart.ackTimeout = setTimeout(() => {
      if (!this.heart.ack) {
        this.destroy({
          code: ShardSocketCloseCodes.ZombiedConnection,
          reason: "Heartbeat ack timeout",
          recover: WebSocketShardDestroyRecovery.Resume,
        });
      }
    }, this.heart.interval * 1.5);
  }

  /**
   * Sends an IDENTIFY payload after waiting for the throttler.
   */
  private async identify(): Promise<void> {
    this.debug("Waiting for identify slot");
    const controller = new AbortController();
    const closeListener = () => controller.abort();
    this.once(WebSocketShardEvents.Closed, closeListener);

    try {
      await this.throttler.waitForIdentify(this.id, controller.signal);
    } catch (error) {
      this.off(WebSocketShardEvents.Closed, closeListener);
      if (controller.signal.aborted) {
        return;
      }
      this.emit(WebSocketShardEvents.Error, error as Error);
      return;
    }
    this.off(WebSocketShardEvents.Closed, closeListener);

    const data: GatewayIdentifyData = {
      token: this.options.token,
      properties: this.options.identifyProperties,
      intents: this.options.intents,
      compress: this.options.compress ?? false,
      shard: [this.id, this.options.shardCount],
    };

    if (this.options.largeThreshold) {
      data.large_threshold = this.options.largeThreshold;
    }

    if (this.options.presence) {
      data.presence = this.options.presence;
    }

    this.debug(
      `Identifying as shard ${this.id}/${this.options.shardCount} with intents ${this.options.intents}`,
    );

    await this.send({ op: GatewayOpcodes.Identify, d: data });
  }

  /**
   * Sends a RESUME payload using the persisted session data.
   */
  private async resume(): Promise<void> {
    if (!this.resumable) {
      this.debug("Tried to resume without resumable session, identifying instead");
      await this.identify();
      return;
    }

    this.status = WebSocketShardStatus.Resuming;
    this.replayedEvents = 0;
    const sessionId = this.data.sessionId as string;
    const data: GatewayResumeData = {
      token: this.options.token,
      session_id: sessionId,
      seq: this.data.sequence ?? 0,
    };
    this.debug(`Resuming session ${this.data.sessionId} from sequence ${this.data.sequence}`);
    await this.send({ op: GatewayOpcodes.Resume, d: data });
  }

  private async onClose(code: number, reason: Buffer): Promise<void> {
    this.emit(WebSocketShardEvents.Closed, code);
    this.debug(`WebSocket closed with code ${code} and reason "${reason.toString()}"`);

    switch (code) {
      case ShardSocketCloseCodes.Normal:
        await this.destroy({
          code,
          reason: "Disconnected by Discord",
          recover: WebSocketShardDestroyRecovery.Reconnect,
        });
        return;

      case ShardSocketCloseCodes.Resuming:
      case ShardSocketCloseCodes.Reconnect:
      case ShardSocketCloseCodes.Shutdown:
      case ShardSocketCloseCodes.ShutdownAll:
      case ShardSocketCloseCodes.ZombiedConnection:
        return;

      case GatewayCloseCodes.UnknownError:
      case GatewayCloseCodes.UnknownOpcode:
      case GatewayCloseCodes.DecodeError:
      case GatewayCloseCodes.SessionTimedOut:
        await this.destroy({ code, recover: WebSocketShardDestroyRecovery.Resume });
        return;

      case GatewayCloseCodes.NotAuthenticated:
      case GatewayCloseCodes.AlreadyAuthenticated:
      case GatewayCloseCodes.InvalidSeq:
      case GatewayCloseCodes.RateLimited:
        await this.destroy({ code, recover: WebSocketShardDestroyRecovery.Reconnect });
        return;

      case GatewayCloseCodes.AuthenticationFailed:
      case GatewayCloseCodes.InvalidShard:
      case GatewayCloseCodes.ShardingRequired:
      case GatewayCloseCodes.InvalidAPIVersion:
      case GatewayCloseCodes.InvalidIntents:
      case GatewayCloseCodes.DisallowedIntents: {
        const error = new GatewayError(code, reason.toString() || GatewayCloseCodes[code] || "");
        this.emit(WebSocketShardEvents.Error, error);
        await this.destroy({ code });
        throw error;
      }

      default: {
        const recover = this.failedDueToNetworkError
          ? WebSocketShardDestroyRecovery.Reconnect
          : WebSocketShardDestroyRecovery.Resume;
        this.debug(
          `Unknown close code ${code}, recovering via ${WebSocketShardDestroyRecovery[recover]}`,
        );
        await this.destroy({ code, recover });
      }
    }
  }

  private debug(message: string): void {
    this.emit(WebSocketShardEvents.Debug, `[Shard #${this.id}] ${message}`);
  }
}
