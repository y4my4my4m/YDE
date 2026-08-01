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
   sums, frame counts, town assembly). `D1TestAudio;` checks the playback
   path - voice allocation, pool oversubscription, music track switching,
   and buffer stability while a voice is reading. It is audible and takes
   about 20 seconds.

Controls: left-click walks / attacks / picks up / opens / talks;
right-click casts the selected spell; `i` inventory, `c` character,
`s` spellbook, `q` quest log, TAB automap (`=`/`-` zoom it), `z`
toggles 2x world zoom, the mouse wheel steps 19 levels from the
per-resolution floor (0.50x at 640x480) to 4.00x, `w` cycles resolution
640x480 / 800x600 / 1024x768 / 1280x720 / 1280x960, SHIFT-click stands
ground, holding left-click renews the walk, ESC opens the in-game menu
(Save / Options / New Game / Load / Quit), 1-8 drink from the belt. Every control-panel button works. Arrows/ENTER or the mouse drive the menus; ESC backs out
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
  Quest set pieces are stamped from their retail DUNs (rnd6, SKngDO,
  Banner2, Blood1, Bonestr2, Blind2, Warlord and the four level-16 diab
  quads). Theme rooms are absent, so layouts diverge from retail seeds
  but are deterministic in ours.
- Lighting: MakeLightTable ramp shading, radial falloff around the
  player, applied to tiles and actors.
- Monsters: 80 types over the full depth, machine-generated from their
  monstdat rows with TRN recolors, carrying mAi, class and magic
  resistance. Per-type AI mirroring the MAI_ routines: fallen rally and
  rout, scavenger corpse eating, gargoyle stone form, rhino charges,
  sneak fade, erratic bats, and magma/acid/succubus/storm casters firing
  their own missiles. Immunity and resistance apply per school.
- Missiles: 11 types (arrows, firebolt, fireball, holy bolt, elemental,
  inferno, charged bolt, acid, blood star, lightning) with wall and
  target collision.
- Combat: to-hit rolls both ways, hit flash, XP with level-ups (real
  ExpLvlsTbl thresholds), player death and town respawn.
- Objects and loot: barrels shatter, chests open, monsters drop gold and
  potions; click to pick up, keys 1-8 drink from the belt.
- Items: 74 base items generated from itemdat rows (weapons, armor,
  shields, helms, five staves, six potion kinds, gold); level-fit
  monster drops; the Inv.CEL inventory screen with a 10x4 grid and
  equip slots; weapon damage and armor AC feed combat.
- Staves carry a GetStaffSpell roll and charges; casting from one bills
  the staff, the panel icon tints orange (RSPLTYPE_CHARGES), and Adria
  stocks them. A spent staff stays spent: recharging is absent.
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
  pentagrams, mouse-driven menus, and a sectioned scrollable options
  list (AUDIO / GRAPHICS / GAME) shared with the in-game menu: sound
  and music toggles and volume sliders, resolution, fullscreen, fit to
  screen, integer scaling, zoom, gamma, town jog. The gmenu skin draws
  retail optbar/option.cel sliders. Title screen and cut screens on
  every level change.
- Single Player flow: character select over 3 save slots, class
  selection (Warrior/Rogue/Sorcerer with their real starting stats and
  hero portraits), name entry, delete-with-confirm.
- All three classes with the authentic player.cpp attribute tables, caps
  and CreatePlayer HP/mana derivations; class-correct player sprites.
- Character sheet at the real DrawChr coordinates, with working
  attribute-point spending on level up.
- Spells: 19 from spelldat with their real mana costs, book levels and
  GetDamageAmt formulas, including Town Portal, Stone Curse, Mana
  Shield, Teleport, Phasing, Nova, Fireball, Bone Spirit and Blood
  Star; the spellbook lays its four pages out per SpellPages.
- Automap from the .AMP tables: real isometric wall/door/stairs line
  work, explored-tile tracking, four zoom steps.
- Quest log: 13 level-triggered quests on the Quest.CEL panel, with the
  set-piece bosses The Butcher, the Skeleton King and the Warlord of
  Blood on their real stat rows; killing one completes its quest.
