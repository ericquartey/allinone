/**
 * Migrazione Database - Tabelle Liste e ListeDettaglio
 * Creazione tabelle complete per Gestione Liste con tutti i campi necessari
 */

USE promag;
GO

-- ============================================
-- Tabella Liste (Testata)
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Liste]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Liste] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [codice] NVARCHAR(50) NOT NULL UNIQUE,
        [descrizione] NVARCHAR(255) NULL,
        [tipo] NVARCHAR(50) NOT NULL, -- Picking, Refilling, Inventario, Riordino
        [stato] NVARCHAR(50) NOT NULL DEFAULT 'Nuova', -- Nuova, InEsecuzione, Completata, Annullata, InPausa
        [priorita] NVARCHAR(20) NOT NULL DEFAULT 'Media', -- Alta, Media, Bassa

        -- Date e timestamp
        [dataCreazione] DATETIME NOT NULL DEFAULT GETDATE(),
        [dataInizioEsecuzione] DATETIME NULL,
        [dataCompletamento] DATETIME NULL,
        [dataAnnullamento] DATETIME NULL,

        -- Utenti
        [idUtenteCreazione] INT NULL,
        [idUtenteEsecuzione] INT NULL,

        -- Ubicazione destinazione
        [idUbicazioneDestinazione] INT NULL,

        -- Note e motivazioni
        [note] NVARCHAR(MAX) NULL,
        [motivoAnnullamento] NVARCHAR(MAX) NULL,

        -- Foreign Keys (se le tabelle esistono)
        CONSTRAINT FK_Liste_UtenteCreazione FOREIGN KEY ([idUtenteCreazione])
            REFERENCES [dbo].[Utenti]([id]) ON DELETE SET NULL,
        CONSTRAINT FK_Liste_UtenteEsecuzione FOREIGN KEY ([idUtenteEsecuzione])
            REFERENCES [dbo].[Utenti]([id]) ON DELETE SET NULL,
        CONSTRAINT FK_Liste_Ubicazione FOREIGN KEY ([idUbicazioneDestinazione])
            REFERENCES [dbo].[Ubicazioni]([id]) ON DELETE SET NULL,

        -- Indici
        INDEX IX_Liste_Codice NONCLUSTERED ([codice]),
        INDEX IX_Liste_Tipo NONCLUSTERED ([tipo]),
        INDEX IX_Liste_Stato NONCLUSTERED ([stato]),
        INDEX IX_Liste_Priorita NONCLUSTERED ([priorita]),
        INDEX IX_Liste_DataCreazione NONCLUSTERED ([dataCreazione] DESC)
    );

    PRINT '✅ Tabella Liste creata con successo';
END
ELSE
BEGIN
    PRINT '⚠️  Tabella Liste già esistente, verifico colonne...';

    -- Aggiungi colonne se non esistono
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Liste]') AND name = 'priorita')
    BEGIN
        ALTER TABLE [dbo].[Liste] ADD [priorita] NVARCHAR(20) NOT NULL DEFAULT 'Media';
        PRINT '   ✅ Aggiunta colonna priorita';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Liste]') AND name = 'motivoAnnullamento')
    BEGIN
        ALTER TABLE [dbo].[Liste] ADD [motivoAnnullamento] NVARCHAR(MAX) NULL;
        PRINT '   ✅ Aggiunta colonna motivoAnnullamento';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Liste]') AND name = 'idUbicazioneDestinazione')
    BEGIN
        ALTER TABLE [dbo].[Liste] ADD [idUbicazioneDestinazione] INT NULL;
        PRINT '   ✅ Aggiunta colonna idUbicazioneDestinazione';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Liste]') AND name = 'note')
    BEGIN
        ALTER TABLE [dbo].[Liste] ADD [note] NVARCHAR(MAX) NULL;
        PRINT '   ✅ Aggiunta colonna note';
    END

    PRINT '✅ Verifica colonne tabella Liste completata';
END
GO

