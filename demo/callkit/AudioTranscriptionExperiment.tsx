import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  type IAgoraRTCClient,
  type IBufferSourceAudioTrack,
  type ILocalAudioTrack,
} from 'agora-rtc-sdk-ng';

const FIXED_TEXT = '你好，现在开始语音通话测试。';
const FIXED_AUDIO_URL = new URL('./fixed-speech.wav', import.meta.url).href;
const ASR_URL = 'http://127.0.0.1:8765/transcribe';

type Recording = {
  chunks: Float32Array[];
  sampleRate: number;
  context: AudioContext;
  worklet: AudioWorkletNode;
  sink: GainNode;
  track: MediaStreamTrack | null;
  source: MediaStreamAudioSourceNode | null;
  poll: number;
  flushResolve: (() => void) | null;
};

const AUDIO_WORKLET_SOURCE = `
class RemoteAudioCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pending = new Float32Array(4096);
    this.offset = 0;
    this.port.onmessage = event => {
      if (event.data === 'flush') {
        if (this.offset > 0) this.port.postMessage(this.pending.slice(0, this.offset));
        this.offset = 0;
        this.port.postMessage('flushed');
      }
    };
  }
  process(inputs) {
    const channels = inputs[0];
    if (!channels || channels.length === 0) return true;
    for (let index = 0; index < channels[0].length; index++) {
      let sample = 0;
      for (const channel of channels) sample += channel[index] / channels.length;
      this.pending[this.offset++] = sample;
      if (this.offset === this.pending.length) {
        this.port.postMessage(this.pending, [this.pending.buffer]);
        this.pending = new Float32Array(4096);
        this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor('remote-audio-capture', RemoteAudioCapture);
`;

function disposeRecording(recording: Recording): void {
  window.clearInterval(recording.poll);
  for (const node of [recording.source, recording.worklet, recording.sink]) {
    try {
      node?.disconnect();
    } catch {
      // A track can be released by the browser during hangup.
    }
  }
  recording.worklet.port.close();
  void recording.context.close().catch(() => undefined);
}

