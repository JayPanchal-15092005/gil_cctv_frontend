"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import mpegts from "mpegts.js";
import Hls from "hls.js";

interface CameraPlayerProps {
  cameraId: string;
  title: string;
  showControls?: boolean;
  isActive?: boolean;
  activateWhenVisible?: boolean;
  priority?: boolean;
  compact?: boolean;
}

export default function CameraPlayer({
  cameraId,
  title,
  showControls = true,
  isActive = true,
  activateWhenVisible = true,
  priority = false,
  compact = false,
}: CameraPlayerProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerRef = useRef<mpegts.Player | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  const [isLive, setIsLive] = useState(false);
  const [isVisible, setIsVisible] = useState(!activateWhenVisible);
  const [retryKey, setRetryKey] = useState(0);
  const [muted, setMuted] = useState(false);
  const [statusText, setStatusText] = useState("Connecting...");

  const streamBase = process.env.NEXT_PUBLIC_STREAM_BASE_URL ?? "ws://localhost:8000/live";
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

  const wsUrl = `${streamBase.replace(/\/$/, "")}/${cameraId}`;
  const hlsUrl = `${backendBase.replace(/\/$/, "")}/hls/${cameraId}/index.m3u8`;

  const isMseSupported = useMemo(() => {
    try {
      return !!mpegts && !!mpegts.getFeatureList && mpegts.getFeatureList().mseLivePlayback;
    } catch {
      return false;
    }
  }, []);

  const shouldStream = isActive && (activateWhenVisible ? isVisible : true);

  useEffect(() => {
    if (!activateWhenVisible) {
      setIsVisible(true);
      return;
    }

    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => setIsVisible(entries[0]?.isIntersecting ?? false),
      { threshold: 0.2, rootMargin: priority ? "450px" : "240px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activateWhenVisible, priority]);

  useEffect(() => {
    // cleanup helpers
    const clearRetry = () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const cleanupPlayer = () => {
      try {
        if (playerRef.current) {
          playerRef.current.pause();
          playerRef.current.unload();
          playerRef.current.detachMediaElement();
          playerRef.current.destroy();
          playerRef.current = null;
        }

        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };

    const video = videoRef.current;
    if (!video) return;

    if (!shouldStream) {
      setIsLive(false);
      setStatusText(isActive ? "Standby" : "Paused");
      clearRetry();
      cleanupPlayer();
      return;
    }

    // Try MSE/WebSocket player first (mpegts.js). If not available, fallback to HLS.
    let destroyed = false;

    const scheduleRetry = (delayMs = 3000) => {
      if (destroyed) return;
      setIsLive(false);
      setStatusText("Reconnecting...");
      clearRetry();
      retryTimerRef.current = window.setTimeout(() => {
        if (!destroyed) setRetryKey((k) => k + 1);
      }, delayMs);
    };

    const tryMpegts = () => {
      if (!isMseSupported) return false;

      try {
        const player = mpegts.createPlayer({ type: "mpegts", isLive: true, url: wsUrl }, { enableWorker: true, enableStashBuffer: false, lazyLoad: false, stashInitialSize: 128 });
        playerRef.current = player;
        player.attachMediaElement(video);
        player.load();
        video.muted = muted;

        player.on(mpegts.Events.MEDIA_INFO, () => {
          setIsLive(true);
          setStatusText("LIVE");
          const p = player.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        });

        player.on(mpegts.Events.ERROR, (_type, detail) => {
          console.warn("mpegts error", cameraId, detail);
          try {
            player.pause();
            player.unload();
            player.detachMediaElement();
            player.destroy();
            playerRef.current = null;
          } catch (e) {}
          scheduleRetry(5000);
        });

        return true;
      } catch (e) {
        console.warn("Failed to start mpegts player", e);
        return false;
      }
    };

    const tryHls = () => {
      try {
        if (Hls.isSupported()) {
          const hls = new Hls({ lowLatencyMode: true });
          hlsRef.current = hls;
          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
          video.muted = muted;

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLive(true);
            setStatusText("LIVE (HLS)");
            video.play().catch(() => {});
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.warn("HLS error", data);
            if (data.fatal) {
              hls.destroy();
              hlsRef.current = null;
              scheduleRetry(5000);
            }
          });

          return true;
        }

        // Native HLS on Safari
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = hlsUrl;
          video.muted = muted;
          video.addEventListener("loadedmetadata", () => {
            setIsLive(true);
            setStatusText("LIVE (HLS)");
            video.play().catch(() => {});
          }, { once: true });

          return true;
        }
      } catch (e) {
        console.warn("Failed HLS fallback", e);
      }

      return false;
    };

    // Start playback
    const started = tryMpegts() || tryHls();
    if (!started) {
      setStatusText("No supported playback available");
      scheduleRetry(8000);
    }

    return () => {
      destroyed = true;
      clearRetry();
      cleanupPlayer();
    };
  }, [cameraId, shouldStream, retryKey, muted, isMseSupported]);

  // Toggle mute
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    setMuted(next);
    v.muted = next;
    if (!next) v.volume = 1;
  };

  // Fullscreen
  const toggleFullscreen = async () => {
    const el = cardRef.current ?? videoRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((el as HTMLElement).requestFullscreen) {
        await (el as HTMLElement).requestFullscreen();
      }
    } catch (e) {
      // ignore
    }
  };

  // Ensure controls and state are restored when entering/exiting fullscreen
  useEffect(() => {
    const onFullChange = () => {
      const v = videoRef.current;
      if (!v) return;

      // Restore controls and muted state when fullscreen changes
      try {
        v.controls = !!showControls;
        v.muted = muted;
      } catch (e) {
        // ignore
      }

      // When exiting fullscreen, try to resume playback and ensure UI shows
      if (!document.fullscreenElement) {
        try {
          v.play().catch(() => {});
        } catch {}
      }
    };

    document.addEventListener("fullscreenchange", onFullChange);
    // Safari
    // @ts-ignore
    document.addEventListener("webkitfullscreenchange", onFullChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullChange);
      // @ts-ignore
      document.removeEventListener("webkitfullscreenchange", onFullChange);
      // if unmounting while fullscreen, exit to avoid orphaned fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [showControls, muted]);

  return (
    <div ref={cardRef} className={`flex flex-col bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 ${compact ? "text-sm" : ""}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? "bg-red-500" : "bg-slate-500"}`} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-200 text-sm truncate">{title}</span>
            <span className="text-xs text-slate-400">{statusText}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="rounded-md px-2 py-1 text-xs bg-slate-800/60 hover:bg-slate-700">
            {muted ? "🔇" : "🔊"}
          </button>
          <button onClick={toggleFullscreen} className="rounded-md px-2 py-1 text-xs bg-slate-800/60 hover:bg-slate-700">
            ⤢
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {!isLive && <div className="absolute text-xs text-gray-400">{statusText}</div>}

        <video
          ref={videoRef}
          controls={showControls}
          autoPlay
          muted={muted}
          playsInline
          className="w-full h-full object-contain bg-black"
        />
      </div>
    </div>
  );
}
