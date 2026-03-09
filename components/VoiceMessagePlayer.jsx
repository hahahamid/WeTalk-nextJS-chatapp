import React, { useRef, useState, useEffect, useMemo } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

const DUMMY_BARS = 48;
function getDummyWaveform() {
  let arr = [];
  for (let i = 0; i < DUMMY_BARS; i++) {
    const amp = 0.4 + Math.random() * 0.5;
    arr.push(amp);
  }
  return arr;
}

function toProxyUrl(src) {
  if (!src || src.startsWith("blob:") || src.startsWith("data:")) return src;
  return `/api/audio-proxy?url=${encodeURIComponent(src)}`;
}

const VoiceMessagePlayer = ({
  src,
  color = "#24a0ed",
  bubbleClass,
  target,
}) => {
  const audioRef = useRef(null);
  const pendingSrcRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dummyWaveform] = useState(getDummyWaveform);
  const [animatedBars, setAnimatedBars] = useState(dummyWaveform);

  const audioSrc = useMemo(() => toProxyUrl(src), [src]);

  // Apply audio src changes, but defer if currently playing
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.src = audioSrc;
      pendingSrcRef.current = null;
    } else {
      pendingSrcRef.current = audioSrc;
    }
  }, [audioSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const applyPendingSrc = () => {
      if (pendingSrcRef.current) {
        audio.src = pendingSrcRef.current;
        pendingSrcRef.current = null;
      }
    };

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () =>
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    const onEnded = () => {
      setPlaying(false);
      setLoading(false);
      setProgress(0);
      applyPendingSrc();
    };
    const onPause = () => {
      setLoading(false);
      applyPendingSrc();
    };
    const onPlaying = () => {
      window.dispatchEvent(
        new CustomEvent("voice-play", { detail: audio })
      );
      setPlaying(true);
      setLoading(false);
    };
    const onWaiting = () => setLoading(true);
    const onError = () => {
      setPlaying(false);
      setLoading(false);
    };

    const onOtherPlay = (e) => {
      if (e.detail !== audio && !audio.paused) {
        audio.pause();
        setPlaying(false);
        setLoading(false);
      }
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);
    window.addEventListener("voice-play", onOtherPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      window.removeEventListener("voice-play", onOtherPlay);
    };
  }, []);

  useEffect(() => {
    let interval = null;

    if (playing && !loading) {
      interval = setInterval(() => {
        setAnimatedBars(() =>
          dummyWaveform.map((amp) =>
            Math.min(1, Math.max(0.3, amp + (Math.random() - 0.5) * 0.15))
          )
        );
      }, 150);
    } else {
      setAnimatedBars(dummyWaveform);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playing, loading, dummyWaveform]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || loading) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      const isBuffered = audio.readyState >= 3;
      if (!isBuffered) setLoading(true);

      try {
        await audio.play();
      } catch (err) {
        console.error("Audio playback failed:", err);
        setLoading(false);
      }
    }
  };

  const formatTime = (s) =>
    isNaN(s)
      ? "0:00"
      : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div
      className={`flex flex-col gap-2 items-center md:p-1 rounded-2xl shadow-inner ${bubbleClass}`}
      style={{ maxWidth: 340 }}
    >
      <div className="flex items-center w-full gap-3">
        <audio ref={audioRef} preload="auto" />
        <button
          onClick={togglePlay}
          disabled={loading}
          className="h-8 w-8 rounded-full flex items-center justify-center shadow bg-white relative z-10"
        >
          {loading ? (
            <span
              className="h-4 w-4 border-2 rounded-full animate-spin"
              style={{ borderColor: `${color}40`, borderTopColor: color }}
            />
          ) : playing ? (
            <FaPause className="text-sm" style={{ color }} />
          ) : (
            <FaPlay className="text-sm ml-0.5" style={{ color }} />
          )}
        </button>

        <div className="flex-grow relative">
          {target !== "composebar" && (
            <div
              className="h-1 bg-gray-200 rounded"
              style={{ width: 120, minWidth: 80, marginBottom: 4 }}
            >
              <div
                className="h-1 rounded"
                style={{
                  width: `${progress}%`,
                  background: color,
                }}
              />
            </div>
          )}

          <svg width={120} height={18} style={{ display: "block" }}>
            {animatedBars.map((amp, i) => (
              <rect
                key={i}
                x={i * 2.5}
                y={9 - amp * 9}
                width={2}
                height={amp * 18 + 1}
                rx={1}
                fill={color}
                opacity={0.7}
                style={{
                  transition: "height 0.15s, y 0.15s",
                }}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