-- ============================================
-- Tabella ListeDettaglio (Righe)
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ListeDettaglio]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ListeDettaglio] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [idLista] INT NOT NULL,
        [idArticolo] INT NOT NULL,

        -- Quantità
        [quantita] FLOAT NOT NULL,
        [quantitaPrelevata] FLOAT NOT NULL DEFAULT 0,

        -- Ubicazione e lotto
        [idUbicazione] INT NULL,
        [lotto] NVARCHAR(50) NULL,

        -- Gestione inevadibilità
        [inevadibile] BIT NOT NULL DEFAULT 0,
        [motivoInevadibilita] NVARCHAR(MAX) NULL,

        -- Note
        [note] NVARCHAR(MAX) NULL,

        -- Foreign Keys
        CONSTRAINT FK_ListeDettaglio_Lista FOREIGN KEY ([idLista])
            REFERENCES [dbo].[Liste]([id]) ON DELETE CASCADE,
        CONSTRAINT FK_ListeDettaglio_Articolo FOREIGN KEY ([idArticolo])
            REFERENCES [dbo].[Articoli]([id]) ON DELETE NO ACTION,
        CONSTRAINT FK_ListeDettaglio_Ubicazione FOREIGN KEY ([idUbicazione])
            REFERENCES [dbo].[Ubicazioni]([id]) ON DELETE SET NULL,

        -- Indici
        INDEX IX_ListeDettaglio_Lista NONCLUSTERED ([idLista]),
        INDEX IX_ListeDettaglio_Articolo NONCLUSTERED ([idArticolo]),
        INDEX IX_ListeDettaglio_Inevadibile NONCLUSTERED ([inevadibile])
    );

    PRINT '✅ Tabella ListeDettaglio creata con successo';
END
ELSE
BEGIN
    PRINT '⚠️  Tabella ListeDettaglio già esistente, verifico colonne...';

    -- Aggiungi colonne se non esistono
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ListeDettaglio]') AND name = 'inevadibile')
    BEGIN
        ALTER TABLE [dbo].[ListeDettaglio] ADD [inevadibile] BIT NOT NULL DEFAULT 0;
        PRINT '   ✅ Aggiunta colonna inevadibile';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ListeDettaglio]') AND name = 'motivoInevadibilita')
    BEGIN
        ALTER TABLE [dbo].[ListeDettaglio] ADD [motivoInevadibilita] NVARCHAR(MAX) NULL;
        PRINT '   ✅ Aggiunta colonna motivoInevadibilita';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ListeDettaglio]') AND name = 'lotto')
    BEGIN
        ALTER TABLE [dbo].[ListeDettaglio] ADD [lotto] NVARCHAR(50) NULL;
        PRINT '   ✅ Aggiunta colonna lotto';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ListeDettaglio]') AND name = 'note')
    BEGIN
        ALTER TABLE [dbo].[ListeDettaglio] ADD [note] NVARCHAR(MAX) NULL;
        PRINT '   ✅ Aggiunta colonna note';
    END

    PRINT '✅ Verifica colonne tabella ListeDettaglio completata';
END
GO

-- ============================================
-- Dati di esempio per testing
-- ============================================

-- Inserisci liste di esempio solo se la tabella è vuota
IF NOT EXISTS (SELECT 1 FROM [dbo].[Liste])
BEGIN
    PRINT '📝 Creazione dati di esempio...';

    -- Lista Picking
    INSERT INTO [dbo].[Liste] (
        codice, descrizione, tipo, stato, priorita,
        idUtenteCreazione, dataCreazione
    )
    VALUES (
        'PICK-001', 'Lista Picking Ordine 12345', 'Picking', 'Nuova', 'Alta',
        (SELECT TOP 1 id FROM [dbo].[Utenti] WHERE utente = 'superuser'),
        GETDATE()
    );

    -- Lista Refilling
    INSERT INTO [dbo].[Liste] (
        codice, descrizione, tipo, stato, priorita,
        idUtenteCreazione, dataCreazione
    )
    VALUES (
        'REF-001', 'Refilling Cassetti Zona A', 'Refilling', 'Nuova', 'Media',
        (SELECT TOP 1 id FROM [dbo].[Utenti] WHERE utente = 'superuser'),
        GETDATE()
    );

    -- Lista Inventario
    INSERT INTO [dbo].[Liste] (
        codice, descrizione, tipo, stato, priorita,
        idUtenteCreazione, dataCreazione
    )
    VALUES (
        'INV-001', 'Inventario Annuale 2025', 'Inventario', 'Nuova', 'Bassa',
        (SELECT TOP 1 id FROM [dbo].[Utenti] WHERE utente = 'admin'),
        GETDATE()
    );

    PRINT '✅ Dati di esempio creati';
END
ELSE
BEGIN
    PRINT '⚠️  Liste già presenti, skip dati di esempio';
END
GO

PRINT '';
PRINT '╔═══════════════════════════════════════════════════════╗';
PRINT '║  ✅ Migrazione Liste completata con successo!         ║';
PRINT '╚═══════════════════════════════════════════════════════╝';
PRINT '';

-- Verifica tabelle create
SELECT
    t.name AS TableName,
    SUM(p.rows) AS RowCount,
    COUNT(c.column_id) AS ColumnCount
FROM sys.tables t
LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
LEFT JOIN sys.columns c ON t.object_id = c.object_id
WHERE t.name IN ('Liste', 'ListeDettaglio')
GROUP BY t.name;
GO
