import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import soundscapeService, { DEFAULT_SOUNDSCAPES } from "../services/soundscapeService";

const SoundscapeContext = createContext(null);

export function SoundscapeProvider({ children }) {
  const [playlist, setPlaylist] = useState(DEFAULT_SOUNDSCAPES);
  const [currentTrack, setCurrentTrack] = useState(DEFAULT_SOUNDSCAPES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLooping, setIsLooping] = useState(true); // Loop ambient soundscapes by default
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(true);
  const [sleepTimer, setSleepTimer] = useState(0); // 0 = off, minutes
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState(0); // seconds remaining

  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Initialize HTML Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (!audio.loop) {
        handleNext();
      }
    };
    const onError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // Sync volume & loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = isLooping;
    }
  }, [volume, isLooping]);

  // Handle Sleep Timer Countdown
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (sleepTimer > 0 && isPlaying) {
      setSleepTimeRemaining(sleepTimer * 60);

      timerIntervalRef.current = setInterval(() => {
        setSleepTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            setSleepTimer(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setSleepTimeRemaining(0);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sleepTimer, isPlaying]);

  const playSoundscape = useCallback((item, customList = null) => {
    if (!item) return;
    if (customList && Array.isArray(customList)) {
      setPlaylist(customList);
    }

    setCurrentTrack(item);
    if (audioRef.current) {
      audioRef.current.src = item.audioUrl;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          soundscapeService.incrementPlay(item.id).catch(() => {});
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src && currentTrack) {
        audioRef.current.src = currentTrack.audioUrl;
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying, currentTrack]);

  const handleNext = useCallback(() => {
    if (!playlist || playlist.length === 0) return;
    const currentIdx = playlist.findIndex((s) => s.id === currentTrack?.id);
    const nextIdx = (currentIdx + 1) % playlist.length;
    playSoundscape(playlist[nextIdx]);
  }, [playlist, currentTrack, playSoundscape]);

  const handlePrev = useCallback(() => {
    if (!playlist || playlist.length === 0) return;
    const currentIdx = playlist.findIndex((s) => s.id === currentTrack?.id);
    const prevIdx = (currentIdx - 1 + playlist.length) % playlist.length;
    playSoundscape(playlist[prevIdx]);
  }, [playlist, currentTrack, playSoundscape]);

  const seek = useCallback((time) => {
    if (audioRef.current && Number.isFinite(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setTimer = useCallback((minutes) => {
    setSleepTimer(minutes);
  }, []);

  const toggleMiniPlayer = useCallback(() => {
    setIsMiniPlayerVisible((prev) => !prev);
  }, []);

  const value = {
    playlist,
    setPlaylist,
    currentTrack,
    currentSoundscape: currentTrack,
    isPlaying,
    volume,
    setVolume,
    isLooping,
    setIsLooping,
    duration,
    currentTime,
    sleepTimer,
    setTimer,
    sleepTimeRemaining,
    isMiniPlayerVisible,
    toggleMiniPlayer,
    playSoundscape,
    playTrack: playSoundscape,
    togglePlay,
    handleNext,
    handlePrev,
    seek,
  };

  return <SoundscapeContext.Provider value={value}>{children}</SoundscapeContext.Provider>;
}

export function useSoundscape() {
  const context = useContext(SoundscapeContext);
  if (!context) {
    throw new Error("useSoundscape must be used within a SoundscapeProvider");
  }
  return context;
}

// Alias for backward compatibility
export const useMusic = useSoundscape;
export const MusicProvider = SoundscapeProvider;
export default SoundscapeContext;
