/*
  EJLOG WMS - Integrations Configuration Table
  Database: promag (SQL Server)
*/

IF NOT EXISTS (
  SELECT 1 FROM sys.tables WHERE name = 'IntegrationsConfig'
)
BEGIN
  CREATE TABLE IntegrationsConfig (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    integrationKey NVARCHAR(50) NOT NULL UNIQUE,
    enabled BIT NOT NULL DEFAULT(0),
    configJson NVARCHAR(MAX) NOT NULL,
    updatedAt DATETIME NOT NULL DEFAULT(GETDATE()),
    updatedBy NVARCHAR(100) NULL
  );
END;
