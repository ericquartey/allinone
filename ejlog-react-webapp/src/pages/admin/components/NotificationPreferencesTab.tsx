// ============================================================================
// EJLOG WMS - Notification Preferences Tab
// Configurazione preferenze notifiche utente
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  VolumeUp as SoundIcon,
  Notifications as DesktopIcon,
  Email as EmailIcon,
  PhoneAndroid as PushIcon,
  Category as CategoryIcon,
  AccessTime as TimeIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

import {
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
  type NotificationPreferences,
} from '../../../services/api/notificationsApi';

// TODO: Sostituire con userId reale da autenticazione
const CURRENT_USER_ID = 'admin';

const AVAILABLE_CATEGORIES = [
  { value: 'system', label: 'Sistema', color: 'default' as const },
  { value: 'operations', label: 'Operazioni', color: 'primary' as const },
  { value: 'lists', label: 'Liste', color: 'secondary' as const },
  { value: 'items', label: 'Articoli', color: 'success' as const },
];

export function NotificationPreferencesTab() {
  const {
    data: preferences,
    isLoading,
    error,
    refetch,
  } = useGetPreferencesQuery(CURRENT_USER_ID);

  const [updatePreferences, { isLoading: isSaving }] = useUpdatePreferencesMutation();

  const [formData, setFormData] = useState<Partial<NotificationPreferences>>({
    enableSound: true,
    enableDesktop: true,
    enableEmail: false,
    enablePush: true,
    categories: ['operations', 'lists', 'items', 'system'],
    quietHoursStart: '',
    quietHoursEnd: '',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Aggiorna form quando arrivano i dati dal server
  useEffect(() => {
    if (preferences) {
      setFormData({
        enableSound: preferences.enableSound,
        enableDesktop: preferences.enableDesktop,
        enableEmail: preferences.enableEmail,
        enablePush: preferences.enablePush,
        categories: Array.isArray(preferences.categories) ? preferences.categories : [],
        quietHoursStart: preferences.quietHoursStart || '',
        quietHoursEnd: preferences.quietHoursEnd || '',
      });
    }
  }, [preferences]);

  const handleToggle = (field: keyof NotificationPreferences) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    setSaveSuccess(false);
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => {
      const currentCategories = prev.categories || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter((c) => c !== category)
        : [...currentCategories, category];

      return {
        ...prev,
        categories: newCategories,
      };
    });
    setSaveSuccess(false);
  };

  const handleTimeChange = (field: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      await updatePreferences({
        userId: CURRENT_USER_ID,
        data: formData,
      }).unwrap();

      setSaveSuccess(true);
      refetch();

      // Auto-hide success message dopo 3 secondi
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Errore salvataggio preferenze:', error);
      alert(`Errore salvataggio: ${error?.data?.error || error.message}`);
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
    return <Alert severity="error">Errore caricamento preferenze</Alert>;
  }

  return (
    <Box>
      {/* Success Message */}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Preferenze salvate con successo!
        </Alert>
      )}

      {/* Notification Channels */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Canali di Notifica
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Scegli come vuoi ricevere le notifiche
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <FormGroup>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableSound || false}
                    onChange={() => handleToggle('enableSound')}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <SoundIcon />
                    <Box>
                      <Typography variant="body1">Notifiche Audio</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Riproduci un suono quando arriva una notifica
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableDesktop || false}
                    onChange={() => handleToggle('enableDesktop')}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <DesktopIcon />
                    <Box>
                      <Typography variant="body1">Notifiche Desktop</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mostra notifiche desktop del browser
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableEmail || false}
                    onChange={() => handleToggle('enableEmail')}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon />
                    <Box>
                      <Typography variant="body1">Notifiche Email</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ricevi notifiche importanti via email
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enablePush || false}
                    onChange={() => handleToggle('enablePush')}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <PushIcon />
                    <Box>
                      <Typography variant="body1">Notifiche Push</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ricevi notifiche push su dispositivi mobili
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </FormGroup>
      </Paper>

      {/* Categories */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <CategoryIcon />
          <Typography variant="h6">Categorie di Notifiche</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Seleziona le categorie di notifiche che vuoi ricevere
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Box display="flex" flexWrap="wrap" gap={2}>
          {AVAILABLE_CATEGORIES.map((category) => {
            const isSelected = formData.categories?.includes(category.value);
            return (
              <Chip
                key={category.value}
                label={category.label}
                color={isSelected ? category.color : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                onClick={() => handleCategoryToggle(category.value)}
                sx={{
                  cursor: 'pointer',
                  fontSize: '1rem',
                  py: 2.5,
                  px: 1,
                }}
              />
            );
          })}
        </Box>

        {formData.categories && formData.categories.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Attenzione: Nessuna categoria selezionata. Non riceverai alcuna notifica.
          </Alert>
        )}
      </Paper>

      {/* Quiet Hours */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <TimeIcon />
          <Typography variant="h6">Orario Silenzioso (Quiet Hours)</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Definisci un periodo durante il quale non ricevere notifiche
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              type="time"
              label="Inizio"
              value={formData.quietHoursStart || ''}
              onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              type="time"
              label="Fine"
              value={formData.quietHoursEnd || ''}
              onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {formData.quietHoursStart && formData.quietHoursEnd && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Notifiche silenziate dalle {formData.quietHoursStart} alle {formData.quietHoursEnd}
          </Alert>
        )}
      </Paper>

      {/* Save Button */}
      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Salvataggio...' : 'Salva Preferenze'}
        </Button>
      </Box>

      {/* Info */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Nota:</strong> Le preferenze vengono salvate per il tuo utente e si applicano a
          tutte le sessioni. Le modifiche hanno effetto immediato.
        </Typography>
      </Alert>
    </Box>
  );
}
