$routes = Get-ChildItem -Path "src/app/api" -Recurse -Filter "route.ts"
foreach ($file in $routes) {
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch "force-dynamic") {
        $lines = Get-Content $file.FullName
        $insertAt = 0
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -notmatch "^import " -and $lines[$i] -notmatch "^'use") {
                $insertAt = $i
                break
            }
        }
        $newLines = @()
        $newLines += $lines[0..($insertAt-1)]
        $newLines += ""
        $newLines += "export const dynamic = 'force-dynamic';"
        $newLines += $lines[$insertAt..($lines.Count-1)]
        Set-Content $file.FullName $newLines
        Write-Host "Updated: $($file.FullName)"
    } else {
        Write-Host "Skipped (already dynamic): $($file.Name)"
    }
}
Write-Host "Done."
