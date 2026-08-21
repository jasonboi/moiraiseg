param(
    [switch]$ResolveInterpreterOnly
)

$ErrorActionPreference = "Stop"

$toolRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $toolRoot "config.json"
$guiPath = Join-Path $toolRoot "moiraiseg_gui.py"
$defaultCondaEnvironment = "moiraiseg"

function Resolve-PythonInterpreter {
    param([string]$Candidate)

    if (-not $Candidate) {
        return $null
    }
    $expanded = [Environment]::ExpandEnvironmentVariables($Candidate)
    if (-not (Test-Path -LiteralPath $expanded -PathType Leaf)) {
        return $null
    }
    $resolved = (Resolve-Path -LiteralPath $expanded).Path
    $probe = $resolved
    if ([IO.Path]::GetFileName($probe) -ieq "pythonw.exe") {
        $consolePython = Join-Path (Split-Path -Parent $probe) "python.exe"
        if (Test-Path -LiteralPath $consolePython -PathType Leaf) {
            $probe = $consolePython
        }
        else {
            return $resolved
        }
    }
    try {
        $lines = @(& $probe -c "import sys; print(sys.executable)" 2>$null)
        if ($LASTEXITCODE -ne 0) {
            return $null
        }
        $reported = $lines |
            Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) } |
            Select-Object -Last 1
        if ($reported) {
            return (Resolve-Path -LiteralPath $reported).Path
        }
    }
    catch {
        return $null
    }
    return $null
}

function Find-CondaCommand {
    $candidates = @()
    if ($env:CONDA_EXE) {
        $candidates += $env:CONDA_EXE
    }
    $command = Get-Command conda -ErrorAction SilentlyContinue
    if ($command) {
        $candidates += $command.Source
    }
    if ($env:USERPROFILE) {
        foreach ($distribution in @("miniforge3", "miniconda3", "anaconda3")) {
            $candidates += Join-Path $env:USERPROFILE "$distribution\Scripts\conda.exe"
            $candidates += Join-Path $env:USERPROFILE "$distribution\condabin\conda.bat"
        }
    }
    foreach ($candidate in $candidates | Select-Object -Unique) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }
    return $null
}

function Resolve-CondaInterpreter {
    param(
        [string]$CondaCommand,
        [string]$EnvironmentName
    )

    if (-not $CondaCommand -or -not $EnvironmentName) {
        return $null
    }
    try {
        $lines = @(
            & $CondaCommand run -n $EnvironmentName `
                python -c "import sys; print(sys.executable)" 2>$null
        )
        if ($LASTEXITCODE -ne 0) {
            return $null
        }
        $reported = $lines |
            Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) } |
            Select-Object -Last 1
        if ($reported) {
            return (Resolve-Path -LiteralPath $reported).Path
        }
    }
    catch {
        return $null
    }
    return $null
}

if (-not (Test-Path -LiteralPath $guiPath -PathType Leaf)) {
    throw "缺少 moiraiseg_gui.py"
}

$config = $null
if (Test-Path -LiteralPath $configPath -PathType Leaf) {
    try {
        $config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 |
            ConvertFrom-Json
    }
    catch {
        Write-Warning "无法读取 config.json，将继续查找可用 Python。"
    }
}

$pythonPath = $null
if ($config -and [string]$config.python_executable) {
    $pythonPath = Resolve-PythonInterpreter `
        -Candidate ([string]$config.python_executable)
}

if (-not $pythonPath) {
    $condaCommand = Find-CondaCommand
    $pythonPath = Resolve-CondaInterpreter `
        -CondaCommand $condaCommand `
        -EnvironmentName $defaultCondaEnvironment
}

if (-not $pythonPath) {
    $pythonPath = Resolve-PythonInterpreter `
        -Candidate (Join-Path $toolRoot ".venv\Scripts\python.exe")
}

if (-not $pythonPath) {
    $pathPython = Get-Command python -CommandType Application `
        -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($pathPython) {
        $pythonPath = Resolve-PythonInterpreter -Candidate $pathPython.Source
    }
}

if (-not $pythonPath) {
    $pathPythonw = Get-Command pythonw -CommandType Application `
        -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($pathPythonw) {
        $pythonPath = Resolve-PythonInterpreter -Candidate $pathPythonw.Source
    }
}

if (-not $pythonPath) {
    throw (
        "找不到可用的 Python。请创建并激活 moiraiseg Conda 环境，" +
        "或创建项目 .venv 后运行 python moiraiseg_gui.py。"
    )
}

if ($ResolveInterpreterOnly) {
    Write-Output $pythonPath
    exit 0
}

$guiPython = $pythonPath
$pythonwPath = Join-Path (Split-Path -Parent $pythonPath) "pythonw.exe"
if (Test-Path -LiteralPath $pythonwPath -PathType Leaf) {
    $guiPython = $pythonwPath
}

$quotedGui = '"' + $guiPath.Replace('"', '\"') + '"'
Start-Process `
    -FilePath $guiPython `
    -ArgumentList $quotedGui `
    -WorkingDirectory $toolRoot
