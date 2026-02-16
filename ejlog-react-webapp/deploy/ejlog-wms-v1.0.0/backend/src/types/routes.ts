// ============================================================================
// EJLOG WMS - Route Type Definitions
// Types for routing configuration
// ============================================================================

import { LazyExoticComponent, ComponentType } from 'react';

export interface RouteConfig {
  path: string;
  element: LazyExoticComponent<ComponentType<any>> | ComponentType<any>;
  protected?: boolean;
  children?: RouteConfig[];
  title?: string;
  icon?: string;
}

export interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  children?: NavigationItem[];
}
