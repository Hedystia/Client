import { type ChildProcess, spawn } from "node:child_process";
import { createReadStream, type ReadStream } from "node:fs";
import { Readable } from "node:stream";
import OpusScript from "opusscript";
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
  private playInterval: NodeJS.Timeout | null = null;
  private ffmpegEnded = false;
  private readonly FRAME_LENGTH = 20; // 20ms frames
  private readonly SAMPLE_RATE = 48000; // 48kHz
  private readonly CHANNELS = 2; // Stereo
  private readonly FRAME_SIZE = (this.SAMPLE_RATE * this.FRAME_LENGTH) / 1000;
  private readonly PCM_FRAME_BYTES = this.FRAME_SIZE * this.CHANNELS * 2;
  private readonly encoder = new OpusScript(
    this.SAMPLE_RATE,
    this.CHANNELS,
    OpusScript.Application.AUDIO,
  );
  private pcmBuffer = Buffer.alloc(0);

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
    this.connection.setSpeaking(true);
    this.createFFmpegStream(resource, options.seek);
  }

  private createFFmpegStream(resource: AudioResource, seek = 0): void {
    this.ffmpegEnded = false;
    const ffmpegArgs = [
      ...(seek > 0 ? ["-ss", String(seek)] : []),
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
      this.ffmpegEnded = true;

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
      const pipe = this.ffmpeg?.stdin;
      if (pipe) {
        stream.pipe(pipe);
      }
    }

    this.playable = true;
    this.startPlaying();
  }

  private onAudioData(data: Buffer): void {
    if (!this.playable || this.paused) {
      return;
    }

    this.pcmBuffer = Buffer.concat([this.pcmBuffer, data]);
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
    const opusPacket = this.encoder.encode(data, this.FRAME_SIZE);
    this.connection.sendAudioPacket(opusPacket);
  }

  private startPlaying(): void {
    if (this.playInterval) {
      clearInterval(this.playInterval);
    }

    this.playInterval = setInterval(() => {
      if (!this.playable || this.paused) {
        return;
      }

      if (this.pcmBuffer.length >= this.PCM_FRAME_BYTES) {
        const frame = this.pcmBuffer.subarray(0, this.PCM_FRAME_BYTES);
        this.pcmBuffer = this.pcmBuffer.subarray(this.PCM_FRAME_BYTES);
        const volumeAdjustedFrame =
          this.volume !== 1 ? this.applyVolume(frame, this.volume) : frame;
        this.sendAudioPacket(volumeAdjustedFrame);
        return;
      }

      if (this.ffmpegEnded) {
        this.onEnd();
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
    this.ffmpegEnded = false;
    this.pcmBuffer = Buffer.alloc(0);

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
    const silence = Buffer.alloc(this.PCM_FRAME_BYTES);
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
    if (!this.playable) {
      return;
    }
    this.playable = false;
    this.ffmpegEnded = false;
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
    this.encoder.delete();
    this.connection = null;
  }
}

export default AudioPlayer;
