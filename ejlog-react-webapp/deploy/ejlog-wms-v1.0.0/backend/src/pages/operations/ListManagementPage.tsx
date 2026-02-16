/**
 * Pagina Gestione Liste con Tabs
 * Tabs: Inserimento, Modifica, Prenotazione, Deprenotazione
 */

import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  BookmarkIcon,
  BookmarkSlashIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/shared/Card';

// Import tabs
import InsertListTab from '../../components/operations/tabs/InsertListTab';
import EditListTab from '../../components/operations/tabs/EditListTab';
import ReserveListTab from '../../components/operations/tabs/ReserveListTab';
import UnreserveListTab from '../../components/operations/tabs/UnreserveListTab';

const ListManagementPage: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tabs = [
    {
      name: 'Inserimento',
      icon: PlusCircleIcon,
      color: 'blue',
      component: InsertListTab,
    },
    // RIMOSSI: Modifica, Prenotazione, Deprenotazione
    // {
    //   name: 'Modifica',
    //   icon: PencilSquareIcon,
    //   color: 'green',
    //   component: EditListTab,
    // },
    // {
    //   name: 'Prenotazione',
    //   icon: BookmarkIcon,
    //   color: 'purple',
    //   component: ReserveListTab,
    // },
    // {
    //   name: 'Deprenotazione',
    //   icon: BookmarkSlashIcon,
    //   color: 'red',
    //   component: UnreserveListTab,
    // },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestione Liste</h1>
        <p className="text-gray-600 mt-1">
          Inserisci, modifica, prenota e deprenota liste operations
        </p>
      </div>

      <Card>
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isSelected = selectedIndex === index;

              return (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-all
                    focus:outline-none focus:ring-2 ring-offset-2 ring-offset-${tab.color}-400 ring-white ring-opacity-60
                    ${
                      selected
                        ? `bg-${tab.color}-600 text-white shadow`
                        : `text-gray-700 hover:bg-white/[0.12] hover:text-${tab.color}-600`
                    }`
                  }
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : `text-${tab.color}-600`}`} />
                    <span>{tab.name}</span>
                  </div>
                </Tab>
              );
            })}
          </Tab.List>

          <Tab.Panels className="mt-6">
            {tabs.map((tab, index) => {
              const Component = tab.component;
              return (
                <Tab.Panel
                  key={index}
                  className="rounded-xl p-3 focus:outline-none"
                >
                  <Component />
                </Tab.Panel>
              );
            })}
          </Tab.Panels>
        </Tab.Group>
      </Card>
    </div>
  );
};

export default ListManagementPage;
