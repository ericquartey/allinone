// ============================================================================
// EJLOG WMS - Assign List Modal Component
// Modal component for assigning lists to users/operators with warehouse/area selection
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  TextField,
  Chip,
} from '@mui/material';
import { Assignment, Person, Warehouse as WarehouseIcon, LocationOn } from '@mui/icons-material';
import * as ListsService from '../../services/listsService';
import type { List, User, Warehouse, Area } from '../../services/listsService';

interface AssignListModalProps {
  open: boolean;
  onClose: () => void;
  list: List | null;
  onAssignSuccess: () => void;
}

export const AssignListModal: React.FC<AssignListModalProps> = ({
  open,
  onClose,
  list,
  onAssignSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [selectedAreaId, setSelectedAreaId] = useState<number | ''>('');

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  // Load initial data
  useEffect(() => {
    if (open) {
      loadUsers();
      loadWarehouses();

      // Pre-select warehouse if list has one
      if (list?.listHeader.selectedWarehouses && list.listHeader.selectedWarehouses.length > 0) {
        setSelectedWarehouseId(list.listHeader.selectedWarehouses[0]);
      }
    } else {
      // Reset form when modal closes
      setSelectedUserId('');
      setSelectedWarehouseId('');
      setSelectedAreaId('');
      setError(null);
    }
  }, [open, list]);

  // Load areas when warehouse changes
  useEffect(() => {
    if (selectedWarehouseId) {
      loadAreas(selectedWarehouseId as number);
    } else {
      setAreas([]);
      setSelectedAreaId('');
    }
  }, [selectedWarehouseId]);

  const loadUsers = async () => {
    try {
      const usersData = await ListsService.getAvailableUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Errore nel caricamento degli utenti');
    }
  };

  const loadWarehouses = async () => {
    try {
      const warehousesData = await ListsService.getWarehouses();
      setWarehouses(warehousesData);
    } catch (err) {
      console.error('Error loading warehouses:', err);
      setError('Errore nel caricamento dei magazzini');
    }
  };

  const loadAreas = async (warehouseId: number) => {
    try {
      const areasData = await ListsService.getAreas(warehouseId);
      setAreas(areasData);
    } catch (err) {
      console.error('Error loading areas:', err);
      setError('Errore nel caricamento delle aree');
    }
  };

  const handleAssign = async () => {
    if (!list || !selectedUserId) {
      setError('Selezionare un operatore');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: ListsService.AssignListParams = {
        listNumber: list.listHeader.listNumber,
        userId: selectedUserId,
        warehouseId: selectedWarehouseId ? (selectedWarehouseId as number) : undefined,
        areaId: selectedAreaId ? (selectedAreaId as number) : undefined,
      };

      // Validate
      const validationErrors = ListsService.validateListAssignment(params);
      if (Object.keys(validationErrors).length > 0) {
        setError(Object.values(validationErrors).join(', '));
        setLoading(false);
        return;
      }

      const response = await ListsService.assignListToUser(params);

      if (response.result === 'OK') {
        onAssignSuccess();
        onClose();
      } else {
        setError(response.message || 'Errore durante l\'assegnazione');
      }
    } catch (err) {
      console.error('Error assigning list:', err);
      setError(err instanceof Error ? err.message : 'Errore durante l\'assegnazione');
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName} (${user.username})`;
    }
    return user.username;
  };

  if (!list) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Assignment />
          <span>Assegna Lista a Operatore</span>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Box display="flex" gap={1} alignItems="center" mb={1}>
            <strong>Lista:</strong>
            <Chip label={list.listHeader.listNumber} color="primary" size="small" />
          </Box>
          <Box display="flex" gap={1} alignItems="center" mb={1}>
            <strong>Tipo:</strong>
            <span>{ListsService.getListTypeLabel(list.listHeader.listType)}</span>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <strong>Stato:</strong>
            <span>{ListsService.getListStatusLabel(list.listHeader.listStatus)}</span>
          </Box>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="user-select-label">
            <Box display="flex" alignItems="center" gap={1}>
              <Person fontSize="small" />
              Operatore *
            </Box>
          </InputLabel>
          <Select
            labelId="user-select-label"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            label="Operatore *"
            disabled={loading}
          >
            <MenuItem value="">
              <em>Seleziona operatore</em>
            </MenuItem>
            {users.map((user) => (
              <MenuItem key={user.userId} value={user.userId}>
                {getUserDisplayName(user)}
                {user.badge && (
                  <Chip
                    label={`Badge: ${user.badge}`}
                    size="small"
                    sx={{ ml: 1 }}
                    variant="outlined"
                  />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="warehouse-select-label">
            <Box display="flex" alignItems="center" gap={1}>
              <WarehouseIcon fontSize="small" />
              Magazzino
            </Box>
          </InputLabel>
          <Select
            labelId="warehouse-select-label"
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value as number)}
            label="Magazzino"
            disabled={loading}
          >
            <MenuItem value="">
              <em>Seleziona magazzino</em>
            </MenuItem>
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse.warehouseId} value={warehouse.warehouseId}>
                {warehouse.warehouseName}
                {warehouse.warehouseCode && ` (${warehouse.warehouseCode})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="area-select-label">
            <Box display="flex" alignItems="center" gap={1}>
              <LocationOn fontSize="small" />
              Area
            </Box>
          </InputLabel>
          <Select
            labelId="area-select-label"
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value as number)}
            label="Area"
            disabled={loading || !selectedWarehouseId}
          >
            <MenuItem value="">
              <em>Seleziona area</em>
            </MenuItem>
            {areas.map((area) => (
              <MenuItem key={area.areaId} value={area.areaId}>
                {area.areaName}
                {area.areaCode && ` (${area.areaCode})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {!selectedWarehouseId && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Seleziona un magazzino per vedere le aree disponibili
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annulla
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={loading || !selectedUserId}
          startIcon={loading ? <CircularProgress size={20} /> : <Assignment />}
        >
          {loading ? 'Assegnazione...' : 'Assegna'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignListModal;
