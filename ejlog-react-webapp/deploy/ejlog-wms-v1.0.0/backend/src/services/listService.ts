import { apiService } from './api'

/**
 * List Service - Gestione liste (picking, stoccaggio, inventario)
 */
export const listService = {
  /**
   * Get lists with pagination and filters
   * @param {object} params - Query parameters
   * @param {number} params.limit - Limit records
   * @param {number} params.offset - Offset for pagination
   * @param {string} params.listNumber - Filter by list number (optional)
   * @param {number} params.listType - Filter by list type (optional): 0=Prelievo, 1=Versamento, 2=Inventario
   * @param {number} params.listStatus - Filter by list status (optional): 1=Attiva, 2=Chiusa
   * @returns {Promise<object>} Lists response
   */
  getLists: async ({ limit = 50, offset = 0, listNumber = null, listType = null, listStatus = null }) => {
    try {
      const params = { limit, offset }
      if (listNumber) params.listNumber = listNumber
      if (listType !== null && listType !== undefined) params.listType = listType
      if (listStatus !== null && listStatus !== undefined) params.listStatus = listStatus

      const response = await apiService.get('/Lists', params)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Import/Create lists
   * @param {Array} lists - Array of lists to import
   * @returns {Promise<object>} Import response
   */
  importLists: async (lists) => {
    try {
      const response = await apiService.post('/Lists', lists)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Get single list by number
   * @param {string} listNumber - List number
   * @returns {Promise<object>} List data
   */
  getList: async (listNumber) => {
    try {
      const response = await listService.getLists({ limit: 1, listNumber })
      return response.exported && response.exported.length > 0
        ? response.exported[0]
        : null
    } catch (error) {
      throw error
    }
  },

  /**
   * Send view list (liste in visione)
   * @param {Array} viewLists - Array of view lists
   * @returns {Promise<object>} Response
   */
  sendViewLists: async (viewLists) => {
    try {
      const response = await apiService.post('/Lists/ViewList', viewLists)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Get active lists
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Active lists
   */
  getActiveLists: async (limit = 50) => {
    try {
      const response = await listService.getLists({ limit, listStatus: 1 })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get picking lists (type 0)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Picking lists
   */
  getPickingLists: async (limit = 50) => {
    try {
      const response = await listService.getLists({ limit, listType: 0 })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get storage lists (type 1)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Storage lists
   */
  getStorageLists: async (limit = 50) => {
    try {
      const response = await listService.getLists({ limit, listType: 1 })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },

  /**
   * Get inventory lists (type 2)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Inventory lists
   */
  getInventoryLists: async (limit = 50) => {
    try {
      const response = await listService.getLists({ limit, listType: 2 })
      return response.exported || []
    } catch (error) {
      throw error
    }
  },
}

export default listService
