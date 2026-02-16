import { useState } from 'react';
import { Button, Card, Input, BarcodeInput, Modal, Loading, Badge, Table } from '../components/common';
import { Search } from 'lucide-react';

/**
 * Component Test Page
 *
 * This page is used for Playwright E2E testing of common components.
 * It demonstrates all component variants and states.
 */
const ComponentTestPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeLog, setBarcodeLog] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleBarcodeScan = (barcode) => {
    const logEntry = {
      barcode,
      timestamp: new Date().toLocaleTimeString(),
    };
    setBarcodeLog((prev) => [logEntry, ...prev]);
    setBarcodeValue(barcode);
  };

  const validateInput = (value) => {
    if (value.length < 3) {
      setInputError('Minimo 3 caratteri richiesti');
    } else {
      setInputError('');
    }
  };

  const tableData = [
    { id: 1, name: 'Articolo 1', code: 'ART001', quantity: 100 },
    { id: 2, name: 'Articolo 2', code: 'ART002', quantity: 50 },
    { id: 3, name: 'Articolo 3', code: 'ART003', quantity: 75 },
  ];

  const tableColumns = [
    { accessorKey: 'code', header: 'Codice' },
    { accessorKey: 'name', header: 'Nome' },
    { accessorKey: 'quantity', header: 'Quantità' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Component Test Page</h1>
          <p className="text-gray-600 mt-2">
            Page for testing common components with Playwright E2E tests
          </p>
        </div>

        {/* Buttons Section */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" data-testid="btn-primary">
              Primary
            </Button>
            <Button variant="secondary" data-testid="btn-secondary">
              Secondary
            </Button>
            <Button variant="outline" data-testid="btn-outline">
              Outline
            </Button>
            <Button variant="ghost" data-testid="btn-ghost">
              Ghost
            </Button>
            <Button variant="danger" data-testid="btn-danger">
              Danger
            </Button>
            <Button variant="success" data-testid="btn-success">
              Success
            </Button>
            <Button variant="primary" loading data-testid="btn-loading">
              Loading
            </Button>
            <Button variant="primary" disabled data-testid="btn-disabled">
              Disabled
            </Button>
          </div>
          <div className="mt-4 flex gap-3">
            <Button size="sm" data-testid="btn-small">
              Small
            </Button>
            <Button size="md" data-testid="btn-medium">
              Medium
            </Button>
            <Button size="lg" data-testid="btn-large">
              Large
            </Button>
          </div>
        </Card>

        {/* Input Section */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Input</h2>
          <div className="space-y-4 max-w-md">
            <Input
              label="Nome utente"
              placeholder="Inserisci nome"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                validateInput(e.target.value);
              }}
              error={inputError}
              required
              data-testid="input-username"
            />
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              icon={Search}
              helperText="Inserisci un indirizzo email valido"
              data-testid="input-email"
            />
            <Input
              label="Password"
              type="password"
              disabled
              placeholder="Password disabilitata"
              data-testid="input-disabled"
            />
          </div>
        </Card>

        {/* BarcodeInput Section */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">BarcodeInput (CRITICAL for RF)</h2>
          <div className="space-y-4">
            <BarcodeInput
              label="Scansiona Barcode"
              onScan={handleBarcodeScan}
              placeholder="Scansiona o inserisci manualmente..."
              data-testid="barcode-input"
            />

            {barcodeValue && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Ultimo barcode scansionato:</strong> {barcodeValue}
                </p>
              </div>
            )}

            {/* Barcode Log */}
            {barcodeLog.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Log Scansioni:</h3>
                <div className="space-y-2" data-testid="barcode-log">
                  {barcodeLog.slice(0, 5).map((log, index) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-100 rounded text-sm"
                    >
                      <span className="font-mono">{log.barcode}</span>
                      <span className="text-gray-500 ml-2">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Modal Section */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Modal</h2>
          <Button onClick={() => setModalOpen(true)} data-testid="btn-open-modal">
            Open Modal
          </Button>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Test Modal"
            footer={
              <Modal.Footer
                onCancel={() => setModalOpen(false)}
                onConfirm={() => {
                  alert('Confirmed!');
                  setModalOpen(false);
                }}
              />
            }
          >
            <p data-testid="modal-content">
              This is modal content for testing. It has a title, body, and footer with actions.
            </p>
          </Modal>
        </Card>

        {/* Badge Section */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge color="gray" data-testid="badge-gray">
              Gray
            </Badge>
            <Badge color="red" data-testid="badge-red">
              Red
            </Badge>
            <Badge color="green" data-testid="badge-green">
              Green
            </Badge>
            <Badge color="blue" data-testid="badge-blue">
              Blue
            </Badge>
            <Badge color="yellow" data-testid="badge-yellow">
              Yellow
            </Badge>
          </div>
        </Card>

        {/* Table Section */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Table</h2>
          <Table data={tableData} columns={tableColumns} pageSize={5} data-testid="test-table" />
        </Card>

        {/* Loading Section */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Loading</h2>
          <div className="p-8 flex justify-center">
            <Loading data-testid="loading-spinner" />
          </div>
        </Card>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card hover data-testid="card-hover">
            <h3 className="font-semibold">Hoverable Card</h3>
            <p className="text-sm text-gray-600 mt-2">Hover over me!</p>
          </Card>
          <Card padding="sm" data-testid="card-small">
            <h3 className="font-semibold">Small Padding</h3>
          </Card>
          <Card padding="lg" data-testid="card-large">
            <h3 className="font-semibold">Large Padding</h3>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ComponentTestPage;
