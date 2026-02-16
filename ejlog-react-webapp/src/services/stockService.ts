import { apiService } from './api'

/**
 * Stock Service - Gestione giacenze
 */
export const stockService = {
  /**
   * Get stock with pagination and filters
   * @param {object} params - Query parameters
   * @param {number} params.limit - Limit records
   * @param {number} params.offset - Offset for pagination
   * @param {number} params.idMagazzino - Warehouse ID (optional)
   * @param {string} params.itemCode - Item code (optional)
   * @param {string} params.lot - Lot number (optional)
   * @param {string} params.serialNumber - Serial number (optional)
   * @param {string} params.expiryDate - Expiry date in yyyyMMdd format (optional)
   * @param {number} params.idUdc - UDC ID (optional)
   * @returns {Promise<object>} Stock response
   */
  getStock: async ({
    limit = 50,
    offset = 0,
    idMagazzino = null,
    itemCode = null,
    lot = null,
    serialNumber = null,
    expiryDate = null,
    idUdc = null
  }) => {
    try {
      const params = { limit, offset }
      if (idMagazzino) params.idMagazzino = idMagazzino
      if (itemCode) params.itemCode = itemCode
      if (lot) params.lot = lot
      if (serialNumber) params.serialNumber = serialNumber
      if (expiryDate) params.expiryDate = expiryDate
      if (idUdc) params.idUdc = idUdc

      const response = await apiService.get('/Stock', params)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Get stock for specific item
   * @param {string} itemCode - Item code
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Stock records for item
   */
  getStockForItem: async (itemCode, limit = 100) => {
    try {
      const response = await stockService.getStock({ limit, itemCode })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get stock by warehouse
   * @param {number} idMagazzino - Warehouse ID
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Stock records for warehouse
   */
  getStockByWarehouse: async (idMagazzino, limit = 100) => {
    try {
      const response = await stockService.getStock({ limit, idMagazzino })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get stock by lot
   * @param {string} lot - Lot number
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Stock records for lot
   */
  getStockByLot: async (lot, limit = 100) => {
    try {
      const response = await stockService.getStock({ limit, lot })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get stock expiring soon
   * @param {string} beforeDate - Expiry date threshold (yyyyMMdd)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Expiring stock records
   */
  getExpiringStock: async (beforeDate, limit = 100) => {
    try {
      const response = await stockService.getStock({ limit, expiryDate: beforeDate })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Calculate total quantity for item across all warehouses
   * @param {string} itemCode - Item code
   * @returns {Promise<number>} Total quantity
   */
  getTotalQuantityForItem: async (itemCode) => {
    try {
      const stocks = await stockService.getStockForItem(itemCode, 1000)
      return stocks.reduce((total, stock) => total + (stock.quantity || 0), 0)
    } catch (error) {
      throw error
    }
  },
}

export default stockService
