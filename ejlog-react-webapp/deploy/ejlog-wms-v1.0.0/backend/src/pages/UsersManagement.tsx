/**
 * UsersManagement Page
 * Main page with tabs for comprehensive user management
 */

import { FC, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UsersList } from '@/components/users/UsersList';
import { LoginHistoryTab } from '@/components/users/LoginHistoryTab';
import { ActiveTokensTab } from '@/components/users/ActiveTokensTab';
import { UserGroupsTab } from '@/components/users/UserGroupsTab';
import { Shield, Users, LogIn, Key, UserCircle } from 'lucide-react';

// TODO: Replace with actual auth context/hook
interface MockAuthContext {
  user: {
    id: number;
    username: string;
    groupId: number;
    privilegeLevel: number;
  } | null;
  isAdmin: boolean;
}

const useMockAuth = (): MockAuthContext => {
  // TEMPORARY: Replace with actual useAuth hook
  return {
    user: {
      id: 1,
      username: 'admin',
      groupId: 1,
      privilegeLevel: 1,
    },
    isAdmin: true,
  };
};

export const UsersManagement: FC = () => {
  const auth = useMockAuth();
  const [activeTab, setActiveTab] = useState('users');

  if (!auth.user) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Devi essere autenticato per accedere a questa pagina.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Only admins can access user management (adjust based on requirements)
  if (!auth.isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Non hai i permessi necessari per accedere alla gestione utenti.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestione Utenti</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestisci utenti, gruppi, accessi e token di sicurezza
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Utenti</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Storico Accessi</span>
              </TabsTrigger>
              <TabsTrigger value="tokens" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">Token Attivi</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Gruppi</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Users List */}
            <TabsContent value="users" className="space-y-4">
              <UsersList currentUserId={auth.user.id} isAdmin={auth.isAdmin} />
            </TabsContent>

            {/* Tab: Login History */}
            <TabsContent value="history" className="space-y-4">
              <LoginHistoryTab />
            </TabsContent>

            {/* Tab: Active Tokens */}
            <TabsContent value="tokens" className="space-y-4">
              <ActiveTokensTab />
            </TabsContent>

            {/* Tab: User Groups */}
            <TabsContent value="groups" className="space-y-4">
              <UserGroupsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span>
                Connesso come: <span className="font-semibold">{auth.user.username}</span>
              </span>
            </div>
            <div className="text-xs">
              EjLog User Management v1.0 - Backend: localhost:3077
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagement;

