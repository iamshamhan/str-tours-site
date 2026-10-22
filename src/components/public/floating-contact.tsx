"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";

export function FloatingContact({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const [clearance, setClearance] = useState(12);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      let bottom = 12;
      // Lift the shortcut above visible fixed panels instead of hiding behind content.
      document
        .querySelectorAll(".mobile-booking-bar,.cookie-notice,.map-route-sheet,.map-detail-sheet")
        .forEach((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          if (
            element.getAttribute("data-obscured") !== "true" &&
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            rect.right > innerWidth - (innerWidth >= 768 ? 364 : 76) &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.top < innerHeight
          ) {
            bottom = Math.max(bottom, innerHeight - rect.top + 12);
          }
        });
      setClearance(bottom);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-obscured", "open", "class"],
    });
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <a
      className="whatsapp-float"
      style={{ "--contact-clearance": `${clearance}px` } as CSSProperties}
      aria-label={label}
      title={label}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="whatsapp-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.4-4.8a8.5 8.5 0 1 1 16.1-4.1Z"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
          <path
            d="M8 7.5c-.6 0-1.1.8-1 1.8.3 3.4 3 6.1 6.5 6.7 1 .2 2-.4 2.2-1.1l.3-.9-2.3-1.1-.9 1c-1.5-.6-2.7-1.8-3.3-3.2l.9-.9-1-2.3H8Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="whatsapp-copy">{label}</span>
      <svg className="whatsapp-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M5 15 15 5M5 5h10v10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
