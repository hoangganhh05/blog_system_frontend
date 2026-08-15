import { createContext, useContext, useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export const PLAYLIST = [
  {
    id: 1,
    title: "Vinahouse Club Night 2026",
    artist: "BlogViet DJ Team",
    genre: "Vinahouse / EDM",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio2.mp3",
    fallbackSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    title: "Lo-Fi Beats & Study Lounge",
    artist: "Lofi Developer Beats",
    genre: "Lofi Chill",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio10.mp3",
    fallbackSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    title: "Cyber Sunset Synthwave",
    artist: "Retro Wave Studio",
    genre: "Synthwave",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80",
    src: "https://streams.ilovemusic.de/iloveradio9.mp3",
    fallbackSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: 4,
    title: "Piano & Gentle Raindrop",
    artist: "Acoustic Melody & Rain",
    genre: "Acoustic Chill",
    cover: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=300&auto=format&fit=crop&q=80",
    src: "https://stream.zeno.fm/f3wvbbqmdg8uv",
    fallbackSrc: "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
  },
  {
    id: 5,
    title: "Deep Space Focus Ambience",
    artist: "Cosmic Relax Collective",
    genre: "Ambient Relax",
    cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=80",
    src: "https://actions.google.com/sounds/v1/science_fiction/space_ambience.ogg",
    fallbackSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
];

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef(null);
  const retryCountRef = useRef(0);
  const currentTrack = PLAYLIST[currentTrackIndex];

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

      const track = PLAYLIST[currentTrackIndex];
      if (track?.fallbackSrc && retryCountRef.current === 0) {
        retryCountRef.current = 1;
        console.info("[MUSIC FALLBACK] Thử link phụ fallbackSrc:", track.fallbackSrc);
        audio.src = track.fallbackSrc;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
        return;
      }

      toast.info(`Bài hát "${track?.title}" đang chuyển sang luồng tiếp theo...`);
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
  }, []);

  // Handle track change
  const playTrack = (index) => {
    const nextIdx = (index + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    setHasError(false);
    retryCountRef.current = 0;
    if (audioRef.current) {
      audioRef.current.src = PLAYLIST[nextIdx].src;
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

  return (
    <MusicContext.Provider
      value={{
        playlist: PLAYLIST,
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
