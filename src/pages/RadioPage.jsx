import { useState, useEffect, useRef } from "react";

const RADIO_STATIONS = [
  {
    id: "lofi-beats",
    name: "Lo-Fi Chill Beats",
    genre: "Chillhop & Study Beats",
    description: "Nhạc Lo-fi nhẹ nhàng hoàn hảo cho việc vừa đọc Blog vừa thư giãn làm việc.",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80",
    url: "https://streams.ilovemusic.de/iloveradio10.mp3",
    color: "#6366f1"
  },
  {
    id: "piano-rain",
    name: "Piano & Gentle Rain",
    genre: "Acoustic Piano & Raindrops",
    description: "Giai điệu Piano du dương kết hợp tiếng mưa nhẹ cho những đêm bình yên.",
    cover: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80",
    url: "https://stream.zeno.fm/f3wvbbqmdg8uv",
    color: "#0ea5e9"
  },
  {
    id: "coffee-jazz",
    name: "Coffee Shop Jazz",
    genre: "Smooth & Warm Jazz",
    description: "Âm hưởng Jazz quán cà phê ấm áp cho buổi sáng tràn đầy năng lượng.",
    cover: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
    url: "https://streams.ilovemusic.de/iloveradio2.mp3",
    color: "#d97706"
  },
  {
    id: "synthwave",
    name: "Cyberpunk Synthwave",
    genre: "Retro 80s & Synth Lounge",
    description: "Nhạc Synthwave không lời mang không khí Cyberpunk cổ điển độc đáo.",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
    url: "https://streams.ilovemusic.de/iloveradio9.mp3",
    color: "#ec4899"
  }
];

function RadioPage() {
  const [currentStation, setCurrentStation] = useState(RADIO_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [sleepTimer, setSleepTimer] = useState(null); // min
  const [timerLeft, setTimerLeft] = useState(0);

  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleStationChange = (station) => {
    setCurrentStation(station);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentStation.url;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentStation]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSetTimer = (minutes) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (!minutes) {
      setSleepTimer(null);
      setTimerLeft(0);
      return;
    }
    setSleepTimer(minutes);
    setTimerLeft(minutes * 60);

    timerIntervalRef.current = setInterval(() => {
      setTimerLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          setSleepTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="app-layout radio-page">
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
        <audio ref={audioRef} />

      {/* Hero Banner Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${currentStation.color} 0%, #1e1b4b 100%)`,
          borderRadius: 24,
          padding: "36px 32px",
          color: "#fff",
          marginBottom: 32,
          boxShadow: `0 20px 40px ${currentStation.color}33`,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 32,
          justifyContent: "space-between"
        }}
      >
        {/* Decorative Background Circles */}
        <div style={{
          position: "absolute", top: -50, right: -50, width: 250, height: 250,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none"
        }} />

        {/* Left Side: Vinyl Record Player Animation */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, zIndex: 1 }}>
          <div style={{ position: "relative", width: 140, height: 140 }}>
            {/* Spinning Disc */}
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "#111",
                border: "4px solid #333",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: isPlaying ? "spin 6s linear infinite" : "none",
                position: "relative"
              }}
            >
              {/* Disc Grooves */}
              <div style={{ position: "absolute", inset: 12, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", inset: 26, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />

              {/* Station Cover Center */}
              <img
                src={currentStation.cover}
                alt={currentStation.name}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #fff"
                }}
              />
            </div>

            {/* Play Badge */}
            {isPlaying && (
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                background: "var(--primary)", borderRadius: "50%", width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
              }}>
                <span style={{ fontSize: 12 }}>🎵</span>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.8, marginBottom: 4 }}>
              📻 BlogViet Radio • {currentStation.genre}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
              {currentStation.name}
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 14, maxWidth: 380, lineHeight: 1.5 }}>
              {currentStation.description}
            </p>
          </div>
        </div>

        {/* Right Side: Player Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, zIndex: 1, minWidth: 220 }}>
          {/* Big Play / Pause Button */}
          <button
            onClick={togglePlay}
            style={{
              background: "#ffffff",
              color: currentStation.color,
              border: "none",
              borderRadius: 40,
              padding: "14px 28px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              transition: "transform 0.2s, background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <span style={{ fontSize: 20 }}>{isPlaying ? "⏸️" : "▶️"}</span>
            <span>{isPlaying ? "Đang phát nhạc" : "Bắt đầu nghe"}</span>
          </button>

          {/* Volume Control */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.12)", padding: "8px 16px", borderRadius: 20 }}>
            <span style={{ fontSize: 14 }}>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#ffffff", cursor: "pointer" }}
            />
          </div>

          {/* Sleep Timer Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ opacity: 0.8 }}>⏱️ Hẹn giờ tắt:</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleSetTimer(sleepTimer === mins ? null : mins)}
                  style={{
                    background: sleepTimer === mins ? "#ffffff" : "rgba(255,255,255,0.15)",
                    color: sleepTimer === mins ? currentStation.color : "#ffffff",
                    border: "none",
                    borderRadius: 12,
                    padding: "3px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {mins}p
                </button>
              ))}
            </div>
          </div>
          {timerLeft > 0 && (
            <div style={{ textAlign: "right", fontSize: 11, fontWeight: 600, opacity: 0.9 }}>
              ⏳ Tắt nhạc sau: {formatTimer(timerLeft)}
            </div>
          )}
        </div>
      </div>

      {/* Grid danh sách Kênh Radio */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span>📻 Các Kênh Radio Phát Liên Tục</span>
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
        {RADIO_STATIONS.map((st) => {
          const isActive = currentStation.id === st.id;
          return (
            <div
              key={st.id}
              onClick={() => handleStationChange(st)}
              style={{
                background: "var(--bg-card)",
                border: isActive ? `2px solid ${st.color}` : "1px solid var(--border-light)",
                borderRadius: 18,
                padding: 16,
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: isActive ? `0 10px 25px ${st.color}22` : "0 2px 8px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ position: "relative", width: "100%", height: 130, borderRadius: 12, overflow: "hidden" }}>
                <img src={st.cover} alt={st.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {isActive && isPlaying && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ fontSize: 32, animation: "bounce 1s infinite" }}>🎵</span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: st.color, textTransform: "uppercase", marginBottom: 2 }}>
                  {st.genre}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 4 }}>
                  {st.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {st.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Animation keyframes cho Đĩa than */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
      </div>
    </div>
  );
}

export default RadioPage;
