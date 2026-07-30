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
- **Mip selection** is texels per screen pixel, using the texinfo vector length
  as Quake's `mipadjust` does, not distance alone. HL scales its textures far
  more than Quake and ships them at 128 or 256 against Quake's 64, so ignoring
  the vector length costs one to two mip levels on most world geometry.
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
  with bunnyhop scaling and no auto-hop. Duck is bound to `c`.
- **Ducking** follows `PM_Duck`/`PM_UnDuck`: the press edge arms a 1s timer, the
  transition completes after `TIME_TO_DUCK` 0.4s or immediately when airborne,
  the origin drops 18 units so the feet stay put, `PM_FixPlayerCrouchStuck`
  nudges up to 36 units if the smaller hull lands inside geometry, unducking
  traces the raised position with both hulls before committing, and the command
  is scaled by 0.333 while ducked. The view eases to `VEC_DUCK_VIEW - fMore`,
  below the ducked eye height, because the origin has not moved yet.
- **Ladders, water and falling** — `PM_Ladder` plane decomposition,
  `PM_WaterMove`, `PM_CheckWaterJump`, `PM_CheckFalling` damage and sound
  tiers, conveyor base velocity.
- **Native entity system** — `HLEntity.ZC`. HL's game logic is native, so the
  engine calls classes directly; there is no QuakeC. Classname spawn dispatch,
  method-ID virtual dispatch, `SUB_UseTargets` with delay and killtarget,
  `SUB_CalcMove`, master/multisource gating, pusher movement that carries the
  player. `+use` is bound to `e`.
- **Trains** — `func_train` walks `path_corner`; `func_tracktrain` walks
  `path_track` and yaws to the direction of travel, with Valve's 180 degree
  offset because tracktrain brushwork is modelled facing west. Its collision
  hull turns with it.
- **Animation events** — `mstudioevent_t` is decoded per sequence and dispatched
  from the frame the tick stepped over, not the frame it landed on. The shared
  script events are interpreted: 1004 and 1008 play the sound named in
  `options` on CHAN_BODY and CHAN_VOICE with a real entnum, 1005 and 1010 speak
  a sentence. This is where most monster foley and vocalisation lives.
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

Built from the shipped `resource/` files rather than approximated.

- **Main menu** — the tiled backdrop composited from
  `resource/background/800_*.tga` (12 TGA tiles, 4x3 at 256 pitch, cropping to
  exactly 800x600, nearest-neighbour scaled to the canvas), a left-aligned item
  column, and the armed item's help text to its right. Items, order and
  `OnlyInGame` filtering from `GameMenu.res`; labels and hints from
  `gameui_english.txt`; colours from `ClientScheme.res` — `BrightControlText`
  for items, white for armed, `DimBaseText` for help.
- **Dialogs** — New Game with the `#GameUI_Difficulty` combo (skill 1/2/3,
  default Medium), and multi-slot Save Game and Load Game lists. All three are
  laid out at their `.res` coordinates, which are authored in 800x600 space, on
  a `ControlBG`-blended panel.
- **Options** — HL's tabbed dialog. Keyboard, Aim, Audio and Video, with the
  labels from `OptionsSub*.res`. Multiplayer, Voice and Lock are not shown:
  nothing in this port drives them. Row 0 of each page is the tab strip, so Up
  from the first control reaches it and Left/Right there changes page.
- Without `resource/background/800_*.tga` the backdrop falls back to
  `gfx/lambda.bmp` over black plus a text wordmark. Only those 12 tiles are
  needed, 1.9 MB; the rest of `resource/background` is the 21:9 set.
  `HLTest;` reports which of the two you will get.
- Text is recoloured per glyph rather than drawn in the font's own colours:
  CONCHARS glyphs are pre-coloured orange over a dark outline, so a flat colour
  is modulated by each texel's luminance. That keeps the outline and stays
  legible over a photograph.

There is no screen-size option and `-`/`=` are unbound, and `HLSbarLines` is
always 0: Quake reserved rows at the bottom of the screen for the status bar and
shrank the 3D view above them. HL has no status bar — the HUD is an overlay on a
full-screen view.

## Not done

- **Node-graph pathing.** HL routes monsters over a compiled node graph. There
  is none here and none can be generated from the shipped data, so movement is
  direct with a single wall-slide and a floor probe. A monster grinds against a
  wall between it and its target rather than walking around a corner. This is
  the largest gap in the AI and it is structural. `m_fMoveTo` WALK/RUN
  teleports the actor to the mark for the same reason.
- **Monster-vs-monster and monster-vs-player collision.** `HLTraceEntity`
  clips `SOLID_BSP` only; nothing traces a `SLIDEBOX`.
- **Per-monster animation events.** The shared script events (1004/1005/1008/
  1010) are dispatched. Codes at 2000 and above are interpreted by each
  monster's own `HandleAnimEvent`, which does not exist here, so an attack still
  lands at the end of its sequence rather than on the frame the claw connects.
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
- **Save/load for the native entity system.** The menu writes and lists eight
  slots, but `HLSave.ZC` still serialises the QuakeC world, which no longer
  exists: a restored game gets the player back and an unmodified map. Entity
  state is not in the file.
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
| `valve/resource/background/800_*.tga` | 1.9 MB | menu backdrop (12 tiles) |

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
