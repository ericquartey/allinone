// ============================================================================
// EJLOG WMS - Product Images Page
// Gestione Immagini Prodotti con upload, visualizzazione e gestione
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Image as ImageIcon, Upload, Trash2, Star, Search, RefreshCw } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Spinner from '../../components/shared/Spinner';

// Types based on backend API
interface ProductImage {
  id: number;
  itemCode: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isPrimary: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  uploadedBy?: string;
  uploadedDate?: string;
  plantId?: number;
}

interface ImageWithItem extends ProductImage {
  itemDescription?: string;
}

const ProductImagesPage: React.FC = () => {
  // State
  const [images, setImages] = useState<ImageWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingItemCode, setUploadingItemCode] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);

  // Load all images on mount
  useEffect(() => {
    loadAllImages();
  }, []);

  // Load images for all items (mock implementation)
  const loadAllImages = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // In a real implementation, we would have an endpoint to get all images
      // For now, we'll fetch images for known item codes
      const knownItemCodes = ['ART001', 'ART002', 'ART003', 'ART004'];
      const allImages: ImageWithItem[] = [];

      for (const itemCode of knownItemCodes) {
        try {
          const response = await fetch(
            `http://localhost:3077/EjLogHostVertimag/Items/${itemCode}/Images`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.result === 'SUCCESS' && data.exported) {
              allImages.push(...data.exported);
            }
          }
        } catch (err) {
          // Skip items without images
          console.warn(`No images for ${itemCode}`);
        }
      }

      setImages(allImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento immagini');
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load images for specific item
  const loadImagesForItem = async (itemCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `http://localhost:3077/EjLogHostVertimag/Items/${itemCode}/Images`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.result === 'SUCCESS' && data.exported) {
        setImages(data.exported);
        setSelectedItemCode(itemCode);
      } else {
        setImages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento immagini');
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply search filter
  const filteredImages = useMemo(() => {
    if (!searchTerm) return images;

    return images.filter(
      (img) =>
        img.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.itemDescription?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [images, searchTerm]);

  // Group images by item code
  const imagesByItem = useMemo(() => {
    const grouped = new Map<string, ImageWithItem[]>();
    filteredImages.forEach((img) => {
      const existing = grouped.get(img.itemCode) || [];
      grouped.set(img.itemCode, [...existing, img]);
    });
    return grouped;
  }, [filteredImages]);

  // Statistics
  const stats = useMemo(() => {
    return {
      totalImages: images.length,
      totalItems: new Set(images.map((img) => img.itemCode)).size,
      primaryImages: images.filter((img) => img.isPrimary).length,
      totalSize: images.reduce((sum, img) => sum + img.fileSize, 0),
    };
  }, [images]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle set primary image
  const handleSetPrimary = async (imageId: number, itemCode: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `http://localhost:3077/EjLogHostVertimag/Items/${itemCode}/Images/${imageId}/primary`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to set primary image');
      }

      // Reload images
      if (selectedItemCode) {
        await loadImagesForItem(selectedItemCode);
      } else {
        await loadAllImages();
      }
    } catch (err) {
      console.error('Error setting primary image:', err);
      alert('Errore nell\'impostare l\'immagine principale');
    }
  };

  // Handle delete image
  const handleDeleteImage = async (imageId: number, itemCode: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `http://localhost:3077/EjLogHostVertimag/Items/${itemCode}/Images/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Reload images
      if (selectedItemCode) {
        await loadImagesForItem(selectedItemCode);
      } else {
        await loadAllImages();
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Errore durante l\'eliminazione dell\'immagine');
    }
  };

  // Handle upload image (mock - in real implementation would use FormData with file)
  const handleUploadImage = async () => {
    if (!uploadingItemCode) {
      alert('Inserisci il codice articolo');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('authToken');

      // In real implementation, this would use FormData with actual file
      // For now, we'll just call the API endpoint
      const response = await fetch(
        `http://localhost:3077/EjLogHostVertimag/Items/${uploadingItemCode}/Images`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Mock data - in real implementation this would be FormData
            fileName: 'new_image.jpg',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      // Reload images
      setUploadingItemCode('');
      if (selectedItemCode === uploadingItemCode) {
        await loadImagesForItem(uploadingItemCode);
      } else {
        await loadAllImages();
      }

      alert('Immagine caricata con successo');
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Errore durante il caricamento dell\'immagine');
    } finally {
      setUploading(false);
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Foto Articoli</h1>
          <p className="text-gray-600 mt-1">
            Gestisci le immagini dei prodotti del magazzino
          </p>
        </div>
        <Button variant="secondary" onClick={loadAllImages} disabled={loading}>
          <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Totale Immagini</div>
            <div className="text-2xl font-bold">{stats.totalImages}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Articoli con Foto</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Immagini Principali</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.primaryImages}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600">Dimensione Totale</div>
            <div className="text-2xl font-bold text-green-600">
              {formatFileSize(stats.totalSize)}
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Carica Nuova Immagine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Codice Articolo..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={uploadingItemCode}
              onChange={(e) => setUploadingItemCode(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={uploading}
            />
            <Button
              variant="primary"
              onClick={handleUploadImage}
              disabled={uploading || !uploadingItemCode}
            >
              {uploading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Carica
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per codice o nome file..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Clear Selection */}
            {selectedItemCode && (
              <Button variant="secondary" onClick={loadAllImages}>
                Mostra Tutti gli Articoli
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card variant="error">
          <div className="p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Images Grid - Grouped by Item */}
      <div className="space-y-6">
        {Array.from(imagesByItem.entries()).map(([itemCode, itemImages]) => (
          <Card key={itemCode}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold">{itemCode}</h3>
                  <Badge variant="primary">{itemImages.length} immagini</Badge>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => loadImagesForItem(itemCode)}
                >
                  Vedi Dettagli
                </Button>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {itemImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge variant="warning">
                          <Star className="w-3 h-3" />
                        </Badge>
                      </div>
                    )}

                    {/* Image */}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <img
                        src={image.thumbnailUrl || image.imageUrl}
                        alt={image.fileName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        {!image.isPrimary && (
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleSetPrimary(image.id, image.itemCode)}
                            title="Imposta come principale"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleDeleteImage(image.id, image.itemCode)}
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-600 truncate" title={image.fileName}>
                        {image.fileName}
                      </p>
                      <p className="text-xs text-gray-400">{formatFileSize(image.fileSize)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {filteredImages.length === 0 && !loading && (
          <Card>
            <div className="p-8 text-center text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nessuna immagine trovata</p>
              <p className="text-sm mt-2">Carica la prima immagine usando il form sopra</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductImagesPage;

