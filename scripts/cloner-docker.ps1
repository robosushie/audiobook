# Build and run the stateless cloner image (Chatterbox + IndicF5 + Habibi).
#
# Usage (from repo root):
#   .\scripts\cloner-docker.ps1              # build + GPU run
#   .\scripts\cloner-docker.ps1 -Cpu         # build + CPU run (slow)
#   .\scripts\cloner-docker.ps1 -Command build
#   .\scripts\cloner-docker.ps1 -Command run
#
# Then POST a clip + text to http://127.0.0.1:8002/api/clone (see scripts/cloner-request.ps1).

param(
    [ValidateSet("build", "run", "up")]
    [string]$Command = "up",
    [switch]$Cpu
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Image = "audiobook-cloner"
$Port = 8002

function Build-Image {
    Write-Host "Building $Image from src/services/cloner/Dockerfile ..."
    docker build -f src/services/cloner/Dockerfile -t $Image .
}

function Run-Container {
    $gpu = @()
    if (-not $Cpu) {
        $gpu = @("--gpus", "all")
        Write-Host "Starting $Image on :$Port with GPU ..."
    }
    else {
        Write-Host "Starting $Image on :$Port on CPU (slow) ..."
    }

    $envFile = @()
    if (Test-Path (Join-Path $Root ".env")) {
        $envFile = @("--env-file", ".env")
    }

    docker run --rm --name audiobook-cloner `
        @gpu `
        -p "${Port}:8002" `
        @envFile `
        -e CLONER_MODEL_DIR=/data/cloner-models `
        -v audiobook-cloner-models:/data/cloner-models `
        $Image
}

switch ($Command) {
    "build" { Build-Image }
    "run" { Run-Container }
    "up" {
        Build-Image
        Run-Container
    }
}
