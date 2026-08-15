import { createContext, useContext, useState, useRef, useEffect } from "react";

export const PLAYLIST = [
  {
    id: 1,
    title: "Vinahouse Night Fever 2026",
    artist: "BlogViet DJ Team",
    genre: "Vinahouse / EDM",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
    src: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
  },
  {
    id: 2,
    title: "Deep Coding & Focus Chill",
    artist: "Lofi Developer Beats",
    genre: "Lofi Chill",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
    src: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_c764e2a6d8.mp3",
  },
  {
    id: 3,
    title: "Cyber Sunset Synthwave",
    artist: "Retro Wave Studio",
    genre: "Synthwave",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80",
    src: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
  },
  {
    id: 4,
    title: "Acoustic Morning Sunrise",
    artist: "Coffee & Books Melody",
    genre: "Acoustic Chill",
    cover: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&auto=format&fit=crop&q=80",
    src: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3",
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

  const audioRef = useRef(null);
  const currentTrack = PLAYLIST[currentTrackIndex];

  // Initialize singleton audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = currentTrack.src;
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      nextTrack();
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, []);

  // Handle track change
  const playTrack = (index) => {
    const nextIdx = (index + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(nextIdx);
    if (audioRef.current) {
      audioRef.current.src = PLAYLIST[nextIdx].src;
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const nextTrack = () => {
    playTrack(currentTrackIndex + 1);
  };

  const prevTrack = () => {
    playTrack(currentTrackIndex - 1);
  };

  const seek = (timeInSeconds) => {
    if (audioRef.current) {
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
