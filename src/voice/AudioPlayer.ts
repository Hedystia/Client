import { type ChildProcess, spawn } from "node:child_process";
import { createReadStream, type ReadStream } from "node:fs";
import { Readable } from "node:stream";
import type VoiceConnection from "./VoiceConnection";

export interface AudioOptions {
  volume?: number;
  loop?: boolean;
  seek?: number;
}

export type AudioResource = string | ReadStream | Readable;

/**
 * Audio player for playing audio in voice channels
 * Uses ffmpeg for audio processing
 */
class AudioPlayer {
  private connection: VoiceConnection | null = null;
  private ffmpeg: ChildProcess | null = null;
  private playable = false;
  private paused = false;
  private volume = 1;
  private loop = false;
  private currentResource: AudioResource | null = null;
  private stream: Readable | null = null;
  private sequence = 0;
  private timestamp = 0;
  private playInterval: NodeJS.Timeout | null = null;
  private readonly FRAME_LENGTH = 20; // 20ms frames
  private readonly SAMPLE_RATE = 48000; // 48kHz
  private readonly CHANNELS = 2; // Stereo

  /**
   * Set the voice connection
   */
  public setConnection(connection: VoiceConnection): void {
    this.connection = connection;
  }

  /**
   * Play an audio resource
   * @param resource - File path, ReadStream, or Readable stream
   * @param options - Audio options
   * @link https://discord.com/developers/topics/voice-connections#transport-encryption-and-sending-voice
   */
  public play(resource: AudioResource, options: AudioOptions = {}): void {
    if (!this.connection) {
      throw new Error("No voice connection set");
    }

    if (!this.connection.isReady()) {
      throw new Error("Voice connection is not ready");
    }

    // Stop current playback
    this.stop();

    this.currentResource = resource;
    this.volume = options.volume ?? 1;
    this.loop = options.loop ?? false;

    // Create ffmpeg stream
    this.createFFmpegStream(resource);
  }

  private createFFmpegStream(resource: AudioResource): void {
    const ffmpegArgs = [
      "-i",
      typeof resource === "string" ? resource : "pipe:0",
      "-f",
      "s16le",
      "-ar",
      this.SAMPLE_RATE.toString(),
      "-ac",
      this.CHANNELS.toString(),
      "-loglevel",
      "warning",
      "pipe:1",
    ];

    this.ffmpeg = spawn("ffmpeg", ffmpegArgs);

    this.ffmpeg.stdout?.on("data", (data: Buffer) => {
      this.onAudioData(data);
    });

    this.ffmpeg.stderr?.on("data", (data: Buffer) => {
      console.error(`FFmpeg error: ${data.toString()}`);
    });

    this.ffmpeg.on("close", (code) => {
      this.ffmpeg = null;

      if (this.loop && code === 0 && this.currentResource) {
        // Loop the audio
        this.play(this.currentResource, { volume: this.volume, loop: true });
      } else {
        this.onEnd();
      }
    });

    // If resource is a stream, pipe it to ffmpeg
    if (typeof resource !== "string") {
      const stream =
        resource instanceof Readable ? resource : createReadStream((resource as ReadStream).path);
      this.stream = stream;
      // biome-ignore lint/style/noNonNullAssertion: ffmpeg is guaranteed to be non-null here
      stream.pipe(this.ffmpeg!.stdin!);
    }

    this.playable = true;
    this.startPlaying();
  }

  private onAudioData(data: Buffer): void {
    if (!this.playable || this.paused) {
      return;
    }

    // Apply volume
    const volumeAdjustedData = this.volume !== 1 ? this.applyVolume(data, this.volume) : data;

    // Send audio packet
    this.sendAudioPacket(volumeAdjustedData);
  }

  private applyVolume(data: Buffer, volume: number): Buffer {
    const result = Buffer.alloc(data.length);
    const clampedVolume = Math.max(0, Math.min(1, volume));

    for (let i = 0; i < data.length; i += 2) {
      // Read 16-bit sample (little-endian)
      let sample = data.readInt16LE(i);

      // Apply volume
      sample = Math.floor(sample * clampedVolume);

      // Clamp to valid range
      sample = Math.max(-32768, Math.min(32767, sample));

      // Write back
      result.writeInt16LE(sample, i);
    }

    return result;
  }

