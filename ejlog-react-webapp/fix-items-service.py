import re

with open('src/services/api/items.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the return statement
old_pattern = r'      const response = await apiClient\.get\(API_ENDPOINTS\.ITEMS, \{ params \}\);\n      return response\.data;'

new_code = '''      const response = await apiClient.get(API_ENDPOINTS.ITEMS, { params });

      // Transform backend response to match frontend expectations
      const backendData = response.data;
      return {
        items: (backendData.exported || []).map(item => ({
          // Map backend field names to Italian frontend field names
          codice: item.code,
          descrizione: item.description,
          descrizioneBreve: item.shortDescription,
          barcode: item.barcode,
          um: item.measurementUnit,
          peso: item.weight,
          giacenzaMinima: item.minimumStock,
          altezza: item.height,
          larghezza: item.width,
          profondita: item.depth,
          prezzoUnitario: item.unitPrice,
          tipoGestioneArticolo: item.itemTypeManagement,
          categoriaDesc: item.itemCategory,
          fifoRangeDays: item.fifoRangeDays,
          giacenza: item.inStock ? 1 : 0,
          sottoscorta: item.understock,
          tipoBatch: item.itemTypeBatch,
          tipoSeriale: item.itemTypeSerialNumber,
          // Keep original fields too for compatibility
          code: item.code,
          description: item.description,
          shortDescription: item.shortDescription,
          inStock: item.inStock,
          understock: item.understock,
          itemTypeBatch: item.itemTypeBatch,
          itemTypeSerialNumber: item.itemTypeSerialNumber,
        })),
        totalCount: backendData.recordNumber || 0,
        result: backendData.result,
        message: backendData.message,
      };'''

content = re.sub(old_pattern, new_code, content)

with open('src/services/api/items.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully!")
