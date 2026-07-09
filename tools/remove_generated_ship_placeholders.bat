@echo off
REM Run this from the root of the repository.
IF EXIST "assets\images\ships\catalog" (
  rmdir /s /q "assets\images\ships\catalog"
  echo Removed assets\images\ships\catalog
) ELSE (
  echo No generated ship placeholder folder found. Nothing to remove.
)
