import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import songService from "../services/songService";

export const VIETNAMESE_PLAYLIST = [
  // 1. Vinahouse & Remix Club
  {
    id: 1,
    title: "Vinahouse Club Night & Bass Boosted",
    artist: "DJ Live Mix Nonstop",
    genre: "Vinahouse",
    genreColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio2.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio9.mp3",
  },
  {
    id: 2,
    title: "Cắt Đôi Nỗi Sầu (Vinahouse Remix)",
    artist: "Tăng Duy Tân",
    genre: "Vinahouse",
    genreColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio14.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio2.mp3",
  },
  {
    id: 3,
    title: "See Tình (Hoàng Thùy Linh Remix)",
    artist: "Hoàng Thùy Linh",
    genre: "Vinahouse",
    genreColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio15.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio9.mp3",
  },
  {
    id: 4,
    title: "EDM Festival & Nonstop Dance Party",
    artist: "Ultra Music Live",
    genre: "Vinahouse",
    genreColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio9.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio2.mp3",
  },

  // 2. Lo-Fi Chill & Focus
  {
    id: 5,
    title: "Lo-Fi Study & Chill Beats",
    artist: "BlogViet Lo-Fi Station",
    genre: "Lofi Chill",
    genreColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio10.mp3",
    fallbackSrc: "https://stream.zeno.fm/f3wvbbqmdg8uv",
  },
  {
    id: 6,
    title: "Acoustic Guitar & Coffee Melody",
    artist: "Acoustic Melody Session",
    genre: "Lofi Chill",
    genreColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio11.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio1.mp3",
  },
  {
    id: 7,
    title: "Late Night Lofi Beats & Deep Focus",
    artist: "Developer Chill Beats",
    genre: "Lofi Chill",
    genreColor: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    src: "https://stream.zeno.fm/f3wvbbqmdg8uv",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio10.mp3",
  },
  {
    id: 8,
    title: "Gaming Beats & Chillhop Level Up",
    artist: "Pixel Wave Records",
    genre: "Lofi Chill",
    genreColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio16.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio9.mp3",
  },

  // 3. Top V-Pop & Rap Việt
  {
    id: 9,
    title: "Nơi Này Có Anh",
    artist: "Sơn Tùng M-TP",
    genre: "V-Pop",
    genreColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio1.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio2.mp3",
  },
  {
    id: 10,
    title: "Nàng Thơ",
    artist: "Hoàng Dũng",
    genre: "V-Pop",
    genreColor: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio12.mp3",
    fallbackSrc: "https://stream.zeno.fm/f3wvbbqmdg8uv",
  },
  {
    id: 11,
    title: "Ngày Đầu Tiên",
    artist: "Đức Phúc",
    genre: "V-Pop",
    genreColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio18.mp3",
    fallbackSrc: "https://stream.zeno.fm/f3wvbbqmdg8uv",
  },
  {
    id: 12,
    title: "Chìm Sâu",
    artist: "RPT MCK ft. Trung Trần",
    genre: "V-Pop",
    genreColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio20.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio2.mp3",
  },
];

