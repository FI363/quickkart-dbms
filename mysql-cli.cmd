@echo off
REM QuickKart MySQL Launcher for Windows CMD
REM Automatically connects to MySQL CLI client using .env credentials
set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if not exist "%MYSQL_BIN%" set "MYSQL_BIN=mysql"

if "%~1"=="" (
    "%MYSQL_BIN%" -u root -p"MyNewPassword123!" quickkart_db
) else (
    node "%~dp0query.js" %*
)

