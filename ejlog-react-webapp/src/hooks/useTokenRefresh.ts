/**
 * Token Auto-Refresh Hook
 *
 * Automatically refreshes access token when it's about to expire
 * Checks every 5 minutes if token is expiring soon (within 30 minutes)
 *
 * @author Elio (Full-Stack Architect)
 * @date 2025-12-09
 * @version 1.0.0
 */

import { useEffect, useRef } from 'react'
import { authService } from '../services/authService'

const CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes

export function useTokenRefresh() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    const checkAndRefresh = async () => {
      // Skip if already refreshing
      if (isRefreshingRef.current) {
        return
      }

      // Skip if not authenticated
      if (!authService.isAuthenticated()) {
        return
      }

      // Check if token is expiring soon
      if (authService.isTokenExpiringSoon()) {
        console.log('🔄 Token expiring soon, refreshing...')

        try {
          isRefreshingRef.current = true
          await authService.refreshToken()
          console.log('✅ Token refreshed successfully')
        } catch (error) {
          console.error('❌ Token refresh failed:', error)
          // authService.refreshToken() already handles logout on failure
        } finally {
          isRefreshingRef.current = false
        }
      }
    }

    // Initial check
    checkAndRefresh()

    // Setup interval
    intervalRef.current = setInterval(checkAndRefresh, CHECK_INTERVAL)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
}

export default useTokenRefresh
