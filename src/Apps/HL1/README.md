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

Studio gaps, in the order they will bite: sequence groups (`<name>NN.mdl`),
chrome skins, attachments, four-way blends, and per-vertex lighting from the
model normals — everything is currently flat-lit from `HLLightPoint` at the
entity origin.

Not done yet, in the order they are being done:

1. Native entity system. `HLProgs.ZC`/`HLBuiltin.ZC` are the QuakeC VM and are
   dead weight here — HL's game logic is native code, which is the SDK.
2. SPR v2 sprites (per-sprite palette, render modes).
3. Weapons, gamerules, HUD.
4. Monster AI: schedules, tasks, `scripted_sequence`, sentences.
5. Protocol 48 netcode. **Last** — single player runs in-process without it.

Movement pieces still missing all need entities first: ladders, HL water
movement, fall damage, per-surface friction, conveyors.

## Game data

Not redistributable, and there is no shareware Half-Life. Files go under:

    src/Apps/HL1/valve/

A retail install keeps most content **loose**, not in a pak — maps, the wads,
and much of `models/` and `sound/`. Every lookup is loose-first, pak-second,
gamedir before `valve`, and case is folded both ways on the way, so a Steam
install (lowercase) and an old disc (uppercase) both resolve.

`pak0.pak` is **not required**. It is ~350 MB and nothing in the renderer path
needs it. The current minimum is:

| File | Size | Why |
|---|---|---|
| `valve/halflife.wad` | ~70 MB | world textures |
| `valve/maps/c0a0.bsp` | ~2 MB | any map; `c0a0` is the default |
| `valve/liquids.wad` | ~3 MB | only if the map's `wad` key names it |
| `valve/models/*.mdl` | ~1 MB ea | optional; whatever the map's monsters use |

For models, `scientist.mdl` plus `scientistT.mdl` is the useful pair to start
with — it exercises the external-texture path, which most player and NPC
models use. `HLTest;` loads exactly that.

Watch the disk. The stock `ZealOS.qcow2` is 1 GiB virtual with ~460 MiB free —
a full `valve/` will not fit without growing it.

Two Quake-era files `valve/` does not have, both handled without it:

- `gfx/colormap.lmp` — generated from the palette at startup.
- `gfx/palette.lmp` — lives inside `pak0.pak`. Without it a generic colour
  cube stands in. This affects 2D art only; the world is drawn through the
  per-texture palettes in the wads.

`gfx.wad` is WAD3 here and stores `CONCHARS` as a font lump rather than
Quake's raw 128x128 atlas, so console text falls back to the kernel font
(`sys_font_std`). Text always works, gfx.wad or not.

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
