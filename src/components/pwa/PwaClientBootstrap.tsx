"use client";

import { useEffect } from "react";

export function PwaClientBootstrap() {
  useEffect(() => {
    const register = () => {
      void navigator.serviceWorker.register("/sw.js");
    };
    if ("serviceWorker" in navigator) {
      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register, { once: true });
      }
    }

    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
