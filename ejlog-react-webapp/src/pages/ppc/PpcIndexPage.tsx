import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { ppcModules } from '../../features/ppc/ppcViews';

const PpcIndexPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PPC</h1>
          <p className="text-sm text-gray-600">
            Panel PC UI migration hub. Select a module to see all screens.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ppcModules.map((module) => (
          <Card key={module.id} className="p-5" variant="outlined" hoverable>
            <div className="space-y-2">
              <div className="text-xs uppercase text-gray-400 tracking-wide">
                {module.project}
              </div>
              <Link
                to={`/ppc/${module.slug}`}
                className="text-lg font-semibold text-gray-900 hover:text-ferretto-red"
              >
                {module.label}
              </Link>
              <div className="text-sm text-gray-500">{module.viewCount} screens</div>
              {module.sections.length > 0 && (
                <div className="text-xs text-gray-400">
                  Sections: {module.sections.join(', ')}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PpcIndexPage;
