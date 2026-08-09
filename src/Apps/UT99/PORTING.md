# UT99 → ZealOS port notes

## What this is

A real port of Unreal Tournament 99: retail packages (`.unr`, `.utx`, `.u`) are
parsed and executed, not reimplemented. Anything that looks like UT but is
native invention gets deleted rather than tuned — a lookalike never converges
on the original.

The data layer is a genuine port and is verified byte-exact against the retail
files. The renderer is not: it is native code wearing UT's data, and it does not
look like the game. "DrawSurf.cpp is asm and is not transliterable" was used to
justify inventing a shading model; the asm has readable C fallbacks beside it in
every case that matters, so the algorithm is recoverable and must be. See "The
renderer is not a port yet". Gameplay is also still native.

## References

| what | where |
|---|---|
| Unreal v200 C++ source | `/home/y4my4m/Downloads/Unreal - v200/` (files are `.gz`) |
| retail packages (host copies) | `~/.cache/y4mos-zctest/pkg/{Engine.u,Botpack.u}` |
| retail packages (guest) | `::/Apps/UT99/{System,Maps,Textures}/` |
| test rig | `utils/zctest/playtest.sh` |
| raw VM image | `~/.cache/y4mos-zctest/zeal.img` (rebuilt from `build/ZealOS.qcow2`) |

Key reference files, after `zcat`:
`Render/Src/UnLight.cpp` (lighting), `Render/Src/UnRender.cpp` (OccludeBsp),
`SoftDrv/Src/DrawSurf.cpp`, `Engine/Inc/UnMesh.h`, `Engine/Src/UnPhysic.cpp`,
`Engine/Classes/*.uc` (class defaults live in `defaultproperties`).

## Test rig

    MENU_WAIT=310 WORLD_WAIT=70 utils/zctest/playtest.sh

Boots headless QEMU, presses `P` (debug launch straight into the map), dumps
`~/.cache/y4mos-zctest/{play.log,world1.png,world2.png}`. Takes ~6 min.

Reading results:
- `gaps=00` means in-world; `gaps=28` means still in the menu — check this
  before trusting any fps number.
- `launch: 0` means `P` never fired; the run proves nothing.
- `world1.png` is often captured mid-load. Check `world2.png` too.
- No log file at all = build error. Read it off the screenshot with
  `utils/zctest/crop.py <ppm> <png> 430 470 2`.

The rig aborts if any source is under 200 bytes: a truncated file otherwise
leaves a stale copy on the image and the guest keeps compiling happily.

`play.log` is written only at the end of a run; while one is in flight the file
on disk is the *previous* run's. Check its mtime, or read `peek.log`, which the
running guest appends to. Reading a stale `play.log` as if it were the current
run gives a confident wrong answer.

The menu phase logs `gaps=28` for hundreds of lines before `debug launch (P)`,
so grepping with `head` sees only menu output. Read from the `debug launch (P)`
marker forward.

## Current state

Map is CTF-Face (Facing Worlds). At the debug spawn point the scene is
`tris=5844 spans=39218 nzpix=307128 facets=2868` and runs at a median 14 fps,
measured over the in-world samples of a rig run.

Working: package/UModel parsing (byte-exact), textures 1703/1708 bound with
per-texture palettes, real lightmaps with shadow filtering, front-to-back
traversal, draw bins, spans-only occlusion, truecolor throughout (no
`gr_palette`), present snapshot, physics from real class defaults, first-person
weapon mesh with real wedge UVs, class/state-aware script resolution, mesh
skins from `UMesh.Textures` via `Materials`.

Open, and the order matters. The VM is the blocker; everything below it is
secondary. There is no game without it — no gameplay, no weapon behaviour, no
player controller, no states. Rendering work does not move this. A whole
session was spent on shading while this sat untouched; do not repeat that.

