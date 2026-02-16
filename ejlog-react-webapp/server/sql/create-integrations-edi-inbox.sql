IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationEdiInbox')
BEGIN
  CREATE TABLE IntegrationEdiInbox (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    integrationKey NVARCHAR(50) NOT NULL,
    flow NVARCHAR(50) NOT NULL,
    messageType NVARCHAR(10) NULL,
    rawContent NVARCHAR(MAX) NOT NULL,
    parsedJson NVARCHAR(MAX) NULL,
    receivedAt DATETIME NOT NULL DEFAULT(GETDATE())
  );
END
