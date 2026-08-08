# UT99 for ZealOS

Contract: `docs/Apps/UT99/PORT.md`.

Boot = Engine Client (`UTClient`) + SoftDrv `URenderDevice`.
UWindow from retail `System/UWindow.u` / `UMenu.u` / `UTMenu.u`.
Start Match → `UTClientTravel` → Level Model SoftDrv + PlayerStart possess.
SoftDrv world draw uses Z-buffer (FSpan off: first-seg clip + seg cap sealed the view).
Cursor = `Texture'MouseCursor'` from UWindow.u (exact name) or poly arrow — UWindow only.
Menu music = `utmenu23.umx`; map travel falls back to Cannon.

## SoftDrv

- SoftDrv = CPU `URenderDevice` (P8 Lock/Unlock/DrawTile → ARGB blit via `ut_pal_argb`).
- Level = `.unr` Model1 via `UTBspDrawModel` after ClientTravel bind.
- Menu = UWindow host; cursor = SoftDrv glyph (`Texture'MouseCursor'` or pen). `MouseRaw` hides OS pointer — soft cursor integrates `mouse_hard.raw_data`.
- GameInfo / ChallengeHUD object Exec incomplete (PORT.md).

## Resolution

SoftDrv canvas defaults **640×480**. Present blit stretches to fill the WinMax window (`ut_blit_*` = full `dc`; no letterbox).

| Slot | Size |
|------|------|
| 0 | 320×240 |
| 1 | 400×300 |
| 2 | 512×384 |
| 3 | 640×480 (boot) |
| 4 | 800×600 |
| 5 | match window (`Fs->pix_*`, clamped) |

Cycle in-game: **F5** or **=**. Or set `ut_opt_res` then `ut_res_dirty=TRUE` before/while running.

## Run

Quit QEMU if disk mounted. Sync host → guest:

```
cd /home/y4my4m/gits/y4mOS/build && ./sync.sh vm
```

Guest:

```
Cd("::/Apps/UT99");;ExeFile("Run");
```

WASD move, mouse look, Space jump, ESC = UWindow, Q = quit, F5/= = SoftDrv res.

Level load fail → **"Engine Client incomplete"** + gap note.
Level ok, GameInfo/ChallengeHUD missing → corner overlay, walkable.

## Gaps

- UObject New + property linker for widget/actor graph
- GameInfo / DeathMatchPlus from Botpack Exec
- ChallengeHUD PostRender via Canvas natives
- Full UWindow RootWindow object Tick/Paint
