import { apiService } from './api'

/**
 * Order Service - Gestione commesse/ordini
 */
export const orderService = {
  /**
   * Get orders with pagination and filters
   * @param {object} params - Query parameters
   * @param {number} params.limit - Limit records
   * @param {number} params.offset - Offset for pagination
   * @param {string} params.order - Filter by order number (optional)
   * @returns {Promise<object>} Orders response
   */
  getOrders: async ({ limit = 50, offset = 0, order = null }) => {
    try {
      const params = { limit, offset }
      if (order) params.order = order

      const response = await apiService.get('/Orders', params)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Import/Create orders
   * @param {Array} orders - Array of orders to import
   * @returns {Promise<object>} Import response
   */
  importOrders: async (orders) => {
    try {
      const response = await apiService.post('/Orders', orders)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Get single order by number
   * @param {string} orderNumber - Order number
   * @returns {Promise<object>} Order data
   */
  getOrder: async (orderNumber) => {
    try {
      const response = await orderService.getOrders({ limit: 1, order: orderNumber })
      return response.exported && response.exported.length > 0
        ? response.exported[0]
        : null
    } catch (error) {
      throw error
    }
  },
}

export default orderService
