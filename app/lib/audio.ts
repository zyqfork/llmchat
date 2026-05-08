export type AudioHandlerOptions = {
  /** 录音与 AudioContext 采样率；通义 ASR 需 16000 */
  recordingSampleRate?: number;
  /**
   * 在支持的浏览器（如新版 Chrome）启用 voiceIsolation，弱化非主讲人声。
   * 若设备不支持则自动忽略。
   */
  preferVoiceIsolation?: boolean;
  /**
   * 上行静音门控：短时能量 + 前滚缓冲；未检测到人声时不往 WebSocket 送 PCM。
   */
  uplinkSpeechGate?: boolean;
};

export class AudioHandler {
  private context: AudioContext;
  private mergeNode: ChannelMergerNode;
  private analyserData: Uint8Array<ArrayBuffer>;
  public analyser: AnalyserNode;
  private workletNode: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private recordBuffer: Int16Array[] = [];
  private readonly sampleRate: number;
  private readonly preferVoiceIsolation: boolean;

  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  private playbackQueue: AudioBufferSourceNode[] = [];
  private playBuffer: Int16Array[] = [];

  private readonly uplinkSpeechGate: boolean;
  private uplinkGateOpen = false;
  private uplinkVoicedStreak = 0;
  private uplinkSilenceAfterSpeech = 0;
  private uplinkPreRoll: Uint8Array[] = [];
  private readonly uplinkPreRollMaxChunks = 12;

  constructor(options?: AudioHandlerOptions) {
    this.sampleRate = options?.recordingSampleRate ?? 24000;
    this.preferVoiceIsolation = options?.preferVoiceIsolation ?? false;
    this.uplinkSpeechGate = options?.uplinkSpeechGate ?? false;
    this.context = new AudioContext({ sampleRate: this.sampleRate });
    // using ChannelMergerNode to get merged audio data, and then get analyser data.
    this.mergeNode = new ChannelMergerNode(this.context, { numberOfInputs: 2 });
    this.analyser = new AnalyserNode(this.context, { fftSize: 256 });
    this.analyserData = new Uint8Array(
      new ArrayBuffer(this.analyser.frequencyBinCount),
    );
    this.mergeNode.connect(this.analyser);
  }

  private resetUplinkGate() {
    this.uplinkGateOpen = false;
    this.uplinkVoicedStreak = 0;
    this.uplinkSilenceAfterSpeech = 0;
    this.uplinkPreRoll = [];
  }

  private pushUplinkPreRollSnapshot(uint8Data: Uint8Array) {
    const snapshot = new Uint8Array(uint8Data.byteLength);
    snapshot.set(uint8Data);
    this.uplinkPreRoll.push(snapshot);
    if (this.uplinkPreRoll.length > this.uplinkPreRollMaxChunks) {
      this.uplinkPreRoll.shift();
    }
  }

  /** Int16 PCM 块 RMS，归一化到约 0～1 */
  private static pcmChunkRmsNorm(int16: Int16Array): number {
    if (int16.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < int16.length; i++) {
      const v = int16[i]! / 32768;
      sum += v * v;
    }
    return Math.sqrt(sum / int16.length);
  }

  /**
   * 是否向服务端上传本块 PCM（本地 recordBuffer 始终完整保存）。
   * ~50ms/块 @16kHz：约 2 块有声打开闸门；约 14 块静音关闭（衔接服务端判停）。
   */
  private shouldUplinkPcmChunk(int16: Int16Array): boolean {
    const rmsThreshold = 0.018;
    const openVoicedChunks = 2;
    const hangoverSilentChunks = 14;

    const voiced = AudioHandler.pcmChunkRmsNorm(int16) >= rmsThreshold;

    if (!this.uplinkGateOpen) {
      this.pushUplinkPreRollSnapshot(
        new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength),
      );

      if (voiced) {
        this.uplinkVoicedStreak++;
        if (this.uplinkVoicedStreak >= openVoicedChunks) {
          this.uplinkGateOpen = true;
          this.uplinkVoicedStreak = 0;
          this.uplinkSilenceAfterSpeech = 0;
          return true;
        }
      } else {
        this.uplinkVoicedStreak = 0;
      }
      return false;
    }

