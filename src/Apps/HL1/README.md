# Half-Life for ZealOS

A GoldSrc-compatible engine written natively in ZealC, forked from this tree's
Quake port (`src/Apps/Quake`). The two are independent: every symbol here is
`HL*`/`hl_*` so both can be loaded in one task, and fixes have to be carried
across by hand.

Valve's SDK (`valvesoftware/halflife`) is open, but it is the *game* — `dlls/`,
`cl_dll/`, `pm_shared/`. The engine is not in it. So the split is:

| Layer | Source |
|---|---|
| BSP30, WAD3, studio models, sprites, rasterizer, sound, netcode | written here |
| player movement, entities, weapons, AI, HUD | ported from the SDK |

## Status

**Half-Life levels load, render and are walkable.** Confirmed in the VM on
`c1a0`: BSP30 geometry, WAD3 textures with per-texture palettes, RGB lightmaps,
the truecolor span rasteriser, and world collision. `HLTest;` renders a frame
off-screen and reports the numbers if you want to check a build without
starting the game.

Working, inherited from the Quake port and re-pointed at HL formats:

- **BSP v30** loader — `HLBSP.ZC`. Geometry lumps are byte-identical to BSP29;
  what changed is external textures, RGB lighting, and four hulls.
- **WAD3** archives — `HLWad3.ZC`. Mounts the archives named in worldspawn's
  `wad` key. Most HL world textures live here, not in the map.
- **Per-texture palettes** — every miptex carries its own 256 colours, so there
  is no shared colormap and the renderer composites in RGB.
- **RGB lightmaps** — three bytes per luxel throughout, including dynamic
  lights, which are now coloured.
- **Truecolor canvas** — `CHLCanvas.pixels` is `0x00RRGGBB`. Gamma and the
  damage/water tint moved out of the palette and into the blit, so they now
  cover the world too.
- **Four clip hulls** — 32x32x72 standing, 64x64x64 large, 32x32x36 ducked.
- **Studio models** (`IDST` v10) — `HLStudio.ZC`. Bones, RLE animation
  channels, quaternion slerp, two-way blends, bodyparts/submodels/meshes,
  tristrip and trifan decode, skin families, textures embedded or in a
  sibling `<name>T.mdl`. Skinned software rasterisation through the same span
  loop as the world.

- **HL player movement** — the parts that define how HL feels: air
  acceleration with the 30-unit target cap (airstrafing), half-gravity
  leapfrog integration, jump at `sqrt(2*800*45)` with bunnyhop scaling and no
  auto-hop, and a full duck state machine that swaps to hull 3. Duck is bound
  to `c` by default.

- **HUD** — `HLHud.ZC`, driven by `sprites/hud.txt` (one row per element per
  resolution; the largest set that fits the canvas wins). Health, suit charge
  and ammo. HL HUD sheets are SPR v2 with texFormat ADDITIVE, so they blend
  rather than draw opaque - drawn opaque every number gets a black box.
- **Console/HUD font** — HL's `gfx.wad` stores `CONCHARS` as a WAD3 `qfont_t`
  with variable-width glyphs, not Quake's fixed 8x8 atlas. Decoded, with a
  fallback to the kernel font when a Quake-format `gfx.wad` or none is present.
- **Damage** — `HLEntTakeDamage`, HL's armour ratio (the suit soaks 80% at two
  points of charge per point absorbed), `func_breakable`, `trigger_hurt`
  (metered per half second, negative `dmg` heals), `trigger_push`,
  `trigger_teleport`.
- **Scripted sequences and speech** — `HLAI.ZC`. `sentences.txt` parsed and
  played word by word, timed off each sample's real duration.
  `scripted_sequence` places its actor and runs a named sequence, then fires
  its target. Per-entity animation state, so a one-shot holds its last frame.
- **Sound** — door and button sound tables (HL stores these as integers the
  game code resolves, not as paths), `ambient_generic` loops, and the
  `movesnd`/`stopsnd`/`sounds`/`volume` keys.
- **Native entity system** — `HLEntity.ZC`. No QuakeC: HL's game logic is
  native, so the engine calls classes directly. Classname spawn dispatch,
  method-ID virtual dispatch, `SUB_UseTargets` with delay and killtarget,
  `SUB_CalcMove`, master/multisource gating, pusher movement that carries the
  player. Working classes: `func_door`, `func_button`, `func_train` +
  `path_corner`, the `trigger_*` family, `multi_manager`, `multisource`,
  switchable lights, `func_wall`. `+use` is bound to `e`.

Studio gaps, in the order they will bite: sequence groups (`<name>NN.mdl`),
chrome skins, attachments, four-way blends, and per-vertex lighting from the
model normals — everything is currently flat-lit from `HLLightPoint` at the
entity origin.

Also in, from this pass:

- **Weapons and inventory** — `HLWeapon.ZC`. One table rather than the SDK's
  per-weapon classes, because every weapon in scope is hitscan and differs
  only in numbers. Ammo pools with carry caps, pickup, bucket switching,
  reload, first-person view model, hitscan with the real `VECTOR_CONE_*`
  tangents and `gSkillData` values. Damage goes through `HLEntTakeDamage`, so
  shooting a breakable breaks it.
- **Ladders, water and falling** — `PM_Ladder` plane decomposition,
  `PM_WaterMove` (HL's, not Quake's), `PM_CheckWaterJump`, `PM_CheckFalling`
  damage and sound tiers, conveyor base velocity.
- **Protocol 48** — delta compression complete and driven by `valve/delta.lst`
  (all seven tables), the real opcode table, resource lists, user messages.

## Also in:

