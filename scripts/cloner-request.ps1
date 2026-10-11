# Call the stateless cloner container. Example:
#   .\scripts\cloner-request.ps1 -Language english -ReferenceWav .\ref.wav -ReferenceText "Hello there." -SourceText "This is cloned speech." -Out .\out.wav

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("english", "hindi", "arabic", "assamese", "bengali", "gujarati", "kannada", "malayalam", "marathi", "odia", "punjabi", "tamil", "telugu")]
    [string]$Language,
    [Parameter(Mandatory = $true)]
    [string]$ReferenceWav,
    [Parameter(Mandatory = $true)]
    [string]$ReferenceText,
    [Parameter(Mandatory = $true)]
    [string]$SourceText,
    [string]$Out = "clone.wav",
    [string]$BaseUrl = "http://127.0.0.1:8002"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $ReferenceWav)) {
    throw "Reference WAV not found: $ReferenceWav"
}

curl.exe -sS -X POST "$BaseUrl/api/clone" `
    -F "reference_audio=@$ReferenceWav" `
    -F "reference_text=$ReferenceText" `
    -F "source_text=$SourceText" `
    -F "language=$Language" `
    -o $Out `
    -D -

Write-Host "`nWrote $Out"
