import { apiService } from './api'

/**
 * Item Service - Gestione articoli
 */
export const itemService = {
  /**
   * Get items list with pagination
   * @param {object} params - Query parameters
   * @param {number} params.limit - Limit records
   * @param {number} params.offset - Offset for pagination
   * @param {string} params.itemCode - Filter by item code (optional)
   * @returns {Promise<object>} Items response
   */
  getItems: async ({ limit = 50, offset = 0, itemCode = null }) => {
    try {
      const params = { limit, offset }
      if (itemCode) params.itemCode = itemCode

      const response = await apiService.get('/Items', params)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Import/Create items
   * @param {Array} items - Array of items to import
   * @returns {Promise<object>} Import response
   */
  importItems: async (items) => {
    try {
      const response = await apiService.post('/Items', items)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Get single item by code
   * @param {string} itemCode - Item code
   * @returns {Promise<object>} Item data
   */
  getItem: async (itemCode) => {
    try {
      const response = await itemService.getItems({ limit: 1, itemCode })
      return response.exported && response.exported.length > 0
        ? response.exported[0]
        : null
    } catch (error) {
      throw error
    }
  },

  /**
   * Search items by partial code or description
   * @param {string} searchTerm - Search term
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Matching items
   */
  searchItems: async (searchTerm, limit = 20) => {
    try {
      // Note: API doesn't support text search, so we get all and filter client-side
      // In production, implement server-side search
      const response = await itemService.getItems({ limit: 100, offset: 0 })

      if (!response.exported) return []

      const term = searchTerm.toLowerCase()
      return response.exported
        .filter(item =>
          item.itemCode?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term)
        )
        .slice(0, limit)
    } catch (error) {
      throw error
    }
  },
}

export default itemService
