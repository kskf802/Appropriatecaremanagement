$file = Get-ChildItem -Path . -Filter "*脳血管疾患Ⅰ期*.pdf" | Select-Object -First 1
Write-Host "Found File: $($file.Name)"

# PythonやiTextSharp等が使えないか確認
$bytes = [System.IO.File]::ReadAllBytes($file.FullName)
Write-Host "Bytes Read: $($bytes.Length)"
