import { createCipheriv, createDecipheriv, getCiphers } from "node:crypto";
import { createSocket, type Socket } from "node:dgram";
import EventEmitter from "node:events";
import { isIP } from "node:net";
import * as Davey from "@snazzah/davey";
import {
  type VoiceReadyData as OfficialVoiceReadyData,
  VoiceCloseCodes,
  VoiceEncryptionMode,
  type VoiceHeartbeat,
  VoiceOpcodes,
  type VoiceReceivePayload,
  type VoiceSelectProtocol,
  type VoiceSendPayload,
  type VoiceSessionDescriptionData,
  VoiceSpeakingFlags,
} from "discord-api-types/voice";
import WebSocket from "ws";
import AudioPlayer, { type AudioOptions, type AudioResource } from "./AudioPlayer";

export type VoiceReadyData = OfficialVoiceReadyData;
export type VoiceSessionDescription = VoiceSessionDescriptionData;

export interface VoiceConnectionOptions {
  serverId: string;
  userId: string;
  sessionId: string;
  token: string;
  endpoint: string;
  channelId?: string;
}

export interface VoiceState {
  sessionId: string;
  serverId: string;
  userId: string;
  token: string;
  endpoint: string | null;
  channelId?: string | null;
}

/**
 * A decoded voice packet received from Discord.
 */
export interface VoiceAudioPacket {
  /** The encrypted-transport-decoded Opus frame, optionally DAVE-decoded. */
  opus: Buffer;
  /** The sender's user ID when the SSRC has been associated with a user. */
  userId: string | null;
  /** The RTP timestamp. */
  timestamp: number;
  /** The RTP sequence number. */
  sequence: number;
  /** The sender SSRC. */
  ssrc: number;
}

const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);
const VOICE_VERSION = 8;

/**
 * A voice connection implementing Discord's voice gateway, DAVE session flow,
 * UDP discovery, AEAD transport encryption, encrypted Opus sending, receiving,
 * and paced playback.
 */
class VoiceConnection extends EventEmitter {
  private ws: WebSocket | null = null;
  private udp: Socket | null = null;
  private state: VoiceState;
  private readyData: VoiceReadyData | null = null;
  private sessionDescription: VoiceSessionDescription | null = null;
  private secretKey: Buffer | null = null;
  private encryptionMode: VoiceEncryptionMode | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private initialHeartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat = 0;
  private lastHeartbeatAck = 0;
  private sequence = Math.floor(Math.random() * 0x10000);
  private timestamp = Math.floor(Math.random() * 0x1_0000_0000);
  private nonce = 0;
  private voiceSequence = -1;
  private udpAddress: string | null = null;
  private udpPort = 0;
  private connected = false;
  private intentionalDisconnect = false;
  private discoveryComplete = false;
  private connectPromise: Promise<void> | null = null;
  private resolveConnect: (() => void) | null = null;
  private rejectConnect: ((error: Error) => void) | null = null;
  private readonly audioPlayer: AudioPlayer;
  private readonly ssrcUsers = new Map<number, string>();
  private readonly connectedUsers = new Set<string>();
  private daveSession: Davey.DAVESession | null = null;
  private daveProtocolVersion = 0;
  private readonly pendingTransitions = new Map<number, number>();
  private lastTransitionId: number | null = null;
  private daveDowngraded = false;

  /**
   * @param options - The voice session credentials received from Discord.
   */
  public constructor(options: VoiceConnectionOptions) {
    super();
    this.state = {
      sessionId: options.sessionId,
      serverId: options.serverId,
      userId: options.userId,
      token: options.token,
      endpoint: options.endpoint,
      channelId: options.channelId ?? null,
    };
    this.audioPlayer = new AudioPlayer();
    this.audioPlayer.setConnection(this);
  }

  /**
   * Connects to the voice websocket and resolves after the UDP and session
   * description handshake is complete.
   * @returns A promise that resolves when encrypted media can be sent.
   */
  public connect(): Promise<void> {
    if (this.isReady()) {
      return Promise.resolve();
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.intentionalDisconnect = false;
    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.resolveConnect = resolve;
      this.rejectConnect = reject;
    });

    let endpoint = this.state.endpoint;
    if (!endpoint) {
      this.failConnection(new Error("No voice endpoint provided"));
      return this.connectPromise;
    }

