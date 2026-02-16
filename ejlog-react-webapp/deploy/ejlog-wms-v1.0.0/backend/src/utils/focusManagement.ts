// ==============================================================================
// EJLOG WMS - Focus Management Utilities
// Utilities for managing focus in accessible web applications
// ==============================================================================

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
};

/**
 * Trap focus within a container (for modals, dropdowns, dialogs)
 * Returns cleanup function
 *
 * @example
 * const cleanup = trapFocus(modalElement);
 * // When closing modal:
 * cleanup();
 */
export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    console.warn('[Focus Trap] No focusable elements found in container');
    return () => {};
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Focus first element on mount
  firstElement.focus();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab: moving backward
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: moving forward
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Focus Manager - Save and restore focus
 * Useful for modals, dialogs, and temporary UI overlays
 *
 * @example
 * const focusManager = createFocusManager();
 *
 * // Before opening modal:
 * focusManager.save();
 *
 * // After closing modal:
 * focusManager.restore();
 */
export const createFocusManager = () => {
  let previousFocus: HTMLElement | null = null;

  return {
    /**
     * Save currently focused element
     */
    save: () => {
      previousFocus = document.activeElement as HTMLElement;
    },

    /**
     * Restore focus to previously saved element
     */
    restore: () => {
      if (previousFocus && typeof previousFocus.focus === 'function') {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          previousFocus?.focus();
        }, 0);
      }
    },

    /**
     * Clear saved focus reference
     */
    clear: () => {
      previousFocus = null;
    },
  };
};

/**
 * Focus first element in container
 */
export const focusFirstElement = (container: HTMLElement): void => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
};

/**
 * Focus element by selector within container
 * Falls back to first focusable element if selector not found
 */
export const focusElement = (
  container: HTMLElement,
  selector: string
): void => {
  const element = container.querySelector<HTMLElement>(selector);

  if (element && typeof element.focus === 'function') {
    element.focus();
  } else {
    // Fallback to first focusable element
    focusFirstElement(container);
  }
};

/**
 * Check if element is currently focused
 */
export const isFocused = (element: HTMLElement): boolean => {
  return document.activeElement === element;
};

/**
 * Focus visible elements only (skip hidden elements)
 */
export const focusFirstVisibleElement = (container: HTMLElement): void => {
  const focusableElements = getFocusableElements(container);

  for (const element of focusableElements) {
    const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
    if (isVisible) {
      element.focus();
      break;
    }
  }
};

/**
 * Create a React Hook for focus management
 * For use in functional components
 *
 * @example
 * const { save, restore } = useFocusManager();
 *
 * useEffect(() => {
 *   if (isModalOpen) {
 *     save();
 *     return () => restore();
 *   }
 * }, [isModalOpen]);
 */
export const useFocusManager = () => {
  // For React integration
  const manager = createFocusManager();
  return manager;
};

/**
 * React Hook for focus trap
 *
 * @example
 * const containerRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(containerRef, isOpen);
 */
export const useFocusTrap = (
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean
) => {
  // Implementation would use useEffect
  // This is a TypeScript-compatible signature
  // Actual React implementation would be in a separate .tsx file
};

/**
 * Skip to main content utility
 * For implementing "Skip to Main Content" links
 *
 * @example
 * <a href="#main-content" onClick={skipToMainContent}>
 *   Skip to main content
 * </a>
 */
export const skipToMainContent = (mainContentId: string = 'main-content') => {
  const mainContent = document.getElementById(mainContentId);

  if (mainContent) {
    mainContent.setAttribute('tabindex', '-1');
    mainContent.focus();

    // Remove tabindex after focusing
    setTimeout(() => {
      mainContent.removeAttribute('tabindex');
    }, 100);
  }
};

/**
 * Keyboard navigation helper
 * Handles arrow key navigation in lists/menus
 *
 * @example
 * <ul onKeyDown={createArrowKeyHandler(items, activeIndex, setActiveIndex)}>
 */
export const createArrowKeyHandler = (
  items: HTMLElement[],
  currentIndex: number,
  onIndexChange: (index: number) => void
) => {
  return (e: KeyboardEvent) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = (currentIndex - 1 + items.length) % items.length;
        break;

      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;

      default:
        return; // Don't update for other keys
    }

    onIndexChange(newIndex);
    items[newIndex]?.focus();
  };
};

/**
 * Focus utilities export
 */
export default {
  getFocusableElements,
  trapFocus,
  createFocusManager,
  focusFirstElement,
  focusElement,
  isFocused,
  focusFirstVisibleElement,
  skipToMainContent,
  createArrowKeyHandler,
};
