# D1Snd wiring

Call sites for the main thread. D1Snd.ZC is self-contained; no other file
is modified by the audio module itself. Line numbers refer to the tree at
the time of writing.

Every entry point no-ops when the AC97 device is absent (`ac97.present`
FALSE). The VM launch script already passes `-device AC97,audiodev=snd0`.

## Build order

`Run.ZC`: insert after `#include "D1Rnd"` (line 29), before `#include
"D1Draw"`:

    #include "D1Snd"

D1Snd needs D1Fmt (byte readers), D1Mpq (archive reads) and nothing later;
all callers come after it. Add the matching row to the Run.ZC order
comment.

## Init / teardown

| site | call |
|---|---|
| Diablo1.ZC `Diablo1()`, after `D1AssetsLoad` succeeds (line 375) | `D1SndInit;` |
| Diablo1.ZC `Diablo1()`, teardown block before `"Diablo1: bye.\n"` (line 459) | `D1SndFree;` |

`D1SndFree` silences every voice before releasing the PCM the mixer
borrows; it must run before the app task dies.

## Music

One looped track per band (sound.cpp `sgszMusicTracks`), switched by
`D1SndMusicForLevel(level)`. Same-track requests are no-ops, so calling it
on every level change is correct.

| site | call |
|---|---|
| Diablo1.ZC `D1EnterTitle()` (line 89, top) | `D1SndMusic("Music\\Dintro.wav");` |
| Diablo1.ZC `D1LoadLevel()` right after the `D1CutShow` block + `Sleep(60)` (line 122) | `D1SndMusicForLevel(level);` |

Placing the level call behind the cut screen hides the decode of a
10-25MB track. Band map (verified in the MPQ, all PCM 22050Hz 16-bit):

| levels | track | channels | length |
|---|---|---|---|
| 0 (town) | `Music\DTowne.wav` | stereo | 288.6s |
| 1-4 | `Music\DLvlA.wav` | mono | 265.2s |
| 5-8 | `Music\DLvlB.wav` | mono | 349.4s |
| 9-12 | `Music\DLvlC.wav` | mono | 299.5s |
| 13-16 | `Music\DLvlD.wav` | mono | 253.6s |
| title/menu | `Music\Dintro.wav` | stereo | 92.4s |

## Title / menu

`IS_TITLEMOV` / `IS_TITLSLCT` (effects.cpp sgSFX rows 109-110).

| site | call |
|---|---|
| Diablo1.ZC `D1MenuKeys()` inside both the `SC_CURSOR_UP` (line 332) and `SC_CURSOR_DOWN` (line 338) branches | `D1SndPlay("Sfx\\Items\\Titlemov.wav");` |
| Diablo1.ZC `D1MenuKeys()` inside the `SC_ENTER` branch (line 344) | `D1SndPlay("Sfx\\Items\\Titlslct.wav");` |
| Diablo1.ZC `Diablo1()` title-state `SC_ENTER` (line 402) and `D1Input()` title key/click (lines 305, 309) | `D1SndPlay("Sfx\\Items\\Titlslct.wav");` |

## Player

| event | site | call |
|---|---|---|
| melee swing | D1Play.ZC `D1AttackStart()` (line 243) | `if (D1SndRnd2()) D1SndPlay("Sfx\\Misc\\Swing2.wav"); else D1SndPlay("Sfx\\Misc\\Swing.wav");` |
| takes melee damage | D1Mon.ZC `D1MonAttackPlayer()` inside the successful roll (line 381, next to `d1_plr_hitflash = 4`) | `if (D1SndRnd2()) D1SndPlay("Sfx\\Warrior\\Wario69b.wav"); else D1SndPlay("Sfx\\Warrior\\Warior69.wav");` |
| takes missile damage | D1Mis.ZC `D1MisHitPlayer()` inside the successful roll (line 158) | same pair as above |
| death | D1Play.ZC `D1PlayerDie()` (line 306) | `D1SndPlay("Sfx\\Misc\\Dead.wav");` |
| firebolt cast | D1Play.ZC `D1PlayCastFirebolt()` after `D1MisSpawn` (line 377) | `D1SndPlay("Sfx\\Misc\\Fbolt1.wav");` |
| firebolt impact | D1Mis.ZC `D1MisTick()` at both deactivation points: wall (line 193) and monster hit (line 202), gated on `ms->type == D1MIS_FIREBOLT` | `D1SndPlay("Sfx\\Misc\\Firimp2.wav");` |

`PS_SWING` and `PS_WARR69` are two-variant sounds upstream (effects.cpp
`RndSFX`); the two-line pattern reproduces that. `D1PlayerDie` playing
`Sfx\Misc\Dead.wav` follows devilution player.cpp:2059 (`PS_DEAD`, kept
there with a BUGFIX note); `Sfx\Warrior\Warior71.wav` is the voiced
alternative, also verified present.

## Monsters

