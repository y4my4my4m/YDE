# Unreal Tournament 99 for ZealOS

Native ZealC SoftDrv port. Formats from FaultyRAM/Ut99PubSrc + retail packages.

**SoftDrv = CPU framebuffer only** (P8 canvas → ARGB blit). UI = Canvas DrawTile + GrFont TTF LookAndFeel chrome. Full UScript UWindow Exec absent.

## Runs

```
Cd("::/Apps/UT99");;ExeFile("Run");
```

Boot opens Practice Session (MenuGr metal desktop, menubar, lavender LAF window).
WASD mouse SPACE jump LMB/RMB fire `[` `]` weapons Tab scores K suicide.
ESC pause menu. Maps: 1–4 favorites, `n`/`b` cycle.

## Present

- SoftDrv P8 + FTB BSP + FSpan; per-surf `.utx`
- UPalette from ArenaTex/MenuGr → `ut_pal_argb` blit; index 0 black; reserved pens include Win95 LAF lavender/blue
- **UTWin**: UCanvas DrawTile / DrawText; LAF frame/button/combo/tab helpers
- **UTFont**: `::/System/Gr/UISANS.TTF` via GrFont; optional UWindowFonts UFont
- Menu: MenuGr `rmetal` + embossed U (`epic`/`logo2`); Game menubar; Start Practice Session Match/Rules/Settings/Bots; Mutators stub dialog
- ChallengeHUD-style HUD via Canvas/TTF
- Zone-0 volume solid + upward facet floors; OOB Z rescue to spawn
- Bot spawn skips player start; 5s fire grace
- Light actors → facet shade; Botpack weapons; announcer; IT music; CTF/DOM

## Gaps

- Full UWindow hierarchy / UScript Exec not running
- Latent UScript / IpDrv net
- Lightmaps absent; SoftDrv index-shade only
- Zone portals / thin same-zone walls incomplete
- Mutator list is stub labels only

## Modules

`UTPal` `UTFont` `UTWin` `UTMenu` `UTSoft` `UTBsp` `UTGame` `UTHUD` …