1. **VM.** The earlier claim here — "no `Self`, no parameters, no state
   machine" — was wrong, and it misdirected a whole session. All three exist.
   `UTVMSetSelf`/`EX_Self` bind an object, locals and by-value parameters work,
   and `GotoState`, `EX_LabelTable`, `BeginState`/`EndState` and latent `Sleep`
   are implemented, alongside ~100 operators and complete control flow.

   The actual blockers, in order:

   1. **One global frame.** `ut_vm_main` is shared by every actor
      (`UTVM.ZC:248`), so two actors cannot hold state concurrently. This is
      the real "no state machine" — states exist but cannot be per-actor.
   2. **Out parameters are by value.** `GetAxes(Rotation, X, Y, Z)` writes
      nothing back, so any native taking output parms silently no-ops.
      `PlayerMove` opens with `GetAxes`, which is why it does nothing.
   3. **Missing movement natives.** `GetAxes` is absent from the native table.
   4. **No event probing / ProbeMask.** `AnimEnd`, `Landed` and friends never
      fire, so state logic that waits on them stalls.

   `EX_Self` reading the global instead of `FFrame::Object` is fixed.
2. **Sky child frame.** Hang fixed, scissor ownership fixed, sky zone
   identified (zone 2 on Face). World facets still vanish when enabled;
   `sky` toggles it. Needs a real `FSceneNode` child frame.
3. **Actor skins.** Character meshes carry an all-`None` `Textures` array
   (`Soldier` is four `None` entries): their skin comes from the actor's
   `Skin`/`MultiSkins` properties, which are not read yet.
4. Dynamic lights, `LightEffect` spatial functions.
5. Shadow-map filter: ours reconstructs a 3x3 kernel with `UT_SHADOW_SUM`
   320; Epic uses `FilterTab[128]` with `Result = (Acc * 255) / FilterSum`
   (`UnLight.cpp` ~400-500). The claim that the kernel is equivalent is
   unproven and sits on the `Src` term scaling every light contribution.

## Gameplay path (do this before any more rendering)

Player movement, shooting, weapon switching and pickups are all UnrealScript.
None of it runs, for one reason: out parameters are passed by value.

`PlayerWalking.PlayerMove` opens with `GetAxes(Rotation, X, Y, Z)`. `X`, `Y`
and `Z` are out parms. They come back zero, acceleration is computed from zero
vectors, and the player never moves. Weapons and pickups fail the same way.

UE1 solves this with `GPropAddr` (`Core/Src/UnScript.cpp`): stepping a variable
expression records that variable's address, and a native with out parms reads
it back immediately after stepping each parm.

The port already has both halves and never joined them:
- `UTVMRotAxes` (UTVM.ZC:687) wraps `UTGetAxes` and computes the axes
- `UTVMStoreSlot` (UTVM.ZC:674) writes a value into a frame local

Wiring, in order:

1. Add a `ut_vm_prop_slot` global. In the variable opcode (UTVM.ZC ~2282), set
   it to the slot index for `EX_LocalVariable` and `EX_NativeParm`, and to -1
   for everything else. This is `GPropAddr`.
2. In the native parm loop (UTVM.ZC ~2379), record `ut_vm_prop_slot` per
   argument as each parm is stepped, so a native knows which locals its out
   parms map to.
3. Bind `GetAxes` in the native table: step the rotator, call `UTVMRotAxes`,
   then `UTVMStoreSlot` the three axes into the recorded slots.

Then re-check `PlayerMove`. Movement, weapon fire and pickup touch all run on
the same out-parm mechanism, so they should come up together.

Remaining VM blockers after that: one global frame `ut_vm_main` shared by every
actor (UTVM.ZC:248), so actors cannot hold state concurrently; and no event
probing, so `AnimEnd` and `Landed` never fire.

## Mesh format

`utils/zctest/utmeshwalk.py` walks `UMesh`/`ULodMesh` against the retail
packages and consumes every byte of all 198 mesh exports in `Botpack.u`. Its
header records the field order; a nonzero tail means the layout is wrong. Two
fields are absent from the Unreal v200 headers and only show up in the bytes:
`TextureLOD` (one `FLOAT` per `Textures` entry, ends `UMesh`) and
`RemapAnimVerts`/`OldFrameVerts` (ends `ULodMesh`).

`Connects` and `VertLinks` are `TLazyArray`, not `TArray`: an `INT` skip offset
precedes the count. Reading that offset as the count is a 4-byte desync that
loses `Textures` entirely.

A face names its skin through two hops, not one:
`FMeshFace.MaterialIndex` → `Materials[].TextureIndex` → `Textures[]`.
`Textures[0]` is routinely `None`, so slot 0 is not a usable default —
`PulseGun3rd` is `{None, JPulse3rd_01}` and `PulseGunR` is
`{None, AmmoLed, JPulseGun_02, JPulseGun_03}`.

