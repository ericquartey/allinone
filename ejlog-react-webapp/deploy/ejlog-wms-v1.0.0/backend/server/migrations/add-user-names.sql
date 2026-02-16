-- ============================================================================
-- Migrazione: Aggiungi campi nome e cognome alla tabella Utenti
-- ============================================================================

-- Verifica se le colonne esistono già
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'Utenti' AND COLUMN_NAME = 'nome')
BEGIN
    ALTER TABLE Utenti
    ADD nome NVARCHAR(100) NULL;

    PRINT 'Colonna "nome" aggiunta con successo';
END
ELSE
BEGIN
    PRINT 'Colonna "nome" esiste gi\u00e0';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME = 'Utenti' AND COLUMN_NAME = 'cognome')
BEGIN
    ALTER TABLE Utenti
    ADD cognome NVARCHAR(100) NULL;

    PRINT 'Colonna "cognome" aggiunta con successo';
END
ELSE
BEGIN
    PRINT 'Colonna "cognome" esiste gi\u00e0';
END

-- Aggiorna alcuni utenti di esempio con nomi completi
UPDATE Utenti SET nome = 'Super', cognome = 'User' WHERE utente = 'superuser';
UPDATE Utenti SET nome = 'Admin', cognome = 'Istrator' WHERE utente = 'admin';
UPDATE Utenti SET nome = 'Test', cognome = 'User' WHERE utente = 'user';

PRINT 'Migrazione completata con successo!';
