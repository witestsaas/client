'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Download, Gauge } from 'lucide-react';

interface StepMarker {
  name: string;
  status?: string;
}

interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
  steps?: StepMarker[];
}

const SPEED_OPTIONS = [1, 1.5, 2, 3];

export function VideoPlayer({ src, title = 'Test Recording', className = '', steps = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [hoveredStep, setHoveredStep] = useState(-1);

  const stepSegments = useMemo(() => {
    if (!steps.length || !duration) return [];
    const segDur = duration / steps.length;
    return steps.map((_s, i) => ({
      startTime: i * segDur,
      endTime: (i + 1) * segDur,
      startPercent: (i / steps.length) * 100,
      widthPercent: 100 / steps.length,
    }));
  }, [steps, duration]);

  useEffect(() => {
    if (!stepSegments.length) return;
    const idx = stepSegments.findIndex(
      (seg) => currentTime >= seg.startTime && currentTime < seg.endTime,
    );
    setActiveStepIndex(idx === -1 && currentTime >= duration ? steps.length - 1 : idx);
  }, [currentTime, stepSegments, duration, steps.length]);

  const handlePlayPause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause(); else v.play();
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleMuteToggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const cycleSpeed = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const next = SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(playbackRate) + 1) % SPEED_OPTIONS.length];
    v.playbackRate = next;
    setPlaybackRate(next);
  }, [playbackRate]);

  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setCurrentTime(v.currentTime);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
  }, []);

  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setDuration(v.duration);
    v.playbackRate = playbackRate;
  }, [playbackRate]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressBarRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * v.duration;
  }, []);

  const handleStepClick = useCallback((index: number) => {
    const v = videoRef.current;
    if (!v || !stepSegments[index]) return;
    v.currentTime = stepSegments[index].startTime;
    if (!isPlaying) { v.play(); setIsPlaying(true); }
  }, [stepSegments, isPlaying]);

  const handleFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen?.();
  }, []);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = src;
    a.download = `${title.replace(/\s+/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [src, title]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const stepColor = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'passed' || s === 'completed' || s === 'success') return 'bg-green-500';
    if (s === 'failed' || s === 'error') return 'bg-red-500';
    return 'bg-white/40';
  };

  return (
    <div className={`flex flex-col rounded-xl border border-black/8 dark:border-white/10 overflow-hidden bg-[#0d0b1f] dark:bg-[#1a1a2e] ${className}`}>
      {/* Title bar */}
      <div className="flex-shrink-0 px-4 py-2 bg-[#0d0b1f]/80 dark:bg-[#1a1a2e]/80 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-medium text-white/60">{title}</span>
        <button onClick={handleDownload} className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white/70 transition-colors" title="Download video">
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Video */}
      <div className="relative flex-1 min-h-0 bg-[#0d0b1f] flex items-center justify-center">
        <video
          ref={videoRef}
          src={src}
          className="w-full max-h-[55vh] object-contain"
          muted={isMuted}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={handlePlayPause}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={handlePlayPause}>
            <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors backdrop-blur-sm">
              <Play className="h-7 w-7 text-white ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 bg-[#0d0b1f]/90 dark:bg-[#1a1a2e]/90 px-3 pb-2 pt-1.5">
        {/* Progress bar with step dividers */}
        <div ref={progressBarRef} className="relative h-1.5 bg-white/10 rounded-full cursor-pointer mb-2 group" onClick={handleProgressClick}>
          {stepSegments.map((seg, i) => (
            i > 0 ? <div key={i} className="absolute top-0 w-px h-full bg-white/20 z-10" style={{ left: `${seg.startPercent}%` }} /> : null
          ))}
          <div className="absolute top-0 left-0 h-full bg-[#FFAA00] rounded-full transition-[width] duration-100" style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FFAA00] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" style={{ left: `calc(${progress}% - 6px)` }} />
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button onClick={handlePlayPause} className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button onClick={handleMuteToggle} className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <span className="text-[10px] text-white/40 ml-1 font-mono tabular-nums">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={cycleSpeed} className="h-6 px-2 rounded bg-white/[0.08] hover:bg-white/15 text-[10px] font-bold text-white/70 hover:text-[#FFAA00] transition-colors inline-flex items-center gap-1" title="Playback speed">
              <Gauge className="h-3 w-3" />
              {playbackRate}x
            </button>
            <button onClick={handleFullscreen} className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Step timeline */}
      {steps.length > 0 && duration > 0 && (
        <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0d0b1f]/95 dark:bg-[#1a1a2e]/95 px-3 py-2 max-h-[180px] overflow-y-auto">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Steps</span>
            <span className="text-[10px] text-white/25">{steps.length}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {steps.map((step, i) => {
              const seg = stepSegments[i];
              const isActive = i === activeStepIndex;
              const isHov = i === hoveredStep;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleStepClick(i)}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(-1)}
                  className={`flex items-center gap-2 px-2 py-1 rounded-md text-left transition-colors cursor-pointer ${
                    isActive ? 'bg-[#FFAA00]/15 text-[#FFAA00]' : isHov ? 'bg-white/[0.06] text-white/80' : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-[#FFAA00]' : stepColor(step.status)}`} />
                  <span className="text-[10px] font-mono text-white/30 w-8 flex-shrink-0 tabular-nums">
                    {seg ? fmt(seg.startTime) : '--:--'}
                  </span>
                  <span className={`text-[11px] truncate flex-1 ${isActive ? 'font-medium' : ''}`}>{step.name}</span>
                  {isActive && isPlaying && <span className="w-1 h-1 rounded-full bg-[#FFAA00] animate-pulse flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