    if (!endpoint.startsWith("wss://") && !endpoint.startsWith("ws://")) {
      endpoint = `wss://${endpoint}`;
    }

    try {
      const url = new URL(endpoint);
      url.searchParams.set("v", String(VOICE_VERSION));
      this.ws = new WebSocket(url.href);
      this.ws.on("open", () => this.onOpen());
      this.ws.on("message", (data: WebSocket.Data, isBinary: boolean) =>
        this.onMessage(data, isBinary),
      );
      this.ws.on("error", (error: Error) => this.onError(error));
      this.ws.on("close", (code: number, reason: Buffer) => this.onClose(code, reason));
    } catch (error) {
      this.failConnection(error as Error);
    }

    return this.connectPromise;
  }

  /**
   * Disconnects from both the voice websocket and UDP media server.
   * @param reconnect - Whether the connection should be re-established.
   */
  public disconnect(reconnect = false): void {
    this.intentionalDisconnect = !reconnect;
    this.connected = false;
    this.clearTimers();
    this.audioPlayer.stop();
    this.closeUDP();

    const socket = this.ws;
    this.ws = null;
    if (socket) {
      socket.removeAllListeners("message");
      socket.removeAllListeners("close");
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000, reconnect ? "Voice reconnect" : "Client disconnect");
      }
    }

    if (!reconnect) {
      this.readyData = null;
      this.sessionDescription = null;
      this.secretKey = null;
      this.encryptionMode = null;
      this.pendingTransitions.clear();
      this.daveSession?.reset();
      this.daveProtocolVersion = 0;
      this.lastTransitionId = null;
      this.resolveConnect = null;
      this.rejectConnect = null;
      this.connectPromise = null;
      this.emit("close", VoiceCloseCodes.Disconnected, "Client disconnect");
    }
  }

  /**
   * Updates the voice server credentials after Discord moves the session.
   * @param token - The new voice token.
   * @param endpoint - The new voice endpoint, or null while Discord is rotating it.
   */
  public updateServer(token: string, endpoint: string | null): void {
    this.state.token = token;
    this.state.endpoint = endpoint;
    if (!endpoint) {
      this.disconnect(true);
      return;
    }
    if (this.isReady()) {
      this.disconnect(true);
      this.connect().catch((error) => this.reportError(error as Error));
    }
  }

  /**
   * Updates the main gateway voice session ID.
   * @param sessionId - The new voice session ID.
   */
  public updateSession(sessionId: string): void {
    this.state.sessionId = sessionId;
  }

  private clearTimers(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
    if (this.initialHeartbeatTimer) {
      clearTimeout(this.initialHeartbeatTimer);
      this.initialHeartbeatTimer = null;
    }
  }

  private onOpen(): void {
    this.connected = true;
    this.send({
      op: VoiceOpcodes.Identify,
      d: {
        server_id: this.state.serverId,
        user_id: this.state.userId,
        session_id: this.state.sessionId,
        token: this.state.token,
        max_dave_protocol_version: Davey.DAVE_PROTOCOL_VERSION,
      },
    });
    this.emit("connect");
  }

  private onMessage(data: WebSocket.Data, isBinary: boolean): void {
    const buffer = this.toBuffer(data);
    if (isBinary) {
      this.handleBinaryMessage(buffer);
      return;
    }

    let packet: VoiceReceivePayload;
    try {
      packet = JSON.parse(buffer.toString("utf8")) as VoiceReceivePayload;
    } catch (error) {
      this.reportError(new Error(`Failed to parse voice packet: ${(error as Error).message}`));
      return;
    }

    const sequence = (packet as VoiceReceivePayload & { seq?: number }).seq;
    if (sequence !== undefined) {
      this.voiceSequence = sequence;
    }

    switch (packet.op) {
      case VoiceOpcodes.Ready:
        this.readyData = packet.d;
        this.initializeUDP(packet.d).catch((error) => this.failConnection(error as Error));
        this.emit("voiceReady", packet.d);
        break;
      case VoiceOpcodes.SessionDescription:
        this.handleSessionDescription(packet.d).catch((error) =>
          this.failConnection(error as Error),
        );
        break;
      case VoiceOpcodes.Hello:
        this.startHeartbeat(packet.d.heartbeat_interval);
        this.emit("hello", packet.d);
        break;
      case VoiceOpcodes.HeartbeatAck:
        this.lastHeartbeatAck = Date.now();
        if (this.heartbeatTimeout) {
          clearTimeout(this.heartbeatTimeout);
          this.heartbeatTimeout = null;
        }
        this.emit("pong", this.lastHeartbeatAck - this.lastHeartbeat);
        break;
      case VoiceOpcodes.Speaking:
        this.ssrcUsers.set(packet.d.ssrc, packet.d.user_id);
        this.connectedUsers.add(packet.d.user_id);
        this.emit(packet.d.speaking ? "speakingStart" : "speakingStop", packet.d.user_id);
        this.emit("speaking", packet.d);
        break;
      case VoiceOpcodes.ClientsConnect:
        for (const userId of packet.d.user_ids) {
          this.connectedUsers.add(userId);
        }
        this.emit("usersConnect", packet.d.user_ids);
        this.emit("clientConnect", packet.d);
        break;
      case VoiceOpcodes.ClientDisconnect:
        this.connectedUsers.delete(packet.d.user_id);
        for (const [ssrc, userId] of this.ssrcUsers) {
          if (userId === packet.d.user_id) {
            this.ssrcUsers.delete(ssrc);
          }
        }
        this.emit("userDisconnect", packet.d.user_id);
        this.emit("clientDisconnect", packet.d);
        break;
      case VoiceOpcodes.Resumed:
        this.connected = true;
        this.emit("resumed");
        break;
      case VoiceOpcodes.DavePrepareTransition:
        this.prepareDaveTransition(packet.d.transition_id, packet.d.protocol_version);
        break;
      case VoiceOpcodes.DaveExecuteTransition:
        this.executeDaveTransition(packet.d.transition_id);
        break;
      case VoiceOpcodes.DavePrepareEpoch:
        if (packet.d.epoch === 1) {
          this.daveProtocolVersion = packet.d.protocol_version;
          this.reinitializeDaveSession();
        }
        this.emit("davePrepareEpoch", packet.d);
        break;
    }
  }

  private toBuffer(data: WebSocket.Data): Buffer {
    if (Buffer.isBuffer(data)) {
      return data;
    }
    if (typeof data === "string") {
      return Buffer.from(data);
    }
    if (data instanceof ArrayBuffer) {
      return Buffer.from(data);
    }
    if (Array.isArray(data)) {
      return Buffer.concat(data.map((part) => Buffer.from(part)));
    }
    const view = data as Uint8Array;
    return Buffer.from(
      new Uint8Array(view.buffer as ArrayBuffer, view.byteOffset, view.byteLength),
    );
  }

  private handleBinaryMessage(message: Buffer): void {
    if (message.length < 3) {
      this.reportError(new Error("Received an invalid binary voice gateway payload"));
      return;
    }

    this.voiceSequence = message.readUInt16BE(0);
    const opcode = message.readUInt8(2);
    const payload = message.subarray(3);
    const daveSession = this.daveSession;

    if (!daveSession) {
      return;
    }

    try {
      switch (opcode) {
        case VoiceOpcodes.DaveMlsExternalSender:
          daveSession.setExternalSender(payload);
          this.emit("daveExternalSender");
          break;
        case VoiceOpcodes.DaveMlsProposals: {
          if (payload.length < 1) {
            throw new Error("DAVE proposals payload is missing its operation type");
          }
          const result = daveSession.processProposals(
            payload.readUInt8(0) as Davey.ProposalsOperationType,
            payload.subarray(1),
            [...this.connectedUsers, this.state.userId],
          );
          if (result.commit) {
            this.sendBinary(
              VoiceOpcodes.DaveMlsCommitWelcome,
              result.welcome ? Buffer.concat([result.commit, result.welcome]) : result.commit,
            );
          }
          this.emit("daveProposals", result);
          break;
        }
        case VoiceOpcodes.DaveMlsAnnounceCommitTransition:
          this.processDaveCommit(payload, false);
          break;
        case VoiceOpcodes.DaveMlsWelcome:
          this.processDaveCommit(payload, true);
          break;
        default:
          this.emit("daveBinary", { opcode, payload });
          break;
      }
    } catch (error) {
      this.reportError(error as Error);
      if (this.lastTransitionId !== null) {
        this.recoverFromInvalidTransition(this.lastTransitionId);
      }
    }
  }

  private processDaveCommit(payload: Buffer, welcome: boolean): void {
    if (payload.length < 2) {
      throw new Error("DAVE commit payload is too short");
    }
    const transitionId = payload.readUInt16BE(0);
    if (welcome) {
      this.daveSession?.processWelcome(payload.subarray(2));
    } else {
      this.daveSession?.processCommit(payload.subarray(2));
    }
    this.lastTransitionId = transitionId;
    if (transitionId !== 0) {
      this.pendingTransitions.set(transitionId, this.daveProtocolVersion);
      this.send({
        op: VoiceOpcodes.DaveTransitionReady,
        d: { transition_id: transitionId },
      });
    }
    this.emit(welcome ? "daveWelcome" : "daveCommit", transitionId);
  }

  private reinitializeDaveSession(): void {
    if (this.daveProtocolVersion <= 0) {
      this.daveSession?.reset();
      this.daveSession?.setPassthroughMode(true, 30);
      return;
    }

    try {
      if (this.daveSession) {
        this.daveSession.reinit(
          this.daveProtocolVersion,
          this.state.userId,
          this.state.channelId ?? this.state.serverId,
        );
      } else {
        this.daveSession = new Davey.DAVESession(
          this.daveProtocolVersion,
          this.state.userId,
          this.state.channelId ?? this.state.serverId,
        );
      }
      this.sendBinary(VoiceOpcodes.DaveMlsKeyPackage, this.daveSession.getSerializedKeyPackage());
      this.emit("daveSession", this.daveSession);
    } catch (error) {
      this.reportError(error as Error);
    }
  }

  private prepareDaveTransition(transitionId: number, protocolVersion: number): void {
    this.pendingTransitions.set(transitionId, protocolVersion);
    if (protocolVersion === 0) {
      this.daveSession?.setPassthroughMode(true, 30);
    }
    if (transitionId === 0) {
      this.executeDaveTransition(transitionId);
    } else {
      this.send({ op: VoiceOpcodes.DaveTransitionReady, d: { transition_id: transitionId } });
    }
    this.emit("davePrepareTransition", { transitionId, protocolVersion });
  }

  private executeDaveTransition(transitionId: number): boolean {
    const nextVersion = this.pendingTransitions.get(transitionId);
    if (nextVersion === undefined) {
      this.emit("warn", `Received an unknown DAVE transition ${transitionId}`);
      return false;
    }

    const previousVersion = this.daveProtocolVersion;
    this.daveProtocolVersion = nextVersion;
    this.pendingTransitions.delete(transitionId);
    if (nextVersion === 0) {
      this.daveDowngraded = true;
      this.daveSession?.setPassthroughMode(true, 30);
    } else if (this.daveDowngraded) {
      this.daveDowngraded = false;
      this.daveSession?.setPassthroughMode(true, 10);
    }
    this.emit("daveTransition", { transitionId, previousVersion, nextVersion });
    return true;
  }

  private recoverFromInvalidTransition(transitionId: number): void {
    this.send({
      op: VoiceOpcodes.DaveMlsInvalidCommitWelcome,
      d: { transition_id: transitionId },
    });
    this.reinitializeDaveSession();
  }

  private async handleSessionDescription(data: VoiceSessionDescription): Promise<void> {
    this.sessionDescription = data;
    this.secretKey = Buffer.from(data.secret_key);
    this.encryptionMode = data.mode;
    this.daveProtocolVersion = data.dave_protocol_version ?? 0;
    if (data.mode !== VoiceEncryptionMode.AeadAes256GcmRtpSize) {
      this.reportError(new Error(`Unsupported voice encryption mode: ${data.mode}`));
      return;
    }

    this.reinitializeDaveSession();
    this.connected = true;
    this.emit("sessionDescription", data);
    this.emit("ready", data);
    this.resolveConnect?.();
    this.resolveConnect = null;
    this.rejectConnect = null;
    this.connectPromise = null;
  }

  private async initializeUDP(data: VoiceReadyData): Promise<void> {
    if (!getCiphers().includes("aes-256-gcm")) {
      this.failConnection(new Error("This runtime does not provide AES-256-GCM for Discord voice"));
      return;
    }

    const mode = data.modes.find(
      (candidate) => candidate === VoiceEncryptionMode.AeadAes256GcmRtpSize,
    );
    if (!mode) {
      this.failConnection(new Error("Discord did not offer AES-256-GCM RTP-size voice encryption"));
      return;
    }

    this.closeUDP();
    this.udp = createSocket(isIP(data.ip) === 6 ? "udp6" : "udp4");
    this.udpAddress = data.ip;
    this.udpPort = data.port;
    this.encryptionMode = mode;
    this.discoveryComplete = false;

    this.udp.on("error", (error) => this.reportError(error));
    this.udp.once("message", (message) => this.handleDiscoveryResponse(message, mode));
    this.udp.on("message", (message) => {
      if (this.discoveryComplete) {
        this.handleIncomingRtp(message);
      }
    });

    await new Promise<void>((resolve, reject) => {
      const socket = this.udp;
      if (!socket) {
        reject(new Error("Voice UDP socket was not created"));
        return;
      }
      socket.once("listening", () => {
        const discovery = Buffer.alloc(74);
        discovery.writeUInt16BE(1, 0);
        discovery.writeUInt16BE(70, 2);
        discovery.writeUInt32BE(data.ssrc, 4);
        socket.send(discovery, data.port, data.ip, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      socket.once("error", reject);
      socket.bind();
    }).catch((error: Error) => this.failConnection(error));
  }

  private handleDiscoveryResponse(message: Buffer, mode: VoiceEncryptionMode): void {
    if (message.length < 70 || !this.udp) {
      this.failConnection(new Error("Invalid Discord voice UDP discovery response"));
      return;
    }
    const addressEnd = message.indexOf(0, 8);
    const address = message.toString(
      "utf8",
      8,
      addressEnd === -1 ? message.length - 2 : addressEnd,
    );
    const port = message.readUInt16BE(message.length - 2);
    this.discoveryComplete = true;
    const payload: VoiceSelectProtocol = {
      op: VoiceOpcodes.SelectProtocol,
      d: {
        protocol: "udp",
        data: { address, port, mode },
      },
    };
    this.send(payload);
    this.emit("udpReady", { address, port, mode });
  }

  private handleIncomingRtp(message: Buffer): void {
    const firstByte = message[0] ?? 0;
    const payloadType = message[1] ?? 0;
    if (message.length < 32 || payloadType !== 0x78 || firstByte >> 6 !== 2) {
      return;
    }

    const hasExtension = (firstByte & 0x10) !== 0;
    const hasPadding = (firstByte & 0x20) !== 0;
    const csrcCount = firstByte & 0x0f;
    let headerSize = 12 + csrcCount * 4;
    if (hasExtension) {
      if (message.length < headerSize + 4) {
        return;
      }
      headerSize += 4 + message.readUInt16BE(headerSize + 2) * 4;
    }
    if (message.length <= headerSize + 20) {
      return;
    }

    try {
      const nonce = Buffer.alloc(12);
      message.copy(nonce, 0, message.length - 4);
      const decipher = createDecipheriv("aes-256-gcm", this.secretKey as Buffer, nonce);
      decipher.setAAD(message.subarray(0, headerSize));
      decipher.setAuthTag(message.subarray(message.length - 20, message.length - 4));
      let opus = Buffer.concat([
        decipher.update(message.subarray(headerSize, message.length - 20)),
        decipher.final(),
      ]);

      if (hasPadding && opus.length > 0) {
        const padding = opus[opus.length - 1] ?? 0;
        if (padding > 0 && padding <= opus.length) {
          opus = opus.subarray(0, opus.length - padding);
        }
      }
      if (hasExtension) {
        const extensionOffset = 12 + csrcCount * 4;
        if (message[extensionOffset] === 0xbe && message[extensionOffset + 1] === 0xde) {
          opus = opus.subarray(message.readUInt16BE(extensionOffset + 2) * 4);
        }
      }
      if (opus.length === 0) {
        return;
      }

      const ssrc = message.readUInt32BE(8);
      const userId = this.ssrcUsers.get(ssrc) ?? null;
      if (this.daveSession && !opus.equals(SILENCE_FRAME)) {
        if (this.daveProtocolVersion > 0 && !this.daveSession.ready) {
          return;
        }
        if (userId && (this.daveSession.ready || this.daveSession.canPassthrough(userId))) {
          opus = Buffer.from(this.daveSession.decrypt(userId, Davey.MediaType.AUDIO, opus));
        }
      }

      const packet: VoiceAudioPacket = {
        opus,
        userId,
        timestamp: message.readUInt32BE(4),
        sequence: message.readUInt16BE(2),
        ssrc,
      };
      this.emit("audio", packet);
      this.emit("audioPacket", packet);
    } catch (error) {
      this.emit("warn", `Failed to decrypt received voice packet: ${(error as Error).message}`);
    }
  }

  private closeUDP(): void {
    this.udp?.removeAllListeners();
    this.udp?.close();
    this.udp = null;
    this.discoveryComplete = false;
    this.udpAddress = null;
  }

  private onError(error: Error): void {
    this.reportError(error);
  }

  private onClose(code: number, reason: Buffer): void {
    this.connected = false;
    this.clearTimers();
    this.closeUDP();
    this.ws = null;

    if (!this.intentionalDisconnect && this.shouldReconnect(code) && this.state.endpoint) {
      this.emit("reconnecting", code);
      setTimeout(() => {
        this.connect().catch((error) => this.reportError(error as Error));
      }, 500);
      return;
    }

    if (this.connectPromise) {
      this.failConnection(new Error(`Voice websocket closed (${code}): ${reason.toString()}`));
    }
    this.emit("close", code, reason.toString());
  }

  private shouldReconnect(code: number): boolean {
    return [
      VoiceCloseCodes.UnknownOpcode,
      VoiceCloseCodes.FailedToDecode,
      VoiceCloseCodes.SessionTimeout,
      VoiceCloseCodes.VoiceServerCrashed,
    ].includes(code);
  }

  private failConnection(error: Error): void {
    this.rejectConnect?.(error);
    this.resolveConnect = null;
    this.rejectConnect = null;
    this.connectPromise = null;
    this.reportError(error);
  }

  private reportError(error: Error): void {
    if (this.listenerCount("error") > 0) {
      this.emit("error", error);
    } else {
      this.emit("voiceError", error);
    }
  }

  private startHeartbeat(interval: number): void {
    this.clearTimers();
    this.initialHeartbeatTimer = setTimeout(
      () => {
        this.initialHeartbeatTimer = null;
        this.sendHeartbeat();
        this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), interval);
      },
      Math.floor(interval * Math.random()),
    );
  }

  private sendHeartbeat(): void {
    const packet: VoiceHeartbeat = {
      op: VoiceOpcodes.Heartbeat,
      d: { t: Date.now(), seq_ack: this.voiceSequence },
    };
    this.lastHeartbeat = packet.d.t;
    this.send(packet);
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }
    this.heartbeatTimeout = setTimeout(() => {
      this.reportError(new Error("Voice heartbeat ACK timeout"));
      this.disconnect(true);
      this.connect().catch((error) => this.reportError(error as Error));
    }, 10_000);
  }

  private send(packet: VoiceSendPayload): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
    }
  }

  private sendBinary(opcode: VoiceOpcodes, payload: Buffer): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }
    const message = Buffer.allocUnsafe(payload.length + 1);
    message.writeUInt8(opcode, 0);
    payload.copy(message, 1);
    this.ws.send(message);
  }

  /**
   * Sets the speaking state announced to other voice clients.
   * @param speaking - Whether the client is currently speaking.
   * @param ssrc - Optional SSRC override.
   */
  public setSpeaking(speaking: boolean, ssrc?: number): void {
    if (!this.readyData) {
      return;
    }
    this.send({
      op: VoiceOpcodes.Speaking,
      d: {
        speaking: speaking ? VoiceSpeakingFlags.Microphone : (0 as VoiceSpeakingFlags),
        delay: 0,
        ssrc: ssrc ?? this.readyData.ssrc,
      },
    });
  }

  /**
   * Sends one Opus frame as an AEAD AES-256-GCM RTP-size packet.
   * @param opusPacket - A single 20 ms Opus frame.
   */
  public sendAudioPacket(opusPacket: Buffer): void {
    const readyData = this.readyData;
    if (!this.isReady() || !this.udp || !this.udpAddress || !this.secretKey || !readyData) {
      return;
    }
    if (this.encryptionMode !== VoiceEncryptionMode.AeadAes256GcmRtpSize) {
      this.reportError(new Error(`Unsupported voice encryption mode: ${this.encryptionMode}`));
      return;
    }

    let frame = opusPacket;
    if (this.daveSession?.ready && this.daveProtocolVersion > 0 && !frame.equals(SILENCE_FRAME)) {
      frame = this.daveSession.encryptOpus(frame);
    }

    const header = Buffer.alloc(12);
    header[0] = 0x80;
    header[1] = 0x78;
    header.writeUInt16BE(this.sequence, 2);
    header.writeUInt32BE(this.timestamp, 4);
    header.writeUInt32BE(readyData.ssrc, 8);

    const nonce = Buffer.alloc(12);
    nonce.writeUInt32BE(this.nonce, 0);
    const cipher = createCipheriv("aes-256-gcm", this.secretKey, nonce);
    cipher.setAAD(header);
    const encrypted = Buffer.concat([cipher.update(frame), cipher.final(), cipher.getAuthTag()]);
    const packet = Buffer.concat([header, encrypted, nonce.subarray(0, 4)]);

    this.udp.send(packet, this.udpPort, this.udpAddress);
    this.nonce = (this.nonce + 1) >>> 0;
    this.sequence = (this.sequence + 1) & 0xffff;
    this.timestamp = (this.timestamp + 960) >>> 0;
  }

  /**
   * Updates the bot's main gateway voice state.
   * @param channelId - The target channel ID, or null to leave.
   * @param selfMute - Whether the bot should be muted.
   * @param selfDeaf - Whether the bot should be deafened.
   */
  public updateVoiceState(channelId: string | null, selfMute = false, selfDeaf = false): void {
    this.state.channelId = channelId;
    this.emit("stateUpdate", { ...this.state, channelId, selfMute, selfDeaf });
  }

  /**
   * Resumes the voice websocket session.
   */
  public resume(): void {
    if (!this.state.sessionId) {
      return;
    }
    this.send({
      op: VoiceOpcodes.Resume,
      d: {
        server_id: this.state.serverId,
        session_id: this.state.sessionId,
        token: this.state.token,
        seq_ack: this.voiceSequence,
      },
    });
  }

  /**
   * Gets the current voice state.
   */
  public getState(): VoiceState {
    return { ...this.state };
  }

  /**
   * Gets the voice websocket READY data.
   */
  public getReadyData(): VoiceReadyData | null {
    return this.readyData;
  }

  /**
   * Gets the selected voice session description.
   */
  public getSessionDescription(): VoiceSessionDescription | null {
    return this.sessionDescription;
  }

  /**
   * Gets the active DAVE session, when Discord negotiated DAVE.
   */
  public getDaveSession(): Davey.DAVESession | null {
    return this.daveSession;
  }

  /**
   * Gets the negotiated DAVE protocol version.
   */
  public getDaveProtocolVersion(): number {
    return this.daveProtocolVersion;
  }

  /**
   * Gets the current DAVE voice privacy code.
   */
  public getVoicePrivacyCode(): string | null {
    return this.daveSession?.voicePrivacyCode ?? null;
  }

  /**
   * Gets the measured heartbeat round-trip time.
   */
  public getPing(): number {
    if (!this.lastHeartbeatAck || !this.lastHeartbeat) {
      return -1;
    }
    return this.lastHeartbeatAck - this.lastHeartbeat;
  }

  /**
   * Whether the connection is connected to the voice websocket.
   */
  public isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Whether UDP discovery, session description, and transport encryption are ready.
   */
  public isReady(): boolean {
    return Boolean(
      this.isConnected() &&
        this.readyData &&
        this.sessionDescription &&
        this.secretKey &&
        this.udp &&
        this.udpAddress &&
        this.discoveryComplete,
    );
  }

  /**
   * Plays an audio resource through this voice connection.
   * @param resource - A file path or readable stream accepted by the audio player.
   * @param options - Playback options.
   */
  public play(resource: AudioResource, options?: AudioOptions): void {
    this.audioPlayer.play(resource, options);
  }

  /**
   * Pauses the current audio playback.
   */
  public pause(): void {
    this.audioPlayer.pause();
  }

  /**
   * Resumes paused audio playback.
   */
  public resumePlayback(): void {
    this.audioPlayer.resume();
  }

  /**
   * Stops the current audio playback.
   */
  public stopPlayback(): void {
    this.audioPlayer.stop();
  }

  /**
   * Returns the audio player attached to this connection.
   */
  public get player(): AudioPlayer {
    return this.audioPlayer;
  }
}

export default VoiceConnection;
