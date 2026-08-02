# HL1 Wave A — Campaign Playable

**Date:** 2026-08-03  
**Status:** draft for user review  
**Scope:** `src/Apps/HL1` only  
**Fidelity:** hybrid C — combat/AI/move SDK-cited; FX playable + `Deviation:` OK  
**Verify:** extend `HLTest` where cheap; user smoke campaign maps  

**Roadmap:** A (this) → B (perf) → C (net) → D (visual) → L (leftovers). Specs for C/D/L later.

## Goal

Ship single-player campaign behaviour that no longer feels broken against Anniversary `valve/` maps: monsters that fence correctly, fire travelling projectiles, leap, form fireteams where the code already claims to, and weapon/HUD edges that the port itself lists as missing.

## Non-goals (out of Wave A)

- Soft-raster FPS (Wave B)
- Protocol 48 send, prediction, demo record (Wave C)
- Gouraud / chrome / seq groups / glow-through-geo / present-buffer fades / VGUI mouse (Wave D)
- Scent, node cover, scripted death poses, spray, voice, full `func_tank*` / `xen_*`, `stuffcmd "bf"`, pathfind heap (Wave L)
- Rewriting working squad machinery from scratch if audit shows it already matches SDK

## Known ground truth (audit before rewrite)

| Claim | Reality in tree |
|---|---|
| README “Squad AI: hgrunts fight as individuals” | `HLAI.ZC` already has `HLAIOccupySlot` / `VacateSlot` / `SquadRecruit` / save fields. Treat as **audit + fix gaps**, not greenfield. |
| “No runtime entity allocation” for AI projectiles | Player projectiles already use `hl_proj[HLPROJ_MAX]` in `HLWeapon.ZC` (bolt, rocket, grenade, hornet, snark, …). Extend kinds + AI fire path; do not invent a second pool. |
| Crossbow zoom FOV “half applied” | Shell already reads `hl_wpn_zoom_fov` in `HL1.ZC:1454`. Fix stale comment only. |
| “Player cannot hurt monster” | `HLWeapon` already calls `HLDmgHurt`. Fix stale comment only. |
| Flashlight dlight thrash | Already keyed (`HLFLASH_DLIGHT_KEY`). Wave B, not A. |

## Architecture

### 1. AI projectiles via `hl_proj[]`

Extend `CHLProj` / `HLPRJ_*` with AI kinds (names illustrative; final names match existing style):

- `HLPRJ_SPIT` — bullsquid
- `HLPRJ_HORNET` already exists — wire islave / agrunt anim events to spawn, stop hitscan stand-in
- `HLPRJ_CTRLBALL` — controller energy ball
- `HLPRJ_AIGRENADE` — hgrunt / similar timed or contact grenade

Each kind: spawn at event origin+forward, integrate like existing projectiles, touch → `HLDmgHurt` with SDK damage/bits, lifetime, model/sprite. Cap: same `HLPROJ_MAX`; drop oldest or refuse with log if saturated (`Deviation:` OK if marked).

Replace hitscan stand-ins in `HLAI` HandleAnimEvent paths (grunt grenade early-return, spit, etc.).

### 2. Monster clip

- Honour `FL_MONSTERCLIP` / `func_monsterclip`: solid to `SOLID_SLIDEBOX` monsters, not to player.
- Keep existing slidebox-vs-slidebox / player clip.
- README “monster-vs-monster collision: traces clip SOLID_BSP only” — extend monster mover traces to clip slideboxes + monsterclip brushes the way SDK `UTIL_TraceMonsterHull` expectations require for campaign fences.

### 3. Fauna

Spawn-inert small fauna (leech and friends listed in README / `HLEntSpawnInert`): minimal life cycle — model, idle/swim or crawl schedule, touch/bite damage, death. Not full talk-AI. Prefer SDK schedule subset; `Deviation:` if simplified mover.

### 4. Headcrab leap

On leap anim event: apply velocity along aim (SDK leap), airborne until ground/touch; `LeapTouch` damages player. Requires monster mover to accept vertical velocity for that state (today leap is walk+bite).

