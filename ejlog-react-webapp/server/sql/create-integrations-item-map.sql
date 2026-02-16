IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'IntegrationItemMap')
BEGIN
  CREATE TABLE IntegrationItemMap (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    integrationKey NVARCHAR(50) NOT NULL,
    externalCode NVARCHAR(100) NOT NULL,
    itemId INT NULL,
    itemCode NVARCHAR(100) NULL,
    description NVARCHAR(200) NULL,
    createdAt DATETIME NOT NULL DEFAULT(GETDATE())
  );
END
