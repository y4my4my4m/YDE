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

Not done yet, in the order they are being done:

1. Studio models (`IDST`, MDL v10) — bones, sequences, blends. The alias model
   path still present is Quake's and will not load an HL model.
2. `pm_shared` player movement.
3. Native entity system. `HLProgs.ZC`/`HLBuiltin.ZC` are the QuakeC VM and are
   dead weight here — HL's game logic is native code, which is the SDK.
4. SPR v2 sprites (per-sprite palette, render modes).
5. Weapons, gamerules, HUD.
6. Monster AI: schedules, tasks, `scripted_sequence`, sentences.
7. Protocol 48 netcode. **Last** — single player runs in-process without it.

## Game data

Not redistributable, and there is no shareware Half-Life. Copy your own
install's `valve/` directory in:

    src/Apps/HL1/valve/

`pak0.pak` is required. The `.wad` files (`halflife.wad`, `liquids.wad`,
`xeno.wad`, `decals.wad`, ...) are loose files beside it in a retail install
and are looked for there first, then inside the paks.

Mission packs go in their own directory next to `valve` — `gearbox` for
Opposing Force, `bshift` for Blue Shift — and are selected with `game <dir>`
at the console.

`gfx/colormap.lmp` is a Quake file and `valve/` has no such lump. It is
generated from `gfx/palette.lmp` at startup instead; only 2D art still uses it.

## Running

    Cd("::/Apps/HL1");;ExeFile("Run");        // single player
    Cd("::/Apps/HL1");;ExeFile("RunNet");     // + UDP, inherited, not yet HL

`RunNet.ZC` is a separate entry point rather than a runtime switch because the
binding is compile-time — see its header.

## Build order

`Run.ZC` is the build script and the include order is load-bearing: ZealC is a
single-pass compiler, so a file can only reference symbols from an earlier one.
The header of `Run.ZC` documents the dependency graph.
