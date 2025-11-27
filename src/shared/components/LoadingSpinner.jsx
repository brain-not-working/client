import React, { useEffect, useRef, useState } from "react";
import { Loader } from "lucide-react";

/**
 * Props:
 *  - loading (boolean)
 *  - fullscreen (boolean)
 *  - minVisibleMs (number)
 *  - fadeMs (number)
 *  - text (string)        : optional text next to the loader
 *  - textClass (string)   : optional class for customizing text
 */
const LoadingSpinner = ({
  loading = true,
  fullscreen = false,
  minVisibleMs = 1500,
  fadeMs = 700,

  // NEW
  text = "",
  textClass = "",
}) => {
  const [render, setRender] = useState(loading);
  const [fadingOut, setFadingOut] = useState(false);
  const startRef = useRef(0);
  const hideTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    if (!fullscreen) return;
    if (render) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [render, fullscreen]);

  useEffect(() => {
    const clearAll = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };

    if (loading) {
      clearAll();
      setFadingOut(false);
      if (!render) setRender(true);
      startRef.current = startRef.current || Date.now();
      return;
    }

    const elapsed = Date.now() - (startRef.current || Date.now());
    const remainingMin = Math.max(0, minVisibleMs - elapsed);

    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setFadingOut(true);

      fadeTimerRef.current = setTimeout(() => {
        fadeTimerRef.current = null;
        setFadingOut(false);
        setRender(false);
        startRef.current = 0;
      }, fadeMs);
    }, remainingMin);

    return clearAll;
  }, [loading, minVisibleMs, fadeMs]);

  if (!render) return null;

  const overlayClass = fadingOut ? "ls-fade-out" : "ls-fade-in";

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={`${
          fullscreen ? "fixed inset-0 z-50" : "w-full min-h-[calc(80vh-10rem)]"
        } flex items-center justify-center  pointer-events-auto ${overlayClass}`}
        style={{ transition: `opacity ${fadeMs}ms ease` }}
      >
        {/* FLEX ROW: LOADER + TEXT */}
        <div className="flex items-center space-x-3">
          <Loader
            className={`${
              text ? "w-8 h-8" : "w-12 h-12"
            } text-green-600 animate-spin`}
          />

          {text && (
            <span className={`text-gray-700 text-lg font-medium ${textClass}`}>
              {text}
            </span>
          )}
        </div>
      </div>

      <style jsx="true">{`
        .ls-fade-in {
          opacity: 1;
        }
        .ls-fade-out {
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default LoadingSpinner;
