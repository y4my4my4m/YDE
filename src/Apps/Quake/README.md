# Quake for y4mOS

A Quake engine written natively in ZealC. No C source is translated from id's
release: everything here is written against the published file format specs
(PAK, BSP29, MDL, WAD2, progs.dat).

## Why not a port of the original source

id's engine is GPL-2.0. ZealOS is public domain / unlicensed, so pulling GPL
code into this tree would relicense it. Independent implementation from the
format documentation keeps the tree clean.

Half-Life 1 is not a candidate at all: GoldSrc was never open-sourced, and only
the game-logic SDK is public.

## Game data

`id1/PAK0.PAK` is the shareware archive (id's freely redistributable episode 1).
It is gitignored - fetch it separately:

    curl -O https://ftp.gwdg.de/pub/misc/ftp.idsoftware.com/idstuff/quake/quake106.zip
    unzip quake106.zip                 # yields resource.1, an LHA self-extractor
    7z x -oout resource.1              # yields out/ID1/PAK0.PAK
    cp out/ID1/PAK0.PAK src/Apps/Quake/id1/

Expected: 18254423 bytes, md5 `5906e5998fc3d896ddaf5e6a62e03abb`, 339 entries.

## Files

| File | Role |
|---|---|
| `QFmt.ZC` | Little-endian byte readers; exact binary32 -> F64 widening |
| `QPak.ZC` | PAK mount / lookup / load |
| `QPal.ZC` | `palette.lmp` + `colormap.lmp`, plus a truecolor expansion |
| `QBSP.ZC` | BSP29 loader, all 15 lumps, surface extents, miptex |
| `QTest.ZC` | In-guest self-checks |
| `Run.ZC` | Include chain and entry point |

## ZealC constraints this code is written around

These are silent-failure traps, not style preferences:

- **No struct overlay on file bytes.** ZealC arithmetic is F64-only and postfix
  casts (`x(F64)`) are no-ops. Every on-disk field is decoded explicitly and
  binary32 is widened by rebuilding the double's bit pattern.
- **Globals are not zeroed** by the JIT. Anything read before its first write
  needs an explicit initializer.
- **`<<` and `>>` bind tighter than `*` and `/`** (opposite of C). Shift
  expressions mixed with arithmetic are parenthesized.
- **No `continue`, no ternary, no function-like `#define`.**
- **Locals are function-scoped**, so declarations are hoisted to the top.
- **Brace initializers only at global scope.**
- **A raw `$` in source is a DolDoc command** to the lexer, even inside a
  comment. Use the byte value `0x24`.
- **Mutual recursion through a forward declaration miscompiles.** BSP traversal
  must use direct self-recursion.
- **Single-pass compile**, so `Run.ZC` include order is load-bearing.

## Verifying the data layer

    Cd("::/Apps/Quake");;ExeFile("Run");

`QTest` should print values matching this host-computed ground truth for
`maps/e1m1.bsp` (BSP version 29):

    planes 1810  vertices 7358  edges 13497  surfedges 26702
    nodes 2750   leafs 1531     texinfo 489  faces 5516
    marksurfaces 7073  models 58
    visdata 40843 bytes  lightdata 168590 bytes  entities 26284 bytes

    vert bounds  x  -592.0 .. 1504.0
                 y  -416.0 .. 3064.0
                 z  -592.0 ..  272.0

    solid leafs 1 of 1531
    textures: slipbotsd(16x64) +0slipbot(64x64) slipside(16x16)
              sliplite(16x16) sfloor4_2(64x64)
    model0 mins  -607.0 -431.0 -607.0
    model0 maxs  1519.0 3071.0  287.0

    pal[0] = 00000000   pal[15] = 00EBEBEB   pal[255] = 009F5B53

The vertex bounds are the sharpest check on the binary32 decoder: a mantissa or
exponent mistake shows up there immediately.

## Status

- [x] PAK reader
- [x] BSP29 loader
- [x] Palette / colormap
- [x] PVS decompression + BSP traversal (frustum culled, front-to-back)
- [x] 8bpp span rasterizer -> truecolor blit
- [x] YDE app shell, raw-mouse look, flycam
- [x] **Runs in-guest, renders e1m1**
- [x] Alias models (.mdl), entity spawning, brush submodels
- [x] Two-layer scrolling sky *(untested)*
- [x] Player physics: gravity, walking, stairs, wall sliding *(untested)*
- [ ] Subdivide + hand-ASM the span loop
- [ ] QuakeC VM (monsters that actually think)

## Sky

Sky textures are 256x128 holding **two** 128x128 layers: the right half is the
solid starfield, the left half is clouds where palette index 0 is transparent.
They are also textured by *view direction*, not by surface position, so the sky
sits at infinity and does not slide as the player walks. The two layers scroll
at different speeds, which is where the drifting parallax comes from.

Drawing a sky face as an ordinary tiling texture instead shows both halves side
by side, repeated and static. Both dimensions are powers of two, so nothing
complains - it just looks like banded garbage.

## Collision

The BSP carries three collision trees. Hull 0 is the point hull used for
rendering; hulls 1 and 2 are the same geometry pre-grown by a player-sized and
a monster-sized box. Because the growing is baked in by the compiler, collision
is a **point trace** through hull 1 - the player's bounding box never appears
in the code.

Movement is trace, slide along the impact plane, repeat with the remaining
time. Stairs work by retrying the move from one step-height up and settling
back down, keeping whichever attempt travelled further.

Press **N** for noclip if you get stuck.

## A trap worth knowing: draw_it and teardown

The first build crashed reliably on quit. `QDrawIt` runs on the **window
manager task**, and the blit is ~307k pixel writes, so the compositor is
executing inside it a large fraction of the time. Setting `Fs->draw_it = NULL`
does not stop a call that has *already been entered*, so freeing the canvas
immediately afterwards frees memory out from under the compositor.

The ordering that works, and that any ZealOS app with a `draw_it` should use:

1. clear the flag the callback checks (`q_ready`)
2. detach `Fs->draw_it`
3. `Sleep(100)` so an in-flight call can drain
4. NULL each global *before* freeing what it pointed at

## Entities without QuakeC

There is no VM yet, so nothing precaches models. `QEnt.ZC` carries a
classname-to-model table instead, and entities spawn in their rest pose:
soldiers stand, doors sit closed, items float without bobbing. That is the
honest limit of the current engine, not a rendering bug.

## Launching

From the YDE launcher menu: **Quake**. Or from a terminal:

    Cd("::/Apps/Quake");;ExeFile("Run");

Controls: WASD move, mouse look, shift to run, T toggles stats, ESC quits.

`Run.ZC` runs `QTest` before `Quake`, so a data-layer regression shows up as
wrong numbers rather than as a black screen.

## Performance expectation

The span loop divides once per pixel. That is the deliberately slow, obviously
correct version, so the first run will not be fast. The two planned steps, in
order: subdivide the perspective divide to every 8-16 pixels, then hand-write
`QDrawSpan` in assembly. Do not start either until the output is known good.

Sound is deliberately deferred: AC97 output exists (`AudioStreamOpen` /
`AudioStreamPush`), so it is reachable, but it needs an 8-channel mixer.
