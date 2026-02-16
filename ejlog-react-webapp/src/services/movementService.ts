import { apiService } from './api'
import { toEjlogDate } from '../utils/formatters'

/**
 * Movement Service - Gestione movimenti magazzino
 */
export const movementService = {
  /**
   * Get movements with pagination and filters
   * @param {object} params - Query parameters
   * @param {number} params.limit - Limit records
   * @param {number} params.offset - Offset for pagination
   * @param {string} params.itemCode - Item code (optional)
   * @param {number} params.operationType - Operation type (optional): 1-11
   * @param {string} params.numlist - List number (optional)
   * @param {Date|string} params.dateFrom - From date (optional)
   * @param {Date|string} params.dateTo - To date (optional)
   * @returns {Promise<object>} Movements response
   */
  getMovements: async ({
    limit = 50,
    offset = 0,
    itemCode = null,
    operationType = null,
    numlist = null,
    dateFrom = null,
    dateTo = null
  }) => {
    try {
      const params = { limit, offset }
      if (itemCode) params.itemCode = itemCode
      if (operationType) params.operationType = operationType
      if (numlist) params.numlist = numlist

      // Convert dates to EjLog format (yyyyMMddHHmmss)
      if (dateFrom) {
        params.dateFrom = typeof dateFrom === 'string'
          ? dateFrom
          : toEjlogDate(dateFrom)
      }
      if (dateTo) {
        params.dateTo = typeof dateTo === 'string'
          ? dateTo
          : toEjlogDate(dateTo)
      }

      const response = await apiService.get('/Movements', params)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Get movements for specific item
   * @param {string} itemCode - Item code
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Movements for item
   */
  getMovementsForItem: async (itemCode, limit = 100) => {
    try {
      const response = await movementService.getMovements({ limit, itemCode })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get movements for specific list
   * @param {string} listNumber - List number
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Movements for list
   */
  getMovementsForList: async (listNumber, limit = 100) => {
    try {
      const response = await movementService.getMovements({ limit, numlist: listNumber })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get movements by operation type
   * @param {number} operationType - Operation type (1-11)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Movements by type
   */
  getMovementsByType: async (operationType, limit = 100) => {
    try {
      const response = await movementService.getMovements({ limit, operationType })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get movements for date range
   * @param {Date} fromDate - Start date
   * @param {Date} toDate - End date
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Movements in date range
   */
  getMovementsByDateRange: async (fromDate, toDate, limit = 100) => {
    try {
      const response = await movementService.getMovements({
        limit,
        dateFrom: fromDate,
        dateTo: toDate
      })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get today's movements
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Today's movements
   */
  getTodayMovements: async (limit = 100) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      return await movementService.getMovementsByDateRange(today, tomorrow, limit)
    } catch (error) {
      throw error
    }
  },

  /**
   * Get inbound movements (carico, versamento, etc.)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Inbound movements
   */
  getInboundMovements: async (limit = 100) => {
    try {
      // Operation types: 1=Carico, 7=Versamento
      const loadMovements = await movementService.getMovementsByType(1, limit / 2)
      const storageMovements = await movementService.getMovementsByType(7, limit / 2)

      return [...loadMovements, ...storageMovements]
        .sort((a, b) => new Date(b.movementDate) - new Date(a.movementDate))
    } catch (error) {
      throw error
    }
  },

  /**
   * Get outbound movements (scarico, prelievo, etc.)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Outbound movements
   */
  getOutboundMovements: async (limit = 100) => {
    try {
      // Operation types: 2=Scarico, 6=Prelievo, 8=Picking
      const unloadMovements = await movementService.getMovementsByType(2, limit / 3)
      const pickingMovements = await movementService.getMovementsByType(6, limit / 3)
      const pickMovements = await movementService.getMovementsByType(8, limit / 3)

      return [...unloadMovements, ...pickingMovements, ...pickMovements]
        .sort((a, b) => new Date(b.movementDate) - new Date(a.movementDate))
    } catch (error) {
      throw error
    }
  },
}

export default movementService
