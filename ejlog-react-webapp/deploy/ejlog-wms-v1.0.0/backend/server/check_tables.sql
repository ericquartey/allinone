-- Check for tables related to loading units (UDC/Cassetti)
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE='BASE TABLE'
  AND (
    TABLE_NAME LIKE '%supp%'
    OR TABLE_NAME LIKE '%UDC%'
    OR TABLE_NAME LIKE '%caric%'
    OR TABLE_NAME LIKE '%cassett%'
    OR TABLE_NAME LIKE '%scompart%'
  )
ORDER BY TABLE_NAME;
