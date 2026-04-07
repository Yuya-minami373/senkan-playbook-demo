Set oShell = CreateObject("WScript.Shell")
oShell.Environment("Process")("NODE_OPTIONS") = "--max-old-space-size=2048"
oShell.Run "cmd /c cd /d C:\Users\pc\senkan-playbook-demo && npm run start > C:\Users\pc\senkan-playbook-demo\server.log 2>&1", 0, False
