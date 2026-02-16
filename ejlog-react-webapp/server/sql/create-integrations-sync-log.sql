IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationSyncLog')
BEGIN
  CREATE TABLE IntegrationSyncLog (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    integrationKey NVARCHAR(50) NOT NULL,
    direction NVARCHAR(20) NOT NULL,
    flow NVARCHAR(50) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    message NVARCHAR(500) NULL,
    recordCount INT NULL,
    startedAt DATETIME NOT NULL DEFAULT(GETDATE()),
    finishedAt DATETIME NULL,
    durationMs INT NULL
  );
END
