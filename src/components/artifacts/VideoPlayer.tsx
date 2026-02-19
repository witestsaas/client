'use client';

import { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Download } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export function VideoPlayer({ src, title = 'Test Recording', className = '' }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useState<HTMLVideoElement | null>(null);

  const handlePlayPause = () => {
    const video = document.getElementById('artifact-video') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    const video = document.getElementById('artifact-video') as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = document.getElementById('artifact-video') as HTMLVideoElement;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    if (video) {
      video.currentTime = clickPosition * video.duration;
    }
  };

  const handleFullscreen = () => {
    const video = document.getElementById('artifact-video') as HTMLVideoElement;
    if (video) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title.replace(/\s+/g, '-')}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Video title */}
      <div className="flex-shrink-0 px-4 py-2 bg-muted border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-card-foreground">{title}</span>
        <button
          onClick={handleDownload}
          className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-accent-foreground"
          title="Download video"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
      
      {/* Video element - flexible container that fills available space */}
      <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center">
        <video
          id="artifact-video"
          src={src}
          className="max-w-full max-h-full w-auto h-auto object-contain"
          muted={isMuted}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={handlePlayPause}
        />
        
        {/* Play button overlay when paused */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={handlePlayPause}
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <Play className="h-8 w-8 text-white ml-1" />
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-gray-800">
        {/* Progress bar */}
        <div 
          className="h-1 bg-gray-300 dark:bg-gray-600 rounded cursor-pointer mb-2"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-blue-500 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-white"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={handleMuteToggle}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-white"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <button
            onClick={handleFullscreen}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-white"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
