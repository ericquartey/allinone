import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import {
  getPpcModule,
  getPpcViewsByModule,
  groupPpcViewsBySection,
} from '../../features/ppc/ppcViews';

const PpcModulePage: React.FC = () => {
  const { module: moduleSlug } = useParams();
  const moduleData = moduleSlug ? getPpcModule(moduleSlug) : undefined;
  const views = moduleSlug ? getPpcViewsByModule(moduleSlug) : [];
  const grouped = groupPpcViewsBySection(views);

  if (!moduleData) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">PPC module not found</h1>
        <Link to="/ppc" className="text-sm text-blue-600 hover:underline">
          Back to PPC
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase text-gray-400 tracking-wide">{moduleData.project}</div>
          <h1 className="text-2xl font-bold text-gray-900">{moduleData.label}</h1>
          <p className="text-sm text-gray-600">{moduleData.viewCount} screens available.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>

      <div className="space-y-4">
        {[...grouped.entries()].map(([section, sectionViews]) => (
          <Card key={section} title={section} className="p-0" variant="outlined">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sectionViews.map((view) => (
                <Link
                  key={view.id}
                  to={view.route}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:border-ferretto-red hover:text-ferretto-red"
                >
                  {view.label}
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PpcModulePage;
