# PowerShell script to fix all invalid import statements with version numbers

$files = Get-ChildItem -Path "admin/src/components/ui" -Filter "*.tsx" -Recurse

$patterns = @{
    '@radix-ui/react-accordion@[\d\.]+' = '@radix-ui/react-accordion'
    '@radix-ui/react-alert-dialog@[\d\.]+' = '@radix-ui/react-alert-dialog'
    '@radix-ui/react-aspect-ratio@[\d\.]+' = '@radix-ui/react-aspect-ratio'
    '@radix-ui/react-avatar@[\d\.]+' = '@radix-ui/react-avatar'
    '@radix-ui/react-checkbox@[\d\.]+' = '@radix-ui/react-checkbox'
    '@radix-ui/react-collapsible@[\d\.]+' = '@radix-ui/react-collapsible'
    '@radix-ui/react-context-menu@[\d\.]+' = '@radix-ui/react-context-menu'
    '@radix-ui/react-dialog@[\d\.]+' = '@radix-ui/react-dialog'
    '@radix-ui/react-dropdown-menu@[\d\.]+' = '@radix-ui/react-dropdown-menu'
    '@radix-ui/react-hover-card@[\d\.]+' = '@radix-ui/react-hover-card'
    '@radix-ui/react-label@[\d\.]+' = '@radix-ui/react-label'
    '@radix-ui/react-menubar@[\d\.]+' = '@radix-ui/react-menubar'
    '@radix-ui/react-navigation-menu@[\d\.]+' = '@radix-ui/react-navigation-menu'
    '@radix-ui/react-popover@[\d\.]+' = '@radix-ui/react-popover'
    '@radix-ui/react-progress@[\d\.]+' = '@radix-ui/react-progress'
    '@radix-ui/react-radio-group@[\d\.]+' = '@radix-ui/react-radio-group'
    '@radix-ui/react-scroll-area@[\d\.]+' = '@radix-ui/react-scroll-area'
    '@radix-ui/react-select@[\d\.]+' = '@radix-ui/react-select'
    '@radix-ui/react-separator@[\d\.]+' = '@radix-ui/react-separator'
    '@radix-ui/react-slider@[\d\.]+' = '@radix-ui/react-slider'
    '@radix-ui/react-slot@[\d\.]+' = '@radix-ui/react-slot'
    '@radix-ui/react-switch@[\d\.]+' = '@radix-ui/react-switch'
    '@radix-ui/react-tabs@[\d\.]+' = '@radix-ui/react-tabs'
    '@radix-ui/react-toggle@[\d\.]+' = '@radix-ui/react-toggle'
    '@radix-ui/react-toggle-group@[\d\.]+' = '@radix-ui/react-toggle-group'
    '@radix-ui/react-tooltip@[\d\.]+' = '@radix-ui/react-tooltip'
    'lucide-react@[\d\.]+' = 'lucide-react'
    'class-variance-authority@[\d\.]+' = 'class-variance-authority'
    'react-hook-form@[\d\.]+' = 'react-hook-form'
    'next-themes@[\d\.]+' = 'next-themes'
    'sonner@[\d\.]+' = 'sonner'
    'input-otp@[\d\.]+' = 'input-otp'
    'cmdk@[\d\.]+' = 'cmdk'
    'vaul@[\d\.]+' = 'vaul'
    'react-resizable-panels@[\d\.]+' = 'react-resizable-panels'
    'embla-carousel-react@[\d\.]+' = 'embla-carousel-react'
    'react-day-picker@[\d\.]+' = 'react-day-picker'
}

$totalFixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileFixed = 0
    
    foreach ($pattern in $patterns.Keys) {
        $replacement = $patterns[$pattern]
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $fileFixed++
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed $fileFixed pattern(s) in: $($file.Name)" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host "`nTotal files fixed: $totalFixed" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