function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const sampleCount = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(bytes);
  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index++) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, bytes.byteLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, sampleCount * 2, true);
  let offset = 44;
  for (const chunk of chunks) {
    for (const sample of chunk) {
      const clipped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([bytes], { type: 'audio/wav' });
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[\s.,!?，。！？、；;：:'"“”‘’（）()【】\[\]{}<>《》-]/g, '');
}

export default function AudioTranscriptionExperiment({
  client,
  isInCall,
}: {
  client: IAgoraRTCClient | null;
  isInCall: boolean;
}) {
  const [status, setStatus] = useState('等待通话连接');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const recordingRef = useRef<Recording | null>(null);
  const sendingTrackRef = useRef<IBufferSourceAudioTrack | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const current = recordingRef.current;
      if (current) {
        recordingRef.current = null;
        disposeRecording(current);
      }
      sendingTrackRef.current?.close();
      sendingTrackRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const stopRecording = async () => {
    const current = recordingRef.current;
    if (!current) return;
    recordingRef.current = null;
    window.clearInterval(current.poll);
    setRecording(false);
    await Promise.race([
      new Promise<void>(resolve => {
        current.flushResolve = resolve;
        try {
          current.worklet.port.postMessage('flush');
        } catch {
          resolve();
        }
      }),
      new Promise<void>(resolve => window.setTimeout(resolve, 500)),
    ]);
    disposeRecording(current);
    if (!current.sampleRate || current.chunks.length === 0) {
      setStatus('没有收到音频帧；请先让另一端播放固定语音');
      return;
    }
    const wav = encodeWav(current.chunks, current.sampleRate);
    setAudioUrl(URL.createObjectURL(wav));
    setTranscribing(true);
    setStatus('远端音频已录制，正在本地识别…');
    try {
      const response = await fetch(ASR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/wav' },
        body: wav,
      });
      const payload = (await response.json()) as { text?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      const text = payload.text?.trim() || '';
      setResult(text);
      setStatus(
        text
          ? normalizeText(text) === normalizeText(FIXED_TEXT)
            ? '识别文字与原文一致'
            : '识别完成；文字与原文有差异，请试听录音'
          : '识别完成，但没有识别出文字；请试听录音',
      );
    } catch (error) {
      setStatus(`识别失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (!client || !isInCall || recordingRef.current) return;
    setAudioUrl('');
    setResult('');
    const context = new AudioContext();
    try {
      const moduleUrl = URL.createObjectURL(
        new Blob([AUDIO_WORKLET_SOURCE], { type: 'application/javascript' }),
      );
      try {
        await context.audioWorklet.addModule(moduleUrl);
      } finally {
        URL.revokeObjectURL(moduleUrl);
      }
      await context.resume();
      const worklet = new AudioWorkletNode(context, 'remote-audio-capture');
      const sink = context.createGain();
      sink.gain.value = 0;
      worklet.connect(sink).connect(context.destination);
      const current: Recording = {
        chunks: [],
        sampleRate: context.sampleRate,
        context,
        worklet,
        sink,
        track: null,
        source: null,
        poll: 0,
        flushResolve: null,
      };
      worklet.port.onmessage = event => {
        if (event.data === 'flushed') {
          current.flushResolve?.();
        } else if (event.data instanceof Float32Array) {
          current.chunks.push(event.data);
        }
      };
      const attach = () => {
        if (recordingRef.current !== current) return;
        let next: MediaStreamTrack | null = null;
        try {
          next =
            client.remoteUsers.find(user => user.audioTrack)?.audioTrack?.getMediaStreamTrack() ??
            null;
        } catch {
          // Agora may remove a remote track while the sender switches sources.
        }
        if (next?.readyState !== 'live') next = null;
        if (next === current.track) return;
        try {
          current.source?.disconnect();
        } catch {
          // The previous native track may already have ended.
        }
        current.source = null;
        current.track = next;
        if (next) {
          try {
            current.source = context.createMediaStreamSource(new MediaStream([next]));
            current.source.connect(worklet);
          } catch {
            current.source = null;
            current.track = null;
          }
        }
      };
      recordingRef.current = current;
      attach();
      current.poll = window.setInterval(attach, 200);
      setRecording(true);
      setStatus('正在录制远端音频；请在另一端播放固定语音，播放结束后点“停止并识别”');
    } catch (error) {
      void context.close().catch(() => undefined);
      setStatus(`录制启动失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const sendFixedSpeech = async () => {
    if (!client || !isInCall || sending) return;
    setSending(true);
    setStatus('准备固定语音文件…');
    let original: ILocalAudioTrack | null = null;
    let track: IBufferSourceAudioTrack | null = null;
    try {
      const response = await fetch(FIXED_AUDIO_URL);
      if (!response.ok) throw new Error(`音频文件 HTTP ${response.status}`);
      const file = new File([await response.blob()], 'fixed-speech.wav', { type: 'audio/wav' });
      track = await AgoraRTC.createBufferSourceAudioTrack({ source: file });
      sendingTrackRef.current = track;
      original =
        (client.localTracks.find(item => item.trackMediaType === 'audio') as ILocalAudioTrack) ??
        null;
      if (original) await client.unpublish(original);
      await client.publish(track);
      setStatus('固定语音正在通过 RTC 发送…');
      await new Promise<void>(resolve => {
        let timer = 0;
        const finish = () => {
          window.clearTimeout(timer);
          resolve();
        };
        track!.on('source-state-change', state => {
          if (state === 'stopped') finish();
        });
        timer = window.setTimeout(finish, Math.ceil(track!.duration * 1000) + 1500);
        track!.startProcessAudioBuffer();
      });
      await new Promise(resolve => window.setTimeout(resolve, 800));
      setStatus('固定语音播放完毕；接收端可以停止录音并识别');
    } catch (error) {
      setStatus(`发送失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (track) {
        if (client.connectionState === 'CONNECTED') {
          await client.unpublish(track).catch(() => undefined);
        }
        track.close();
      }
      sendingTrackRef.current = null;
      if (original && client.connectionState === 'CONNECTED' && original.enabled) {
        await client.publish(original).catch(() => undefined);
      }
      if (mountedRef.current) setSending(false);
    }
  };

  return (
    <section
      style={{ padding: 16, marginBottom: 20, border: '1px solid #91caff', borderRadius: 8 }}
    >
      <h3 style={{ marginTop: 0 }}>远端语音转文字实验</h3>
      <p>固定原文：{FIXED_TEXT}</p>
      <p>接收端先开始录音，发送端再播放固定语音；播放结束后接收端停止并识别。</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button disabled={!isInCall || !client || sending} onClick={sendFixedSpeech}>
          {sending ? '发送中…' : '播放固定语音到通话'}
        </button>
        <button
          disabled={!isInCall || !client || recording || transcribing}
          onClick={startRecording}
        >
          开始录制远端语音
        </button>
        <button disabled={!recording} onClick={stopRecording}>
          停止并识别
        </button>
      </div>
      <p role="status">{status}</p>
      {audioUrl && <audio controls src={audioUrl} aria-label="接收到的远端录音" />}
      {result && <p>识别结果：{result}</p>}
      <p style={{ fontSize: 12, color: '#666' }}>
        本地识别服务：{ASR_URL}。本实验会暂时替换发送端麦克风轨道，结束后恢复。
      </p>
    </section>
  );
}