    if (voiced) {
      this.uplinkSilenceAfterSpeech = 0;
    } else {
      this.uplinkSilenceAfterSpeech++;
      if (this.uplinkSilenceAfterSpeech > hangoverSilentChunks) {
        this.uplinkGateOpen = false;
        this.uplinkSilenceAfterSpeech = 0;
        this.uplinkVoicedStreak = 0;
        this.uplinkPreRoll = [];
        return false;
      }
    }
    return true;
  }

  getByteFrequencyData() {
    this.analyser.getByteFrequencyData(this.analyserData);
    return this.analyserData;
  }

  async initialize() {
    await this.context.audioWorklet.addModule("/audio-processor.js");
    try {
      await this.context.resume();
    } catch {
      /* 无用户手势时可能仍为 suspended，startRecording 内会再 resume */
    }
  }

  async startRecording(onChunk: (chunk: Uint8Array) => void) {
    try {
      if (!this.workletNode) {
        await this.initialize();
      }

      const audioConstraints: MediaTrackConstraints & {
        voiceIsolation?: boolean;
      } = {
        channelCount: 1,
        sampleRate: this.sampleRate,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      if (this.preferVoiceIsolation) {
        try {
          const sup = navigator.mediaDevices.getSupportedConstraints();
          if ("voiceIsolation" in sup && sup.voiceIsolation) {
            audioConstraints.voiceIsolation = true;
          }
        } catch {
          /* ignore */
        }
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      await this.context.resume();
      this.resetUplinkGate();
      this.source = this.context.createMediaStreamSource(this.stream);
      this.workletNode = new AudioWorkletNode(
        this.context,
        "audio-recorder-processor",
      );

      this.workletNode.port.onmessage = (event) => {
        if (event.data.eventType === "audio") {
          const float32Data = event.data.audioData;
          const int16Data = new Int16Array(float32Data.length);

          for (let i = 0; i < float32Data.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Data[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          const uint8Data = new Uint8Array(
            int16Data.buffer,
            int16Data.byteOffset,
            int16Data.byteLength,
          );
          // save recordBuffer（全量，便于导出）
          // @ts-ignore
          this.recordBuffer.push.apply(this.recordBuffer, int16Data);

          if (!this.uplinkSpeechGate) {
            onChunk(uint8Data);
            return;
          }

          const wasGateClosed = !this.uplinkGateOpen;
          const sendNow = this.shouldUplinkPcmChunk(int16Data);

          if (!sendNow) {
            return;
          }

          if (
            wasGateClosed &&
            this.uplinkGateOpen &&
            this.uplinkPreRoll.length > 0
          ) {
            for (const past of this.uplinkPreRoll) {
              onChunk(past);
            }
            this.uplinkPreRoll = [];
            return;
          }

          onChunk(uint8Data);
        }
      };

      this.source.connect(this.workletNode);
      this.source.connect(this.mergeNode, 0, 0);
      this.workletNode.connect(this.context.destination);

      this.workletNode.port.postMessage({
        command: "START_RECORDING",
        sampleRate: this.sampleRate,
      });
    } catch (error) {
      // 静默处理错误，避免在生产环境输出过多日志
      throw error;
    }
  }

  stopRecording() {
    if (!this.workletNode || !this.source || !this.stream) {
      throw new Error("Recording not started");
    }

    this.workletNode.port.postMessage({ command: "STOP_RECORDING" });

    this.workletNode.disconnect();
    this.source.disconnect();
    this.stream.getTracks().forEach((track) => track.stop());
    this.resetUplinkGate();
  }
  startStreamingPlayback() {
    this.isPlaying = true;
    this.nextPlayTime = this.context.currentTime;
  }

  stopStreamingPlayback() {
    this.isPlaying = false;
    this.playbackQueue.forEach((source) => source.stop());
    this.playbackQueue = [];
    this.playBuffer = [];
  }

  playChunk(chunk: Uint8Array) {
    if (!this.isPlaying) return;

    const sampleCount = chunk.byteLength >> 1;
    if (sampleCount <= 0) return;
    const int16Data = new Int16Array(
      chunk.buffer,
      chunk.byteOffset,
      sampleCount,
    );
    // @ts-ignore
    this.playBuffer.push.apply(this.playBuffer, int16Data); // save playBuffer

    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / (int16Data[i] < 0 ? 0x8000 : 0x7fff);
    }

    const audioBuffer = this.context.createBuffer(
      1,
      float32Data.length,
      this.sampleRate,
    );
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.context.destination);
    source.connect(this.mergeNode, 0, 1);

    const chunkDuration = audioBuffer.length / this.sampleRate;

    source.start(this.nextPlayTime);

    this.playbackQueue.push(source);
    source.onended = () => {
      const index = this.playbackQueue.indexOf(source);
      if (index > -1) {
        this.playbackQueue.splice(index, 1);
      }
    };

    this.nextPlayTime += chunkDuration;

    if (this.nextPlayTime < this.context.currentTime) {
      this.nextPlayTime = this.context.currentTime;
    }
  }
  _saveData(data: Int16Array, bytesPerSample = 16): Blob {
    const headerLength = 44;
    const numberOfChannels = 1;
    const byteLength = data.buffer.byteLength;
    const header = new Uint8Array(headerLength);
    const view = new DataView(header.buffer);
    view.setUint32(0, 1380533830, false); // RIFF identifier 'RIFF'
    view.setUint32(4, 36 + byteLength, true); // file length minus RIFF identifier length and file description length
    view.setUint32(8, 1463899717, false); // RIFF type 'WAVE'
    view.setUint32(12, 1718449184, false); // format chunk identifier 'fmt '
    view.setUint32(16, 16, true); // format chunk length
    view.setUint16(20, 1, true); // sample format (raw)
    view.setUint16(22, numberOfChannels, true); // channel count
    view.setUint32(24, this.sampleRate, true); // sample rate
    view.setUint32(28, this.sampleRate * 4, true); // byte rate (sample rate * block align)
    view.setUint16(32, numberOfChannels * 2, true); // block align (channel count * bytes per sample)
    view.setUint16(34, bytesPerSample, true); // bits per sample
    view.setUint32(36, 1684108385, false); // data chunk identifier 'data'
    view.setUint32(40, byteLength, true); // data chunk length

    // using data.buffer, so no need to setUint16 to view.
    return new Blob([view, data.buffer as ArrayBuffer], { type: "audio/mpeg" });
  }
  savePlayFile() {
    // @ts-ignore
    return this._saveData(new Int16Array(this.playBuffer));
  }
  saveRecordFile(
    audioStartMillis: number | undefined,
    audioEndMillis: number | undefined,
  ) {
    const startIndex = audioStartMillis
      ? Math.floor((audioStartMillis * this.sampleRate) / 1000)
      : 0;
    const endIndex = audioEndMillis
      ? Math.floor((audioEndMillis * this.sampleRate) / 1000)
      : this.recordBuffer.length;
    return this._saveData(
      // @ts-ignore
      new Int16Array(this.recordBuffer.slice(startIndex, endIndex)),
    );
  }
  async close() {
    this.recordBuffer = [];
    this.workletNode?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    await this.context.close();
  }
}
