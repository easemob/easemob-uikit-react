import React, { useEffect, useRef, useState } from 'react';
import type { IAgoraRTCClient, ILocalVideoTrack } from 'agora-rtc-sdk-ng';

const colors = { red: '#ef2020', green: '#20df20', blue: '#2020ef' } as const;
type Color = keyof typeof colors;
type Source = {
  client: IAgoraRTCClient;
  published: ILocalVideoTrack;
  original: MediaStreamTrack;
  generated: MediaStreamTrack;
  timer: number;
  color: Color | null;
};

async function releaseSource(source: Source, restore: boolean): Promise<void> {
  window.clearInterval(source.timer);
  let restored = false;
  try {
    if (
      restore &&
      source.client.connectionState === 'CONNECTED' &&
      source.original.readyState === 'live'
    ) {
      await source.published.replaceTrack(source.original, false);
      restored = true;
    }
  } finally {
    source.generated.stop();
    if (!restored) source.original.stop();
  }
}

/** Deterministic video source for validating content received through a real RTC call. */
export default function VideoColorExperiment({
  client,
  isInCall,
}: {
  client: IAgoraRTCClient | null;
  isInCall: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<Source | null>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('等待视频通话连接');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const source = sourceRef.current;
      sourceRef.current = null;
      if (source) void releaseSource(source, false).catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (isInCall) return;
    const source = sourceRef.current;
    sourceRef.current = null;
    if (source) void releaseSource(source, false).catch(() => undefined);
    setActive(false);
    setStatus('等待视频通话连接');
  }, [isInCall]);

  const start = async () => {
    if (!client || !isInCall || busyRef.current || sourceRef.current) return;
    busyRef.current = true;
    setBusy(true);
    let source: Source | null = null;
    try {
      const published = client.localTracks.find(track => track.trackMediaType === 'video') as
        | ILocalVideoTrack
        | undefined;
      if (!published) throw new Error('请先接通视频通话并开启摄像头');
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const stream = canvas.captureStream(15);
      source = {
        client,
        published,
        original: published.getMediaStreamTrack(),
        generated: stream.getVideoTracks()[0],
        timer: 0,
        color: null,
      };
      const current = source;
      let frame = 0;
      const draw = () => {
        context.fillStyle = current.color ? colors[current.color] : '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        // Keep generating frames even while a color is held. Labels stay outside the sampled center.
        context.fillStyle = '#fff';
        context.font = '22px sans-serif';
        context.fillText(`${current.color ?? 'black'} / ${++frame}`, 12, 28);
        context.fillRect((frame * 8) % (canvas.width - 20), canvas.height - 18, 20, 10);
      };
      draw();
      source.timer = window.setInterval(draw, 100);
      sourceRef.current = source;
      // Preserve the published Agora track and its SDK ownership; only replace its media source.
      await published.replaceTrack(source.generated, false);
      if (sourceRef.current !== source || client.connectionState !== 'CONNECTED') {
        await releaseSource(source, false);
        return;
      }
      setActive(true);
      setStatus('正在发送黑色测试画面');
    } catch (error) {
      if (sourceRef.current === source) sourceRef.current = null;
      if (source) await releaseSource(source, true).catch(() => undefined);
      if (mountedRef.current) setStatus(`视频源启动失败：${String(error)}`);
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const stop = async () => {
    if (busyRef.current) return;
    const source = sourceRef.current;
    if (!source) return;
    busyRef.current = true;
    setBusy(true);
    sourceRef.current = null;
    try {
      await releaseSource(source, true);
      if (mountedRef.current) setStatus('测试视频已停止，已恢复摄像头');
    } catch (error) {
      if (mountedRef.current) setStatus(`摄像头恢复失败：${String(error)}`);
    } finally {
      busyRef.current = false;
      if (mountedRef.current) {
        setBusy(false);
        setActive(false);
      }
    }
  };

  return (
    <section
      aria-label="远端视频颜色实验"
      style={{ padding: 16, marginBottom: 20, border: '1px solid #91caff', borderRadius: 8 }}
    >
      <h3>远端视频颜色实验</h3>
      <p>接通视频后，将本端画面切换为测试颜色，在对方视频窗口观察变化；停止后恢复摄像头。</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button disabled={!isInCall || !client || busy || active} onClick={start}>
          开始发送测试视频
        </button>
        {(['red', 'green', 'blue'] as const).map((color, index) => (
          <button
            key={color}
            disabled={!active || busy}
            onClick={() => {
              if (sourceRef.current) sourceRef.current.color = color;
              setStatus(`正在发送${['红色', '绿色', '蓝色'][index]}测试画面`);
            }}
          >
            发送{['红色', '绿色', '蓝色'][index]}画面
          </button>
        ))}
        <button disabled={!active || busy} onClick={stop}>
          停止测试视频
        </button>
      </div>
      <p aria-label="视频测试状态" aria-live="polite">
        {status}
      </p>
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        aria-label="发送端测试视频源"
        style={{ width: 320, maxWidth: '100%', display: active ? 'block' : 'none' }}
      />
    </section>
  );
}
