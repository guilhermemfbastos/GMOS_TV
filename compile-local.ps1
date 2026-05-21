$ErrorActionPreference = "Stop"

$ToolsDir = "$PWD\.tools"
$JdkDir = "$ToolsDir\jdk"
$SdkDir = "$ToolsDir\android-sdk"

Write-Host "Iniciando Preparação do Ambiente Local Isolado..." -ForegroundColor Cyan

if (!(Test-Path $ToolsDir)) { New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null }

# 1. Setup Java 17
if (!(Test-Path "$JdkDir\bin\java.exe")) {
    Write-Host "Baixando Java (JDK 17) minimalista da Microsoft..."
    # URL oficial do Microsoft Build of OpenJDK 17
    $JdkUrl = "https://aka.ms/download-jdk/microsoft-jdk-17.0.11-windows-x64.zip"
    $JdkZip = "$ToolsDir\jdk.zip"
    Invoke-WebRequest -Uri $JdkUrl -OutFile $JdkZip
    Write-Host "Extraindo Java..."
    Expand-Archive -Path $JdkZip -DestinationPath $ToolsDir -Force
    $ExtractedFolder = Get-ChildItem -Path $ToolsDir -Directory | Where-Object { $_.Name -like "jdk-17*" } | Select-Object -First 1
    Rename-Item -Path $ExtractedFolder.FullName -NewName "jdk"
    Remove-Item $JdkZip
}

$env:JAVA_HOME = $JdkDir
Write-Host "JAVA_HOME configurado isoladamente." -ForegroundColor Green

# 2. Setup Android SDK
if (!(Test-Path "$SdkDir\cmdline-tools\latest\bin\sdkmanager.bat")) {
    Write-Host "Baixando Ferramentas do Android SDK puro..."
    # Descobrir a URL mais recente direto do site do Android
    $PageHtml = (Invoke-WebRequest -Uri "https://developer.android.com/studio" -UseBasicParsing).Content
    $Regex = "https://dl\.google\.com/android/repository/commandlinetools-win-\d+_latest\.zip"
    $SdkUrl = [regex]::Match($PageHtml, $Regex).Value
    if ([string]::IsNullOrWhiteSpace($SdkUrl)) {
        # Fallback seguro caso o site mude
        $SdkUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    }
    $SdkZip = "$ToolsDir\sdk.zip"
    Invoke-WebRequest -Uri $SdkUrl -OutFile $SdkZip
    Write-Host "Extraindo Android SDK..."
    $CmdLineDir = "$SdkDir\cmdline-tools"
    New-Item -ItemType Directory -Force -Path $CmdLineDir | Out-Null
    Expand-Archive -Path $SdkZip -DestinationPath $CmdLineDir -Force
    # O arquivo extrai uma pasta chamada 'cmdline-tools', precisamos renomear para 'latest'
    Rename-Item -Path "$CmdLineDir\cmdline-tools" -NewName "latest"
    Remove-Item $SdkZip
}

$env:ANDROID_HOME = $SdkDir
Write-Host "ANDROID_HOME configurado isoladamente." -ForegroundColor Green

# 3. Aceitar Licencas do Android
Write-Host "Aceitando licenças do Android silenciosamente..."
$SdkManager = "$SdkDir\cmdline-tools\latest\bin\sdkmanager.bat"
cmd.exe /c "echo y| ""$SdkManager"" --licenses > NUL 2>&1"

# 4. Construir o APK
Write-Host "Iniciando o compilador Gradle (Aguarde alguns minutos na 1ª vez)..." -ForegroundColor Cyan
Set-Location android
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCESSO TOTAL! O APK do GMOS foi gerado em:" -ForegroundColor Green
    Write-Host "$PWD\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Yellow
} else {
    Write-Host "`nFalha na compilação. Veja os erros acima." -ForegroundColor Red
}
Set-Location ..
