// ============================================================================
// EJLOG WMS - Notifications Center Page
// Centro notifiche con integrazione API real-time
// ============================================================================

import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Bell, AlertCircle, Info, CheckCircle, XCircle, Filter, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsManagement } from '../../hooks/useNotifications';
import type { Notification, NotificationLevel } from '../../services/api/notificationsApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/shared/Badge';
import Input from '../../components/shared/Input';
import { toast } from 'react-hot-toast';

// ============================================================================
// Type Mapping
// ============================================================================

type DisplayNotification = Notification & {
  displayType: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
};

const mapLevelToType = (level: NotificationLevel): 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' => {
  switch (level) {
    case 'INFO':
      return 'INFO';
    case 'WARN':
      return 'WARNING';
    case 'ERROR':
      return 'ERROR';
    case 'FATAL':
      return 'ERROR';
    default:
      return 'INFO';
  }
};

// ============================================================================
// Component
// ============================================================================

const NotificationsCenterPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<string>('ALL');
  const [selectedNotification, setSelectedNotification] = useState<DisplayNotification | null>(null);

  // React Query hooks
  const {
    notifications: rawNotifications,
    unreadCount,
    isLoadingNotifications,
    isUpdating,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetchNotifications,
  } = useNotificationsManagement();

  // Map notifications to display format
  const notifications: DisplayNotification[] = useMemo(() => {
    return rawNotifications.map(n => ({
      ...n,
      displayType: mapLevelToType(n.level),
    }));
  }, [rawNotifications]);

  // Filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch =
        n.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel =
        levelFilter === 'ALL' || n.level === levelFilter;

      const matchesRead =
        readFilter === 'ALL' ||
        (readFilter === 'UNREAD' && !n.read) ||
        (readFilter === 'READ' && n.read);

      return matchesSearch && matchesLevel && matchesRead;
    });
  }, [notifications, searchTerm, levelFilter, readFilter]);

  // Stats
  const totalNotifications = notifications.length;
  const errorCount = notifications.filter(n => n.level === 'ERROR' || n.level === 'FATAL').length;
  const warnCount = notifications.filter(n => n.level === 'WARN').length;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleMarkAsRead = async (notification: DisplayNotification) => {
    if (notification.read) return;

    try {
      await markAsRead({
        notificationId: notification.id,
        userId: 'current-user', // TODO: Get from auth context
      });
      toast.success('Notifica segnata come letta');
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead('current-user'); // TODO: Get from auth context
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleDelete = async (notification: DisplayNotification) => {
    try {
      await deleteNotification({
        notificationId: notification.id,
        userId: 'current-user', // TODO: Get from auth context
      });
      if (selectedNotification?.id === notification.id) {
        setSelectedNotification(null);
      }
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare tutte le notifiche?')) {
      return;
    }

    try {
      await clearAll('current-user'); // TODO: Get from auth context
      setSelectedNotification(null);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleRowClick = async (notification: DisplayNotification) => {
    setSelectedNotification(notification);

    // Mark as read when opening
    if (!notification.read) {
      await handleMarkAsRead(notification);
    }
  };

  const handleTakeAction = (notification: DisplayNotification) => {
    if (notification.redirectUrl) {
      // Build URL with params if provided
      let url = notification.redirectUrl;
      if (notification.redirectParams) {
        const params = new URLSearchParams(notification.redirectParams);
        url += `?${params.toString()}`;
      }
      navigate(url);
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const getTypeBadge = (type: DisplayNotification['displayType']) => {
    const config: Record<
      DisplayNotification['displayType'],
      { variant: 'default' | 'success' | 'warning' | 'danger'; icon: any }
    > = {
      INFO: { variant: 'default', icon: Info },
      WARNING: { variant: 'warning', icon: AlertCircle },
      ERROR: { variant: 'danger', icon: XCircle },
      SUCCESS: { variant: 'success', icon: CheckCircle },
    };
    const { variant, icon: Icon } = config[type];
    return (
      <Badge variant={variant}>
        <Icon className="w-3 h-3 mr-1 inline" />
        {type}
      </Badge>
    );
  };

  const getLevelBadge = (level: NotificationLevel) => {
    const variants: Record<NotificationLevel, 'default' | 'warning' | 'danger'> = {
      INFO: 'default',
      WARN: 'warning',
      ERROR: 'danger',
      FATAL: 'danger',
    };
    return <Badge variant={variants[level]}>{level}</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  // ============================================================================
  // Table Columns
  // ============================================================================

  const columns = [
    {
      header: 'Livello',
      accessor: 'level' as keyof DisplayNotification,
      render: (n: DisplayNotification) => getLevelBadge(n.level),
    },
    {
      header: 'Messaggio',
      accessor: 'message' as keyof DisplayNotification,
      render: (n: DisplayNotification) => (
        <span className={n.read ? '' : 'font-bold'}>{n.message}</span>
      ),
    },
    {
      header: 'Data/Ora',
      accessor: 'timestamp' as keyof DisplayNotification,
      render: (n: DisplayNotification) => formatTimestamp(n.timestamp),
    },
    {
      header: 'Stato',
      accessor: 'read' as keyof DisplayNotification,
      render: (n: DisplayNotification) => (
        <Badge variant={n.read ? 'default' : 'warning'}>
          {n.read ? 'LETTA' : 'NON LETTA'}
        </Badge>
      ),
    },
    {
      header: 'Azioni',
      accessor: 'id' as keyof DisplayNotification,
      render: (n: DisplayNotification) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(n);
          }}
          disabled={isUpdating}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoadingNotifications) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bell className="h-12 w-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Caricamento notifiche...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Indietro
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Centro Notifiche
            </h1>
            <p className="text-gray-600 mt-1">
              Gestisci notifiche e alert di sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleMarkAllAsRead}
              disabled={isUpdating || unreadCount === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Segna Tutte Lette
            </Button>
            <Button
              variant="danger"
              onClick={handleClearAll}
              disabled={isUpdating || totalNotifications === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina Tutte
            </Button>
            <Button variant="primary" onClick={() => refetchNotifications()}>
              <Bell className="w-4 h-4 mr-2" />
              Aggiorna
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totali</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalNotifications}
              </p>
            </div>
            <Bell className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Non Lette</p>
              <p className="text-2xl font-bold text-orange-600">
                {unreadCount}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avvisi</p>
              <p className="text-2xl font-bold text-yellow-600">{warnCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Errori</p>
              <p className="text-2xl font-bold text-red-600">{errorCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cerca notifiche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tutti i Livelli</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
            <option value="FATAL">Fatal</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tutti gli Stati</option>
            <option value="UNREAD">Non Lette</option>
            <option value="READ">Lette</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nessuna Notifica
          </h3>
          <p className="text-gray-600">
            {searchTerm || levelFilter !== 'ALL' || readFilter !== 'ALL'
              ? 'Nessuna notifica trovata con i filtri selezionati'
              : 'Non ci sono notifiche da visualizzare'}
          </p>
        </Card>
      ) : (
        <Card>
          <Table
            columns={columns}
            data={filteredNotifications}
            onRowClick={handleRowClick}
          />
        </Card>
      )}

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Dettaglio Notifica
              </h2>
              <Button
                variant="secondary"
                onClick={() => setSelectedNotification(null)}
              >
                Chiudi
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Tipo
                  </h3>
                  {getTypeBadge(selectedNotification.displayType)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Livello
                  </h3>
                  {getLevelBadge(selectedNotification.level)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Stato
                  </h3>
                  <Badge
                    variant={selectedNotification.read ? 'default' : 'warning'}
                  >
                    {selectedNotification.read ? 'LETTA' : 'NON LETTA'}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Data/Ora
                  </h3>
                  <p className="text-gray-900">
                    {formatTimestamp(selectedNotification.timestamp)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-3">Messaggio</h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.redirectUrl && (
                <div className="border-t pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                    <div className="flex items-center mb-2">
                      <Info className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-900">
                        Azione Disponibile
                      </h3>
                    </div>
                    <p className="text-sm text-blue-800">
                      Questa notifica ha un'azione associata.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleTakeAction(selectedNotification)}
                    >
                      Vai alla Pagina
                    </Button>
                    {!selectedNotification.read && (
                      <Button
                        variant="secondary"
                        onClick={() => handleMarkAsRead(selectedNotification)}
                        disabled={isUpdating}
                      >
                        Segna come Letta
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(selectedNotification)}
                      disabled={isUpdating}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Elimina
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsCenterPage;
