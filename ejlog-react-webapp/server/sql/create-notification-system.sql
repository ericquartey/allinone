-- ============================================
-- Sistema di Notifiche Real-Time per EjLog
-- ============================================
-- Questo script crea una tabella di notifiche e trigger
-- per rilevare modifiche istantanee dal sistema Java EjLog
-- ============================================

USE promag;
GO

-- ============================================
-- 1. Crea tabella DatabaseNotifications
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DatabaseNotifications')
BEGIN
    CREATE TABLE DatabaseNotifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        eventType VARCHAR(50) NOT NULL,           -- INSERT, UPDATE, DELETE
        tableName VARCHAR(100) NOT NULL,          -- Nome tabella modificata
        recordId INT NOT NULL,                    -- ID del record modificato
        eventData NVARCHAR(MAX),                  -- Dati in formato JSON
        createdAt DATETIME2 DEFAULT GETDATE(),    -- Timestamp evento
        processed BIT DEFAULT 0,                  -- Flag elaborazione
        processedAt DATETIME2 NULL,               -- Timestamp elaborazione

        INDEX IDX_Processed (processed, createdAt),
        INDEX IDX_CreatedAt (createdAt DESC)
    );

    PRINT '✅ Tabella DatabaseNotifications creata con successo';
END
ELSE
BEGIN
    PRINT '⚠️  Tabella DatabaseNotifications già esistente';
END
GO

-- ============================================
-- 2. Crea trigger per tabella Liste
-- ============================================

-- Drop trigger se esiste
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Liste_Changes')
BEGIN
    DROP TRIGGER trg_Liste_Changes;
    PRINT '🗑️  Trigger esistente eliminato';
END
GO

-- Crea nuovo trigger
CREATE TRIGGER trg_Liste_Changes
ON Liste
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @eventType VARCHAR(50);

    -- Determina tipo evento
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
        SET @eventType = 'UPDATE';
    ELSE IF EXISTS(SELECT * FROM inserted)
        SET @eventType = 'INSERT';
    ELSE
        SET @eventType = 'DELETE';

    -- Per INSERT e UPDATE
    IF EXISTS(SELECT * FROM inserted)
    BEGIN
        INSERT INTO DatabaseNotifications (eventType, tableName, recordId, eventData)
        SELECT
            @eventType,
            'Liste',
            i.id,
            (
                SELECT
                    i.id,
                    i.numLista,
                    i.idStatoControlloEvadibilita,
                    i.idTipoLista,
                    i.terminata,
                    i.dataCreazione,
                    i.dataModifica
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )
        FROM inserted i;
    END

    -- Per DELETE
    IF @eventType = 'DELETE'
    BEGIN
        INSERT INTO DatabaseNotifications (eventType, tableName, recordId, eventData)
        SELECT
            @eventType,
            'Liste',
            d.id,
            (
                SELECT
                    d.id,
                    d.numLista,
                    d.idStatoControlloEvadibilita,
                    d.idTipoLista,
                    d.terminata
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            )
        FROM deleted d;
    END
END;
GO

PRINT '✅ Trigger trg_Liste_Changes creato con successo';
GO

-- ============================================
-- 3. Crea stored procedure per pulizia
-- ============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CleanupProcessedNotifications')
BEGIN
    DROP PROCEDURE sp_CleanupProcessedNotifications;
END
GO

CREATE PROCEDURE sp_CleanupProcessedNotifications
    @retentionHours INT = 24  -- Mantieni notifiche processate per 24 ore
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @deletedCount INT;
    DECLARE @cutoffDate DATETIME2 = DATEADD(HOUR, -@retentionHours, GETDATE());

    DELETE FROM DatabaseNotifications
    WHERE processed = 1
      AND processedAt < @cutoffDate;

    SET @deletedCount = @@ROWCOUNT;

    PRINT CONCAT('🧹 Eliminate ', @deletedCount, ' notifiche processate');

    RETURN @deletedCount;
END;
GO

PRINT '✅ Stored procedure sp_CleanupProcessedNotifications creata';
GO

-- ============================================
-- 4. Crea job per pulizia automatica (opzionale)
-- ============================================

-- Esegui pulizia ogni ora
-- EXEC sp_CleanupProcessedNotifications @retentionHours = 24;

-- ============================================
-- 5. Test del sistema
-- ============================================

PRINT '';
PRINT '============================================';
PRINT 'Sistema di Notifiche Real-Time Installato';
PRINT '============================================';
PRINT '';
PRINT 'Componenti creati:';
PRINT '  ✅ Tabella DatabaseNotifications';
PRINT '  ✅ Trigger trg_Liste_Changes';
PRINT '  ✅ Stored Procedure sp_CleanupProcessedNotifications';
PRINT '';
PRINT 'Test trigger:';

-- Conta notifiche attuali
DECLARE @beforeCount INT;
SELECT @beforeCount = COUNT(*) FROM DatabaseNotifications;
PRINT CONCAT('  📊 Notifiche esistenti: ', @beforeCount);

-- Test con un UPDATE fittizio (se esistono liste)
IF EXISTS(SELECT TOP 1 1 FROM Liste)
BEGIN
    DECLARE @testId INT;
    SELECT TOP 1 @testId = id FROM Liste;

    -- Forza un UPDATE per generare notifica
    UPDATE Liste
    SET dataModifica = GETDATE()
    WHERE id = @testId;

    -- Verifica notifica creata
    DECLARE @afterCount INT;
    SELECT @afterCount = COUNT(*) FROM DatabaseNotifications;

    IF @afterCount > @beforeCount
        PRINT '  ✅ Test superato: Trigger funzionante!';
    ELSE
        PRINT '  ⚠️  Test fallito: Nessuna notifica generata';

    -- Mostra ultima notifica
    SELECT TOP 1
        id,
        eventType,
        tableName,
        recordId,
        LEFT(eventData, 100) + '...' AS eventData_preview,
        createdAt,
        processed
    FROM DatabaseNotifications
    ORDER BY createdAt DESC;
END
ELSE
BEGIN
    PRINT '  ⚠️  Nessuna lista disponibile per test';
END

PRINT '';
PRINT '🎉 Installazione completata!';
PRINT '';
GO
