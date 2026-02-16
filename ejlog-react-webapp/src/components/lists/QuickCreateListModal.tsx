import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getListTypeLabel, ListType } from '../../types/lists';

export interface QuickCreateListModalProps {
  isOpen: boolean;
  listType: ListType;
  onClose: () => void;
  onConfirm: (data: {
    listNumber?: string;
    description?: string;
    priority?: number;
    areaId?: number;
  }) => void;
}

export const QuickCreateListModal = ({
  isOpen,
  listType,
  onClose,
  onConfirm
}: QuickCreateListModalProps): JSX.Element | null => {
  const [listNumber, setListNumber] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('1');
  const [areaId, setAreaId] = useState('1');

  useEffect(() => {
    if (isOpen) {
      setListNumber('');
      setDescription('');
      setPriority('1');
      setAreaId('1');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      listNumber: listNumber.trim() || undefined,
      description: description.trim() || undefined,
      priority: priority ? Number(priority) : undefined,
      areaId: areaId ? Number(areaId) : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-ferretto-dark">
            Crea Lista {getListTypeLabel(listType)}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" type="button">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode / NumLista</label>
            <input
              value={listNumber}
              onChange={(e) => setListNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Lascia vuoto per generazione automatica"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Descrizione lista"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorita</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area ID</label>
              <input
                type="number"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            type="button"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-ferretto-red rounded-md hover:bg-ferretto-red-dark"
            type="button"
          >
            Crea
          </button>
        </div>
      </div>
    </div>
  );
};
