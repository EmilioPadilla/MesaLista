import { useCallback, useEffect, useState } from 'react';

/**
 * Keeps a Component mounted until afterClose fires, so that its close animation can complete.
 *
 * @returns
 *  - isOpen: the initial open state of the Component
 *  - setIsOpen: function to set the Component open state
 *  - shouldRender: true if the Component should be rendered
 *  - handleAfterClose: wire this into your Component afterClose prop. This will be called when the Component is closed.
 */
export function useComponentMountControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // When opening, ensure the Component is mounted
  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  // Once afterClose fires, unmount the Component
  const handleAfterClose = useCallback(() => {
    setShouldRender(false);
  }, []);

  return { isOpen, setIsOpen, shouldRender, handleAfterClose };
}
