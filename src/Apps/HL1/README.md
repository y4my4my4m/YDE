# Half-Life for ZealOS

A GoldSrc-compatible engine written natively in ZealC, forked from this tree's
Quake port (`src/Apps/Quake`). The two are independent: every symbol here is
`HL*`/`hl_*` so both can be loaded in one task, and fixes must be carried
across by hand.

Valve's SDK (`valvesoftware/halflife`) is the *game* — `dlls/`, `cl_dll/`,
`pm_shared/`. The engine is not in it, so the split is:

| Layer | Source |
|---|---|
| BSP30, WAD3, studio models, sprites, rasteriser, sound, netcode | written here |
| player movement, entities, weapons, AI, HUD | ported from the SDK |

## Status

Half-Life levels load, render and are walkable. `HLTest;` renders a frame
off-screen and reports the numbers, which checks a build without starting the
game.

### Data and rendering

- **BSP v30** — `HLBSP.ZC`. Geometry lumps are byte-identical to BSP29. The
  differences are external textures, RGB lighting, four hulls, and extra
  contents codes.
- **WAD3** — `HLWad3.ZC`. Mounts the archives named in worldspawn's `wad` key.
  Most world textures live there, not in the map.
- **Per-texture palettes** — every miptex carries its own 256 colours, so there
  is no shared colormap and the renderer composites in RGB.
- **RGB lightmaps** — three bytes per luxel, dynamic lights included.
- **Truecolor canvas** — `CHLCanvas.pixels` is `0x00RRGGBB`. Gamma and the
  damage/water tint are applied in the blit rather than the palette, so they
  cover the world as well as the 2D layer.
- **Four clip hulls** — 32x32x72 standing, 64x64x64 large, 32x32x36 ducked.
- **Studio models** (`IDST` v10) — `HLStudio.ZC`. Bones, RLE animation
  channels, quaternion slerp, two-way blends, bodyparts/submodels/meshes,
  tristrip and trifan decode, skin families, textures embedded or in a sibling
  `<name>T.mdl`. Skinned software rasterisation through the world span loop.
- **SPR v2** — `HLSpr.ZC`. `texFormat` is inserted after `type`, shifting the
  later fields by four bytes. Own palette, ADDITIVE and INDEXALPHA blending.
- **Console/HUD font** — HL's `gfx.wad` stores `CONCHARS` as a WAD3 `qfont_t`
  with variable-width glyphs, not Quake's fixed 8x8 atlas. Decoded, with a
  fallback built from the kernel font when no usable `gfx.wad` is present.

### Gameplay

- **Player movement** — air acceleration with the 30-unit target cap
  (airstrafing), half-gravity leapfrog integration, jump at `sqrt(2*800*45)`
  with bunnyhop scaling and no auto-hop, and a duck state machine that swaps to
  hull 3. Duck is bound to `c`.
- **Ladders, water and falling** — `PM_Ladder` plane decomposition,
  `PM_WaterMove`, `PM_CheckWaterJump`, `PM_CheckFalling` damage and sound
  tiers, conveyor base velocity.
- **Native entity system** — `HLEntity.ZC`. HL's game logic is native, so the
  engine calls classes directly; there is no QuakeC. Classname spawn dispatch,
  method-ID virtual dispatch, `SUB_UseTargets` with delay and killtarget,
  `SUB_CalcMove`, master/multisource gating, pusher movement that carries the
  player. `+use` is bound to `e`.
- **Entity coverage** — every classname in all 125 shipped maps is recognised
  (41513/41513). Doors, buttons, trains and `path_corner`/`path_track`, the
  `trigger_*` family, `multi_manager`, `multisource`, switchable lights,
  rotating brushes, momentary doors and buttons, `env_*` effects, `game_text`,
  `item_*` pickups, chargers, conveyors, and `trigger_changelevel`.
- **Damage** — `HLEntTakeDamage`, HL's armour ratio (the suit absorbs 80% at
  two points of charge per point absorbed), `func_breakable`, `trigger_hurt`
  metered per half second with negative `dmg` healing.
- **Weapons** — `HLWeapon.ZC`. One table rather than the SDK's per-weapon
  classes: every weapon in scope is hitscan and differs only in numbers. Ammo
  pools with carry caps, pickup, bucket switching, reload, first-person view
  model, hitscan with the real `VECTOR_CONE_*` tangents and `gSkillData`
  values. Damage goes through `HLEntTakeDamage`, so shooting a breakable
  breaks it.
- **HUD** — `HLHud.ZC`, driven by `sprites/hud.txt`, one row per element per
  resolution; the largest set that fits the canvas wins. `cross` in that file
  is the health cross, not the reticle — the reticle is per weapon, in
  `sprites/weapon_<name>.txt`.
- **Combat AI** — `HLAI.ZC`. A schedule/task interpreter (17 tasks, 10
  schedules, per-state selection), state machine, view-cone and trace-based
  sensing with a relationship subset, melee and ranged attacks, death. Eight
  monsters tuned from `valve/skill.cfg`, with sequence labels read out of the
  shipped `.mdl` files.
- **Scripted sequences and speech** — `sentences.txt` parsed and played word by
  word, timed off each sample's real duration. `scripted_sequence` places its
  actor, runs a named sequence, then fires its target. Per-entity animation
  state, so a one-shot holds its last frame.
- **Sound** — door, button and train sound tables (HL stores these as integers
  the game code resolves, not as paths), `ambient_generic` loops, the
  `movesnd`/`stopsnd`/`sounds`/`volume` keys, and distance-cadenced footsteps.
  Twelve ambient voices: a map ships 60+ `ambient_generic`, and at Quake's
  three only the nearest three are ever audible.
