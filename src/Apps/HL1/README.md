# Half-Life for ZealOS

GoldSrc-compatible engine in ZealC. Forked from the Quake port
(`src/Apps/Quake`); independent of it - every symbol is `HL*`/`hl_*`.

Valve's SDK (`valvesoftware/halflife`) is the game code only - `dlls/`,
`cl_dll/`, `pm_shared/`. The engine is not public.

| Layer | Source |
|---|---|
| BSP30, WAD3, studio models, sprites, rasteriser, sound, netcode | written here |
| player movement, entities, weapons, AI, HUD | ported from the SDK |

Port rule: SDK behaviour is followed to the line, cited by file:line in the
comments. Deviations are deliberate and marked.

### THIS HAS ONLY BEEN TESTED WITH THE 25th ANNIVERSARY EDITION OF HALF-LIFE.

## Engine

- **BSP v30** - BSP29 geometry, external textures, RGB lightmaps, four clip
  hulls, HL contents codes.
- **WAD3** - archives named in worldspawn's `wad` key. Per-miptex 256-colour
  palettes; the renderer composites in RGB, no shared colormap.
- **Truecolor canvas** - `0x00RRGGBB`. Gamma and damage/water tint applied in
  the blit. A present colour plane is composited once per frame after fades.
  Video menu: 320x240 … 800x600 plus 1280x720; fullscreen is
  edge-to-edge (`WinBorder(OFF)` + full text grid, fill-blit); windowed
  toggle resizes via `HLWindowApply` (no canvas rebuild).
- **Studio MDL v10** - bones, RLE channels, slerp, blends, bodygroups, skin
  families, embedded or `<name>T.mdl` textures. Demand-loaded sequence groups
  (`<name>NN.mdl` / IDSQ). Per-normal light with screen-space Gouraud spans;
  `STUDIO_NF_CHROME` environment UVs from view-space normals. Software
  rasterised through the world span loop. Local-pose bone cache when
  seq+frame unchanged.
- **SPR v2** - own palette, ADDITIVE and INDEXALPHA. `HLLightPoint` results
  for NORMAL sprites are grid-cached.
- **Mip selection** - texels per screen pixel via texinfo vector length, as
  Quake `mipadjust`. Distance alone costs one to two levels on HL's texture
  scales.
- **Spans** - opaque `surf32` fast path behind `hl_r_spanfast`; view-rect
  clear; 1:1 blit when canvas matches window.
- **Brush models** - unrotated faces backface-culled by eye-vs-plane (not view
  forward); world uses PVS.
- **Dlights** - keyed rocket/muzzle/explosion/flashlight entries feed the
  surface-cache key.
- **Sound** - 48 mixer voices (`AUDIO_MAX_SFX_VOICES`, `src/System/Audio/Driver/AC97.ZC`),
  twelve ambient loops, sixteen dynamic channels, reverb by room type,
  `sentences.txt` word scheduler, distance-cadenced footsteps.
- **CD audio** - `trigger_cdaudio` tracks map to the shipped
  `media/<composition>.mp3` by Valve's CD table. Decoded by the ZealAmp
  MPEG-1 Layer III decoder, sliced on the game task, one pass per trigger.
- **Console/HUD font** - WAD3 `qfont_t` variable-width glyphs; kernel-font
  fallback without `gfx.wad`.
- **Net / demo** - protocol 48 client parse, signon (serverinfo / resourcelist /
  usermsg decls / signonnum stages), and server frame send with entity +
  clientdata deltas; `record` / `stop` write the same S2C stream playback
  reads. Client prediction: punch from clientdata, platform basevelocity,
  exponential origin error lerp (~100ms).

## Game

- **Movement** - pm_shared: airstrafe cap, bunnyhop scaling, `PM_Duck` to the
  letter, ladders, water, waterjump, fall damage, conveyors. Duck `c`,
  use `e`.
- **Entities** - native, no QuakeC. All 125 shipped maps spawn every
  classname. Runtime slots via `HLEntAlloc`/`HLEntRelease`. Doors, buttons,
  trains, tracktrains with path-fire, rotating hull, and bank roll from the
  `bank` key, triggers, multi_manager/multisource, breakables, pushables,
  chargers, pickups (world_items included), momentary brushes, env_* effects,
  game_text, changelevels with player carry. `func_monsterclip` is solid to
  monster hulls only (`hl_clip_for_monster`). `func_mortar_field`,
  `trigger_monsterjump`, and `xen_plantlight` glow are live.
