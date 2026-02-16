import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getListStatusLabel, getListTypeLabel } from '../../types/lists';

export interface ListMergeModalProps {
  isOpen: boolean;
  lists: any[];
  initialSelectedIds?: number[];
  onClose: () => void;
  onConfirm: (listIds: number[]) => void;
}

export const ListMergeModal = ({
  isOpen,
  lists,
  initialSelectedIds = [],
  onClose,
  onConfirm
}: ListMergeModalProps): JSX.Element | null => {
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedIds);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
    }
  }, [isOpen, initialSelectedIds]);

  const sortedLists = useMemo(() => {
    return [...lists].sort((a, b) => {
      const aNum = a?.listHeader?.listNumber || '';
      const bNum = b?.listHeader?.listNumber || '';
      return aNum.localeCompare(bNum);
    });
  }, [lists]);

  if (!isOpen) return null;

  const toggleList = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-ferretto-dark">Accorpa Liste</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" type="button">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 max-h-[60vh] overflow-auto">
          <p className="text-sm text-gray-600 mb-3">
            Seleziona almeno due liste da accorpare. Verrà creata una nuova lista con le righe accorpate.
          </p>

          <div className="border border-gray-200 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Seleziona</th>
                  <th className="px-3 py-2 text-left">NumLista</th>
                  <th className="px-3 py-2 text-left">Descrizione</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Stato</th>
                </tr>
              </thead>
              <tbody>
                {sortedLists.map((listExport, index) => {
                  const header = listExport?.listHeader || {};
                  const id = header.id;
                  return (
                    <tr key={id || index} className="border-t border-gray-200">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleList(id)}
                        />
                      </td>
                      <td className="px-3 py-2">{header.listNumber || '-'}</td>
                      <td className="px-3 py-2">{header.listDescription || '-'}</td>
                      <td className="px-3 py-2">{getListTypeLabel(header.listType)}</td>
                      <td className="px-3 py-2">{getListStatusLabel(header.listStatus)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            onClick={() => onConfirm(selectedIds)}
            className="px-4 py-2 text-sm font-medium text-white bg-ferretto-red rounded-md hover:bg-ferretto-red-dark"
            type="button"
            disabled={selectedIds.length < 2}
          >
            Accorpa ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
