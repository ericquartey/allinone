/**
 * UsersFilters Component
 * Sidebar filters for user search
 */

import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserFilters } from '@/types/user.types';
import { useUserGroups } from '@/hooks/useUsers';
import { Search, X, Filter } from 'lucide-react';

interface UsersFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
}

export const UsersFilters: FC<UsersFiltersProps> = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState<UserFilters>(filters);
  const { data: userGroups, isLoading: loadingGroups } = useUserGroups();

  // Sync local filters with parent
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: UserFilters = {
      username: '',
      groupId: null,
      activeOnly: false,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters =
    localFilters.username !== '' ||
    localFilters.groupId !== null ||
    localFilters.activeOnly !== false;

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtri
        </CardTitle>
        <CardDescription>Filtra la lista degli utenti</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Username Search */}
        <div className="space-y-2">
          <Label htmlFor="filter-username">Username</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="filter-username"
              placeholder="Cerca username..."
              value={localFilters.username}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, username: e.target.value })
              }
              className="pl-9"
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            />
          </div>
        </div>

        {/* Group Select */}
        <div className="space-y-2">
          <Label htmlFor="filter-group">Gruppo</Label>
          <Select
            value={localFilters.groupId?.toString() || 'all'}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                groupId: value === 'all' ? null : Number(value),
              })
            }
            disabled={loadingGroups}
          >
            <SelectTrigger id="filter-group">
              <SelectValue placeholder="Tutti i gruppi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i gruppi</SelectItem>
              {userGroups?.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Only Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="filter-active"
            checked={localFilters.activeOnly}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, activeOnly: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="filter-active" className="cursor-pointer">
            Solo utenti attivi
          </Label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700">
            <Search className="h-4 w-4 mr-2" />
            Applica Filtri
          </Button>

          {hasActiveFilters && (
            <Button variant="outline" onClick={handleReset} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Reset Filtri
            </Button>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Filtri attivi:</p>
            <div className="space-y-1">
              {localFilters.username && (
                <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Username: "{localFilters.username}"
                </div>
              )}
              {localFilters.groupId && (
                <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Gruppo:{' '}
                  {userGroups?.find((g) => g.id === localFilters.groupId)?.nome || 'Sconosciuto'}
                </div>
              )}
              {localFilters.activeOnly && (
                <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  Solo attivi
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
