import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '40px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'red', fontSize: '48px' }}>✅ TEST PAGE FUNZIONA!</h1>
      <p style={{ fontSize: '24px' }}>Se vedi questo messaggio, il routing funziona correttamente.</p>
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>Prossimo Step:</h2>
        <p>Sostituire questa pagina con ListManagementPageEnhancedSimple</p>
      </div>
    </div>
  );
};

export default TestPage;