monstdat sndfile equals the gfx pattern with `%c.CL2` replaced by
`%c%i.WAV`; anim letters per effects.cpp `MonstSndChar`: `a` attack, `h`
hit, `d` death, `s` special. Variant `%i` is 1 or 2. `D1SndPlayMon(fmt,
letter)` builds the path and picks the variant; monster.cpp `PlayEffect`
is the model.

| event | site | call |
|---|---|---|
| monster hurt (any source) | D1Mon.ZC `D1MonHurt()` in the surviving branch (line 364, next to `m->mode = D1MM_HIT`) | `D1SndPlayMon(d1_montypes[m->type].gfx_fmt, 'h');` |
| monster death | D1Mon.ZC `D1MonHurt()` in the killed branch (line 357, next to `m->mode = D1MM_DEATH`) | `D1SndPlayMon(d1_montypes[m->type].gfx_fmt, 'd');` |
| monster attack swing | D1Mon.ZC `D1MonTick()` adjacent-attack branch (`m->mode = D1MM_ATTACK;` site) | `D1SndPlayMon(t->gfx_fmt, 'a');` |

Hooking `D1MonHurt` covers melee, arrows and firebolt with one site each.
Paths verified to exist for the roster (all PCM mono 22050Hz 8-bit):
`Monsters\Zombie\Zombie{a,h,d}{1,2}.WAV`,
`Monsters\FalSpear\Phallh1.WAV`, `Monsters\FalSpear\Phalld2.WAV`,
`Monsters\SkelAxe\SklAx{a1,h1,d2}.WAV`, `Monsters\SkelBow\SklBwh1.WAV`,
`Monsters\Scav\Scavd1.WAV`, `Monsters\Sneak\Sneakh2.WAV`,
`Monsters\GoatMace\Goata1.WAV`, `Monsters\GoatBow\GoatBd1.WAV`,
`Monsters\Fat\Fath1.WAV`.

## Objects and items

| event | site | call |
|---|---|---|
| barrel breaks / chest opens | D1Obj.ZC `D1ObjOperate()` after `o->opened = TRUE` (line 120) | `if (o->type == D1OB_CHEST) D1SndPlay("Sfx\\Items\\Chest.wav"); else D1SndPlay("Sfx\\Items\\Barrel.wav");` |
| gold pickup | D1Item.ZC `D1ItemPickup()` gold branch (line 127) | `D1SndPlay("Sfx\\Items\\Gold.wav");` |
| potion pickup | D1Item.ZC `D1ItemPickup()` belt-slot branch (line 134) | `D1SndPlay("Sfx\\Items\\Flippot.wav");` |
| potion drink | D1Item.ZC `D1BeltUse()` after the guards (line 153) | `D1SndPlay("Sfx\\Items\\Invpot.wav");` |

Upstream ids: `IS_BARREL`, `IS_CHEST`, `IS_GOLD`, `IS_FPOT`
(items.cpp `ItemDropSnds`), `Invpot` for potion use.

## Verified sfx paths and formats

All PCM (fmt tag 1), mono, 22050Hz, 8-bit unless noted. Probed straight
from DIABDAT.MPQ.

| path | length | note |
|---|---|---|
| `Sfx\Misc\Swing.wav` / `Swing2.wav` | 0.30s / 0.32s | player swing |
| `Sfx\Misc\Dead.wav` | 1.32s | player death |
| `Sfx\Misc\Fbolt1.wav` / `Firimp2.wav` | 0.81s / 0.63s | firebolt |
| `Sfx\Misc\Walk1.wav` | 0.09s, 16-bit | footstep (optional hook) |
| `Sfx\Items\Titlemov.wav` / `Titlslct.wav` | 0.05s / 0.51s | menu |
| `Sfx\Items\Barrel.wav` / `Chest.wav` | 0.80s / 0.90s | objects |
| `Sfx\Items\Gold.wav` / `Flippot.wav` / `Invpot.wav` | 0.80s / 1.04s / 1.52s | items |
| `Sfx\Warrior\Warior69.wav` / `Wario69b.wav` / `Warior71.wav` | 0.52s / 0.78s / 2.08s | warrior voice |

## Behavior notes

- SFX decode on first play into a 16-entry LRU cache, linear-interp
  resampled to 48kHz stereo; a repeat play is a cache hit. Worst first-hit
  cost is a few ms inside the 50ms tick.
- Concurrent SFX cap is 8 (`D1SND_VOICES`); the oldest voice is stolen
  beyond that. Music runs on its own AC97 voice at volume 100/256 under
  the SFX at 256/256.
- Sound variant picks use a private LCG (`D1SndRnd2`), not `D1Rnd`;
  upstream perturbs the game RNG for these, this port keeps the game
  stream untouched.
- `D1SndStopAll` silences everything and drops the music PCM but keeps
  the sfx cache; suitable on menu exit. `D1SndFree` releases everything.
