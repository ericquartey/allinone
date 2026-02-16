import { baseApi } from './baseApi';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  order?: number;
  visible?: boolean;
  requiredRole?: string;
  requiredPermission?: string;
}

export interface MenuResponse {
  items: MenuItem[];
  userPermissions?: string[];
  userRoles?: string[];
}

export const menuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenu: builder.query<MenuResponse, void>({
      query: () => '/menu',
      providesTags: ['Menu'],
    }),
    getAllMenuItems: builder.query<MenuResponse, void>({
      query: () => '/menu/all',
      providesTags: ['Menu'],
    }),
    getUserPermissions: builder.query<string[], void>({
      query: () => '/menu/permissions',
    }),
  }),
});

export const {
  useGetMenuQuery,
  useGetAllMenuItemsQuery,
  useGetUserPermissionsQuery,
} = menuApi;
