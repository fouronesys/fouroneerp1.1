; Four One Solutions NSIS Installer Script
; SQLite and runtime configuration

!include "MUI2.nsh"
!include "FileFunc.nsh"

; Custom page for SQLite configuration
!define MUI_PAGE_CUSTOMFUNCTION_PRE SQLiteConfigPre
!define MUI_PAGE_CUSTOMFUNCTION_SHOW SQLiteConfigShow
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE SQLiteConfigLeave

Var SQLiteConfigured
Var DatabasePath
Var BackupEnabled

; Initialize SQLite configuration
Function SQLiteConfigPre
  StrCpy $SQLiteConfigured "false"
  StrCpy $DatabasePath "$PROFILE\Four One Solutions\Database"
  StrCpy $BackupEnabled "true"
FunctionEnd

Function SQLiteConfigShow
  ; Create custom dialog for SQLite configuration
  nsDialogs::Create 1018
  Pop $0
  
  ${NSD_CreateLabel} 0 0 100% 20u "Configuración de Base de Datos Local (SQLite)"
  Pop $0
  
  ${NSD_CreateLabel} 0 30u 100% 20u "Four One Solutions utilizará SQLite para funcionalidad offline."
  Pop $0
  
  ${NSD_CreateLabel} 0 60u 100% 10u "Ubicación de la base de datos:"
  Pop $0
  
  ${NSD_CreateText} 0 75u 80% 12u $DatabasePath
  Pop $1
  
  ${NSD_CreateButton} 85% 75u 15% 12u "Examinar"
  Pop $2
  ${NSD_OnClick} $2 BrowseDatabasePath
  
  ${NSD_CreateCheckbox} 0 100u 100% 10u "Habilitar respaldos automáticos"
  Pop $3
  ${NSD_Check} $3
  
  ${NSD_CreateLabel} 0 120u 100% 30u "La aplicación funcionará completamente offline y sincronizará automáticamente cuando haya conexión a internet."
  Pop $0
  
  nsDialogs::Show
FunctionEnd

Function BrowseDatabasePath
  nsDialogs::SelectFolderDialog "Seleccionar ubicación para la base de datos" $DatabasePath
  Pop $DatabasePath
FunctionEnd

Function SQLiteConfigLeave
  StrCpy $SQLiteConfigured "true"
FunctionEnd

; Section to install SQLite and configure database
Section "SQLite Database Setup" SecSQLite
  SetOutPath "$INSTDIR"
  
  ; Create database directory
  CreateDirectory "$DatabasePath"
  
  ; Set permissions for database directory
  AccessControl::GrantOnFile "$DatabasePath" "(S-1-1-0)" "FullAccess"
  
  ; Create initial configuration file
  FileOpen $0 "$INSTDIR\database-config.json" w
  FileWrite $0 '{"databasePath": "$DatabasePath", "backupEnabled": $BackupEnabled, "syncEnabled": true}'
  FileClose $0
  
  ; Register database path in registry
  WriteRegStr HKCU "Software\Four One Solutions" "DatabasePath" "$DatabasePath"
  WriteRegStr HKCU "Software\Four One Solutions" "BackupEnabled" "$BackupEnabled"
  
SectionEnd

; Section to install Visual C++ Redistributable (required for better-sqlite3)
Section "Visual C++ Redistributable" SecVCRedist
  SetOutPath "$TEMP"
  
  ; Download and install VC++ Redistributable if not present
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
  ${If} $0 != "1"
    DetailPrint "Instalando Visual C++ Redistributable..."
    inetc::get "https://aka.ms/vs/17/release/vc_redist.x64.exe" "$TEMP\vc_redist.x64.exe"
    ExecWait "$TEMP\vc_redist.x64.exe /quiet /norestart"
    Delete "$TEMP\vc_redist.x64.exe"
  ${EndIf}
SectionEnd

; Post-installation configuration
Section -PostInstall
  ; Create desktop shortcut with database path parameter
  CreateShortCut "$DESKTOP\Four One Solutions.lnk" "$INSTDIR\Four One Solutions.exe" "--database-path=$DatabasePath"
  
  ; Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\Four One Solutions"
  CreateShortCut "$SMPROGRAMS\Four One Solutions\Four One Solutions.lnk" "$INSTDIR\Four One Solutions.exe"
  CreateShortCut "$SMPROGRAMS\Four One Solutions\Configurar Base de Datos.lnk" "$INSTDIR\database-config.exe"
  CreateShortCut "$SMPROGRAMS\Four One Solutions\Desinstalar.lnk" "$INSTDIR\Uninstall.exe"
  
  ; Register uninstaller
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Four One Solutions" "DisplayName" "Four One Solutions"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Four One Solutions" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Four One Solutions" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Four One Solutions" "NoRepair" 1
  
  ; Start the application after installation
  MessageBox MB_YESNO "¿Desea iniciar Four One Solutions ahora?" IDNO NoStart
    Exec "$INSTDIR\Four One Solutions.exe"
  NoStart:
SectionEnd

; Uninstaller section
Section "Uninstall"
  ; Ask user about database
  MessageBox MB_YESNO "¿Desea conservar la base de datos local para futuras instalaciones?" IDYES KeepDatabase
    ; Remove database directory
    RMDir /r "$DatabasePath"
  KeepDatabase:
  
  ; Remove application files
  RMDir /r "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$DESKTOP\Four One Solutions.lnk"
  RMDir /r "$SMPROGRAMS\Four One Solutions"
  
  ; Remove registry entries
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Four One Solutions"
  DeleteRegKey HKCU "Software\Four One Solutions"
SectionEnd

; Installer attributes
Name "Four One Solutions"
OutFile "Four-One-Solutions-Setup.exe"
InstallDir "$PROGRAMFILES64\Four One Solutions"
RequestExecutionLevel admin

; Interface settings
!define MUI_ABORTWARNING
!define MUI_ICON "electron\assets\icon.ico"
!define MUI_UNICON "electron\assets\icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
Page custom SQLiteConfigShow SQLiteConfigLeave
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "Spanish"
!insertmacro MUI_LANGUAGE "English"