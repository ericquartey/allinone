// ============================================================================
// EJLOG WMS - Manual Command Panel Component
// Panel for sending manual commands to PLC devices with template support
// ============================================================================

import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Alert from '../shared/Alert';
import {
  useGetPLCCommandTemplatesQuery,
  useSendPLCCommandMutation,
  useGetPLCCommandsQuery
} from '../../services/api/plcApi';
import { PLCDevice, PLCCommandType, PLCCommandTemplate } from '../../types/plc';

interface ManualCommandPanelProps {
  device: PLCDevice;
  onCommandSent?: () => void;
}

const ManualCommandPanel: React.FC<ManualCommandPanelProps> = ({ device, onCommandSent }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PLCCommandTemplate | null>(null);
  const [commandType, setCommandType] = useState<PLCCommandType>('CUSTOM');
  const [commandString, setCommandString] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [priority, setPriority] = useState<number>(5);
  const [reason, setReason] = useState<string>('');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // API queries
  const { data: templates, isLoading: isLoadingTemplates } = useGetPLCCommandTemplatesQuery();
  const {
    data: recentCommands,
    refetch: refetchCommands
  } = useGetPLCCommandsQuery({ deviceId: device.id, limit: 10 });
  const [sendCommand, { isLoading: isSending }] = useSendPLCCommandMutation();

  // Filter templates by device type
  const availableTemplates = templates?.filter(
    t => t.deviceTypes.includes(device.type) || t.deviceTypes.includes('GENERIC')
  ) || [];

  // Handle template selection
  useEffect(() => {
    if (selectedTemplate) {
      setCommandType(selectedTemplate.type);
      setCommandString(selectedTemplate.command);

      // Initialize parameters with default values
      const initialParams: Record<string, any> = {};
      selectedTemplate.parameters.forEach(param => {
        initialParams[param.name] = param.defaultValue;
      });
      setParameters(initialParams);
    }
  }, [selectedTemplate]);

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleSendCommand = async () => {
    if (!commandString) {
      setActionResult({ type: 'error', message: 'Inserisci un comando' });
      return;
    }

    if (!reason) {
      setActionResult({ type: 'error', message: 'Inserisci una motivazione per il comando' });
      return;
    }

    // Validate required parameters
    if (selectedTemplate) {
      const missingParams = selectedTemplate.parameters
        .filter(p => p.required && !parameters[p.name])
        .map(p => p.name);

      if (missingParams.length > 0) {
        setActionResult({
          type: 'error',
          message: `Parametri obbligatori mancanti: ${missingParams.join(', ')}`
        });
        return;
      }
    }

    try {
      const response = await sendCommand({
        deviceId: device.id,
        type: commandType,
        command: commandString,
        parameters,
        priority,
        reason
      }).unwrap();

      setActionResult({
        type: 'success',
        message: `Comando inviato con successo. ID: ${response.commandId}`
      });

      // Reset form
      setCommandString('');
      setParameters({});
      setReason('');
      setSelectedTemplate(null);

      // Refresh commands list
      refetchCommands();
      onCommandSent?.();
    } catch (error) {
      setActionResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore durante l\'invio del comando'
      });
    }
  };

  const handleQuickCommand = (type: PLCCommandType, command: string) => {
    setCommandType(type);
    setCommandString(command);
    setSelectedTemplate(null);
    setParameters({});
  };

  const commandTypeOptions = [
    { value: 'START', label: 'START - Avvia dispositivo' },
    { value: 'STOP', label: 'STOP - Ferma dispositivo' },
    { value: 'RESET', label: 'RESET - Reset dispositivo' },
    { value: 'PAUSE', label: 'PAUSE - Pausa operazione' },
    { value: 'RESUME', label: 'RESUME - Riprendi operazione' },
    { value: 'MOVE', label: 'MOVE - Comando movimento' },
    { value: 'LOAD', label: 'LOAD - Carica' },
    { value: 'UNLOAD', label: 'UNLOAD - Scarica' },
    { value: 'EMERGENCY_STOP', label: 'EMERGENCY_STOP - Arresto emergenza' },
    { value: 'WRITE_SIGNAL', label: 'WRITE_SIGNAL - Scrivi segnale' },
    { value: 'CUSTOM', label: 'CUSTOM - Comando personalizzato' }
  ];

  return (
    <Card title="Comandi Manuali">
      <div className="space-y-6">
        {/* Warning Banner */}
        <Alert variant="warning">
          ⚠️ <strong>Attenzione:</strong> I comandi manuali possono influenzare il funzionamento del sistema.
          Assicurati di conoscere le conseguenze prima di procedere.
        </Alert>

        {/* Action Result */}
        {actionResult && (
          <Alert variant={actionResult.type === 'success' ? 'success' : 'danger'}>
            {actionResult.message}
          </Alert>
        )}

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Azioni Rapide</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="success"
              size="sm"
              fullWidth
              onClick={() => handleQuickCommand('START', 'START')}
              disabled={!device.isConnected || isSending}
            >
              ▶️ Start
            </Button>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => handleQuickCommand('STOP', 'STOP')}
              disabled={!device.isConnected || isSending}
            >
              ⏸️ Stop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => handleQuickCommand('RESET', 'RESET')}
              disabled={!device.isConnected || isSending}
            >
              🔄 Reset
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={() => handleQuickCommand('EMERGENCY_STOP', 'EMERGENCY_STOP')}
              disabled={!device.isConnected || isSending}
            >
              🛑 E-Stop
            </Button>
          </div>
        </div>

        {/* Template Selection */}
        {!isLoadingTemplates && availableTemplates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Comandi Predefiniti
            </label>
            <Select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = availableTemplates.find(t => t.id === e.target.value);
                setSelectedTemplate(template || null);
              }}
              options={[
                { value: '', label: 'Seleziona un template...' },
                ...availableTemplates.map(t => ({
                  value: t.id,
                  label: `${t.name} - ${t.description}`
                }))
              ]}
              className="w-full"
            />
          </div>
        )}

        {/* Command Builder */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Costruisci Comando</h3>

          {/* Command Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Comando
            </label>
            <Select
              value={commandType}
              onChange={(e) => setCommandType(e.target.value as PLCCommandType)}
              options={commandTypeOptions}
              className="w-full"
              disabled={!!selectedTemplate}
            />
          </div>

          {/* Command String */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comando <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={commandString}
              onChange={(e) => setCommandString(e.target.value)}
              placeholder="es: MOVE X100 Y200 Z50"
              className="w-full font-mono"
              disabled={!!selectedTemplate}
            />
          </div>

          {/* Template Parameters */}
          {selectedTemplate && selectedTemplate.parameters.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-gray-300">
              <h4 className="text-sm font-medium text-gray-700">Parametri Template</h4>
              {selectedTemplate.parameters.map(param => (
                <div key={param.name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {param.name} {param.required && <span className="text-red-500">*</span>}
                    <span className="text-gray-400 ml-2">({param.description})</span>
                  </label>
                  {param.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={parameters[param.name] || false}
                      onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  ) : param.type === 'number' ? (
                    <Input
                      type="number"
                      value={parameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                      placeholder={`Valore predefinito: ${param.defaultValue}`}
                      className="w-full"
                    />
                  ) : (
                    <Input
                      type="text"
                      value={parameters[param.name] || ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      placeholder={`Valore predefinito: ${param.defaultValue}`}
                      className="w-full"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priorità (0-10)
            </label>
            <Input
              type="range"
              min={0}
              max={10}
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Bassa (0)</span>
              <span className="font-semibold text-gray-900">{priority}</span>
              <span>Alta (10)</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivazione <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descrivi la ragione del comando..."
              className="w-full"
            />
          </div>

          {/* Send Button */}
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleSendCommand}
            loading={isSending}
            disabled={!device.isConnected || isSending || !commandString || !reason}
          >
            {isSending ? 'Invio in corso...' : 'Invia Comando'}
          </Button>
        </div>

        {/* Recent Commands */}
        {recentCommands && recentCommands.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Comandi Recenti</h3>
            <div className="space-y-2">
              {recentCommands.slice(0, 5).map(cmd => (
                <div
                  key={cmd.id}
                  className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-gray-900 truncate">{cmd.command}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(cmd.createdAt).toLocaleString('it-IT')} - {cmd.userName}
                    </p>
                  </div>
                  <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded ${
                    cmd.status === 'EXECUTED' ? 'bg-green-100 text-green-800' :
                    cmd.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cmd.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Device Status Check */}
        {!device.isConnected && (
          <Alert variant="warning">
            Il dispositivo deve essere connesso per inviare comandi manuali.
          </Alert>
        )}
      </div>
    </Card>
  );
};

export default ManualCommandPanel;
