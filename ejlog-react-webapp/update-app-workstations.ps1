$content = Get-Content src/App.jsx -Raw
$content = $content -replace "(import TransferMaterialPage.*?;)", "`$1`n`n// Workstation Pages`nimport WorkstationListPage from './pages/workstations/WorkstationListPage';"
$content = $content -replace "(\{/\* Transfers \*/\})", "        {/* Workstations */}`n        <Route path=`"workstations`" element={<WorkstationListPage />} />`n`n`$1"
$content | Set-Content src/App.jsx
