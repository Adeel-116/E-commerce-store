$ErrorActionPreference = 'Stop'
$path = Join-Path $PSScriptRoot 'products-clean.json'
$catalog = Get-Content $path -Raw | ConvertFrom-Json
$cache = @{}
$found = 0
$missing = 0
$failed = 0

foreach ($product in $catalog.products) {
    $chartTags = @($product.tags | Where-Object { $_ -like '*-chartify' })
    $product | Add-Member -NotePropertyName measurements -NotePropertyValue @() -Force
    if ($chartTags.Count -eq 0) { $missing++; continue }

    $tagValue = ($chartTags -join ',') + ','
    if (-not $cache.ContainsKey($tagValue)) {
        $url = 'https://smartsizechart.technogroves.com/api/product_size_charts?shop=ethnicpk.myshopify.com&tags=' + [uri]::EscapeDataString($tagValue)
        try {
            $cache[$tagValue] = @(Invoke-RestMethod -Uri $url -TimeoutSec 30)
        } catch {
            Write-Warning "Chart request failed for $($product.handle): $_"
            $failed++
            continue
        }
    }

    $charts = @()
    foreach ($result in $cache[$tagValue]) {
        if (-not $result.size_chart) { continue }
        $chart = $result.size_chart
        $table = @($chart.size_chart_data)
        $sizes = @($table[0] | Select-Object -Skip 1)
        $bySize = [ordered]@{}
        for ($column = 0; $column -lt $sizes.Count; $column++) {
            $values = [ordered]@{}
            foreach ($row in ($table | Select-Object -Skip 1)) {
                if ($row.Count -gt ($column + 1)) { $values[[string]$row[0]] = [string]$row[$column + 1] }
            }
            $bySize[[string]$sizes[$column]] = $values
        }
        $charts += [pscustomobject]@{
            chart_id = $chart.id
            title = $chart.title
            unit = 'inches'
            diagram_url = $chart.description_2
            sizes = $bySize
            source_table = $chart.size_chart_data
        }
    }
    $product.measurements = @($charts)
    if ($charts.Count -gt 0) { $found++ } else { $missing++ }
}

$catalog | Add-Member -NotePropertyName measurement_source -NotePropertyValue 'https://smartsizechart.technogroves.com/api/product_size_charts' -Force
$catalog | Add-Member -NotePropertyName products_with_measurements -NotePropertyValue $found -Force
$catalog | Add-Member -NotePropertyName products_without_measurements -NotePropertyValue $missing -Force
$catalog | Add-Member -NotePropertyName measurement_fetch_failures -NotePropertyValue $failed -Force
$catalog | ConvertTo-Json -Depth 30 | Set-Content $path -Encoding utf8
Write-Output "products=$($catalog.products.Count) with_measurements=$found without_measurements=$missing fetch_failures=$failed unique_chart_requests=$($cache.Count)"
