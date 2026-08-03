# Unreal Tournament 99 for ZealOS

Native ZealC SoftDrv port. Formats from FaultyRAM/Ut99PubSrc + retail packages.

**SoftDrv = CPU framebuffer only** (P8 canvas → ARGB blit). UI = UWindow Canvas path.

## Runs

```
Cd("::/Apps/UT99");;ExeFile("Run");
```

Boot opens UTWin menu (UMenu/UTMenu labels, MenuGr chrome, UWindowFonts glyphs).
WASD mouse SPACE jump LMB/RMB fire `[` `]` weapons Tab scores K suicide.
ESC pause menu. Maps: 1–4 favorites, `n`/`b` cycle.

## Present

- SoftDrv P8 + FTB BSP + FSpan; per-surf `.utx`
- UPalette from ArenaTex/MenuGr → `ut_pal_argb` blit; index 0 black; `GrPalette` 16-slot sample while running; restore on exit
- **UTWin** (`UTWin.ZC`): UCanvas DrawTile / DrawText onto SoftDrv P8
- **UTFont** (`UTFont.ZC`): UFont Pages+Characters from `UWindowFonts.utx` (TahomaB10 / UTFont12)
- Menu: MenuGr logo/metal desktop; labels from UMenu.int / UTMenu.int; SoftDrv 5x7 only if UFont absent
- ChallengeHUD-style HUD text via same Canvas/UFont path
- Zone-0 volume solid + upward facet floors
- Light actors → facet shade; Botpack weapons; announcer; IT music; CTF/DOM

## Gaps

- Full UWindow hierarchy / LookAndFeel / UScript Exec not running — Canvas draw + package fonts/art only
- Latent UScript / IpDrv net
- Lightmaps absent; SoftDrv index-shade only
- Zone portals / thin same-zone walls incomplete

## Modules

`UTPal` `UTFont` `UTWin` `UTMenu` `UTSoft` `UTBsp` `UTGame` `UTHUD` …
