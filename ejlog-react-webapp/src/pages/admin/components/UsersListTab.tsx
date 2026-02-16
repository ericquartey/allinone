// ============================================================================
// EJLOG WMS - Users List Tab
// CRUD completo per la gestione utenti
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VpnKey as KeyIcon,
} from '@mui/icons-material';

import {
  useGetUsersQuery,
  useGetUserGroupsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useChangePasswordMutation,
} from '../../../services/api/usersApi';

export function UsersListTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    groupId: '',
    languageId: 1,
    barcode: '',
    password: '',
  });
  const [passwordData, setPasswordData] = useState({
    userId: 0,
    currentPassword: '',
    newPassword: '',
  });

  // API Hooks
  const { data: users = [], isLoading, error, refetch } = useGetUsersQuery();
  const { data: groups = [] } = useGetUserGroupsQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  // Filtered users
  const filteredUsers = users.filter((user: any) =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleOpenDialog = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        groupId: user.groupId || '',
        languageId: user.languageId || 1,
        barcode: user.barcode || '',
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        groupId: '',
        languageId: 1,
        barcode: '',
        password: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        // Update
        await updateUser({
          id: editingUser.id,
          data: {
            username: formData.username,
            firstName: formData.firstName,
            lastName: formData.lastName,
            groupId: parseInt(formData.groupId),
            languageId: formData.languageId,
            barcode: formData.barcode,
          },
        }).unwrap();
      } else {
        // Create
        await createUser({
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          groupId: parseInt(formData.groupId),
          languageId: formData.languageId,
          barcode: formData.barcode,
          password: formData.password,
        }).unwrap();
      }
      handleCloseDialog();
      refetch();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (userId: number) => {
    if (confirm('Sei sicuro di voler eliminare questo utente?')) {
      try {
        await deleteUser(userId).unwrap();
        refetch();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleOpenPasswordDialog = (userId: number) => {
    setPasswordData({ userId, currentPassword: '', newPassword: '' });
    setPasswordDialogOpen(true);
  };

  const handleChangePassword = async () => {
    try {
      await changePassword({
        id: passwordData.userId,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }).unwrap();
      setPasswordDialogOpen(false);
      setPasswordData({ userId: 0, currentPassword: '', newPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Errore durante il caricamento degli utenti
      </Alert>
    );
  }

  return (
    <Box>
      {/* Toolbar */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <TextField
          placeholder="Cerca utente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Utente
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Cognome</TableCell>
              <TableCell>Gruppo</TableCell>
              <TableCell>Livello</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>
                  <strong>{user.username}</strong>
                </TableCell>
                <TableCell>{user.firstName || '-'}</TableCell>
                <TableCell>{user.lastName || '-'}</TableCell>
                <TableCell>{user.groupName || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.groupLevel === 0 ? 'Superuser' : user.groupLevel === 1 ? 'Admin' : 'User'}
                    color={user.groupLevel === 0 ? 'error' : user.groupLevel === 1 ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.barcode || '-'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Modifica">
                    <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cambia Password">
                    <IconButton size="small" onClick={() => handleOpenPasswordDialog(user.id)}>
                      <KeyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton size="small" onClick={() => handleDelete(user.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Modifica Utente' : 'Nuovo Utente'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Nome"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Cognome"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Gruppo</InputLabel>
              <Select
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                label="Gruppo"
              >
                {groups.map((group: any) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name} (Livello {group.level})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              fullWidth
            />
            {!editingUser && (
              <TextField
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambia Password</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Password Attuale"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              fullWidth
            />
            <TextField
              label="Nuova Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Annulla</Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? 'Modifica...' : 'Cambia Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
