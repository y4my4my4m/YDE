# UT99 for ZealOS

Contract: `docs/Apps/UT99/PORT.md`.

Boot = Engine Client (`UTClient`) + SoftDrv `URenderDevice`.
UWindow from retail `System/UWindow.u` / `UMenu.u` / `UTMenu.u`.
Start Match → `UTClientTravel` → Level Model SoftDrv + PlayerStart possess.

## SoftDrv

- SoftDrv = CPU `URenderDevice` (P8 Lock/Unlock/DrawTile → ARGB blit).
- Level = `.unr` Model1 via `UTBspDrawModel` after ClientTravel bind.
- Menu = UWindow host; cursor = `Texture'MouseCursor'` SoftDrv DrawTile.
- GameInfo / ChallengeHUD object Exec incomplete (PORT.md).

## Run

```
Cd("::/Apps/UT99");;ExeFile("Run");
```

WASD move, mouse look, Space jump, ESC = UWindow, Q = quit.

Level load fail → **"Engine Client incomplete"** + gap note.
Level ok, GameInfo/ChallengeHUD missing → corner overlay, walkable.

## Gaps

- UObject New + property linker for widget/actor graph
- GameInfo / DeathMatchPlus from Botpack Exec
- ChallengeHUD PostRender via Canvas natives
- Full UWindow RootWindow object Tick/Paint
