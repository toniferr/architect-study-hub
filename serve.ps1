# Arranca la web (http://127.0.0.1:8000) y el asistente de estudio (http://127.0.0.1:8001)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path .venv)) {
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt
}
if (-not (Test-Path .env)) {
    Write-Host "Aviso: no hay fichero .env. Copia .env.example como .env y añade tu GEMINI_API_KEY (gratuita) para usar el chat." -ForegroundColor Yellow
}
# El asistente corre en segundo plano y se detiene al cerrar la web
$chat = Start-Process -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "chat\server.py" -NoNewWindow -PassThru
try {
    .\.venv\Scripts\mkdocs serve
} finally {
    if (-not $chat.HasExited) { Stop-Process -Id $chat.Id }
}