### 5. MakeDormant

Implement DispatchSpawn middle clause: destination copies of transition entities stay dormant until restore merge / `EntityUpdate`. Required for changelevel carry correctness.

### 6. `func_tracktrain` hull

Fix hull / path-follow sizing against SDK `CFuncTrackTrain` so campaign trains do not stick or fall through. No driveables (still Wave L / never unless needed by a shipped map).

### 7. Weapon / HUD holes

- Autoaim: feed live on-target flag into HUD so crosshair swaps to autoaim art (`hud.txt`). Deflection already lives in `HLWeaponAutoaim`.
- Gauss: spawn exit flare / reflection glow as temp sprites (`R_TempSprite` equivalents already used elsewhere), not only beams.
- RPG: real `laser_spot` projectile/entity driven by designator; eye-trace remains fallback if pool full (`Deviation:`).

### 8. Comment hygiene

Delete or rewrite stale NOT IMPLEMENTED / Deviation notes for zoom FOV and player→monster damage once verified.

## Files (primary)

| File | Role |
|---|---|
| `HLWeapon.ZC` | `hl_proj` kinds, RPG spot, gauss sprites, autoaim HUD publish |
| `HLAI.ZC` | anim events → projectiles, leap, fauna schedules, squad audit, monsterclip consumers |
| `HLEntity.ZC` | `MakeDormant`, `func_monsterclip` behaviour, fauna spawn, tracktrain hull |
| `HLClip.ZC` / `HLPhys.ZC` | monsterclip + mon-vs-mon trace rules |
| `HLHud.ZC` | autoaim reticle swap |
| `HLPart.ZC` / `HLSpr.ZC` | gauss glow sprites if not in weapon file |
| `HLSave.ZC` | persist new proj kinds + dormant bit if needed |
| `HLTest.ZC` | spawn fauna classnames; fire one AI proj; monsterclip solid test if feasible |
| `README.md` | tick Wave A items off Not done when verified |

## Data flow (AI projectile)

```
HandleAnimEvent (HLAI)
  → HLProjAlloc(kind, origin, vel, dmg, owner)
  → HLWeaponProjFrame / shared integrator
  → touch → HLDmgHurt(target, owner, dmg, bits)
  → free slot
```

## Error / saturation

Pool full: refuse spawn, optional one-line `HL1LOG` / `ridelog`; no crash. Prefer oldest AI proj eviction only if SDK-like spam would softlock a fight — document choice in code comment.

## Testing

**Automated (`HLTest`):**

- Load map or synthetic spawn: at least one previously inert fauna classname is non-inert (has model / think).
- Alloc+tick one `HLPRJ_SPIT` or AI grenade; confirm slot frees after lifetime or touch.
- Optional: entity with `func_monsterclip` blocks monster hull, not player hull (unit-style if harness allows).

**Manual smoke (user):**

- `c1a0` → early combat with headcrabs (leap).
- Map with hgrunt fireteam (squad spacing / no everyone-rushes if audit expects it).
- Bullsquid or controller encounter (travelling spit/ball).
- Changelevel with carry items (dormant path).
- Tracktrain segment on a campaign map that previously failed.
- Gauss secondary + RPG laser visible.

## Success criteria

- README Not done bullets for fauna, squad (if still inaccurate), monsterclip/mon-vs-mon, tracktrain, and the weapon holes listed above are resolved or narrowed with explicit remaining `Deviation:`.
- No regression on `HLTest` existing suites.
- Hybrid C: every new combat path cites SDK `file:line` where behaviour is claimed equivalent.

## Risks

- `HLAI.ZC` / `HLEntity.ZC` / `HLWeapon.ZC` are huge; edits must stay local to listed symbols.
- ZealC single-pass include order — new symbols only in files that compile before callers, or publish globals the way `hl_wpn_zoom_fov` does.
- Save/load must learn new `HLPRJ_*` values without breaking old saves (version or default FREE).