- **Weapons** - hitscan table with real `VECTOR_CONE_*` and `gSkillData`;
  projectiles: grenades, MP5 M203, RPG, crossbow, satchel, tripmine, snark,
  hornet, egon. Autoaim HUD reticle; gauss glow sprites; RPG designator
  glow.
- **AI** - schedule/task interpreter, node-graph routing from shipped `.nod`
  files (maps without one run straight-line), lateral + hint-node cover,
  scent conditions over carcass/meat/garbage sounds, scripted_sequence and
  scripted_sentence, per-monster HandleAnimEvent, monstermaker, talk
  monsters with follow, squad slotting. AI spit/hornet/controller ball/
  grunt and assassin grenade use the shared `hl_proj` pool; gargantua flame
  is `HLPRJ_FLAME` cone damage; apache/osprey rockets are `HLPRJ_ROCKET`.
  Headcrab leap flight; babycrab aliases headcrab with tiny hull. Turret /
  miniturret share the sentry think path (`orientation` 0 floor / 1 ceiling).
  Tentacle (Listen + melee), nihilanth (ctrlball), apache/osprey, leech,
  cockroach, assassin, gargantua, ichthyosaur, bigmomma register as AI kinds.
  Death sequences pick forward/back/head/gut takes from attack direction and
  hitgroup when the model carries them.
- **Mounted guns** - `func_tank` / `func_tankcontrols` / laser / rocket /
  mortar: use mounts, view yaw/pitch within map limits, primary fire
  hitscan or rocket via `hl_proj` (func_tank.cpp).
- **weaponbox** - MP death packs the active weapon (`PackDeadPlayerItems`);
  touch gives. SP drops nothing (`DeadPlayerWeapons` = NO).
- **info_bigmomma** - path nodes for `monster_bigmomma`. Momma walks the chain
  as non-combat goals; combat is chase+melee (+mortar range from skill).
- **func_guntarget** - brush path_corner target; Use starts, damage kills and
  fires `message` (plats.cpp CGunTarget).
- **func_traincontrols** - mounts player to linked `func_tracktrain`; +forward
  / +back edges set speed (plats.cpp CFuncTrainControls / Use USE_SET).
- **Save/load** - native entity serialisation, eight slots, field census
  checked by `utils/hl1-savefields.py`. `HLEntMakeDormant` holds changelevel
  destination copies inert until restore merge.
- **Menu** - built from shipped `resource/` files: GameMenu.res, .res dialog
  layouts, ClientScheme colours, TGA backdrop tiles. Keyboard and mouse
  navigation.
- **Skill** - all `sk_` constants from `valve/skill.cfg`.

## Not done

- Protocol 48: unverified vs stock GoldSrc peer (usercmd_t deltas, several
  svc payloads). Same-engine listen/dedicated 48 signon path is wired.
- Client weapon prediction, voice options UI, brass shell ejections.

## Game data

Not redistributable; no shareware exists. Retail `valve/` goes under:

    src/Apps/HL1/valve/

Loose files first, then pak; gamedir before `valve`; case folded both ways.
A pak is optional - no engine path needs one. Minimum for a map on screen:

| File | Why |
|---|---|
| `valve/halflife.wad` | world textures |
| `valve/maps/*.bsp` | the maps |
| `valve/models/*.mdl` + `*T.mdl` | models and skins |
| `valve/resource/background/800_*.tga` | menu backdrop, 12 tiles |
| `valve/media/*.mp3` | soundtrack |

Mission packs sit next to `valve/` (`gearbox`, `bshift`), selected with
`game <dir>`.

## Running

    Cd("::/Apps/HL1");;ExeFile("Run");        // single player
    Cd("::/Apps/HL1");;ExeFile("RunNet");     // + UDP transport

`RunNet.ZC` is a separate entry point because the binding is compile-time.

`HLTest;` at the prompt runs the self-check without starting the game:
format readers, map load, studio load, sentence groups, an off-screen render
of c1a0, an MP3 stream decode with playback, and the intro trigger chains.

Diagnostics land in `::/Apps/HL1/HL1LOG.TXT`. Console cvars gate the noisy
ones: `nodegraph`, `ridelog`, `cllog`, `scriptlog`, `cdmp3`.

## Build order

`RunLib.ZC` compiles the engine; `Run.ZC` includes the shell. Two `ExeFile`
passes - one pass over the whole tree faults nondeterministically.

ZealC is single-pass: symbols resolve only backwards, across files and within
them. `RunLib.ZC` documents the include order.

`utils/hl1-checkorder.py` enforces it: declaration order, nested class
declarations, `continue`, undefined calls and symbols, duplicate globals.
Six counters, all zero, before any VM build.
