/**
 * Hook for detecting mobile devices
 *
 * Detects if the user is on a mobile device based on screen width.
 * Updates on window resize to handle orientation changes.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-16
 */

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // px

/**
 * Hook to detect if user is on mobile device
 *
 * @returns boolean - true if mobile, false if desktop
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Check on mount
    checkIsMobile();

    // Listen for resize events
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}
