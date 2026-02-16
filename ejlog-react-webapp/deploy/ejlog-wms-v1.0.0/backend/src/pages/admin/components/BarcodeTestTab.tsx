// ============================================================================
// EJLOG WMS - Barcode Test Tab
// Test e validazione interattiva dei barcode contro le regole
// ============================================================================

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  PlayArrow as TestIcon,
  CheckCircle as SuccessIcon,
  Cancel as FailIcon,
} from '@mui/icons-material';

import {
  useGetBarcodeRulesQuery,
  useParseBarcodeMutation,
  useValidateBarcodeMutation,
} from '../../../services/api/barcodesApi';

interface ParseResult {
  success: boolean;
  message: string;
  barcode: string;
  extractedData: Record<string, any> | null;
  matchedRule: {
    id: number;
    name: string;
    format: string;
  } | null;
}

interface ValidationResult {
  ruleId: number;
  valid: boolean;
  ruleName: string;
}

export function BarcodeTestTab() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

  const { data: rules = [], isLoading: rulesLoading } = useGetBarcodeRulesQuery();
  const [parseBarcode, { isLoading: isParsing }] = useParseBarcodeMutation();
  const [validateBarcode, { isLoading: isValidating }] = useValidateBarcodeMutation();

  // Test barcode contro tutte le regole (trova la prima che matcha)
  const handleParseBarcode = async () => {
    if (!barcodeInput.trim()) {
      return;
    }

    try {
      const result = await parseBarcode({ barcode: barcodeInput }).unwrap();
      setParseResult(result as ParseResult);
      setValidationResults([]); // Reset validation results
    } catch (error) {
      console.error('Errore parsing barcode:', error);
      setParseResult({
        success: false,
        message: 'Errore durante il parsing',
        barcode: barcodeInput,
        extractedData: null,
        matchedRule: null,
      });
    }
  };

  // Test barcode contro una regola specifica
  const handleValidateAgainstRule = async (ruleId: number, ruleName: string) => {
    if (!barcodeInput.trim()) {
      return;
    }

    try {
      const result = await validateBarcode({
        barcode: barcodeInput,
        ruleId,
      }).unwrap();

      setValidationResults((prev) => {
        const updated = prev.filter((r) => r.ruleId !== ruleId);
        return [...updated, { ruleId, valid: result.valid, ruleName }];
      });
    } catch (error) {
      console.error('Errore validazione barcode:', error);
    }
  };

  // Test contro tutte le regole contemporaneamente
  const handleTestAllRules = async () => {
    if (!barcodeInput.trim()) {
      return;
    }

    setValidationResults([]);

    for (const rule of rules.filter((r) => r.active)) {
      await handleValidateAgainstRule(rule.id, rule.name);
    }
  };

  const getValidationResultForRule = (ruleId: number) => {
    return validationResults.find((r) => r.ruleId === ruleId);
  };

  if (rulesLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Input Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Barcode
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Inserisci un barcode per testarlo contro le regole configurate
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Barcode"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleParseBarcode();
              }
            }}
            placeholder="Es: 1234567890123, (01)12345678901234(10)ABC123"
            fullWidth
            autoFocus
          />
          <Button
            variant="contained"
            startIcon={<TestIcon />}
            onClick={handleParseBarcode}
            disabled={!barcodeInput.trim() || isParsing}
            sx={{ minWidth: 200 }}
          >
            {isParsing ? 'Test...' : 'Test con Auto-Match'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleTestAllRules}
            disabled={!barcodeInput.trim() || isValidating}
            sx={{ minWidth: 200 }}
          >
            Test con Tutte le Regole
          </Button>
        </Box>

        {/* Quick Examples */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Esempi veloci:
          </Typography>
          {[
            { label: 'EAN-13', value: '1234567890123' },
            { label: 'EAN-8', value: '12345678' },
            { label: 'Code128', value: 'ABC12345' },
            { label: 'SSCC', value: '001234567890123456789' },
          ].map((example) => (
            <Chip
              key={example.value}
              label={example.label}
              size="small"
              onClick={() => setBarcodeInput(example.value)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Paper>

      {/* Parse Results */}
      {parseResult && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Risultato Auto-Match
          </Typography>

          {parseResult.success ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="success" icon={<SuccessIcon />}>
                  {parseResult.message}
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Regola Trovata
                    </Typography>
                    <Typography variant="h6">{parseResult.matchedRule?.name}</Typography>
                    <Chip
                      label={parseResult.matchedRule?.format}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Dati Estratti
                    </Typography>
                    {parseResult.extractedData && Object.keys(parseResult.extractedData).length > 0 ? (
                      <Box component="pre" sx={{ fontSize: '0.85em', mt: 1, mb: 0 }}>
                        {JSON.stringify(parseResult.extractedData, null, 2)}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nessun dato estratto
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="warning" icon={<FailIcon />}>
              {parseResult.message}
            </Alert>
          )}
        </Paper>
      )}

      {/* Individual Rule Validation */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Contro Singole Regole
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
          Clicca "Test" per validare il barcode contro una regola specifica
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome Regola</TableCell>
                <TableCell>Pattern</TableCell>
                <TableCell>Formato</TableCell>
                <TableCell>Priorità</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell align="center">Risultato</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules
                .filter((rule) => rule.active)
                .map((rule) => {
                  const validationResult = getValidationResultForRule(rule.id);

                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <strong>{rule.name}</strong>
                      </TableCell>
                      <TableCell>
                        <code
                          style={{
                            fontSize: '0.8em',
                            background: '#f5f5f5',
                            padding: '2px 6px',
                            borderRadius: '3px',
                          }}
                        >
                          {rule.pattern}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Chip label={rule.format} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Chip
                          label={rule.active ? 'Attiva' : 'Inattiva'}
                          size="small"
                          color={rule.active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {validationResult ? (
                          validationResult.valid ? (
                            <Chip
                              label="Valido"
                              color="success"
                              size="small"
                              icon={<SuccessIcon />}
                            />
                          ) : (
                            <Chip
                              label="Non Valido"
                              color="error"
                              size="small"
                              icon={<FailIcon />}
                            />
                          )
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleValidateAgainstRule(rule.id, rule.name)}
                          disabled={!barcodeInput.trim() || isValidating}
                        >
                          Test
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {rules.filter((r) => r.active).length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Nessuna regola attiva disponibile per il test
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
