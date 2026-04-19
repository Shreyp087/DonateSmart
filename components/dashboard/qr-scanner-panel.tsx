"use client";

import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructorLike = new (options: { formats: string[] }) => BarcodeDetectorLike;

export function QrScannerPanel() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isUsingFallbackScanner, setIsUsingFallbackScanner] = useState(false);
  const [lastScan, setLastScan] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const detector = getBarcodeDetector();
    const hasCameraSupport = Boolean(navigator.mediaDevices?.getUserMedia);
    setIsSupported(hasCameraSupport);
    setIsUsingFallbackScanner(!detector);

    if (detector) {
      detectorRef.current = new detector({ formats: ["qr_code"] });
    }

    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play();
  }, [isOpen]);

  async function startScanner() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot open the camera here. Use the QR lookup field instead.");
      return;
    }

    setIsStarting(true);
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      stopScanner();
      streamRef.current = stream;
      setIsOpen(true);
      scheduleScan();
    } catch {
      setError("Camera access was not granted. Allow camera access or use the QR lookup field instead.");
    } finally {
      setIsStarting(false);
    }
  }

  function stopScanner() {
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsOpen(false);
  }

  function scheduleScan() {
    scanTimerRef.current = window.setTimeout(() => {
      void scanFrame();
    }, 250);
  }

  async function scanFrame() {
    const video = videoRef.current;

    if (!video || !streamRef.current) {
      return;
    }

    try {
      if (video.readyState >= 2) {
        const rawValue = (await detectQrValue(video, detectorRef.current, canvasRef.current))?.trim();

        if (rawValue) {
          setLastScan(rawValue);
          stopScanner();
          router.push(`/dashboard?qr=${encodeURIComponent(rawValue)}`);
          return;
        }
      }
    } catch {
      setError("Unable to read the QR code from the camera feed yet. Try holding the code closer, flatter, and steadier.");
    }

    scheduleScan();
  }

  return (
    <div className="rounded-[1.5rem] border border-black/5 bg-slate-50/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Scan with camera</p>
          <p className="mt-1 text-sm text-slate-500">
            Open the scanner and point the employee device camera at the donor QR code.
          </p>
        </div>
        <button
          type="button"
          onClick={isOpen ? stopScanner : startScanner}
          className={cn(
            "rounded-full px-5 py-3 text-sm font-semibold transition",
            isOpen
              ? "border border-black/8 bg-white text-slate-700 hover:bg-slate-100"
              : "bg-slate-950 text-white hover:bg-slate-800"
          )}
        >
          {isOpen ? "Close scanner" : isStarting ? "Opening camera..." : "Start scanner"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      {!isSupported ? (
        <p className="mt-3 text-sm text-slate-500">
          Camera access is not available in this browser, so use the lookup field below.
        </p>
      ) : null}
      {isSupported && isUsingFallbackScanner ? (
        <p className="mt-3 text-sm text-slate-500">
          Using the built-in fallback QR reader for broader phone support.
        </p>
      ) : null}

      {isOpen ? (
        <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-black/8 bg-slate-900">
          <video ref={videoRef} autoPlay playsInline muted className="h-72 w-full object-cover" />
        </div>
      ) : null}
      <canvas ref={canvasRef} className="hidden" />

      {lastScan ? (
        <p className="mt-3 text-sm text-slate-500">
          Last scanned value: <span className="font-semibold text-slate-700">{lastScan}</span>
        </p>
      ) : null}
    </div>
  );
}

function getBarcodeDetector(): BarcodeDetectorConstructorLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructorLike }).BarcodeDetector;
  return candidate || null;
}

async function detectQrValue(
  video: HTMLVideoElement,
  detector: BarcodeDetectorLike | null,
  canvas: HTMLCanvasElement | null
) {
  let nativeValue = "";

  try {
    nativeValue = await detectWithBarcodeDetector(video, detector);
  } catch {
    nativeValue = "";
  }

  if (nativeValue) {
    return nativeValue;
  }

  return detectWithJsQr(video, canvas);
}

async function detectWithBarcodeDetector(video: HTMLVideoElement, detector: BarcodeDetectorLike | null) {
  if (!detector) {
    return "";
  }

  const results = await detector.detect(video);
  return results.find((result) => result.rawValue)?.rawValue?.trim() || "";
}

function detectWithJsQr(video: HTMLVideoElement, canvas: HTMLCanvasElement | null) {
  if (!canvas || !video.videoWidth || !video.videoHeight) {
    return "";
  }

  const maxWidth = 960;
  const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
  const width = Math.max(1, Math.round(video.videoWidth * scale));
  const height = Math.max(1, Math.round(video.videoHeight * scale));

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return "";
  }

  context.drawImage(video, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth"
  });

  return result?.data?.trim() || "";
}