- Magic items: 83 prefixes and 95 suffixes generated from itemdat, rolled
  per GetItemPower ("Vicious Long Battle Bow of the moon"); magnitudes
  roll once at creation per SaveItemPower and persist on the item, and
  identified items list their PrintItemPower lines in the info box.
  Unique powers list there too (DrawUniqueInfo's side box is absent).
- Unique items: 15 from UniqueItemList, rolled through CheckUnique with
  the UniqueItemFlag once-only bitmap; their powers feed damage, AC and
  attributes through the same getters combat already uses.
- Items drop unidentified and wear out: durability rolled per
  ItemRndDur, WeaponDur and ArmorDur decrements, breakage, and
  Griswold's repair priced by AddStoreHoldRepair.
- Town shops: Griswold, Adria, Wirt, Pepin, Cain with generated stock,
  buy/sell, repair, Cain's flat 100-gold identify, and the authentic
  Wirt peek fee. Every towner opens menu-first with its greeting voice;
  "Talk to" is the S_StartTalk topic menu - random gossip from the
  towner's range plus level-gated quest rows - and hovering a stock or
  service row fills the panel info box.
- Towner dialog: 171 lines from textdat alltext - greeting, rotating
  gossip and per-quest topics gated on the deepest level reached - in
  the TextBox.CEL frame, the MedTextS quest font scrolling upward at
  each line's txtspd per minitext.cpp, each line spoken by its own
  voice resolved through effects.cpp sgSFX. Store and dialog panels
  draw half-transparent with retail text colors; hovered actors get
  their CelBlitOutline halo (monsters red, towners silver).
- Save/load: 3 slots, own compact format, checksummed; persists the
  character, inventory, position and all 17 level seeds so dungeons
  regenerate identically, plus per-item prefix/suffix/unique/identified
  state, durability, staff charges and per-item affix rolls, the
  unique-drop bitmap, quest state and spell levels. Autosaves on level
  change and on exit. Format version 4; versions 1-3 still load with
  documented defaults.
- devilutionX-style QOL: town jog, 2x zoom ('z' and the mouse wheel),
  a resizable canvas with five modes to 1280x960 ('w' or the options
  menu), hover HP bar, click feedback sounds.

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
| D1Mon.ZC (+D1MonT) | monsters, per-type AI, combat | monster.cpp, monstdat.cpp |
| D1Mis.ZC | missiles | missiles.cpp |
| D1Item.ZC (+D1ItmT) | base items, drops, belt | items.cpp, itemdat.cpp |
| D1Affix.ZC (+D1AffT) | prefixes and suffixes | itemdat.cpp PL_Prefix/Suffix |
| D1UnqT.ZC | unique items | itemdat.cpp UniqueItemList |
| D1Inv.ZC | inventory grid, equip slots | inv.cpp |
| D1Obj.ZC | barrels, chests, doors | objects.cpp |
| D1Towner.ZC (+D1TwnT) | town NPCs, dialog | towners.cpp, textdat.cpp |
| D1Store.ZC | town stores | stores.cpp (reduced) |
| D1Play.ZC | player, melee, warps | player.cpp, trigs.cpp |
| D1Path.ZC | pathfinding | path.cpp FindPath |
| D1Char.ZC / D1CharUI.ZC | classes, stats, CHAR screen | player.cpp, control.cpp DrawChr |
| D1Spell.ZC | spells, spellbook | spelldat.cpp, control.cpp |
| D1Quest.ZC | quest log, set-piece bosses | quests.cpp |
| D1Auto.ZC | automap | automap.cpp |
| D1Save.ZC | character save slots | loadsave.cpp (own format) |
| D1Sel.ZC | single player front end | DiabloUI select/create |
| D1Snd.ZC | WAV decode, SFX voices, music | sound.cpp |
| D1UI.ZC | screen-panel registry | - |
| D1Panel.ZC | control panel, orbs | control.cpp |
| D1Test.ZC | self check | - |
| Diablo1.ZC | shell, input, game loop | diablo.cpp |

## Deviations

- Options persist in ::/Apps/Diablo1/OPTIONS.INI - KEY=VALUE text,
  hand-editable, unknown keys skipped (diablo.ini precedent), including
  SFXVOL/MUSVOL (0-256, linear rather than retail's log centibels) and
  GAMMA (30-100, retail ApplyGamma pow curve - low values brighten).
  Loaded at include time; the shell saves on leaving the options screen
  and on exit.
- devilutionX's zoom is a Bool, 1x or 2x (GraphicsOptions.zoom,
  scrollrt.cpp Zoom). The 19-step fractional ladder and sub-1x zoom-out
  are port additions.
- The in-game menu's Quit Diablo autosaves and returns to the main menu;
  retail exits the program.
- Only Healing casts in town, per spelldat sTownSpell; retail's other
  town spells (Identify, town-cast utility) are outside the roster.
- Lighting falloff is plain radial, not the original crawl tables. No
  wall-transparency (dTransVal) pass; missiles draw over walls.
- Nova's book level is the Hellfire row's 14. Retail's is -1, staff only.
- The Skeleton King stands in the SKngDO room; the port has no set
  levels, so his own level is not built.
- AI_CLEAVER, AI_SKELKING and AI_WARLORD are unimplemented; all three
  bosses reduce to the skeleton melee AI.
- The hovered name floats over the actor. Retail puts it in the panel
  info box at panel-relative 177,434; the port's gold/level line holds
  that slot.
- towners.cpp AnimOrder frame-sequence tables are absent. Six of the
  eight towners play a hand-authored sequence upstream; here they cycle
  their frames linearly at the correct per-towner rate.
- Level 13 keeps its down stairs, which DRLG_L4's Q_WARLORD branch omits.
- L3ANVIL is a miniset upstream, not a DUN, and is not implemented, so
  level 10 carries no set piece.
- Music plays one pass and stops. No multiplayer.

## Roadmap

remaining gaps: crawl-table lighting and the dTransVal pass, set levels,
multiplayer.

## License

Derivative of Devilution, Sustainable Use License - see LICENSE.md.
Non-commercial. Game data not included.
