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
  the blit.
- **Studio MDL v10** - bones, RLE channels, slerp, blends, bodygroups, skin
  families, embedded or `<name>T.mdl` textures. Software rasterised through
  the world span loop.
- **SPR v2** - own palette, ADDITIVE and INDEXALPHA.
- **Mip selection** - texels per screen pixel via texinfo vector length, as
  Quake `mipadjust`. Distance alone costs one to two levels on HL's texture
  scales.
- **Sound** - 48 mixer voices (`AUDIO_MAX_SFX_VOICES`, `src/System/AC97.ZC`),
  twelve ambient loops, sixteen dynamic channels, reverb by room type,
  `sentences.txt` word scheduler, distance-cadenced footsteps.
- **CD audio** - `trigger_cdaudio` tracks map to the shipped
  `media/<composition>.mp3` by Valve's CD table. Decoded by the ZealAmp
  MPEG-1 Layer III decoder, sliced on the game task, one pass per trigger.
- **Console/HUD font** - WAD3 `qfont_t` variable-width glyphs; kernel-font
  fallback without `gfx.wad`.

## Game

- **Movement** - pm_shared: airstrafe cap, bunnyhop scaling, `PM_Duck` to the
  letter, ladders, water, waterjump, fall damage, conveyors. Duck `c`,
  use `e`.
- **Entities** - native, no QuakeC. All 125 shipped maps spawn every
  classname. Doors, buttons, trains, tracktrains with path-fire, triggers,
  multi_manager/multisource, breakables, pushables, chargers, pickups
  (world_items included), momentary brushes, env_* effects, game_text,
  changelevels with player carry.
- **Weapons** - hitscan table with real `VECTOR_CONE_*` and `gSkillData`;
  projectiles: grenades, MP5 M203, RPG, crossbow, satchel, tripmine, snark,
  hornet, egon.
- **AI** - schedule/task interpreter, node-graph routing from the shipped
  `.nod` files (maps without one run straight-line), scripted_sequence and
  scripted_sentence, per-monster HandleAnimEvent, monstermaker, talk
  monsters with follow.
- **Save/load** - native entity serialisation, eight slots, field census
  checked by `utils/hl1-savefields.py`.
- **Menu** - built from shipped `resource/` files: GameMenu.res, .res dialog
  layouts, ClientScheme colours, TGA backdrop tiles. Keyboard navigation
  only.
- **Skill** - all `sk_` constants from `valve/skill.cfg`.

## Not done

- Remaining fauna beyond leech (assassin, garg, ichthyosaur stay model-only).
- Protocol 48 server send loop; field encoding and delta.lst are done.
- Present buffer for the frame; fades can flicker.
- Node cover / scent / scripted death poses (Wave L).
- `func_tracktrain` bank key still unused; rotating hull is on.
- VGUI mouse input; menus are keyboard-only.
- Sequence groups (`<name>NN.mdl`), chrome, per-vertex model lighting / Gouraud.
- Client prediction, demo record (Wave C).
- Optional hand-asm span (C fast path via `hl_r_spanfast` landed).

## Recently landed (Wave A/B start)

- AI projectiles via `hl_proj` queue (spit, hornet, ctrl ball, grunt grenade).
- `func_monsterclip` solid to monsters only (`hl_clip_for_monster`).
- `MakeDormant` for off-map globalname copies.
- Headcrab leap flight + leech AI row.
- Autoaim HUD reticle, gauss glow sprites, RPG spot glow.
- Soft-raster: `HLLightPoint` grid cache; unrotated brush backface cull;
  opaque `surf32` span fast path (`hl_r_spanfast`); view-rect clear;
  1:1 blit path; studio local-pose bone cache; keyed rocket/muzzle/explosion
  dlights.

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
