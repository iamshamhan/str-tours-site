"use client";
import { useEffect, useRef, useState } from "react";
export function HeroVideo({
  src,
  pauseLabel,
  playLabel,
}: {
  src: string;
  pauseLabel: string;
  playLabel: string;
}) {
  const ref = useRef<HTMLVideoElement>(null),
    paused = useRef(false),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    const video = ref.current,
      mq = matchMedia("(prefers-reduced-motion: reduce)");
    if (!video) return;
    const update = () => {
      if (mq.matches) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } else {
        video.src = src;
        if (!paused.current) void video.play().catch(() => {});
      }
    };
    update();
    mq.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.pause();
      else if (!mq.matches && !paused.current) void video.play().catch(() => {});
    });
    observer.observe(video);
    return () => {
      mq.removeEventListener("change", update);
      observer.disconnect();
      video.pause();
    };
  }, [src]);
  return (
    <>
      <video
        ref={ref}
        className="hero-video"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        className="hero-video-control"
        onClick={() => {
          if (!ref.current) return;
          paused.current = playing;
          if (playing) ref.current.pause();
          else void ref.current.play().catch(() => {});
        }}
        aria-label={playing ? pauseLabel : playLabel}
      >
        {playing ? "Ⅱ" : "▷"}
      </button>
    </>
  );
}
