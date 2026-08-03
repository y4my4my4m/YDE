# Unreal Tournament 99 for ZealOS

Native ZealC SoftDrv port. Formats from FaultyRAM/Ut99PubSrc + retail packages.

**SoftDrv = CPU framebuffer only** (P8 canvas → ARGB blit). UI = Canvas draw + GrFont TTF; full UScript UWindow Exec still absent — this wave = real TTF fonts + UT colours + MenuGr chrome.

## Runs

```
Cd("::/Apps/UT99");;ExeFile("Run");
```

Boot opens UTWin menu (UMenu/UTMenu labels, MenuGr chrome, UISANS TTF).
WASD mouse SPACE jump LMB/RMB fire `[` `]` weapons Tab scores K suicide.
ESC pause menu. Maps: 1–4 favorites, `n`/`b` cycle.

## Present

- SoftDrv P8 + FTB BSP + FSpan; per-surf `.utx`
- UPalette from ArenaTex/MenuGr → `ut_pal_argb` blit; index 0 black; reserved high-slot UT pens (dark blue/gold/white); `GrPalette` dark chrome while running; restore on exit
- **UTWin** (`UTWin.ZC`): UCanvas DrawTile / DrawText onto SoftDrv P8
- **UTFont** (`UTFont.ZC`): primary text = `::/System/Gr/UISANS.TTF` via GrFont (YDE/Zinc path); optional UWindowFonts UFont
- Menu: MenuGr logo/metal desktop or dark-blue wash; labels from UMenu.int / UTMenu.int
- ChallengeHUD-style HUD text via same Canvas/TTF path
- Zone-0 volume solid + upward facet floors
- Light actors → facet shade; Botpack weapons; announcer; IT music; CTF/DOM

## Gaps

- Full UWindow hierarchy / LookAndFeel / UScript Exec not running
- Latent UScript / IpDrv net
- Lightmaps absent; SoftDrv index-shade only
- Zone portals / thin same-zone walls incomplete

## Modules

`UTPal` `UTFont` `UTWin` `UTMenu` `UTSoft` `UTBsp` `UTGame` `UTHUD` …
