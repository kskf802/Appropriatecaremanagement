# PDFファイル一覧とページ解析スクリプト
$pdfFiles = Get-ChildItem -Path . -Filter "*.pdf"

Write-Host "PDF Files Found: $($pdfFiles.Count)"
foreach ($file in $pdfFiles) {
    Write-Host "File: $($file.Name) Size: $($file.Length) bytes"
}
