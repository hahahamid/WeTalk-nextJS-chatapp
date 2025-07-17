import React, { useRef, useState, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

const DUMMY_BARS = 48;
function getDummyWaveform() {
  let arr = [];
  for (let i = 0; i < DUMMY_BARS; i++) {
    // You can create a "round" look with sin/cos, or just use random:
    const amp = 0.4 + Math.random() * 0.5;
    arr.push(amp);
  }
  return arr;
}

const VoiceMessagePlayer = ({ src, color = "#24a0ed", bubbleClass }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dummyWaveform] = useState(getDummyWaveform);
  const [animatedBars, setAnimatedBars] = useState(dummyWaveform);

  // Audio time/progress handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () =>
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Animate bars while playing
  useEffect(() => {
    let interval = null;

    if (playing) {
      interval = setInterval(() => {
        setAnimatedBars(() =>
          dummyWaveform.map((amp) =>
            Math.min(1, Math.max(0.3, amp + (Math.random() - 0.5) * 0.15))
          )
        );
      }, 150); // 7 frames/sec
    } else {
      setAnimatedBars(dummyWaveform); // Reset when stopped/paused
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playing, dummyWaveform]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const formatTime = (s) =>
    isNaN(s)
      ? "0:00"
      : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div
      className={`flex flex-col gap-2 items-center md:p-1 rounded-2xl shadow-inner ${bubbleClass}`}
      style={{
        // background: color + "15",
        // border: `1px solid ${color}20`,
        // minWidth: auto,
        maxWidth: 340,
      }}
    >
      <div className="flex items-center w-full gap-3">
        <audio src={src} ref={audioRef} preload="metadata" />
        <button
          onClick={togglePlay}
          className="h-8 w-8 rounded-full flex items-center justify-center shadow bg-white"
        >
          {playing ? (
            <FaPause className="text-sm" style={{ color }} />
          ) : (
            <FaPlay className="text-sm ml-0.5" style={{ color }} />
          )}
        </button>
        <div className="flex-grow relative">
          {/* Progress bar */}
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
          {/* Animated Dummy Waveform */}
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
        {/* <span className="ml-2 text-[13px] font-mono text-gray-600 drop-shadow">
          {formatTime(duration)}
        </span> */}
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
