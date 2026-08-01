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

Controls: left-click walks / attacks / picks up / opens / talks;
right-click casts the selected spell; `i` inventory, `c` character,
`s` spellbook, `q` quest log, TAB automap (`=`/`-` zoom it), `z` world
zoom (also mouse wheel), 1-8 drink from the belt. Every control-panel
button works. Arrows/ENTER or the mouse drive the menus; ESC backs out
and autosaves.

## What works

- MPQ v1 archive: Storm-cipher table/file decrypt, PKWARE DCL explode,
  sector reads. Whole archive stays resident (FileRead has no seek);
  every DIABDAT file is encrypted, 1752 of 2910 also imploded.
- CEL / CL2 / PCX decode, clipped and unclipped frames, CL2 direction
  groups, TRN recoloring, the smaltext font, palettes and fades.
- Town: TIL/MIN/SOL loading, the four sector DUNs assembled per
  town.cpp T_Pass3, eight NPCs at their towners.cpp spots with stand
  anims and hover names.
- All 16 dungeon levels: faithful drlg_l1 (cathedral), drlg_l2
  (catacombs: recursive room subdivision + wandering halls + the 3x3
  pattern table), drlg_l3 (caves: organic growth, river, lava pools) and
  drlg_l4 (hell: mirrored quadrants) on the exact Borland RNG. Stairs
  travel town -> L1 ... -> L16; level 15 descends through the pentagram.
  Theme rooms and quest set pieces are absent, so layouts diverge from
  retail seeds but are deterministic in ours.
- Lighting: MakeLightTable ramp shading, radial falloff around the
  player, applied to tiles and actors.
- Monsters: 32 types over the full depth (zombies, fallen, skeletons,
  scavengers, hidden, goat clans, overlords and more), machine-generated
  from their monstdat rows with TRN recolors. Melee chase AI plus archers
  (skeleton/goat bows) that keep distance and shoot.
- Missiles: arrows and firebolts with wall/target collision; right-click
  casts Firebolt for 6 mana.
- Combat: to-hit rolls both ways, hit flash, XP with level-ups (real
  ExpLvlsTbl thresholds), player death and town respawn.
- Objects and loot: barrels shatter, chests open, monsters drop gold and
  potions; click to pick up, keys 1-8 drink from the belt.
- Items: 69 base items generated from itemdat rows (weapons, armor,
  shields, helms, six potion kinds, gold); level-fit monster drops;
  the Inv.CEL inventory screen with a 10x4 grid and equip slots; weapon
  damage and armor AC feed combat.
- Objects: barrels, chests, and functional doors (exact objects.cpp
  piece-swap tables for cathedral and catacombs).
- A* pathfinding (path.cpp) with BFS fallback past its 24-step cap.
- Audio through the native AC97 mixer: WAV decode + 48kHz resample,
  8-voice SFX pool, looped music per level band, monster voices,
  menu/combat/item sounds. Options toggles for SFX and music.
- The Dark Lord waits on level 16; killing him wins the game.
- Control panel with live HP and mana orbs (authentic P8Bulbs drain
  compositing), clickable buttons, belt chips, gold/level readout,
  monster health bar on hover.
- Real DiabloUI front end: flaming logo, gold artfont items, focus
  pentagrams, mouse-driven menu, options screen (zoom, town jog, SFX,
  music). Title screen and cut screens on every level change.
- Single Player flow: character select over 3 save slots, class
  selection (Warrior/Rogue/Sorcerer with their real starting stats and
  hero portraits), name entry, delete-with-confirm.
- All three classes with the authentic player.cpp attribute tables, caps
  and CreatePlayer HP/mana derivations; class-correct player sprites.
- Character sheet at the real DrawChr coordinates, with working
  attribute-point spending on level up.
- Spells: Firebolt, Healing, Lightning, Flash, Fire Wall, Chain
  Lightning with authentic mana costs and damage formulas, plus the
  spellbook with its four pages.
- Automap from the .AMP tables: real isometric wall/door/stairs line
  work, explored-tile tracking, four zoom steps.
