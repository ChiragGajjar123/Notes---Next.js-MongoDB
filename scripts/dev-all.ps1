$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$apiBinary = Join-Path $root "tmp_dev_api.exe"

Push-Location $root
try {
  & go build -o $apiBinary ./cmd/dev-api
}
finally {
  Pop-Location
}

$api = Start-Process -FilePath $apiBinary -WorkingDirectory $root -PassThru

try {
  Set-Location $root
  & npm.cmd run dev
}
finally {
  if ($api -and -not $api.HasExited) {
    Stop-Process -Id $api.Id -Force
  }
}
