@echo off
echo Fixing port 3007 to 3001 in test files...

cd /d C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\tests

powershell -Command "(Get-Content 'check-4-pages.spec.cjs') -replace '3007', '3001' | Set-Content 'check-4-pages.spec.cjs'"
echo Fixed check-4-pages.spec.cjs

powershell -Command "(Get-Content 'debug-hub.spec.cjs') -replace '3007', '3001' | Set-Content 'debug-hub.spec.cjs'"
echo Fixed debug-hub.spec.cjs

powershell -Command "(Get-Content 'debug-page.spec.cjs') -replace '3007', '3001' | Set-Content 'debug-page.spec.cjs'"
echo Fixed debug-page.spec.cjs

powershell -Command "(Get-Content 'navigation-verification.spec.cjs') -replace '3007', '3001' | Set-Content 'navigation-verification.spec.cjs'"
echo Fixed navigation-verification.spec.cjs

powershell -Command "(Get-Content 'pages-load-test.spec.cjs') -replace '3007', '3001' | Set-Content 'pages-load-test.spec.cjs'"
echo Fixed pages-load-test.spec.cjs

echo.
echo All files updated!
echo.
pause
