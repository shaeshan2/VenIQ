/**
 * MediaPipe Analyzer
 *
 * Lock In mode  → FaceLandmarker (478-point face mesh)
 *   • Draws the full facial mesh over the person's face
 *   • Extracts: eye openness (tired), smile (happy), brow furrow (stressed)
 *
 * Club mode     → PoseLandmarker (33-point body skeleton, up to 4 people)
 *   • Draws skeleton wireframe on each detected person
 *   • Extracts: hands raised count, estimated movement energy
 */

import {
  FaceLandmarker,
  PoseLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

// ── Singleton instances ────────────────────────────────────────────────────────

let faceLandmarker: FaceLandmarker | null = null;
let poseLandmarker: PoseLandmarker | null = null;
let faceReady = false;
let poseReady = false;

const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.33/wasm";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
// pose_landmarker_full required for multi-person — lite only reliably detects one
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

export async function initFaceLandmarker(): Promise<void> {
  if (faceReady) return;
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
    runningMode: "VIDEO",
    numFaces: 4,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: true,   // gives us smile, blink, etc.
  });
  faceReady = true;
}

export async function initPoseLandmarker(): Promise<void> {
  if (poseReady) return;
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    // CPU delegate required — GPU has a known browser bug with numPoses > 1
    baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses: 6,
    minPoseDetectionConfidence: 0.3,
    minPosePresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  });
  poseReady = true;
}

// ── Feature types ──────────────────────────────────────────────────────────────

export interface FaceFeatures {
  detected: boolean;
  eyeOpenness: number;   // 0 (closed) – 1 (wide open)  avg of both eyes
  smileScore: number;    // 0 – 1
  browFurrow: number;    // 0 – 1  (higher = more furrowed)
  /** Suggested emotion based purely on landmarks */
  suggestedEmotion: "focused" | "happy" | "tired" | "stressed" | null;
}

export interface PoseFeatures {
  personCount: number;
  handsRaisedCount: number;
  suggestedMode: "study" | "club" | null;
}

// ── Analysis functions ─────────────────────────────────────────────────────────

export function analyzeFaceFrame(
  video: HTMLVideoElement,
  timestampMs: number
): { result: FaceLandmarkerResult; features: FaceFeatures } {
  const empty: FaceFeatures = {
    detected: false, eyeOpenness: 0.5, smileScore: 0,
    browFurrow: 0, suggestedEmotion: null,
  };

  if (!faceLandmarker) return { result: { faceLandmarks: [], faceBlendshapes: [], facialTransformationMatrixes: [] }, features: empty };

  const result = faceLandmarker.detectForVideo(video, timestampMs);

  if (!result.faceLandmarks.length) return { result, features: { ...empty, detected: false } };

  // ── Blendshape extraction ──────────────────────────────────────────────────
  const shapes = result.faceBlendshapes?.[0]?.categories ?? [];
  const score = (name: string) =>
    shapes.find((c) => c.categoryName === name)?.score ?? 0;

  const eyeOpenness = 1 - (score("eyeBlinkLeft") + score("eyeBlinkRight")) / 2;
  const smileScore  = (score("mouthSmileLeft") + score("mouthSmileRight")) / 2;
  const browFurrow  = (score("browDownLeft") + score("browDownRight")) / 2;

  // ── Heuristic emotion ──────────────────────────────────────────────────────
  let suggestedEmotion: FaceFeatures["suggestedEmotion"] = "focused";
  if (smileScore > 0.35)       suggestedEmotion = "happy";
  else if (eyeOpenness < 0.35) suggestedEmotion = "tired";
  else if (browFurrow > 0.4)   suggestedEmotion = "stressed";

  return {
    result,
    features: { detected: true, eyeOpenness, smileScore, browFurrow, suggestedEmotion },
  };
}

export function analyzePoseFrame(
  video: HTMLVideoElement,
  timestampMs: number
): { result: PoseLandmarkerResult; features: PoseFeatures } {
  const empty: PoseFeatures = { personCount: 0, handsRaisedCount: 0, suggestedMode: null };

  if (!poseLandmarker) return { result: { landmarks: [], worldLandmarks: [], segmentationMasks: [] }, features: empty };

  const result = poseLandmarker.detectForVideo(video, timestampMs);
  const personCount = result.landmarks.length;
  let handsRaisedCount = 0;

  for (const landmarks of result.landmarks) {
    // Landmark indices: LEFT_WRIST=15, RIGHT_WRIST=16, LEFT_SHOULDER=11, RIGHT_SHOULDER=12
    const lWrist = landmarks[15];
    const rWrist = landmarks[16];
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    if (lWrist && lShoulder && lWrist.visibility > 0.5 && lWrist.y < lShoulder.y) handsRaisedCount++;
    if (rWrist && rShoulder && rWrist.visibility > 0.5 && rWrist.y < rShoulder.y) handsRaisedCount++;
  }

  const suggestedMode: PoseFeatures["suggestedMode"] =
    personCount === 0 ? null : personCount === 1 ? "study" : "club";

  return { result, features: { personCount, handsRaisedCount, suggestedMode } };
}

