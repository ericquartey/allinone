import React from 'react';
import PpcSensorCard from './PpcSensorCard';

type PpcWizardStep = {
  label: string;
  active?: boolean;
};

type PpcWizardLayoutProps = {
  code?: string;
  title: string;
  description?: string;
  steps: PpcWizardStep[];
  sideCards?: { title: string; lines?: string[] }[];
  children: React.ReactNode;
};

const PpcWizardLayout: React.FC<PpcWizardLayoutProps> = ({
  code,
  title,
  description,
  steps,
  sideCards = [],
  children,
}) => {
  return (
    <div className="ppc-page">
      <div className="ppc-installation-wizard">
        <div className="ppc-installation-wizard__title">
          {code && <span>{code}</span>}
          <span>{title}</span>
        </div>
        {description && (
          <div className="ppc-installation-wizard__description">{description}</div>
        )}

        <div className="ppc-error-wizard__layout">
          <div className="ppc-wizard">
            <div className="ppc-wizard__timeline">
              {steps.map((step, index) => (
                <div
                  key={`${step.label}-${index}`}
                  className={`ppc-wizard__step${step.active ? ' is-active' : ''}`}
                >
                  <div className="ppc-wizard__step-circle">{step.label}</div>
                </div>
              ))}
            </div>

            <div className="ppc-wizard__panel">{children}</div>
          </div>

          <div className="ppc-error-wizard__side">
            {sideCards.map((card) => (
              <PpcSensorCard key={card.title} title={card.title} lines={card.lines} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcWizardLayout;
