$ErrorActionPreference = "Stop"

$toolRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $toolRoot "config.json"
$guiPath = Join-Path $toolRoot "dataseg_gui.py"
$environmentName = "usdia-seg"
if (Test-Path -LiteralPath $configPath -PathType Leaf) {
    $config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 |
        ConvertFrom-Json
    if ([string]$config.conda_env) {
        $environmentName = [string]$config.conda_env
    }
}
$condaCommand = Get-Command conda -ErrorAction SilentlyContinue
if (-not $condaCommand) {
    throw "找不到 conda。请先安装 Miniforge、Miniconda 或 Anaconda。"
}
if (-not (Test-Path -LiteralPath $guiPath -PathType Leaf)) {
    throw "缺少 dataseg_gui.py"
}

$lines = @(
    & $condaCommand.Source run -n $environmentName `
        python -c "import sys; print(sys.executable)" 2>&1
)
if ($LASTEXITCODE -ne 0) {
    throw "无法进入 Conda 环境 $environmentName。`n$($lines -join [Environment]::NewLine)"
}
$pythonPath = $lines |
    Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) } |
    Select-Object -Last 1
if (-not $pythonPath) {
    throw "无法确定 $environmentName 环境中的 python.exe。"
}
$pythonwPath = Join-Path (Split-Path -Parent $pythonPath) "pythonw.exe"
if (-not (Test-Path -LiteralPath $pythonwPath -PathType Leaf)) {
    $pythonwPath = $pythonPath
}

$quotedGui = '"' + $guiPath.Replace('"', '\"') + '"'
Start-Process `
    -FilePath $pythonwPath `
    -ArgumentList $quotedGui `
    -WorkingDirectory $toolRoot
