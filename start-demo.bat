@echo off
cd /d C:\Users\pc\senkan-playbook-demo
echo ビルド中です。1〜2分お待ちください...
call npm run build
if %errorlevel% neq 0 (
  echo ビルドに失敗しました
  pause
  exit /b 1
)
echo.
echo サーバーを起動します（http://localhost:3004）
set NODE_OPTIONS=--max-old-space-size=2048
npm run start
pause
