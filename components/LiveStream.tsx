// "use client";
// import { useEffect, useRef, useState } from "react";
// import mpegts from "mpegts.js";
// import Hls from "hls.js";

// export default function CameraPlayer({
//   cameraId,
//   title,
// }: {
//   cameraId: string;
//   title: string;
// }) {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [isLive, setIsLive] = useState(false);
//   // This key forces the player to rebuild itself when an error occurs
//   const [retryKey, setRetryKey] = useState(0);

//   // The WebSocket URL pointing to your Node backend

//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video) return;

//  if (cameraId === "camera1" || cameraId === "camera2") {

//   const hlsUrl = `http://localhost:8000/hls/${cameraId}/index.m3u8`;

//   video.muted = true;

//   if (Hls.isSupported()) {

//     const hls = new Hls({
//       liveSyncDurationCount: 3,
//       liveMaxLatencyDurationCount: 5,
//       maxBufferLength: 30,
//       lowLatencyMode: true,
//     });

//     hls.loadSource(hlsUrl);
//     hls.attachMedia(video);

//     hls.on(Hls.Events.MANIFEST_PARSED, () => {
//       console.log("HLS ready:", hlsUrl);
//       video.play().catch(() => {});
//       setIsLive(true);
//     });

//     hls.on(Hls.Events.ERROR, (event, data) => {
//       if (data.fatal) {
//         console.log("Fatal Hls error", data);
//         setIsLive(false);
//       }
//     });

//     return () => {
//       hls.destroy();
//     };

//   } else if (video.canPlayType("application/vnd.apple.mpegurl")) {

//     video.src = hlsUrl;

//     video.addEventListener("loadedmetadata", () => {
//       video.play();
//       setIsLive(true);
//     });

//   }

//   return;
// }
  
//      // RTSP cameras (existing WebSocket player)
//     let player: mpegts.Player;
//     const wsUrl = `ws://localhost:8000/live/${cameraId}`;

//     if (mpegts.getFeatureList().mseLivePlayback) {
//       player = mpegts.createPlayer(
//         {
//           type: "mpegts",
//           isLive: true,
//           url: wsUrl,
//         },
//         {
//           enableWorker: true,
//           enableStashBuffer: false,
//           lazyLoad: false,
//           liveBufferLatencyChasing: true,
//           liveBufferLatencyMaxLatency: 1,
//           liveBufferLatencyMinRemain: 0.5,
//         },
//       );

//       player.attachMediaElement(video);
//       player.load();
//       video.muted = true;
//       video.play().catch(() => {});

//       player.on(mpegts.Events.MEDIA_INFO, () => {
//         setIsLive(true);
//         const playPromise = player.play();
//         if (playPromise && typeof playPromise.catch === "function") {
//           playPromise.catch((e: Error) => console.log("Autoplay prevented", e));
//         }
//       });

//       player.on(mpegts.Events.ERROR, (errorType, errorDetails) => {
//         console.log(`⚠️ Stream Error on ${cameraId}:`, errorType, errorDetails);
//         setIsLive(false);

//         // Safely destroy the player
//         try {
//           player.pause();
//           player.unload();
//           player.detachMediaElement();
//           player.destroy();
//         } catch (e) {
//           // Ignore errors if the player is already dead
//         }

//         setTimeout(() => setRetryKey((prev) => prev + 1), 5000);
//       });
//     }

//     return () => {
//       if (player) {
//         try {
//           player.pause();
//           player.unload();
//           player.detachMediaElement();
//           player.destroy();
//         } catch (e: any) {
//           console.warn(
//             `Error during cleanup of player for ${cameraId}:`,
//             e.message,
//           );
//         }
//       }
//     };
//   }, [cameraId, retryKey]);

//   return (
//     <div className="flex flex-col bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
//       <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
//         <div className="flex items-center gap-2">
//           <div className="relative flex h-3 w-3">
//             {isLive && (
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
//             )}
//             <span
//               className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? "bg-red-500" : "bg-slate-500"}`}
//             ></span>
//           </div>
//           <h3 className="font-semibold text-slate-200 text-sm">{title}</h3>
//         </div>
//         <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
//           {isLive ? "LIVE" : "RECONNECTING..."}
//         </span>
//       </div>

//       <div className="relative w-full aspect-video bg-black flex items-center justify-center">
//         {/* {!isLive && <span className="text-slate-500 absolute animate-pulse">Waiting for feed...</span>} */}
//         {!isLive && (
//           <div className="absolute text-xs text-gray-400">Connecting...</div>
//         )}

//         <video
//           ref={videoRef}
//           controls
//           autoPlay
//           muted
//           playsInline
//           className="w-full h-full object-contain"
//         ></video>
//       </div>
//     </div>
//   );
// }



"use client";
import { useEffect, useRef, useState } from "react";
import mpegts from "mpegts.js";

export default function CameraPlayer({
  cameraId,
  title,
}: {
  cameraId: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let wsPlayer: mpegts.Player | null = null;
    let destroyed = false;

    const scheduleRetry = (delayMs: number) => {
      if (destroyed) return;
      setIsLive(false);
      setTimeout(() => {
        if (!destroyed) setRetryKey((prev) => prev + 1);
      }, delayMs);
    };

    const wsUrl = `ws://localhost:8000/live/${cameraId}`;

    if (mpegts.getFeatureList().mseLivePlayback) {
      wsPlayer = mpegts.createPlayer(
        {
          type: "mpegts",
          isLive: true,
          url: wsUrl,
        },
        {
          enableWorker: true,
          enableStashBuffer: false,
          lazyLoad: false,
          liveBufferLatencyChasing: true,
          liveBufferLatencyMaxLatency: 1.5,
          liveBufferLatencyMinRemain: 0.3,
          stashInitialSize: 128,
        }
      );

      wsPlayer.attachMediaElement(video);
      wsPlayer.load();
      video.muted = true;

      wsPlayer.on(mpegts.Events.MEDIA_INFO, () => {
        console.log(`✅ Stream live: ${cameraId}`);
        setIsLive(true);
        const playPromise = wsPlayer?.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      });

      wsPlayer.on(mpegts.Events.ERROR, (errorType, errorDetails) => {
        console.warn(`⚠️ Stream Error on ${cameraId}:`, errorType, errorDetails);

        try {
          wsPlayer?.pause();
          wsPlayer?.unload();
          wsPlayer?.detachMediaElement();
          wsPlayer?.destroy();
          wsPlayer = null;
        } catch (e) {}

        scheduleRetry(5000); // 5-second wait before trying to reconnect
      });
    }

    return () => {
      destroyed = true;
      if (wsPlayer) {
        try {
          wsPlayer.pause();
          wsPlayer.unload();
          wsPlayer.detachMediaElement();
          wsPlayer.destroy();
        } catch (e) {}
        wsPlayer = null;
      }
    };
  }, [cameraId, retryKey]);

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

      <div className="relative w-full aspect-video bg-black flex overflow-hidden">
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