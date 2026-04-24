// Client-side only face detection using face-api.js
// This module should only be imported in client components

export interface DetectedFaceMatch {
  name: string;
  distance: number;
  matched: boolean;
}

export interface FaceDetectionResult {
  detections: any[];
  matches: DetectedFaceMatch[];
  timestamp: Date;
}

export interface ReferenceFace {
  name: string;
  descriptor: Float32Array;
}

let modelsLoaded = false;
let referenceFaces: ReferenceFace[] = [];

const MODELS_PATH = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/models/";
const FACES_PATH = "/faces";
const MATCH_THRESHOLD = 0.6;

/**
 * Load face-api library from CDN
 */
async function loadFaceApiLibrary() {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load face-api.js library"));
    document.body.appendChild(script);
  });
}

/**
 * Initialize face detection models
 */
export async function initializeFaceDetection() {
  if (modelsLoaded) {
    return;
  }

  try {
    console.log("Loading face detection models...");

    // Load the library if not already loaded
    if (!(window as any).faceapi) {
      await loadFaceApiLibrary();
    }

    const faceapi = (window as any).faceapi;

    // Load models from CDN
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
      faceapi.nets.faceDescriptorNet.loadFromUri(MODELS_PATH),
    ]);

    modelsLoaded = true;
    console.log("✅ Face detection models loaded");
  } catch (error) {
    console.error("❌ Failed to load face detection models:", error);
    throw error;
  }
}

/**
 * Load reference face images from /faces folder
 */
export async function loadReferenceFaces() {
  try {
    const response = await fetch("/api/faces/list");
    if (!response.ok) {
      console.warn("Could not fetch face list");
      return;
    }

    const faceList: string[] = await response.json();
    const faceapi = (window as any).faceapi;

    for (const faceFile of faceList) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `${FACES_PATH}/${faceFile}`;
        await new Promise((resolve) => (img.onload = resolve));

        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections && detections.descriptor) {
          const name = faceFile.replace(/\.[^/.]+$/, "");
          referenceFaces.push({
            name,
            descriptor: detections.descriptor,
          });
          console.log(`✅ Loaded face: ${name}`);
        }
      } catch (e) {
        console.error(`Failed to process ${faceFile}:`, e);
      }
    }

    console.log(`Loaded ${referenceFaces.length} reference faces`);
  } catch (error) {
    console.error("Error loading reference faces:", error);
  }
}

/**
 * Detect faces in video/canvas element
 */
export async function detectFacesInElement(
  element: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<FaceDetectionResult> {
  if (!modelsLoaded) {
    throw new Error("Models not loaded");
  }

  const faceapi = (window as any).faceapi;

  try {
    const detections = await faceapi
      .detectAllFaces(element, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const matches: DetectedFaceMatch[] = [];

    for (const detection of detections) {
      if (!detection.descriptor) continue;

      const matchResults = referenceFaces.map((refFace) => ({
        name: refFace.name,
        distance: faceapi.euclideanDistance(detection.descriptor, refFace.descriptor),
      }));

      matchResults.sort((a, b) => a.distance - b.distance);

      if (matchResults.length > 0 && matchResults[0].distance < MATCH_THRESHOLD) {
        matches.push({
          ...matchResults[0],
          matched: true,
        });
      } else if (matchResults.length > 0) {
        matches.push({
          ...matchResults[0],
          matched: false,
        });
      }
    }

    return {
      detections,
      matches,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Detection error:", error);
    throw error;
  }
}

/**
 * Draw detections on canvas
 */
export function drawDetections(canvas: HTMLCanvasElement, detections: any[], matches: DetectedFaceMatch[]) {
  const faceapi = (window as any).faceapi;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const displaySize = { width: canvas.width, height: canvas.height };
  faceapi.matchDimensions(canvas, displaySize);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const resizedDetections = faceapi.resizeResults(detections, displaySize);

  resizedDetections.forEach((detection: any, index: number) => {
    const box = detection.detection.box;

    ctx.strokeStyle = index < matches.length && matches[index].matched ? "#00ff00" : "#ffff00";
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    if (index < matches.length && matches[index].matched) {
      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`✓ ${matches[index].name}`, box.x, box.y - 10);
    }
  });
}

export function getReferenceFaces() {
  return referenceFaces;
}

export function clearReferenceFaces() {
  referenceFaces = [];
}
