IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationEdiApplyAudit')
BEGIN
  CREATE TABLE IntegrationEdiApplyAudit (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    inboxId INT NOT NULL,
    appliedBy NVARCHAR(100) NULL,
    appliedAt DATETIME NOT NULL DEFAULT(GETDATE()),
    status NVARCHAR(20) NOT NULL,
    message NVARCHAR(500) NULL
  );
END
