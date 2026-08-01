# Diablo 1 for ZealOS

A ZealC port of Devilution (the reconstructed Diablo source) to this tree's
truecolor ZealOS. No SDL, no libc - the data formats and game logic are
reimplemented against the kernel and this tree's CDC blit path, following
the same structure as the Quake and HL1 ports.

## Running

1. Copy `DIABDAT.MPQ` from a Diablo CD (retail or Hellfire bundle) into
   this directory. It is gitignored; the port reads it in place at
   `::/Apps/Diablo1/DIABDAT.MPQ`.
2. Sync to the VM (`build/sync.sh vm`), boot, then:

       ExeFile("::/Apps/Diablo1/Run");

   `D1Test;` afterwards runs the data-layer self check (extraction byte
   sums, frame counts, town assembly).

Controls: mouse click walks. Arrows + ENTER drive the menu, ESC leaves
game / menu / app.

## What works

- MPQ v1 archive: Storm-cipher table/file decrypt, PKWARE DCL explode,
  sector reads. Whole archive stays resident (FileRead has no seek);
  every DIABDAT file is encrypted, 1752 of 2910 also imploded.
- CEL / CL2 / PCX decode, clipped and unclipped frames, CL2 direction
  groups, the smaltext font, palettes and fades.
- Town: TIL/MIN/SOL loading, the four sector DUNs assembled per
  town.cpp T_Pass3, all six dungeon-tile encodings, painter-order world
  render, click-to-walk warrior with BFS pathing over SOL flags.
- Title screen, main menu, cut screens.

The data layer and renderer are verified on the host by a transpile rig
(scratchpad d1_transpile.py; extraction compared byte-for-byte against
utils/mpqtool.py, frames eyeballed as PNG) and in-VM by D1Test.

## File map

| file | contents | devilution counterpart |
|---|---|---|
| D1Fmt.ZC | LE byte readers | - |
| D1Mpq.ZC | MPQ reader | Storm / PKWare explode.cpp |
| D1Pal.ZC | palette, fades | palette.cpp |
| D1Draw.ZC | 8bpp canvas, window blit | dx.cpp/scrollrt blit |
| D1Cel.ZC | CEL/CL2/PCX, small font | engine.cpp, control.cpp tables |
| D1Menu.ZC | title/menu/cut screens | DiabloUI (simplified) |
| D1Lvl.ZC | dPiece/micros/SOL, town | gendung.cpp, town.cpp |
| D1Render.ZC | tile encodings, world walk | _render.cpp, scrollrt.cpp |
| D1Play.ZC | player anim, walking, BFS | player.cpp, path.cpp |
| D1Test.ZC | self check | - |
| Diablo1.ZC | shell, input, game loop | diablo.cpp |

## Deviations

- Menu text is the in-game small font drawn as bright silhouettes; the
  DiabloUI artfonts (font16/font42 + .bin kerning) are not loaded yet.
- Pathing is BFS, not the original A*; same walkability rules.
- No lighting, transparency, audio, towners, monsters, items, spells,
  quests, dungeon generation, or multiplayer yet. Town only.

## Roadmap

drlg_l1 cathedral generation, towners with talk, the control panel,
inventory, monsters + AI, items, spells, save games, sound through AC97.

## License

Derivative of Devilution, Sustainable Use License - see LICENSE.md.
Non-commercial. Game data not included.
