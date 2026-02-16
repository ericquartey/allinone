// Script per modificare App.tsx con auto-login forzato
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Modifica import: restoreSession -> setCredentials
content = content.replace(
  "import { restoreSession } from './features/auth/authSlice';",
  "import { setCredentials } from './features/auth/authSlice';"
);

// 2. Aggiungi funzione getSuperuserPassword prima di ProtectedRoute
const getSuperuserFunction = `
// ============================================================================
// AUTO-LOGIN SUPERUSER - Password Dinamica
// ============================================================================
function getSuperuserPassword(): string {
  const now = new Date();
  const day = now.getDate();
  const dd = (31 - day).toString().padStart(2, '0');
  return \`promag\${dd}fergrp_2012\`;
}

`;

content = content.replace(
  '// Protected Route Component',
  getSuperuserFunction + '// Protected Route Component'
);

// 3. Modifica AppRouter per aggiungere auto-login
const oldAppRouter = `const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Ripristina sessione da localStorage
    dispatch(restoreSession());
  }, [dispatch]);`;

const newAppRouter = `const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    // ========================================================================
    // AUTO-LOGIN PERMANENTE COME SUPERUSER
    // ========================================================================
    if (!isAuthenticated) {
      const superuserPassword = getSuperuserPassword();
      const today = new Date().toISOString().split('T')[0];

      const superuser = {
        username: 'superuser',
        accessLevel: 'ADMIN' as const,
        roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'],
        fullName: 'Super User (AUTO-LOGIN)',
        email: 'superuser@ejlog.local',
      };

      console.log('\n' + '='.repeat(70));
      console.log('🔐 EJLOG WMS - AUTO-LOGIN SUPERUSER');
      console.log('='.repeat(70));
      console.log(\`📅 Data: \${today}\`);
      console.log(\`👤 Username: superuser\`);
      console.log(\`🔑 Password oggi: \${superuserPassword}\`);
      console.log(\`✅ Access Level: ADMIN\`);
      console.log(\`📋 Roles: \${superuser.roles.join(', ')}\`);
      console.log('='.repeat(70) + '\n');

      dispatch(setCredentials({
        user: superuser,
        token: 'dev_auto_login_token_superuser'
      }));
    }
  }, [dispatch, isAuthenticated]);`;

content = content.replace(oldAppRouter, newAppRouter);

// 4. Rimuovi rotte login (redirect a home)
content = content.replace(
  '<Route path="/login" element={<LoginPage />} />',
  '<Route path="/login" element={<Navigate to="/" replace />} />'
);
content = content.replace(
  '<Route path="/login/badge" element={<BadgeLoginPage />} />',
  '<Route path="/login/badge" element={<Navigate to="/" replace />} />'
);

// Salva file
fs.writeFileSync(appPath, content, 'utf8');
console.log('✅ App.tsx modificato con successo! Auto-login superuser attivato.');
