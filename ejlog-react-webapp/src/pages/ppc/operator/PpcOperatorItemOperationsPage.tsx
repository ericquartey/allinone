import React from 'react';
import { Link } from 'react-router-dom';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { ppcViews } from '../../../features/ppc/ppcViews';

const getRoute = (viewName: string): string => {
  const match = ppcViews.find(
    (view) => view.moduleSlug === 'operator' && view.view === viewName
  );
  return match?.route || '/ppc/operator';
};

const actions = [
  {
    id: 'item-add',
    title: 'Add Item',
    description: 'Create a new item record.',
    path: getRoute('ItemAddView'),
  },
  {
    id: 'item-info',
    title: 'Item Info',
    description: 'Search and inspect item details.',
    path: getRoute('ItemInfoView'),
  },
  {
    id: 'item-pick',
    title: 'Picking',
    description: 'Execute picking workflows (RF).',
    path: getRoute('ItemPickView'),
  },
  {
    id: 'item-put',
    title: 'Putaway',
    description: 'Receive items and confirm putaway (RF).',
    path: getRoute('ItemPutView'),
  },
  {
    id: 'item-inventory',
    title: 'Inventory',
    description: 'Inventory count and discrepancy handling (RF).',
    path: getRoute('ItemInventoryView'),
  },
  {
    id: 'loading-units',
    title: 'Loading Units',
    description: 'Manage UDC and loading unit contents.',
    path: getRoute('LoadingUnitView'),
  },
  {
    id: 'lists',
    title: 'Lists',
    description: 'Review and manage list operations.',
    path: getRoute('WaitingListsView'),
  },
];

const PpcOperatorItemOperationsPage: React.FC = () => {
  return (
    <div className="ppc-page">
      <div className="ppc-accessories__title">
        <span>{ppcT('OperatorApp.ItemOperations', 'Item operations')}</span>
      </div>
      <div className="ppc-accessories__description">
        {ppcT('OperatorApp.ItemOperationsDescription', 'Operazioni disponibili per picking e inventario.')}
      </div>

      <div className="ppc-menu-card-grid">
        {actions.map((action) => (
          <div key={action.id} className="ppc-menu-card">
            <div className="ppc-menu-card__abbr">{ppcT('General.Open', 'Apri')}</div>
            <div className="ppc-menu-card__title">{action.title}</div>
            <div className="ppc-menu-card__desc">{action.description}</div>
            <Link to={action.path} className="ppc-installation-footer__button">
              {ppcT('General.Open', 'Apri')}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PpcOperatorItemOperationsPage;