  private sendAudioPacket(data: Buffer): void {
    if (!this.connection) {
      return;
    }

    const readyData = this.connection.getReadyData();
    const sessionDesc = this.connection.getSessionDescription();

    if (!readyData || !sessionDesc) {
      return;
    }

    // Create RTP packet
    const packet = this.createRTPPacket(data, readyData.ssrc);

    // Send via UDP (this is simplified - actual implementation needs UDP socket)
    // For now, we'll just simulate sending
    this.sendUDPPacket(packet);

    // Update sequence and timestamp
    this.sequence = (this.sequence + 1) & 0xffff;
    this.timestamp = (this.timestamp + (this.SAMPLE_RATE * this.FRAME_LENGTH) / 1000) & 0xffffffff;
  }

  private createRTPPacket(audioData: Buffer, ssrc: number): Buffer {
    const headerLength = 12;
    const packet = Buffer.alloc(headerLength + audioData.length);

    // RTP Header
    packet.writeUInt8(0x80, 0); // Version 2, padding 0, extension 0, CSRC 0
    packet.writeUInt8(0x78, 1); // Payload type 120 (Opus)
    packet.writeUInt16BE(this.sequence, 2); // Sequence number
    packet.writeUInt32BE(this.timestamp, 4); // Timestamp
    packet.writeUInt32BE(ssrc, 8); // SSRC

    // Copy audio data
    audioData.copy(packet, headerLength);

    return packet;
  }

  private sendUDPPacket(_packet: Buffer): void {
    // This would send the packet via UDP to the voice server
    // Actual implementation requires creating a UDP socket
    // and encrypting the packet with the secret key
    // For now, this is a placeholder
  }

  private startPlaying(): void {
    if (this.playInterval) {
      clearInterval(this.playInterval);
    }

    this.playInterval = setInterval(() => {
      if (!this.paused && this.playable) {
        // Continue playing
      }
    }, this.FRAME_LENGTH);
  }

  /**
   * Pause playback
   */
  public pause(): void {
    this.paused = true;
  }

  /**
   * Resume playback
   */
  public resume(): void {
    this.paused = false;
  }

  /**
   * Stop playback
   */
  public stop(): void {
    this.playable = false;

    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }

    if (this.ffmpeg) {
      this.ffmpeg.kill("SIGTERM");
      this.ffmpeg = null;
    }

    if (this.stream) {
      this.stream.destroy();
      this.stream = null;
    }

    // Send silence frames
    this.sendSilenceFrames();
  }

  private sendSilenceFrames(): void {
    // Send 5 frames of silence to avoid Opus interpolation
    const silence = Buffer.alloc(384); // 20ms of silence at 48kHz stereo 16-bit
    silence.fill(0);

    for (let i = 0; i < 5; i++) {
      this.sendAudioPacket(silence);
    }

    // Set speaking to false
    this.connection?.setSpeaking(false);
  }

  /**
   * Set volume
   * @param volume - Volume level (0-1)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Check if currently playing
   */
  public isPlaying(): boolean {
    return this.playable && !this.paused;
  }

  /**
   * Check if paused
   */
  public isPaused(): boolean {
    return this.paused;
  }

  /**
   * Seek to a position (requires ffmpeg to restart)
   * @param seconds - Position in seconds
   */
  public seek(seconds: number): void {
    if (!this.currentResource) {
      return;
    }

    this.play(this.currentResource, {
      volume: this.volume,
      loop: this.loop,
      seek: seconds,
    });
  }

  private onEnd(): void {
    this.playable = false;
    this.currentResource = null;

    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }

    this.sendSilenceFrames();
  }

  /**
   * Destroy the player
   */
  public destroy(): void {
    this.stop();
    this.connection = null;
  }
}

export default AudioPlayer;
