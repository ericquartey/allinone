import { apiService } from './api'

/**
 * Barcode Service - Gestione barcode
 */
export const barcodeService = {
  /**
   * Get barcodes list with pagination
   * @param {object} params - Query parameters
   * @param {number} params.limit - Limit records
   * @param {number} params.offset - Offset for pagination
   * @param {string} params.itemCode - Filter by item code (optional)
   * @returns {Promise<object>} Barcodes response
   */
  getBarcodes: async ({ limit = 50, offset = 0, itemCode = null }) => {
    try {
      const params = { limit, offset }
      if (itemCode) params.itemCode = itemCode

      const response = await apiService.get('/Barcodes', params)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Import/Create barcodes
   * @param {Array} barcodes - Array of barcodes to import
   * @returns {Promise<object>} Import response
   */
  importBarcodes: async (barcodes) => {
    try {
      const response = await apiService.post('/Barcodes', barcodes)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Get barcodes for specific item
   * @param {string} itemCode - Item code
   * @returns {Promise<Array>} Barcodes for item
   */
  getBarcodesForItem: async (itemCode) => {
    try {
      const response = await barcodeService.getBarcodes({ limit: 100, itemCode })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Search barcode
   * @param {string} barcodeValue - Barcode value to search
   * @returns {Promise<object>} Barcode data
   */
  searchBarcode: async (barcodeValue) => {
    try {
      // Get all barcodes and filter (improve with server-side search in production)
      const response = await barcodeService.getBarcodes({ limit: 100 })

      if (!response.exported) return null

      const found = response.exported.find(b => b.barcode === barcodeValue)
      return found || null
    } catch (error) {
      throw error
    }
  },
}

export default barcodeService
