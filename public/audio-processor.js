// @ts-nocheck
class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.bufferSize = 1200; // overridden on START_RECORDING (~50ms at 24kHz)
    this.currentBuffer = [];

    this.port.onmessage = (event) => {
      if (event.data.command === "START_RECORDING") {
        this.isRecording = true;
        const sr = event.data.sampleRate || 24000;
        // ~50ms / chunk：首轮 PCM 更快送达 realtime（原 ~100ms）；过小会增加 send 次数
        this.bufferSize = Math.max(256, Math.floor(sr / 20));
      } else if (event.data.command === "STOP_RECORDING") {
        this.isRecording = false;

        if (this.currentBuffer.length > 0) {
          this.sendBuffer();
        }
      }
    };
  }

  sendBuffer() {
    if (this.currentBuffer.length > 0) {
      const audioData = new Float32Array(this.currentBuffer);
      this.port.postMessage({
        eventType: "audio",
        audioData: audioData,
      });
      this.currentBuffer = [];
    }
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length > 0 && this.isRecording) {
      const audioData = input[0];

      this.currentBuffer.push(...audioData);

      if (this.currentBuffer.length >= this.bufferSize) {
        this.sendBuffer();
      }
    }
    return true;
  }
}

registerProcessor("audio-recorder-processor", AudioRecorderProcessor);