- **Combat AI** — `HLAI.ZC`. A real schedule/task interpreter (17 tasks, 10
  schedules, per-state selection), state machine, view-cone and trace-based
  sensing with a relationship subset, melee and ranged attacks, death. Eight
  monsters tuned from `valve/skill.cfg`, with sequence labels read out of the
  shipped `.mdl` files rather than guessed.
- **Entity coverage** — every classname in all **125** shipped maps is now
  recognised (41513/41513). Rotating brushes, momentary doors and buttons,
  `env_*` effects, `game_text`, `item_*` pickups, chargers, conveyors,
  `trigger_gravity`, and `trigger_changelevel` that actually changes level.
- **Brush rotation** — rotated rendering and rotated hull tracing, opt-in per
  entity so a moving train's bookkeeping yaw cannot rotate its collision hull.

## Deliberately NOT done, with the reason

- **Node-graph pathing.** HL routes monsters over a compiled node graph. There
  is none here and none can be generated from the shipped data, so movement is
  direct with a single wall-slide and a floor probe. A monster will grind
  against a wall between it and its target rather than walk around a corner.
  This is the single biggest gap in the AI and it is structural.
- **Monster-vs-monster and monster-vs-player collision.** `HLTraceEntity`
  clips `SOLID_BSP` only; nothing traces a `SLIDEBOX`. Monsters pass through
  each other.
- **Animation events** (`mstudioevent_t`). The studio layer decodes bones, not
  events, so an attack lands at the END of its sequence rather than on the
  frame the claw connects.
- **Runtime entity creation** — `monstermaker`, `env_shooter`, `gibshooter`.
  `hl_entities` is sized to the parsed map; nothing allocates a slot mid-game.
  That is an entity-table lifetime change, not a missing class.
- **Beams and decals are not drawn.** `env_beam`/`env_laser`/`infodecal` hold
  correct state; the renderer has no line primitive or decal layer.
- **`rendermode`/`renderamt` are stored and ignored** — no alpha or additive
  path on world faces yet, so `env_render` changes nothing visually.
- **VGUI.** HL's real menu is a widget toolkit; this uses Quake's menu with
  text stand-ins. Functional, structurally not HL's.
- **Save/load for the native entity system.** `HLSave.ZC` still serialises the
  QuakeC world, which no longer exists.
- **`svc_packetentities`** — field encoding is done, the frame header is not.
  Off by one bit and every entity decodes as garbage at a plausible origin.
- **`m_fMoveTo` WALK/RUN** teleports the actor to the mark, for want of the
  node graph above.

`HLProgs.ZC`/`HLBuiltin.ZC` are the QuakeC VM carried over by the fork. They
are dead weight now and will be deleted once nothing calls them.

Movement pieces still missing all need entities first: ladders, HL water
movement, fall damage, per-surface friction, conveyors.

## Game data

Not redistributable, and there is no shareware Half-Life. Files go under:

    src/Apps/HL1/valve/

A retail install keeps most content **loose**, not in a pak — maps, the wads,
and much of `models/` and `sound/`. Every lookup is loose-first, pak-second,
gamedir before `valve`, and case is folded both ways on the way, so a Steam
install (lowercase) and an old disc (uppercase) both resolve.

Whether `valve/pak0.pak` exists at all depends on the release: the 1998 discs
shipped one, later builds unpacked it. **Either is fine and neither is
required** — nothing in the engine path needs a pak's contents, and the boot
check accepts "no pak, but a map exists".

Simplest thing, if the disk image has room: copy the whole `valve/` directory.
The stock `ZealOS.qcow2` is 1 GiB and will not fit one, so either grow it or
copy a subset. The minimum that gets a map on screen:

| File | Size | Why |
|---|---|---|
| `valve/halflife.wad` | ~70 MB | world textures |
| `valve/maps/*.bsp` | ~3 MB ea | whatever you want to look at |
| `valve/models/*.mdl` | ~1 MB ea | plus the matching `*T.mdl` |
| `valve/gfx/palette.lmp` | 768 B | 2D art colours; optional |

To find which wads a map wants, from the host:

    strings valve/maps/c1a1.bsp | grep -i '\.wad'

Two Quake-era files `valve/` does not have, both handled without them:

- `gfx/colormap.lmp` — generated from the palette at startup.
- `gfx/palette.lmp` — present loose in some installs, inside the pak in
  others. Without it a generic colour cube stands in. This affects 2D art
  only; the world is drawn through the per-texture palettes in the wads.

`gfx.wad` is WAD3 here and stores `CONCHARS` as a font lump rather than
Quake's raw 128x128 atlas, so console text falls back to the kernel font,
read through `text.font`. Text always works, gfx.wad or not.

Mission packs go in their own directory next to `valve` — `gearbox` for
Opposing Force, `bshift` for Blue Shift — and are selected with `game <dir>`
at the console.

## Running

**You can compile and run before copying any game data.** The build happens
first; the data check is the last thing `HL1()` does, so an empty `valve/`
still gets you a full compile pass. That is the fastest way to shake out
compiler errors without moving 70 MB around.

    Cd("::/Apps/HL1");;ExeFile("Run");        // single player
    Cd("::/Apps/HL1");;ExeFile("RunNet");     // + UDP, inherited, not yet HL

`RunNet.ZC` is a separate entry point rather than a runtime switch because the
binding is compile-time — see its header.

`HLTest;` at the prompt after quitting runs the data-layer self-check: format
readers, palette, a map load, and a studio model load with its skin table
resolved. That is the fastest way to find out which layer is unhappy.

## Build order

`Run.ZC` is the build script and the include order is load-bearing: ZealC is a
single-pass compiler, so a file can only reference symbols from an earlier one.
The header of `Run.ZC` documents the dependency graph.
