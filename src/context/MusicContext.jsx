import { createContext, useContext, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import songService from "../services/songService";

export const VIETNAMESE_PLAYLIST = [
  {
    id: 1,
    title: "Lo-Fi Study & Chill Beats",
    artist: "BlogViet Lo-Fi Station",
    genre: "Lofi Chill",
    genreColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio10.mp3",
    fallbackSrc: "https://stream.zeno.fm/f3wvbbqmdg8uv",
  },
  {
    id: 2,
    title: "Vinahouse & Nonstop Dance Night",
    artist: "DJ Club Live Mix",
    genre: "Vinahouse",
    genreColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio2.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio9.mp3",
  },
  {
    id: 3,
    title: "Acoustic Guitar & Pop Ballad",
    artist: "Acoustic Melody Session",
    genre: "Acoustic",
    genreColor: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio10.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio1.mp3",
  },
  {
    id: 4,
    title: "Top Hit Charts 2026",
    artist: "Trending Global Hits",
    genre: "Pop",
    genreColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio1.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio2.mp3",
  },
  {
    id: 5,
    title: "Piano & Gentle Raindrops",
    artist: "Peaceful Night Ambient",
    genre: "Relaxing",
    genreColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    cover: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80",
    src: "https://stream.zeno.fm/f3wvbbqmdg8uv",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio10.mp3",
  },
  {
    id: 6,
    title: "Cyberpunk 80s Synthwave",
    artist: "Neon Future Beats",
    genre: "Synthwave",
    genreColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio9.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio2.mp3",
  },
  {
    id: 7,
    title: "Warm Coffee Shop Jazz",
    artist: "Midnight Jazz Quartet",
    genre: "Jazz",
    genreColor: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    cover: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio2.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio10.mp3",
  },
  {
    id: 8,
    title: "Gaming Beats & Chillhop Level Up",
    artist: "Pixel Wave Records",
    genre: "Chillhop",
    genreColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio10.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio9.mp3",
  },
  {
    id: 9,
    title: "Deep House Sunset Lounge",
    artist: "Tropical Sunset Vibes",
    genre: "Deep House",
    genreColor: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio2.mp3",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio1.mp3",
  },
  {
    id: 10,
    title: "Healing Zen & Nature Sounds",
    artist: "Deep Mindfulness Space",
    genre: "Zen Ambient",
    genreColor: "bg-lime-100 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300",
    cover: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80",
    src: "https://stream.zeno.fm/f3wvbbqmdg8uv",
    fallbackSrc: "https://streams.ilovemusic.de/iloveradio10.mp3",
  },
];

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

  const audioRef = useRef(null);
  const retryCountRef = useRef(0);

  // Safe Track object with full fallback
  const rawTrack = playlist[currentTrackIndex] || playlist[0] || VIETNAMESE_PLAYLIST[0];
  const currentTrack = {
    ...rawTrack,
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
          // Normalize items to ensure .src and .cover exist
          const normalized = res.data.map((item) => ({
            ...item,
            src: item.src || item.audioUrl || VIETNAMESE_PLAYLIST[0].src,
            fallbackSrc: item.fallbackSrc || item.fallbackAudioUrl,
            cover: item.cover || item.coverUrl || VIETNAMESE_PLAYLIST[0].cover,
          }));
          setPlaylist(normalized);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize singleton audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.src = currentTrack.src;
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (!isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (!isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
      setHasError(false);
      retryCountRef.current = 0;
    };

    const onEnded = () => {
      nextTrack();
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    // Bắt lỗi stream (403, 404, network) và tự động thử fallback/skip
    const onError = () => {
      setHasError(true);
      setIsPlaying(false);
      console.warn("[MUSIC ERROR] Lỗi tải stream:", audio.src);

      const track = playlist[currentTrackIndex] || currentTrack;
      const fallbackUrl = track?.fallbackSrc || track?.fallbackAudioUrl;

      if (fallbackUrl && retryCountRef.current === 0) {
        retryCountRef.current = 1;
        console.info("[MUSIC FALLBACK] Thử link phụ fallbackSrc:", fallbackUrl);
        audio.src = fallbackUrl;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
        return;
      }

      toast.info(`Bài hát "${track?.title || ""}" đang chuyển sang luồng tiếp theo...`);
      setTimeout(() => {
        nextTrack();
      }, 1000);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [playlist]);

  // Robust playTrack handling Number (index), Object (song), or ID (string/number)
  const playTrack = (trackOrIndex) => {
    if (trackOrIndex === undefined || trackOrIndex === null) return;
    if (!playlist || playlist.length === 0) return;

    let targetIndex = 0;

    if (typeof trackOrIndex === "number") {
      targetIndex = (trackOrIndex + playlist.length) % playlist.length;
    } else if (typeof trackOrIndex === "object") {
      // Find track by id or src/audioUrl or title
      const foundIdx = playlist.findIndex(
        (t) =>
          (trackOrIndex.id && t.id === trackOrIndex.id) ||
          (trackOrIndex.src && (t.src === trackOrIndex.src || t.audioUrl === trackOrIndex.src)) ||
          (trackOrIndex.audioUrl && (t.src === trackOrIndex.audioUrl || t.audioUrl === trackOrIndex.audioUrl)) ||
          (trackOrIndex.title && t.title === trackOrIndex.title)
      );

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
      const idx = playlist.findIndex((t) => String(t.id) === trackOrIndex);
      if (idx !== -1) targetIndex = idx;
    }

    const selectedTrack = playlist[targetIndex] || playlist[0] || VIETNAMESE_PLAYLIST[0];
    if (!selectedTrack) return;

    const audioSource =
      selectedTrack.src ||
      selectedTrack.audioUrl ||
      selectedTrack.fallbackSrc ||
      selectedTrack.fallbackAudioUrl ||
      VIETNAMESE_PLAYLIST[0].src;

    setCurrentTrackIndex(targetIndex);
    setHasError(false);
    retryCountRef.current = 0;

    if (audioRef.current) {
      audioRef.current.src = audioSource;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[MUSIC PLAY ERROR]", err);
          setIsPlaying(false);
        });
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
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
    playTrack(currentTrackIndex + 1);
  };

  const prevTrack = () => {
    playTrack(currentTrackIndex - 1);
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
        const normalized = res.data.map((item) => ({
          ...item,
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
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        hasError,
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
