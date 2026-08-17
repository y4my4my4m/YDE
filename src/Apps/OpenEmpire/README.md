# Open Empire for ZealOS

A ZealC port of [openempire](https://github.com/glouw/openempire), an RTS
engine that reads Age of Empires II Trial assets. No SDL, no libc - the DRS
and SLP formats and the game logic are reimplemented against the kernel and
this tree's CDC blit path, following the same structure as the Quake, HL1 and
Diablo1 ports.

Open Empire was written from scratch by Gustav Louw and is not a decompilation
of Age of Empires II. Age of Empires II is copyright Microsoft Corporation,
Ensemble Studios and SkyBox Labs.

## Data

The Trial is a free download. Fetch and unpack it on the host:

    curl -LO https://archive.org/download/AgeofEmpiresIITheAgeofKings_1020/AoE2demo.zip
    unzip AoE2demo.zip
    7z x -oaoe AoE2demo.exe

Copy `aoe/Data` to `src/Apps/OpenEmpire/Data`. Only five files are read:
`graphics.drs`, `interfac.drs`, `terrain.drs`, `sounds.drs` and
`blendomatic.dat`. The directory is gitignored; the Trial is redistributable
by Microsoft's Game Content Usage Rules only as the original download.

## Running

Sync to the VM (`build/sync.sh vm`), boot, then:

    ExeFile("::/Apps/OpenEmpire/Run");

The game spawns its own task, so the invoking shell stays usable.
`OETest;` afterwards runs the data-layer self check - archive indices,
palette, SLP decode byte sums, the iso transform round trip and pathfinding.

## What works

- DRS archives: 64-byte header, table and file index, whole-archive resident
  because FileRead has no seek. graphics 26.6M, interfac 11.8M, terrain 4.6M.
- SLP sprites: all 19 row opcodes including player colour, shadow, the
  extended outline and fill forms. Decoded once into per-row spans, so the
  blitter never visits a transparent pixel and one cache entry serves all
  eight player colours.
- JASC palettes out of interfac.drs, the ARGB lookup, the shadow darkening
  table and the 64K half-blend table an indexed canvas needs.
- 8bpp canvas with a parallel priority plane, the span blitter with
  upstream's transfer rule, and the scaled window blit.
- Integer point maths and the cart / iso / cell / tile transforms.
- A* over the walkability field, on the reference's eight-neighbour rule
  with diagonals blocked at corners.
- WAV decode from sounds.drs, resampled to 48kHz stereo, with a voice pool.
  openempire has no audio; this is addition, not port.

## What is absent

The blendomatic mask pass, the minimap, the UDP transport and
out-of-sync restore, and sound call sites. `docs/Apps/OpenEmpire/PORT.md`
carries the full gap list and the deviations.

Upstream's 128x128 map holds two terrain values - 14400 dirt and 1984 grass.
The world is a test fixture, not content, so a faithful port renders a
faithful test fixture.