- **Protocol 48** — delta compression driven by `valve/delta.lst` (all seven
  tables), the real opcode table, resource lists, user messages.

### Menu

The main menu follows HL's VGUI layout: the tiled backdrop from
`resource/background`, a left-aligned item column, and the armed item's help
text to its right. Items, order, `OnlyInGame` filtering, strings and colours
come from `resource/GameMenu.res`, `resource/gameui_english.txt` and
`resource/ClientScheme.res`. Submenus still use the Quake page furniture.

There is no screen-size option and `-`/`=` are unbound: Quake shrank the 3D
view inside the status bar, HL always renders full screen.

## Not done

- **Node-graph pathing.** HL routes monsters over a compiled node graph. There
  is none here and none can be generated from the shipped data, so movement is
  direct with a single wall-slide and a floor probe. A monster grinds against a
  wall between it and its target rather than walking around a corner. This is
  the largest gap in the AI and it is structural. `m_fMoveTo` WALK/RUN
  teleports the actor to the mark for the same reason.
- **Monster-vs-monster and monster-vs-player collision.** `HLTraceEntity`
  clips `SOLID_BSP` only; nothing traces a `SLIDEBOX`.
- **Animation events** (`mstudioevent_t`). The studio layer decodes bones, not
  events, so an attack lands at the end of its sequence rather than on the
  frame the claw connects.
- **Runtime entity creation** — `monstermaker`, `env_shooter`, `gibshooter`.
  `hl_entities` is sized to the parsed map and nothing allocates a slot
  mid-game. That is an entity-table lifetime change, not a missing class.
- **Beams and decals.** `env_beam`/`env_laser`/`infodecal` hold correct state;
  the renderer has no line primitive or decal layer.
- **`rendermode`/`renderamt`** are stored and ignored — no alpha or additive
  path on world faces, so `env_render` changes nothing visually.
- **Studio gaps**, in the order they bite: sequence groups (`<name>NN.mdl`),
  chrome skins, attachments, four-way blends, per-vertex lighting from the
  model normals. Everything is flat-lit from `HLLightPoint` at the entity
  origin.
- **Save/load for the native entity system.** `HLSave.ZC` still serialises the
  QuakeC world, which no longer exists.
- **`svc_packetentities`** — field encoding is done, the frame header is not.
  Off by one bit and every entity decodes as garbage at a plausible origin.

`HLProgs.ZC`/`HLBuiltin.ZC` are the QuakeC VM carried over by the fork. They
are dead weight and will be deleted once nothing calls them.

## Game data

Not redistributable, and there is no shareware Half-Life. Files go under:

    src/Apps/HL1/valve/

A retail install keeps most content loose, not in a pak — maps, the wads, and
much of `models/` and `sound/`. Every lookup is loose first then pak, gamedir
before `valve`, with case folded both ways, so a Steam install (lowercase) and
an old disc (uppercase) both resolve.

Whether `valve/pak0.pak` exists depends on the release: the 1998 discs shipped
one, later builds unpacked it. Either is fine and neither is required — nothing
in the engine path needs a pak's contents, and the boot check accepts "no pak,
but a map exists".

Copy the whole `valve/` directory if the disk image has room. The stock
`ZealOS.qcow2` is 1 GiB and will not fit one, so either grow it or copy a
subset. The minimum that gets a map on screen:

| File | Size | Why |
|---|---|---|
| `valve/halflife.wad` | ~70 MB | world textures |
| `valve/maps/*.bsp` | ~3 MB ea | whatever you want to look at |
| `valve/models/*.mdl` | ~1 MB ea | plus the matching `*T.mdl` |
| `valve/gfx/palette.lmp` | 768 B | 2D art colours; optional |
| `valve/resource/` | ~40 MB | menu backdrop, strings, scheme |

To find which wads a map wants, from the host:

    strings valve/maps/c1a1.bsp | grep -i '\.wad'

Two Quake-era files `valve/` does not have, both handled without them:

- `gfx/colormap.lmp` — generated from the palette at startup.
- `gfx/palette.lmp` — loose in some installs, inside the pak in others.
  Without it a generic colour cube stands in. 2D art only; the world is drawn
  through the per-texture palettes in the wads.

Mission packs go in their own directory next to `valve` — `gearbox` for
Opposing Force, `bshift` for Blue Shift — selected with `game <dir>` at the
console.

## Running

The build happens before the data check, which is the last thing `HL1()` does,
so an empty `valve/` still gets a full compile pass. That is the fastest way to
shake out compiler errors without moving 70 MB around.

    Cd("::/Apps/HL1");;ExeFile("Run");        // single player
    Cd("::/Apps/HL1");;ExeFile("RunNet");     // + UDP, inherited, not yet HL

`RunNet.ZC` is a separate entry point rather than a runtime switch because the
binding is compile-time; see its header.

`HLTest;` at the prompt runs the data-layer self-check: format readers,
palette, a map load, and a studio model load with its skin table resolved.

## Build order

`RunLib.ZC` compiles the engine, then `Run.ZC` includes `HL1`. Two `ExeFile`
passes, not one: a single compile of the whole tree faults nondeterministically.

The include order is load-bearing. ZealC is single-pass, so a file can only
reference symbols from an earlier one, and within a file only from an earlier
line. `RunLib.ZC` documents the dependency graph.

`utils/hl1-checkorder.py` checks the tree against those rules: cross-file and
within-file declaration order, nested class-typed declarations (which fault the
compiler), and `continue` statements (which ZealC does not have). It must report
zero of each.
