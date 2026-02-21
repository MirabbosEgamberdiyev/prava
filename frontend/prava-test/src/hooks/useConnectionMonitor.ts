import { useState, useEffect, useCallback } from "react";

/**
 * Hook to monitor online/offline status.
 * Returns { isOnline, wasOffline } for showing reconnection notifications.
 */
export function useConnectionMonitor() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (!navigator.onLine) return;
    setWasOffline(true);
    // Reset wasOffline after 5 seconds
    setTimeout(() => setWasOffline(false), 5000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}
