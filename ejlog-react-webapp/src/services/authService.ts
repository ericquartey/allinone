import { apiService } from './api'

const TOKEN_STORAGE_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ejlog_auth_token'
const REFRESH_TOKEN_STORAGE_KEY = 'ejlog_refresh_token'
const USER_STORAGE_KEY = 'ejlog_user_data'

/**
 * Authentication Service
 */
export const authService = {
  /**
   * User login
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<object>} Login response with token and user data
   */
  login: async (username, password) => {
    try {
      // Nuovo endpoint di autenticazione con JSON body
      const response = await apiService.post('/auth/login', {
        username,
        password
      })

      const data = response.data

      // Save token, refresh token and user data
      if (data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token)

        // Save refresh token if present
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken)
        }

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
          username: data.user?.username || data.username,
          tokenId: data.tokenId,
          expiresIn: data.expiresIn,
          accessLevel: data.user?.groupLevel || data.accessLevel,
          groupName: data.user?.groupName,
          loginTime: new Date().toISOString(),
        }))
      }

      return data
    } catch (error) {
      throw error
    }
  },

  /**
   * User logout
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)

      // Call logout endpoint to revoke refresh token
      if (refreshToken) {
        await apiService.post('/auth/logout', { refreshToken })
      }
    } catch (error) {
      // Logout even if API call fails
      console.error('Logout API error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  },

  /**
   * Get current user data from storage
   * @returns {object|null} User data or null
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem(USER_STORAGE_KEY)
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch (error) {
      return null
    }
  },

  /**
   * Get current auth token
   * @returns {string|null} Token or null
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated: () => {
    const token = authService.getToken()
    const user = authService.getCurrentUser()

    if (!token || !user) return false

    // Check if token is expired
    const loginTime = new Date(user.loginTime)
    const expiresIn = user.expiresIn || 3600 // default 1 hour
    const expirationTime = new Date(loginTime.getTime() + expiresIn * 1000)

    if (new Date() > expirationTime) {
      // Token expired - clear storage
      authService.logout()
      return false
    }

    return true
  },

  /**
   * Get user info from API
   * @param {string} username - Username (optional, defaults to current user)
   * @returns {Promise<object>} User info
   */
  getUserInfo: async (username = null) => {
    try {
      const params = username ? { username } : {}
      const response = await apiService.get('/User', params)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Check if user has specific access level
   * @param {string} requiredLevel - Required access level
   * @returns {boolean} True if user has access
   */
  hasAccessLevel: (requiredLevel) => {
    const user = authService.getCurrentUser()
    if (!user || !user.accessLevel) return false

    // Define access level hierarchy
    const levels = {
      'ADMIN': 3,
      'SUPERVISOR': 2,
      'OPERATOR': 1,
      'GUEST': 0,
    }

    const userLevel = levels[user.accessLevel] || 0
    const required = levels[requiredLevel] || 0

    return userLevel >= required
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise<object>} New token data
   */
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
      if (!refreshToken) {
        throw new Error('No refresh token found')
      }

      const response = await apiService.post('/auth/refresh', { refreshToken })
      const data = response.data

      // Update tokens
      if (data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      }

      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken)
      }

      // Update login time
      const user = authService.getCurrentUser()
      if (user) {
        user.loginTime = new Date().toISOString()
        user.expiresIn = data.expiresIn || user.expiresIn
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
      }

      return data
    } catch (error) {
      // If refresh fails, logout
      console.error('Token refresh failed:', error)
      await authService.logout()
      throw error
    }
  },

  /**
   * Get refresh token from storage
   * @returns {string|null} Refresh token or null
   */
  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  },

  /**
   * Check if token is expiring soon (within 30 minutes)
   * @returns {boolean} True if token is expiring soon
   */
  isTokenExpiringSoon: () => {
    const user = authService.getCurrentUser()
    if (!user || !user.loginTime) return false

    const loginTime = new Date(user.loginTime)
    const expiresIn = user.expiresIn || 28800 // default 8 hours
    const expirationTime = new Date(loginTime.getTime() + expiresIn * 1000)
    const now = new Date()

    // Check if expiring within 30 minutes
    const minutesUntilExpiry = (expirationTime.getTime() - now.getTime()) / (60 * 1000)
    return minutesUntilExpiry < 30 && minutesUntilExpiry > 0
  },
}

export default authService
