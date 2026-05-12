"use client";
import { useEffect, useRef, useState } from "react";
import mpegts from "mpegts.js";

// ─────────────────────────────────────────────
// Camera config type
// Pass streamType="hls"  + url = full HLS URL   → for HiFocus cloud cameras
// Pass streamType="ws"   + url = undefined       → uses ws://localhost:8000/live/{cameraId}
// ─────────────────────────────────────────────
export default function CameraPlayer({
  cameraId,
  title,
  streamType = "ws",   // "ws" | "hls"
  hlsUrl,              // required when streamType = "hls"
}: {
  cameraId: string;
  title: string;
  streamType?: "ws" | "hls";
  hlsUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let player: mpegts.Player | null = null;
    let destroyed = false;

    const scheduleRetry = (delayMs: number) => {
      if (destroyed) return;
      setIsLive(false);
      setTimeout(() => {
        if (!destroyed) setRetryKey((prev) => prev + 1);
      }, delayMs);
    };

    // ✅ Choose URL and player type based on streamType
    const url =
      streamType === "hls"
        ? hlsUrl!
        : `ws://localhost:8000/live/${cameraId}`;

    const playerConfig =
      streamType === "hls"
        ? {
            type: "mse" as const,   // mpegts.js handles HLS via MSE
            isLive: true,
            url,
          }
        : {
            type: "mpegts" as const,
            isLive: true,
            url,
          };

    if (mpegts.getFeatureList().mseLivePlayback) {
      player = mpegts.createPlayer(playerConfig, {
        enableWorker: true,
        enableStashBuffer: false,
        lazyLoad: false,
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 3.0,   // HLS has more latency than WS
        liveBufferLatencyMinRemain: 0.5,
        stashInitialSize: 128,
      });

      player.attachMediaElement(video);
      player.load();
      video.muted = true;

      player.on(mpegts.Events.MEDIA_INFO, () => {
        console.log(`✅ Stream live: ${cameraId}`);
        setIsLive(true);
        const playPromise = player?.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      });

      player.on(mpegts.Events.ERROR, (errorType, errorDetails) => {
        console.warn(`⚠️ Stream Error on ${cameraId}:`, errorType, errorDetails);
        try {
          player?.pause();
          player?.unload();
          player?.detachMediaElement();
          player?.destroy();
          player = null;
        } catch (e) {}
        scheduleRetry(5000);
      });
    }

    return () => {
      destroyed = true;
      if (player) {
        try {
          player.pause();
          player.unload();
          player.detachMediaElement();
          player.destroy();
        } catch (e) {}
        player = null;
      }
    };
  }, [cameraId, retryKey, streamType, hlsUrl]);

  return (
    <div className="flex flex-col bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            {isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isLive ? "bg-red-500" : "bg-slate-500"
              }`}
            ></span>
          </div>
          <h3 className="font-semibold text-slate-200 text-sm">{title}</h3>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
          {isLive ? "LIVE" : "RECONNECTING..."}
        </span>
      </div>

      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {!isLive && (
          <div className="absolute text-xs text-gray-400 animate-pulse z-10">
            Connecting to feed...
          </div>
        )}
        <video
          ref={videoRef}
          controls
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