// Time Formatting Helpers
export function formatAudioTime(secs) {
  if (!secs || isNaN(secs) || secs === 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function formatDurationTime(secs) {
  if (!secs || isNaN(secs) || secs === 0 || secs === Infinity) return "Trực tiếp";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const [playlist, setPlaylist] = useState(VIETNAMESE_PLAYLIST);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Mobile & Global Mini Player visibility toggle state
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(() => {
    const saved = localStorage.getItem("blog_mini_player_visible");
    return saved !== null ? saved === "true" : true;
  });

  const hideMiniPlayer = () => {
    setIsMiniPlayerVisible(false);
    localStorage.setItem("blog_mini_player_visible", "false");
  };

  const showMiniPlayer = () => {
    setIsMiniPlayerVisible(true);
    localStorage.setItem("blog_mini_player_visible", "true");
  };

  const toggleMiniPlayer = () => {
    setIsMiniPlayerVisible((prev) => {
      const next = !prev;
      localStorage.setItem("blog_mini_player_visible", String(next));
      return next;
    });
  };

  const audioRef = useRef(null);
  const retryCountRef = useRef(0);

  // References to prevent stale closure in audio event handlers
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;

  const currentTrackIndexRef = useRef(currentTrackIndex);
  currentTrackIndexRef.current = currentTrackIndex;

  // Safe Current Track object
  const rawTrack = playlist[currentTrackIndex] || playlist[0] || VIETNAMESE_PLAYLIST[0];
  const currentTrack = {
    ...rawTrack,
    id: rawTrack?.id ?? (currentTrackIndex + 1),
    src: rawTrack?.src || rawTrack?.audioUrl || VIETNAMESE_PLAYLIST[0].src,
    fallbackSrc: rawTrack?.fallbackSrc || rawTrack?.fallbackAudioUrl || VIETNAMESE_PLAYLIST[0].fallbackSrc,
    cover: rawTrack?.cover || rawTrack?.coverUrl || VIETNAMESE_PLAYLIST[0].cover,
    title: rawTrack?.title || "Bài hát trực tuyến",
    artist: rawTrack?.artist || "BlogViet Streaming",
    genre: rawTrack?.genre || "Radio",
  };

  // Fetch dynamic songs from backend API on mount
  useEffect(() => {
    songService
      .getAll()
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map((item, idx) => ({
            ...item,
            id: item.id || `backend_${idx + 1}`,
            src: item.src || item.audioUrl || VIETNAMESE_PLAYLIST[0].src,
            fallbackSrc: item.fallbackSrc || item.fallbackAudioUrl,
            cover: item.cover || item.coverUrl || VIETNAMESE_PLAYLIST[0].cover,
          }));
          setPlaylist(normalized);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize singleton audio element ONCE
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = currentTrack.src;
    audio.volume = volume;
    audioRef.current = audio;

    const updateDuration = () => {
      const d = audio.duration;
      if (!isNaN(d) && d > 0 && d !== Infinity) {
        setDuration(d);
      } else {
        setDuration(0);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0 && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      updateDuration();
      setHasError(false);
      retryCountRef.current = 0;
    };

    const onDurationChange = () => {
      updateDuration();
    };

    // Auto-Next Queue Trigger
    const onEnded = () => {
      console.info("[MUSIC QUEUE] Bài hát kết thúc -> Tự động chuyển bài tiếp theo trong hàng đợi.");
      const curList = playlistRef.current;
      const curIdx = currentTrackIndexRef.current;
      if (curList && curList.length > 0) {
        const nextIdx = (curIdx + 1) % curList.length;
        playTrackInternal(nextIdx);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    // Fallback & Auto-Skip on Stream error
    const onError = () => {
      setHasError(true);
      setIsPlaying(false);
      console.warn("[MUSIC ERROR] Lỗi phát stream:", audio.src);

      const curList = playlistRef.current;
      const curIdx = currentTrackIndexRef.current;
      const track = curList[curIdx];
      const fallbackUrl = track?.fallbackSrc || track?.fallbackAudioUrl;

      if (fallbackUrl && retryCountRef.current === 0) {
        retryCountRef.current = 1;
        console.info("[MUSIC FALLBACK] Đang thử luồng phụ fallback:", fallbackUrl);
        audio.src = fallbackUrl;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
        return;
      }

      toast.info(`Bài hát "${track?.title || ""}" đang chuyển sang luồng tiếp theo...`);
      setTimeout(() => {
        if (curList && curList.length > 0) {
          const nextIdx = (curIdx + 1) % curList.length;
          playTrackInternal(nextIdx);
        }
      }, 1200);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("canplay", updateDuration);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      try {
        audio.pause();
        audio.src = "";
      } catch {}
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("canplay", updateDuration);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, []);

  // Internal Queue Player
  const playTrackInternal = (targetIndex) => {
    const curList = playlistRef.current;
    if (!curList || curList.length === 0) return;

    const safeIdx = (targetIndex + curList.length) % curList.length;
    const selectedTrack = curList[safeIdx] || VIETNAMESE_PLAYLIST[0];
    if (!selectedTrack) return;

    const audioSource =
      selectedTrack.src ||
      selectedTrack.audioUrl ||
      selectedTrack.fallbackSrc ||
      selectedTrack.fallbackAudioUrl ||
      VIETNAMESE_PLAYLIST[0].src;

    setCurrentTrackIndex(safeIdx);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    setIsMiniPlayerVisible(true);
    retryCountRef.current = 0;

    if (audioRef.current) {
      // Force pause & reset before switching audio
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}

      audioRef.current.src = audioSource;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[MUSIC PLAY ERROR]", err);
          setIsPlaying(false);
        });
    }
  };

  // Robust public playTrack handler
  const playTrack = useCallback((trackOrIndex) => {
    if (trackOrIndex === undefined || trackOrIndex === null) return;
    const curList = playlistRef.current;
    if (!curList || curList.length === 0) return;

    let targetIndex = 0;

    if (typeof trackOrIndex === "number") {
      targetIndex = (trackOrIndex + curList.length) % curList.length;
    } else if (typeof trackOrIndex === "object") {
      let foundIdx = -1;
      // Match by ID first
      if (trackOrIndex.id !== undefined && trackOrIndex.id !== null) {
        foundIdx = curList.findIndex((t) => String(t.id) === String(trackOrIndex.id));
      }
      // Match by title & artist
      if (foundIdx === -1 && trackOrIndex.title) {
        foundIdx = curList.findIndex((t) => t.title === trackOrIndex.title && t.artist === trackOrIndex.artist);
      }
      // Match by source URL
      if (foundIdx === -1 && (trackOrIndex.src || trackOrIndex.audioUrl)) {
        const s = trackOrIndex.src || trackOrIndex.audioUrl;
        foundIdx = curList.findIndex((t) => t.src === s || t.audioUrl === s);
      }

      if (foundIdx !== -1) {
        targetIndex = foundIdx;
      } else {
        const safeTrack = {
          id: trackOrIndex.id || Date.now(),
          title: trackOrIndex.title || "Bài hát trực tuyến",
          artist: trackOrIndex.artist || "BlogViet Streaming",
          genre: trackOrIndex.genre || "Radio",
          cover: trackOrIndex.cover || trackOrIndex.coverUrl || VIETNAMESE_PLAYLIST[0].cover,
          src: trackOrIndex.src || trackOrIndex.audioUrl || VIETNAMESE_PLAYLIST[0].src,
          fallbackSrc: trackOrIndex.fallbackSrc || trackOrIndex.fallbackAudioUrl,
        };
        setPlaylist((prev) => [safeTrack, ...prev]);
        targetIndex = 0;
      }
    } else if (typeof trackOrIndex === "string") {
      const idx = curList.findIndex((t) => String(t.id) === trackOrIndex);
      if (idx !== -1) targetIndex = idx;
    }

    // If clicking on the exact currently selected track: toggle play / pause cleanly
    if (targetIndex === currentTrackIndexRef.current && audioRef.current?.src) {
      if (audioRef.current.paused) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    playTrackInternal(targetIndex);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[MUSIC PLAY ERROR]", err);
          setIsPlaying(false);
        });
    }
  };

  const nextTrack = () => {
    const curList = playlistRef.current;
    if (!curList || curList.length === 0) return;
    const nextIdx = (currentTrackIndexRef.current + 1) % curList.length;
    playTrackInternal(nextIdx);
  };

  const prevTrack = () => {
    const curList = playlistRef.current;
    if (!curList || curList.length === 0) return;
    const prevIdx = (currentTrackIndexRef.current - 1 + curList.length) % curList.length;
    playTrackInternal(prevIdx);
  };

  const seek = (timeInSeconds) => {
    if (audioRef.current && !isNaN(timeInSeconds)) {
      audioRef.current.currentTime = timeInSeconds;
      setCurrentTime(timeInSeconds);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const changeVolume = (newVol) => {
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setVolume(newVol);
      if (newVol === 0) setIsMuted(true);
      else if (isMuted) setIsMuted(false);
    }
  };

  const reloadPlaylist = async () => {
    try {
      const res = await songService.getAll();
      if (Array.isArray(res.data) && res.data.length > 0) {
        const normalized = res.data.map((item, idx) => ({
          ...item,
          id: item.id || `backend_${idx + 1}`,
          src: item.src || item.audioUrl || VIETNAMESE_PLAYLIST[0].src,
          fallbackSrc: item.fallbackSrc || item.fallbackAudioUrl,
          cover: item.cover || item.coverUrl || VIETNAMESE_PLAYLIST[0].cover,
        }));
        setPlaylist(normalized);
      }
    } catch {}
  };

  return (
    <MusicContext.Provider
      value={{
        playlist,
        currentTrack,
        currentTrackIndex,
        currentTrackId: currentTrack?.id,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        hasError,
        isMiniPlayerVisible,
        hideMiniPlayer,
        showMiniPlayer,
        toggleMiniPlayer,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        toggleMute,
        changeVolume,
        playTrack,
        reloadPlaylist,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
