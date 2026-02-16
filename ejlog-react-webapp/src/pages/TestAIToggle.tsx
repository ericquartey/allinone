// ============================================================================
// Test AI Toggle - Pagina di debug per verificare Redux
// ============================================================================

import { useDispatch, useSelector } from 'react-redux';
import { toggleAIAssistant, selectAISettings, selectSettings } from '../features/settings/settingsSlice';

export default function TestAIToggle() {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const aiSettings = useSelector(selectAISettings);

  const handleToggle = () => {
    console.log('=== TOGGLE CLICKED ===');
    console.log('Before dispatch - aiSettings:', aiSettings);
    dispatch(toggleAIAssistant());
    console.log('After dispatch');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Test AI Toggle</h1>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Stato Redux Completo</h2>
        <pre style={{ background: 'white', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>

      <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>AI Settings</h2>
        <pre style={{ background: 'white', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(aiSettings, null, 2)}
        </pre>
      </div>

      <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Stato AI Assistant</h2>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          {aiSettings?.enabled ? '✅ ATTIVO' : '❌ DISATTIVO'}
        </div>

        <button
          onClick={handleToggle}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: aiSettings?.enabled ? '#f44336' : '#4CAF50',
            color: 'white'
          }}
        >
          {aiSettings?.enabled ? 'DISATTIVA AI' : 'ATTIVA AI'}
        </button>
      </div>

      <div style={{ background: '#f3e5f5', padding: '20px', borderRadius: '8px' }}>
        <h2>localStorage</h2>
        <pre style={{ background: 'white', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {localStorage.getItem('ejlog_settings') || 'Nessun dato'}
        </pre>
        <button
          onClick={() => {
            localStorage.removeItem('ejlog_settings');
            window.location.reload();
          }}
          style={{
            padding: '10px 20px',
            marginTop: '10px',
            borderRadius: '4px',
            border: '1px solid #999',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          🗑️ Reset localStorage e ricarica
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff9c4', borderRadius: '8px' }}>
        <strong>💡 Istruzioni:</strong>
        <ul>
          <li>Apri la Console (F12)</li>
          <li>Clicca sul pulsante "ATTIVA AI"</li>
          <li>Verifica i log nella console</li>
          <li>Controlla se lo stato cambia visivamente</li>
        </ul>
      </div>
    </div>
  );
}
