# Unreal Tournament 99 for ZealOS

Native ZealC SoftDrv port. Formats from FaultyRAM/Ut99PubSrc + retail packages.

## SoftDrv vs menu

- **SoftDrv** = CPU `URenderDevice` only (P8 Lock/Unlock/DrawTile → ARGB blit).
- **Menu** = UnrealScript **UWindow** from retail `System/UWindow.u`, `UMenu.u`, `UTMenu.u`.
- Paint path = Engine **Canvas** `DrawTile` / `DrawText` (iNative 465–469 / 472–474) → SoftDrv P8.
- PubSrc has `Window/` (Win32) + Engine Canvas headers. **No** `UWindow.uc` in pubsrc — class bodies live as ScriptText + bytecode inside retail `.u`.

## Runs

```
Cd("::/Apps/UT99");;ExeFile("Run");
```

Boot = `UTUWin` package client:
- Object graph: `UMenuRootWindow` + `UMenuMenuBar` + `UTGameMenu` pulldown (CreateRootWindow host)
- Art: `UMenu.u` Texture exports (`MenuBlack`, `Bg11`–`Bg43`, `BlueBar*`, `BlueMenu*`)
- Paint: mirrors `UMenuRootWindow.Paint` + `UMenuBlueLookAndFeel.Menu_Draw*` via Canvas DrawTile
- Input: mouse / keys → menubar + Game pulldown (`UTGameMenu` items from `UTMenu.int`)

Enter or **Start Practice Session** = start match. ESC/Q = quit. In-game ESC returns to UWindow.

Debug SoftDrv LAF clone: `ut_menu_fake_laf=TRUE` before `UT99` (not default).

WASD mouse SPACE jump LMB/RMB fire `[` `]` weapons Tab scores K suicide.
Maps: 1–4 favorites, `n`/`b` cycle.

## Present

- SoftDrv P8 + FTB BSP + FSpan; per-surf `.utx`
- **UTWin**: UCanvas DrawTile / DrawText
- **UTUWin**: RootWindow graph + package Texture paint + Canvas iNative bind
- **UTVM**: Canvas natives 465–469 / 472–474 skip-parms + cmd flags
- ChallengeHUD-style HUD via Canvas/TTF
- Zone-0 volume solid; bots; Botpack weapons; CTF/DOM

## Gaps

- Full UScript object `New` / property linker for every widget still thin — host graph covers Root/MenuBar/Game menu
- DrawTile iNative does not yet pop Texture object refs from bytecode (host Paint drives tiles)
- Latent UScript / IpDrv net
- Lightmaps absent; SoftDrv index-shade only

## Modules

`UTPal` `UTFont` `UTWin` `UTUWin` `UTMenu` (debug LAF) `UTSoft` `UTBsp` `UTGame` `UTHUD` `UTVM` …
