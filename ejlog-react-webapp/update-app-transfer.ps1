$content = Get-Content src/App.jsx -Raw
$content = $content -replace "(import UDCDetailPage.*?;)", "`$1`n`n// Transfer Pages`nimport TransferMaterialPage from './pages/transfers/TransferMaterialPage';"
$content = $content -replace "(\{/\* UDC \*/\})", "        {/* Transfers */}`n        <Route path=`"transfers/new`" element={<TransferMaterialPage />} />`n`n`$1"
$content | Set-Content src/App.jsx
