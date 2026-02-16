import { useState, useEffect } from 'react';

/**
 * Badge State Type
 */
interface BadgeState {
  notifications: number;
  [key: string]: number;
}

/**
 * Custom Hook Return Type
 */
interface UseMenuBadgesReturn {
  badges: BadgeState;
  updateBadge: (menuItemId: string, count: number) => void;
  resetBadge: (menuItemId: string) => void;
}

/**
 * Custom Hook for Menu Badges
 *
 * This hook manages dynamic badge counts for menu items.
 * Currently supports notifications count.
 *
 * Usage in Sidebar:
 * ```tsx
 * const { badges } = useMenuBadges();
 * // Apply badges to menuConfig before rendering
 * ```
 */
export const useMenuBadges = (): UseMenuBadgesReturn => {
  const [badges, setBadges] = useState<BadgeState>({
    notifications: 0,
  });

  useEffect(() => {
    // TODO: Connect to notifications API or WebSocket
    // Example: Fetch unread notifications count
    const fetchNotificationsCount = async () => {
      try {
        // const response = await notificationsApi.getUnreadCount();
        // setBadges(prev => ({ ...prev, notifications: response.count }));

        // Placeholder for now
        setBadges(prev => ({ ...prev, notifications: 0 }));
      } catch (error) {
        console.error('Error fetching notifications count:', error);
      }
    };

    fetchNotificationsCount();

    // Poll every 30 seconds or use WebSocket for real-time updates
    const interval = setInterval(fetchNotificationsCount, 30000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Update badge count for a specific menu item
   */
  const updateBadge = (menuItemId: string, count: number): void => {
    setBadges(prev => ({ ...prev, [menuItemId]: count }));
  };

  /**
   * Reset badge count for a specific menu item
   */
  const resetBadge = (menuItemId: string): void => {
    setBadges(prev => ({ ...prev, [menuItemId]: 0 }));
  };

  return {
    badges,
    updateBadge,
    resetBadge,
  };
};

export default useMenuBadges;