Skins are exports of the package holding the mesh, not of a `.utx`, so the
texture catalog scans the System `.u` packages as well. `AmmoLed` is a
`ScriptedTexture` (a render-to-texture LED) and does not decode as a static
texture; falling back to the default skin for it is correct.

## The renderer is not a port yet

The data layer is a genuine port. The pixel pipeline is not, and no amount of
constant tuning will make it converge — the transfer function itself is
invented.

Epic resolves a pixel with one table lookup (`SoftDrv/DrawSurf.cpp`
`InitColorTables`):

    Shade[SHADE_R + Tex + Light*256]      // LIGHTSHADES 128, Tex 6-bit
    Val = Tex * Light * (0.5 + Brightness) / 16

`Light` is the raw 7-bit lightmap channel (`UNLITLEVEL 0x3F` = 63 is unit,
saturation 127, packed BGR); `Tex` is the texture channel. There is no scalar
shade, no blend weights, no floor.

Ours multiplies texture ARGB by a float and then blends an invented scalar:
`lm*0.65 + shade*0.35` (UTBsp), `shade*0.55 + 0.55` (UTBsp), `lm*0.7 +
shade*0.3` (UTDraw), a `0.12` minimum. None of those constants exist in Epic's
renderer. They are the lookalike the top of this document says to delete.

Native invention still in the render path, all to be replaced rather than tuned:

| what | where | replace with |
|---|---|---|
| scalar `ut_draw_shade` + blend constants | UTDraw.ZC, UTBsp.ZC | `Shade[]` LUT from `InitColorTables` |
| `UTLightShadeAt` mesh lighting | UTLight.ZC | `FLightManager::Light` (UnLight.cpp) |
| mesh `facing` dot shading | UTLod.ZC `UTLodDraw` | depth sort, `UnMeshRn.cpp` |
| `UTLodSeekCollapse` byte scan | UTLod.ZC | exact walk, already verified |
| `UTLodFindFrameHeader` marker scan | UTLod.ZC | exact walk, already verified |
| `UTLodSynthTris` fabricated fan | UTLod.ZC | nothing; a mesh without faces is a parse bug |

The last two are safe to delete now: `utils/zctest/utmeshwalk.py` consumes every
byte of all 198 mesh exports in `Botpack.u`, so the field order is known exactly
and the heuristics have nothing left to guess.

Reference generations matter. `Unreal - v200` is a different, older renderer.
UT-generation headers are at `~/Downloads/UT99PubSrc/Engine/Inc` (confirms
`TLazyArray`, `TextureLOD`, `RemapAnimVerts`, and `UMesh::GetTexture`), and the
full UT `.uc` class sources at `~/Downloads/UT99-ref` (actor defaults, animation
names, sounds). Neither ships renderer `.cpp`, so v200 remains the only
algorithm source — verify anything taken from it against the UT headers.

## Method that works

Read the value out of the retail package or the reference; never pick it.
Every constant chosen by eye was wrong (`ut_lm_gain`, `ut_lm_ambient`, light
radius `25*33`, brightness `0.7`, screen tints, `GroundSpeed 320`). Every value
read held up.

Check the *whole* chain — several formulas span two files:
- `PlayerViewOffset`: `Weapon.uc` scales by 100, `Inventory.uc` divides by
  0.01. They cancel. Using one gives a confidently wrong answer.
- `Pawn` defaults are not UT's: `TournamentPlayer` overrides `GroundSpeed` to
  400 and `AirControl` to 0.35.

Prefer host-side Python against the real files over VM boots: seconds instead
of six minutes, and it is ground truth. The lightmap builder was validated this
way (engine bytes matched an independent implementation exactly).

Compare against QuakePlus for ZealOS conventions and against Epic's source for
engine semantics. QuakePlus found the input drain and the present snapshot
faster than reasoning from the C++ would have.

## ZealC traps hit here

- No ternary, no `continue`, no `Pow`; `pi` is a builtin — do not name a
  variable `pi`.
- Globals are not zeroed.
- Single pass: a callee must appear above its caller, and a pointer-returning
  function used before definition needs an `extern`. Re-`extern`ing an
  already-defined symbol produces `UndefinedExtern` at runtime.
- `‌` in a comment or string is a DolDoc command escape and silently eats code.
- U8 array loads carry garbage high bits — mask with `& 255`.
- Verify edits landed. A failed pattern match writes nothing and the next run
  silently tests the old code.
