import { useState, useEffect } from 'react';

export type DeviceType = 'desktop' | 'small-desktop' | 'small-tablet' | 'tablet' | 'mobile';

/**
 * Custom hook to detect device type based on window width
 * @returns DeviceType - The current device type based on screen width
 */
export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>('mobile');

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 480) {
        setDeviceType('mobile');
      } else if (window.innerWidth < 768) {
        setDeviceType('small-tablet');
      } else if (window.innerWidth < 864) {
        setDeviceType('tablet');
      } else if (window.innerWidth < 1024) {
        setDeviceType('small-desktop');
      } else {
        setDeviceType('desktop');
      }
    }

    // Set initial device type
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup event listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};
