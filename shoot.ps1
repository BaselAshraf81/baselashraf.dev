$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$out = Join-Path $PSScriptRoot "shots"
New-Item -ItemType Directory -Path $out -Force | Out-Null

$targets = @(
  @{ n = 'eigendrum';   u = 'https://eigendrum.com';                                                   w = 40000 },
  @{ n = 'photophane';  u = 'https://baselashraf81.github.io/photophane/';                             w = 40000 },
  @{ n = 'layoutsans';  u = 'https://baselashraf81.github.io/layout-sans/demo/interactive-text.html';   w = 30000 },
  @{ n = 'blackhole';   u = 'https://baselashraf81.github.io/blackhole/';                              w = 30000 }
)

foreach ($t in $targets) {
  $file = Join-Path $out ("raw-" + $t.n + ".png")
  Remove-Item $file -ErrorAction SilentlyContinue
  $a = @(
    '--headless=new',
    '--hide-scrollbars',
    '--mute-audio',
    '--force-device-scale-factor=2',
    '--window-size=1440,900',
    '--enable-unsafe-swiftshader',
    ('--virtual-time-budget=' + $t.w),
    ('--screenshot=' + $file),
    $t.u
  )
  & $chrome @a 2>$null | Out-Null
  if (Test-Path $file) {
    Write-Output ("OK   " + $t.n + "  " + [math]::Round((Get-Item $file).Length / 1kb) + " kB")
  } else {
    Write-Output ("FAIL " + $t.n)
  }
}
