"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  audioUrl: string | null;
  isGenerating: boolean;
  outputFormat?: "mp3" | "wav";
}

/* ─── WAV Encoder (PCM 16-bit) ─────────────────────────────────── */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const length = buffer.length;
  const dataLength = length * blockAlign;
  const totalSize = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return arrayBuffer;
}

export default function AudioPlayer({
  audioUrl,
  isGenerating,
  outputFormat = "mp3",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  // When audioUrl changes, reset player state and load new audio
  useEffect(() => {
    if (audioUrl && audioUrl !== prevUrlRef.current) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(null);

      if (audioRef.current) {
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        audio.src = audioUrl;
        audio.load();
      }
    }

    if (!audioUrl && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }

    prevUrlRef.current = audioUrl;
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Always check the ACTUAL audio state, not the React state
    if (audio.paused || audio.ended) {
      if (!audio.src || audio.readyState === 0) {
        audio.src = audioUrl;
        audio.load();
      }
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Play failed:", err);
          setIsPlaying(false);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [audioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Once the new audio is loaded and ready, auto-play it
  const handleCanPlayThrough = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (audio.paused && audio.currentTime === 0) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [audioUrl]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  };

  const handleEnded = () => setIsPlaying(false);
  const handlePause = () => setIsPlaying(false);
  const handlePlay = () => setIsPlaying(true);
  const handleError = () => {
    setIsPlaying(false);
    setAudioError("Audio failed to load. Please try generating again.");
  };

  const formatTime = (t: number) => {
    if (!isFinite(t) || isNaN(t)) return "0:00";
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadAudio = useCallback(async () => {
    if (!audioUrl) return;

    try {
      if (outputFormat === "wav") {
        setIsConverting(true);
        const audioContext = new AudioContext();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const wavBuffer = audioBufferToWav(audioBuffer);
        const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
        const wavUrl = URL.createObjectURL(wavBlob);

        const a = document.createElement("a");
        a.href = wavUrl;
        a.download = `inovex_tts_${Date.now()}.wav`;
        a.click();

        URL.revokeObjectURL(wavUrl);
        await audioContext.close();
        setIsConverting(false);
      } else {
        // MP3 — download original blob directly
        const a = document.createElement("a");
        a.href = audioUrl;
        a.download = `inovex_tts_${Date.now()}.mp3`;
        a.click();
      }
    } catch (err) {
      console.error("Download failed:", err);
      setIsConverting(false);
      // Fallback: download as MP3
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `inovex_tts_${Date.now()}.mp3`;
      a.click();
    }
  }, [audioUrl, outputFormat]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // The <audio> element is ALWAYS rendered to avoid unmount/remount issues
  const audioElement = (
    <audio
      ref={audioRef}
      preload="auto"
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onCanPlayThrough={handleCanPlayThrough}
      onEnded={handleEnded}
      onPause={handlePause}
      onPlay={handlePlay}
      onError={handleError}
      style={{ display: "none" }}
    />
  );

  // Generating state
  if (isGenerating) {
    return (
      <>
        {audioElement}
        <div className="mt-6 bg-bg-alt border border-border rounded-xl p-6">
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-accent rounded-full animate-soundwave"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    height: "20px",
                  }}
                />
              ))}
            </div>
            <span className="text-subtext font-medium">Generating audio...</span>
          </div>
        </div>
      </>
    );
  }

  if (!audioUrl) return <>{audioElement}</>;

  return (
    <div className="mt-6 animate-fadeIn">
      {audioElement}

      {/* Generation header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
          <span
            className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-500 animate-pulse" : "bg-green-500"}`}
          />
          {isPlaying ? "Playing" : "Ready"}
        </div>
        <span className="text-xs text-muted font-mono">{formatTime(duration)}</span>
      </div>

      {/* Error message */}
      {audioError && (
        <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
          ⚠️ {audioError}
        </div>
      )}

      {/* Player card */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white
                       shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/35
                       hover:scale-105 active:scale-100 transition-all duration-200 shrink-0"
          >
            {isPlaying ? (
              <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Waveform / Progress bar */}
          <div className="flex-1">
            {/* Progress track */}
            <div className="relative h-8 flex items-center">
              <div className="absolute inset-0 flex items-center">
                {/* Waveform visualization */}
                <div className="w-full flex items-center gap-[1.5px] h-full">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const barProgress = (i / 60) * 100;
                    const isActive = barProgress <= progress;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-colors duration-150 ${
                          isActive ? "bg-accent" : "bg-gray-200"
                        }`}
                        style={{
                          height: `${Math.sin(i * 0.4) * 10 + Math.random() * 8 + 6}px`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.01}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-muted font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-1.5 shrink-0">
            <svg className="w-4 h-4 text-muted" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3z" />
              {volume > 0 && (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              )}
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="w-14 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-accent
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-accent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Share */}
            <button
              className="p-2 rounded-lg hover:bg-gray-50 transition-all text-muted hover:text-accent"
              title="Share"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            </button>
            {/* Download */}
            <button
              onClick={downloadAudio}
              disabled={isConverting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold
                         hover:bg-accent-dark transition-all shadow-sm disabled:opacity-60"
              title={`Export ${outputFormat.toUpperCase()}`}
            >
              {isConverting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Converting...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export {outputFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
