$content = Get-Content src/App.jsx -Raw
$content = $content -replace "(import LocationDetailPage.*?;)", "`$1`n`n// UDC Pages`nimport UDCListPage from './pages/udc/UDCListPage';`nimport UDCDetailPage from './pages/udc/UDCDetailPage';"
$content = $content -replace "(\{/\* Stock \*/\})", "        {/* UDC */}`n        <Route path=`"udc`" element={<UDCListPage />} />`n        <Route path=`"udc/:id`" element={<UDCDetailPage />} />`n`n`$1"
$content | Set-Content src/App.jsx
