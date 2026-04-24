"use client";

import { useEffect, useRef, useState } from "react";
import {
  initializeFaceDetection,
  loadReferenceFaces,
  detectFacesInElement,
  drawDetections,
  getReferenceFaces,
} from "@/lib/faceDetection";
import { fetchCameras, type BackendCamera } from "@/lib/backendApi";
import dynamic from "next/dynamic";

const StreamPlayer = dynamic(() => import("@/components/LiveStream"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-video place-items-center bg-slate-950 text-xs text-slate-400">
      Loading...
    </div>
  ),
});

interface DetectionRecord {
  cameraId: string;
  cameraTitle: string;
  personName: string;
  distance: number;
  timestamp: Date;
  thumbnail?: string;
}

export default function FaceDetectionPage() {
  const [cameras, setCameras] = useState<BackendCamera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [statusText, setStatusText] = useState("Initializing...");
  const [referenceFaceCount, setReferenceFaceCount] = useState(0);
  const [error, setError] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<number>(0);

  // Initialize face detection models
  useEffect(() => {
    const initialize = async () => {
      try {
        setStatusText("Loading face detection models...");
        await initializeFaceDetection();

        setStatusText("Loading reference faces...");
        await loadReferenceFaces();

        const refFaces = getReferenceFaces();
        setReferenceFaceCount(refFaces.length);

        setStatusText("Loading cameras...");
        const response = await fetchCameras();
        setCameras(response.items);

        if (response.items.length > 0) {
          setSelectedCameraId(response.items[0].cameraId);
        }

        setStatusText("Ready for detection");
        setIsInitializing(false);
        setError("");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("Initialization failed:", error);
        setStatusText(`Error: ${errorMsg}`);
        setError(errorMsg);
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  // Start detection when camera is selected
  useEffect(() => {
    if (!selectedCameraId || isInitializing) {
      return;
    }

    setIsDetecting(true);

    // Run face detection every 500ms (2 FPS for performance)
    detectionIntervalRef.current = window.setInterval(async () => {
      if (!containerRef.current || !canvasRef.current) {
        return;
      }

      try {
        const now = Date.now();
        if (now - lastDetectionRef.current < 500) {
          return; // Skip if less than 500ms since last detection
        }
        lastDetectionRef.current = now;

        // Find video element inside the stream player
        const videoElement = containerRef.current.querySelector("video");
        if (!videoElement) {
          return;
        }

        const result = await detectFacesInElement(videoElement);

        // Draw detections on canvas
        if (canvasRef.current && result.detections.length > 0) {
          // Match canvas size to video dimensions
          canvasRef.current.width = videoElement.videoWidth || containerRef.current.clientWidth;
          canvasRef.current.height = videoElement.videoHeight || containerRef.current.clientHeight;
          drawDetections(canvasRef.current, result.detections, result.matches);
        }

        // Add matched detections to history
        result.matches.forEach((match) => {
          if (match.matched) {
            const camera = cameras.find((c) => c.cameraId === selectedCameraId);
            const newDetection: DetectionRecord = {
              cameraId: selectedCameraId,
              cameraTitle: camera?.title || selectedCameraId,
              personName: match.name,
              distance: match.distance,
              timestamp: new Date(),
            };

            // Check if similar detection already recorded in last 2 seconds
            const recentSimilar = detections.some(
              (d) =>
                d.personName === newDetection.personName &&
                d.cameraId === newDetection.cameraId &&
                new Date().getTime() - d.timestamp.getTime() < 2000
            );

            if (!recentSimilar) {
              setDetections((prev) => [newDetection, ...prev.slice(0, 49)]);
            }
          }
        });
      } catch (error) {
        console.error("Detection error:", error);
      }
    });

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      setIsDetecting(false);
    };
  }, [selectedCameraId, isInitializing, cameras, detections]);

  return (
    <div className="flex min-h-[calc(100vh-132px)] flex-col gap-4 p-4">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-[#081321] p-4">
        <h1 className="text-2xl font-bold text-white">🔍 Face Detection</h1>
        <p className="text-sm text-slate-400">
          Real-time face detection and recognition across cameras
        </p>
        <div className="mt-2 flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isInitializing ? "bg-yellow-500" : error ? "bg-red-500" : "bg-green-500"}`} />
            <span className="text-slate-300">{statusText}</span>
          </div>
          <div className="text-slate-400">Reference Faces: {referenceFaceCount}</div>
          <div className="text-slate-400">Detections: {detections.length}</div>
        </div>
        {error && <div className="mt-2 text-xs text-red-400">⚠️ {error}</div>}
      </div>

      {/* Camera Selection */}
      <div className="rounded-2xl border border-white/10 bg-[#081321] p-4">
        <label className="block text-sm font-semibold text-slate-200">Select Camera</label>
        <select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:outline-none"
          disabled={isInitializing}
        >
          <option value="">-- Select a camera --</option>
          {cameras.map((camera) => (
            <option key={camera.cameraId} value={camera.cameraId}>
              {camera.streamId} - {camera.title}
            </option>
          ))}
        </select>
      </div>

      {/* Face Detection Canvas */}
      {selectedCameraId && (
        <div className="rounded-2xl border border-white/10 bg-[#081321] p-4">
          <h2 className="mb-3 text-lg font-semibold text-white">Live Detection</h2>
          <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "16 / 9" }}>
            {/* Canvas overlay for drawing detections */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 z-10 w-full h-full rounded-lg border border-cyan-500/30"
            />

            {/* Stream player */}
            <StreamPlayer
              cameraId={selectedCameraId}
              title={cameras.find((c) => c.cameraId === selectedCameraId)?.title || selectedCameraId}
              showControls={true}
              isActive={true}
              activateWhenVisible={false}
              priority
              compact
            />
          </div>
        </div>
      )}

      {/* Detection Results */}
      <div className="rounded-2xl border border-white/10 bg-[#081321] p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Detection History</h2>
        <div className="max-h-96 overflow-y-auto">
          {detections.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              No faces detected yet. Make sure reference faces are in /public/faces/
            </div>
          ) : (
            <div className="space-y-2">
              {detections.map((detection, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-900/20 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-green-300">
                      ✓ {detection.personName}
                    </p>
                    <p className="text-xs text-slate-400">
                      Camera: {detection.cameraTitle} • Distance: {detection.distance.toFixed(3)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {detection.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-900/20 p-4">
        <h3 className="mb-2 font-semibold text-blue-300">📝 Setup Instructions</h3>
        <ul className="space-y-1 text-sm text-blue-200">
          <li>1. Add face images to: <code className="bg-slate-800 px-1">/public/faces/</code></li>
          <li>2. File naming: <code className="bg-slate-800 px-1">PersonName.jpg</code> (the name will be used for detection)</li>
          <li>3. Select a camera from the dropdown above</li>
          <li>4. When a face matches a reference image, it will appear here and be outlined in green</li>
          <li>5. Yellow box = detected face (no match), Green box = matched face</li>
        </ul>
      </div>
    </div>
  );
}
