// ============================================
// User & Auth Types
// ============================================

export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: string[];
  accessLevel: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR' | 'VIEWER' | 'GUEST';
  permissions?: string[];
  active: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenId: string;
  expiresIn: number;
  username: string;
  user?: User;
}
