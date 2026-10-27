import { useEffect, useState } from "react";
import { isFestive, LAUNCH } from "../data/catalog.js";

/** Days/hours/minutes/seconds remaining until an ISO date, ticking every second. */
export function useCountdown(iso) {
  const target = Date.parse(iso);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, target - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return matches;
}

/** Whether the Dhanteras theme is on; flips off by itself at the end of the festive window. */
export function useFestive() {
  const [on, setOn] = useState(() => isFestive());
  const [check, setCheck] = useState(0);
  useEffect(() => {
    if (!on) return;
    // setTimeout can't wait longer than ~24.8 days, so wait at most a day and check again.
    const ms = Math.min(Date.parse(LAUNCH.festiveUntil) - Date.now(), 86_400_000);
    const t = setTimeout(() => {
      setOn(isFestive());
      setCheck((n) => n + 1);
    }, Math.max(0, ms));
    return () => clearTimeout(t);
  }, [on, check]);
  return on;
}

export const pad = (n) => String(n).padStart(2, "0");