// ── Drawing ────────────────────────────────────────────────────────────────────

// Face mesh triangle connections from MediaPipe spec (major contours only for perf)
const FACE_CONTOURS = FaceLandmarker.FACE_LANDMARKS_CONTOURS;
const FACE_TESSELATION = FaceLandmarker.FACE_LANDMARKS_TESSELATION;

export function drawFaceMesh(
  canvas: HTMLCanvasElement,
  result: FaceLandmarkerResult,
  emotion: string | null
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx || !result.faceLandmarks.length) { ctx?.clearRect(0, 0, canvas.width, canvas.height); return; }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;

  // Color per emotion
  const color =
    emotion === "happy"    ? "rgba(250, 204, 21, 0.55)"   // yellow
    : emotion === "tired"  ? "rgba(167, 139, 250, 0.55)"  // purple
    : emotion === "stressed" ? "rgba(251, 146, 60, 0.55)" // orange
    : "rgba(96, 165, 250, 0.55)";                          // blue (focused)

  const dotColor =
    emotion === "happy"    ? "rgba(253, 224, 71, 0.9)"
    : emotion === "tired"  ? "rgba(196, 181, 253, 0.9)"
    : emotion === "stressed" ? "rgba(253, 186, 116, 0.9)"
    : "rgba(147, 197, 253, 0.9)";

  for (const landmarks of result.faceLandmarks) {
    // Tesselation (full mesh, very faint)
    ctx.strokeStyle = color.replace("0.55", "0.15");
    ctx.lineWidth = 0.5;
    for (const conn of FACE_TESSELATION) {
      const a = landmarks[conn.start];
      const b = landmarks[conn.end];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    }

    // Contours (brighter, thicker)
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    for (const conn of FACE_CONTOURS) {
      const a = landmarks[conn.start];
      const b = landmarks[conn.end];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    }

    // Landmark dots
    ctx.fillStyle = dotColor;
    ctx.shadowBlur = 0;
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Skeleton connections (MediaPipe 33-point pose)
const POSE_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 7],    // face left
  [0, 4], [4, 5], [5, 6], [6, 8],    // face right
  [9, 10],                             // mouth
  [11, 12],                            // shoulders
  [11, 13], [13, 15],                  // left arm
  [12, 14], [14, 16],                  // right arm
  [15, 17], [15, 19], [15, 21],        // left hand
  [16, 18], [16, 20], [16, 22],        // right hand
  [11, 23], [12, 24],                  // torso
  [23, 24],                            // hips
  [23, 25], [25, 27], [27, 29], [27, 31],  // left leg
  [24, 26], [26, 28], [28, 30], [28, 32],  // right leg
];

export function drawPoseSkeleton(
  canvas: HTMLCanvasElement,
  result: PoseLandmarkerResult,
  mood: string | null
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!result.landmarks.length) return;

  const w = canvas.width;
  const h = canvas.height;

  const lineColor = mood === "party" ? "rgba(244, 114, 182, 0.7)"  : "rgba(129, 140, 248, 0.7)";
  const dotColor  = mood === "party" ? "rgba(249, 168, 212, 0.95)" : "rgba(165, 180, 252, 0.95)";
  const handColor = "rgba(250, 204, 21, 0.95)"; // yellow for raised hands

  for (const landmarks of result.landmarks) {
    // Connections
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;

    for (const [a, b] of POSE_CONNECTIONS) {
      const lmA = landmarks[a];
      const lmB = landmarks[b];
      if (!lmA || !lmB || (lmA.visibility ?? 1) < 0.4 || (lmB.visibility ?? 1) < 0.4) continue;

      // Highlight arms when hands raised
      const isArm = (a === 13 || a === 15 || b === 13 || b === 15 ||
                     a === 14 || a === 16 || b === 14 || b === 16);
      const lShoulder = landmarks[11];
      const rShoulder = landmarks[12];
      const lWrist    = landmarks[15];
      const rWrist    = landmarks[16];
      const handsUp   = (lWrist && lShoulder && lWrist.y < lShoulder.y) ||
                        (rWrist && rShoulder && rWrist.y < rShoulder.y);

      ctx.strokeStyle = (isArm && handsUp) ? handColor : lineColor;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(lmA.x * w, lmA.y * h);
      ctx.lineTo(lmB.x * w, lmB.y * h);
      ctx.stroke();
    }

    // Dots
    ctx.shadowBlur = 0;
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if ((lm.visibility ?? 1) < 0.4) continue;
      // Wrists glow yellow when raised
      const lShoulder = landmarks[11];
      const rShoulder = landmarks[12];
      const isRaisedWrist = (i === 15 && lShoulder && lm.y < lShoulder.y) ||
                            (i === 16 && rShoulder && lm.y < rShoulder.y);
      ctx.fillStyle = isRaisedWrist ? handColor : dotColor;
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, i < 11 ? 2 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
