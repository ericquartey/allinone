import { useState } from 'react';
import { UserGroupIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Clienti</h1>
          <p className="text-gray-600 mt-1">Anagrafica clienti e rapporti commerciali</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🟢 Backend Connesso
            </span>
          </div>
        </div>
        <Button variant="primary"><PlusIcon className="w-4 h-4 mr-2" />Nuovo Cliente</Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Cerca clienti..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ferretto-red focus:border-transparent" />
          </div>
        </div>

        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Gestione Clienti</h3>
          <p className="mt-1 text-sm text-gray-500">Funzionalità in fase di implementazione</p>
        </div>
      </Card>
    </div>
  );
}

export default CustomersPage;
