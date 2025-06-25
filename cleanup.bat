@echo off
echo Cleaning up temporary files and directories...

REM Remove temporary directories
rmdir /s /q temp_check_mar
rmdir /s /q temp_mar_extract
rmdir /s /q temp_verify_mar

REM Remove log files
del /q logs\*.log

REM Remove temporary test files
del /q test.jpg

REM Remove duplicate/unused config files
del /q torchserve_config.properties
del /q torchserve_config_high_ports.properties
del /q torchserve_win_config.properties
del /q torchserve_custom_worker.properties
del /q worker_launcher.py
del /q run_torchserve_admin.bat
del /q start_torchserve.py

echo Cleanup complete!
pause
