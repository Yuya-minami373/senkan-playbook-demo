@echo off
schtasks /delete /tn "UniGuide" /f 2>/dev/null
schtasks /create /tn "UniGuide" /tr "wscript.exe C:\Users\pc\senkan-playbook-demo\start-silent.vbs" /sc ONLOGON /rl HIGHEST /f
if %errorlevel% equ 0 (
    echo Setup OK
) else (
    echo Setup FAILED
)
pause