"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

type CameraPlayerProps = {
  cameraId: string;
  title: string;
  streamType: "ws" | "hls";
  hlsUrl?: string;
};

const CameraPlayer = dynamic<CameraPlayerProps>(() => import("@/components/LiveStream"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-slate-900 rounded-xl animate-pulse flex items-center justify-center text-slate-500">
      Loading Player...
    </div>
  ),
});

// Camera type — ws = local RTSP via your backend, hls = HiFocus cloud camera
type Camera = {
  id: string;
  title: string;
  streamType: "ws" | "hls";
  hlsUrl?: string;
};

export default function Dashboard() {

  const cameras: Camera[] = [
    {
      id: "camera1",
      title: "Camera 1 (HiFocus Cloud)",
      streamType: "hls",
      // ✅ Try these URLs in order — test each in FFmpeg/VLC first
      // Option A (most common for HiFocus/S2T):
      // hlsUrl: "http://lb.hf4g.live/live/HF4G008672/profile1.m3u8",
      //  hlsUrl: "http://lb.hf4g.live:8080/live/HF4G008672.m3u8",
      hlsUrl: "http://lb.hf4g.live/hls/HF4G008672.m3u8",
    },
    // { id: "camera3",  title: "Fortune Office (IP Camera 203)", streamType: "ws" },
    // { id: "camera4",  title: "Fortune Office (IP Camera 204)", streamType: "ws" },
    // { id: "camera5",  title: "Fortune Office (IP Camera 205)", streamType: "ws" },
    // { id: "camera6",  title: "Fortune Office (IP Camera 206)", streamType: "ws" },
    // { id: "camera7",  title: "Fortune Office (IP Camera 207)", streamType: "ws" },
    // { id: "camera8",  title: "Fortune Office (IP Camera 208)", streamType: "ws" },
    // { id: "camera9",  title: "Fortune Office (IP Camera 209)", streamType: "ws" },
    // { id: "camera10", title: "Fortune Office (IP Camera 210)", streamType: "ws" },
    // { id: "camera11", title: "Fortune Office (IP Camera 211)", streamType: "ws" },
    // { id: "camera12", title: "Fortune Office (IP Camera 212)", streamType: "ws" },
    // { id: "camera13", title: "Fortune Office (IP Camera 213)", streamType: "ws" },
    // { id: "camera14", title: "Fortune Office (IP Camera 214)", streamType: "ws" },
    // { id: "camera15", title: "Fortune Office (IP Camera 215)", streamType: "ws" },
    // { id: "camera16", title: "Fortune Office (IP Camera 216)", streamType: "ws" },
    // { id: "camera17", title: "Fortune Office (IP Camera 217)", streamType: "ws" },
    // { id: "camera18", title: "Fortune Office (IP Camera 218)", streamType: "ws" },
    // { id: "camera19", title: "Fortune Office (IP Camera 219)", streamType: "ws" },
    // { id: "camera20", title: "Fortune Office (IP Camera 220)", streamType: "ws" },
    // { id: "camera21", title: "Fortune Office (IP Camera 221)", streamType: "ws" },
    // { id: "camera22", title: "Fortune Office (IP Camera 222)", streamType: "ws" },
    // { id: "camera23", title: "Fortune Office (IP Camera 223)", streamType: "ws" },
    // { id: "camera24", title: "Fortune Office (IP Camera 224)", streamType: "ws" },
    // { id: "camera25", title: "Fortune Office (IP Camera 225)", streamType: "ws" },
    // { id: "camera26", title: "Fortune Office (IP Camera 226)", streamType: "ws" },
    // { id: "camera27", title: "Fortune Office (IP Camera 227)", streamType: "ws" },
    // { id: "camera28", title: "Fortune Office (IP Camera 228)", streamType: "ws" },
    // { id: "camera29", title: "Fortune Office (IP Camera 229)", streamType: "ws" },
    // { id: "camera30", title: "Fortune Office (IP Camera 230)", streamType: "ws" },
    // { id: "camera31", title: "Fortune Office (IP Camera 231)", streamType: "ws" },
    // { id: "camera32", title: "Fortune Office (IP Camera 232)", streamType: "ws" },
    // { id: "camera33", title: "Fortune Office (IP Camera 233)", streamType: "ws" },
    // { id: "camera34", title: "Fortune Office (IP Camera 234)", streamType: "ws" },
    // { id: "camera35", title: "Fortune Office (IP Camera 235)", streamType: "ws" },
    // { id: "camera36", title: "Fortune Office (IP Camera 236)", streamType: "ws" },
    // { id: "camera37", title: "Fortune Office (IP Camera 240)", streamType: "ws" },
    // { id: "camera38", title: "Fortune Office (IP Camera 242)", streamType: "ws" },
    // { id: "camera39", title: "Fortune Office (IP Camera 243)", streamType: "ws" },
    // { id: "camera40", title: "Fortune Office (IP Camera 244)", streamType: "ws" },
    // { id: "camera41", title: "Fortune Office (IP Camera 245)", streamType: "ws" },
    // { id: "camera42", title: "Fortune Office (IP Camera 246)", streamType: "ws" },
    // { id: "camera43", title: "Fortune Office (IP Camera 247)", streamType: "ws" },
    // { id: "camera44", title: "Fortune Office (IP Camera 248)", streamType: "ws" },
    // { id: "camera45", title: "Fortune Office (IP Camera 249)", streamType: "ws" },
    // { id: "camera46", title: "Fortune Office (IP Camera 250)", streamType: "ws" },
  ];

  const CAMERAS_PER_PAGE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(cameras.length / CAMERAS_PER_PAGE);
  const startIndex = (page - 1) * CAMERAS_PER_PAGE;
  const visibleCameras = cameras.slice(startIndex, startIndex + CAMERAS_PER_PAGE);

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">

        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Security Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Ultra-low latency WebSocket feeds
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {visibleCameras.map((cam) => (
            <CameraPlayer
              key={cam.id}
              cameraId={cam.id}
              title={cam.title}
              streamType={cam.streamType}
              hlsUrl={cam.hlsUrl}
            />
          ))}
        </div>

        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Prev
          </button>
          <span className="text-slate-300 text-sm">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Next
          </button>
        </div>

      </div>
    </main>
  );
}
