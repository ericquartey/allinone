IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationEdiApplyErrors')
BEGIN
  CREATE TABLE IntegrationEdiApplyErrors (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    inboxId INT NOT NULL,
    orderNumber NVARCHAR(100) NULL,
    lineNumber NVARCHAR(50) NULL,
    itemCode NVARCHAR(100) NULL,
    reason NVARCHAR(500) NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT(GETDATE())
  );
END
