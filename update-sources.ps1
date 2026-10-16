param([switch]$CheckOnly)

$ErrorActionPreference = 'Stop'
$deployRoot = $PSScriptRoot

function Invoke-RepoGit {
    param([string]$Repository, [string[]]$GitArguments)
    $result = & git -c "safe.directory=$($Repository.Replace('\', '/'))" -C $Repository @GitArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Git failed in $Repository (exit $LASTEXITCODE): $($GitArguments -join ' ')"
    }
    return $result
}

# Stop before pulling anything if an existing checkout has uncommitted changes.
foreach ($relativePath in @('.', 'DuongSach-BE', 'DuongSach-FE')) {
    $repository = if ($relativePath -eq '.') { $deployRoot } else { Join-Path $deployRoot $relativePath }
    if (Test-Path -LiteralPath (Join-Path $repository '.git')) {
        $changes = Invoke-RepoGit -Repository $repository -GitArguments @('status', '--porcelain', '--untracked-files=normal')
        if ($changes) {
            throw "Uncommitted changes in $relativePath. Commit or stash them before updating. No sources were updated."
        }
    }
}

if ($CheckOnly) {
    Write-Output 'Working trees are clean; update can proceed.'
    exit 0
}

Invoke-RepoGit -Repository $deployRoot -GitArguments @('pull', '--ff-only')
Invoke-RepoGit -Repository $deployRoot -GitArguments @('submodule', 'sync', '--recursive')
Invoke-RepoGit -Repository $deployRoot -GitArguments @('submodule', 'update', '--init', '--remote', '--merge')
Invoke-RepoGit -Repository $deployRoot -GitArguments @('submodule', 'status')
Write-Output 'Sources updated. Review, then git add DuongSach-BE DuongSach-FE; git commit; git push to publish the deployment references.'
