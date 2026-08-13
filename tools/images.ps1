$ErrorActionPreference = 'Stop'
$root  = Split-Path $PSScriptRoot -Parent
$shots = Join-Path $root 'shots'
$media = Join-Path $root 'media'
New-Item -ItemType Directory -Path $media -Force | Out-Null

# 1. decode the canvas we pulled straight out of the live page
$b64 = ((Get-Content (Join-Path $shots 'eigendrum.b64') -Raw) -replace '\s', '')
while ($b64.Length % 4 -ne 0) { $b64 += '=' }
Write-Output ("b64 chars: " + $b64.Length)
[IO.File]::WriteAllBytes((Join-Path $media 'eigendrum-star.webp'), [Convert]::FromBase64String($b64))

# 2. crop + downscale the headless captures. Sources are 2880x1800 (2x of 1440x900).
#    crop=w:h:x:y then scale to a sane delivery width.
$jobs = @(
  @{ src = 'raw-prolifictea.png'; out = 'prolifictea.webp'; f = 'crop=2880:1740:0:60,scale=1400:-1:flags=lanczos'; q = 76 },
  @{ src = 'raw-alertacert.png';  out = 'alertacert.webp';  f = 'crop=2880:1800:0:0,scale=1400:-1:flags=lanczos';  q = 76 },
  @{ src = 'raw-layoutsans.png';  out = 'layoutsans.webp';  f = 'crop=2880:1700:0:100,scale=1400:-1:flags=lanczos'; q = 78 }
)

foreach ($j in $jobs) {
  $src = Join-Path $shots $j.src
  $out = Join-Path $media $j.out
  if (-not (Test-Path $src)) { Write-Output ("MISSING " + $j.src); continue }
  & ffmpeg -y -loglevel error -i $src -vf $j.f -quality $j.q -c:v libwebp $out
  if (Test-Path $out) {
    Write-Output ("OK   " + $j.out + "  " + [math]::Round((Get-Item $out).Length / 1kb) + " kB")
  } else {
    Write-Output ("FAIL " + $j.out)
  }
}

Get-ChildItem $media | ForEach-Object {
  Write-Output ("   -> " + $_.Name + "  " + [math]::Round($_.Length / 1kb) + " kB")
}
