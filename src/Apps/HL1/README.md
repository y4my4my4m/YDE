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

Not done yet, in the order they are being done:

1. The rest of the brush entities. `func_plat` and `func_tracktrain` are in;
   rotating brushes need `HLDrawBrushModel` to take angles first, and nothing
   rotates until it does. Then momentary doors, breakables, and the damage
   system they need, plus blocked/crush handling on pushers.
2. SPR v2 sprites (per-sprite palette, render modes).
   Console and HUD text needs HL's `qfont_t` decoded out of `gfx.wad` -
   until then text falls back to the kernel 8x8 font and looks chunky.
3. Weapons, gamerules, HUD.
4. Monster AI: schedules, tasks, `scripted_sequence`, sentences.
5. Protocol 48 netcode. **Last** — single player runs in-process without it.

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
