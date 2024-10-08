import { useEffect, useMemo, useRef, useState } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import throttle from "lodash.throttle";

/**
 * A custom hook that handles the state for the timer
 */
export const useTimer = ({
  initialTimeInMs = 0,
  onFinish = () => null,
  mode = "stopwatch",
  intervalMs = 16,
}: {
  initialTimeInMs?: number;
  onFinish?: () => void;
  mode?: "timer" | "stopwatch";
  intervalMs?: number;
}) => {
  const direction = mode === "timer" ? -1 : 1;
  const [elapsedInMs, setElapsedInMs] = useState(0);
  const startTime = useRef<number | null>(null);
  const pausedTime = useRef<number | null>(null);
  const intervalId = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const throttledOnFinish = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    () => throttle(onFinish, 100, { trailing: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    // Ensure that the timer is reset when the initialTimeInMs changes
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTimeInMs]);

  useEffect(() => {
    // Checking if it's a timer and it reached 0
    if (mode === "timer" && elapsedInMs >= initialTimeInMs) {
      removeInterval();
      setElapsedInMs(initialTimeInMs);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      throttledOnFinish();
    }
  }, [elapsedInMs, initialTimeInMs, mode, throttledOnFinish]);

  function getSnapshot() {
    return Math.abs(initialTimeInMs + elapsedInMs * direction);
  }

  function play() {
    // Already playing, returning early
    if (intervalId.current) {
      return;
    }
    // Timer mode and it reached 0, returning early
    if (elapsedInMs === initialTimeInMs && mode === "timer") {
      return;
    }
    // First time playing, recording the start time
    if (!startTime.current) {
      startTime.current = Date.now();
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    intervalId.current = setInterval(() => {
      if (!pausedTime.current) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setElapsedInMs(Date.now() - startTime.current!);
      } else {
        // If the timer is paused, we need to update the start time
        const elapsedSincePaused = Date.now() - pausedTime.current;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        startTime.current = startTime.current! + elapsedSincePaused;
        pausedTime.current = null;
      }
    }, intervalMs);
  }

  function resetState() {
    setElapsedInMs(0);
    startTime.current = null;
    pausedTime.current = null;
  }

  function removeInterval() {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }

  function pause() {
    removeInterval();
    if (!pausedTime.current && elapsedInMs > 0) {
      pausedTime.current = Date.now();
    }
    return getSnapshot();
  }

  function reset() {
    removeInterval();
    resetState();
  }

  const countInSeconds = Math.floor(getSnapshot() / 1000);

  return {
    tensOfMs: Math.floor(getSnapshot() / 10) % 100,
    lastDigit: countInSeconds % 10,
    tens: Math.floor(countInSeconds / 10) % 6,
    minutes: Math.floor(countInSeconds / 60),
    play,
    pause,
    reset,
    getSnapshot,
  };
};
