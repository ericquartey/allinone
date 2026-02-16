// ============================================================================
// EJLOG WMS - User Groups Tab
// Gestione gruppi e ruoli utenti
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import {
  useGetUserGroupsQuery,
  useCreateUserGroupMutation,
  useUpdateUserGroupMutation,
  useDeleteUserGroupMutation,
} from '../../../services/api/usersApi';

export function UserGroupsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 2,
    description: '',
  });

  const { data: groups = [], isLoading, error, refetch } = useGetUserGroupsQuery();
  const [createGroup, { isLoading: isCreating }] = useCreateUserGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateUserGroupMutation();
  const [deleteGroup] = useDeleteUserGroupMutation();

  const handleOpenDialog = (group?: any) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name || '',
        level: group.level || 2,
        description: group.description || '',
      });
    } else {
      setEditingGroup(null);
      setFormData({ name: '', level: 2, description: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingGroup) {
        await updateGroup({ id: editingGroup.id, data: formData }).unwrap();
      } else {
        await createGroup(formData).unwrap();
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleDelete = async (groupId: number) => {
    if (confirm('Sei sicuro di voler eliminare questo gruppo?')) {
      try {
        await deleteGroup(groupId).unwrap();
        refetch();
      } catch (error: any) {
        alert(error.data?.details || 'Errore durante l\'eliminazione');
      }
    }
  };

  if (isLoading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Errore durante il caricamento dei gruppi</Alert>;

  return (
    <Box>
      <Box mb={3}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuovo Gruppo
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Livello Privilegi</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group: any) => (
              <TableRow key={group.id}>
                <TableCell>{group.id}</TableCell>
                <TableCell><strong>{group.name}</strong></TableCell>
                <TableCell>
                  <Chip
                    label={group.level === 0 ? 'Superuser' : group.level === 1 ? 'Admin' : `User (${group.level})`}
                    color={group.level === 0 ? 'error' : group.level === 1 ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{group.description || '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Modifica">
                    <IconButton size="small" onClick={() => handleOpenDialog(group)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton size="small" onClick={() => handleDelete(group.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? 'Modifica Gruppo' : 'Nuovo Gruppo'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nome Gruppo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Livello Privilegi"
              type="number"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              helperText="0 = Superuser, 1 = Admin, 2+ = User"
              required
              fullWidth
            />
            <TextField
              label="Descrizione"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleSave} variant="contained" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