- Quest log: 13 level-triggered quests on the Quest.CEL panel.
- Magic items: 83 prefixes and 95 suffixes generated from itemdat, rolled
  per GetItemPower ("Vicious Long Battle Bow of the moon").
- Town shops: Griswold, Adria, Wirt, Pepin, Cain with generated stock,
  buy/sell, and the authentic Wirt peek fee.
- Save/load: 3 slots, own compact format, checksummed; persists the
  character, inventory, position and all 17 level seeds so dungeons
  regenerate identically. Autosaves on level change and on exit.
- devilutionX-style QOL: town jog, 2x zoom ('z'), hover HP bar, click
  feedback sounds. Widescreen needs a variable-width canvas and is not
  in yet.

The data layer, generator, renderer, lighting, and combat are verified on
the host by a transpile rig (scratchpad d1_transpile.py; extraction
compared byte-for-byte against utils/mpqtool.py, dungeon layout checksum
pinned, frames eyeballed as PNG) and in-VM by D1Test.

## File map

| file | contents | devilution counterpart |
|---|---|---|
| D1Fmt.ZC | LE byte readers | - |
| D1Mpq.ZC | MPQ reader | Storm / PKWare explode.cpp |
| D1Pal.ZC | palette, fades | palette.cpp |
| D1Rnd.ZC | Borland LCG | engine.cpp SetRndSeed/random_ |
| D1Draw.ZC | 8bpp canvas, window blit | dx.cpp/scrollrt blit |
| D1Lvl.ZC | dPiece/micros/SOL, town, grids | gendung.cpp, town.cpp |
| D1Light.ZC | shade tables, light grid | lighting.cpp |
| D1Cel.ZC | CEL/CL2/PCX, small font | engine.cpp, control.cpp tables |
| D1Menu.ZC | title/menu/cut screens | DiabloUI (simplified) |
| D1Drlg1.ZC | cathedral generation | drlg_l1.cpp |
| D1Drlg2.ZC (+T) | catacombs generation | drlg_l2.cpp |
| D1Drlg3.ZC (+T) | caves generation | drlg_l3.cpp |
| D1Drlg4.ZC (+T) | hell generation | drlg_l4.cpp |
| D1Render.ZC | tile encodings, world walk | _render.cpp, scrollrt.cpp |
| D1Mon.ZC (+D1MonT) | monsters, AI, combat | monster.cpp, monstdat.cpp |
| D1Mis.ZC | arrows, firebolt | missiles.cpp |
| D1Item.ZC | gold, potions, belt | items.cpp (reduced) |
| D1Obj.ZC | barrels, chests | objects.cpp (reduced) |
| D1Towner.ZC | town NPCs | towners.cpp |
| D1Play.ZC | player, melee, warps, BFS | player.cpp, path.cpp, trigs.cpp |
| D1Panel.ZC | control panel, orbs | control.cpp |
| D1Test.ZC | self check | - |
| Diablo1.ZC | shell, input, game loop | diablo.cpp |

## Deviations

- Menu text is the in-game small font drawn as bright silhouettes; the
  DiabloUI artfonts (font16/font42 + .bin kerning) are not loaded yet.
- Pathing is BFS, not the original A*; same walkability rules.
- Monster AI is chase + melee or kite + shoot; per-type quirks (fallen
  flight, scavenger corpse eating, gargoyle stone form, charges) are not
  modeled, and those types are absent from the roster.
- Lighting falloff is plain radial, not the original crawl tables; no
  wall-transparency (dTransVal) pass. Missiles draw over walls.
- Items are gold and potions only; no bases/affixes/inventory grid.
  Doors render open and never close. Firebolt is the one spell.
- No audio, quests, saves, Diablo boss, or multiplayer.

## Roadmap

remaining gaps: quest set-pieces and their unique bosses, the level-16
Diablo quad room, unique/set items, item identification and repair as
real mechanics, the remaining ~30 spells, monster special abilities,
towner dialog trees, widescreen (variable-width canvas), multiplayer.

## License

Derivative of Devilution, Sustainable Use License - see LICENSE.md.
Non-commercial. Game data not included.
