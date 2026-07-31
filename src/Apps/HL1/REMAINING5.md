# REMAINING5 - what is left to port

Audit of src/Apps/HL1 against /home/y4my4m/gits/hlsdk/dlls and the 125 shipped
BSPs in valve/maps. Ordered by player-visible impact.

Instance counts are measured, not reasoned. A throwaway parser read lump 0
(offset/length at bytes 4..12) of all 125 BSPs and tallied 177 distinct
classnames and their keyvalues. Every count below comes from that pass.

Defect classes, as named in the audit brief:

- **C1** zero-caller subsystem - complete code nothing invokes
- **C2** stale blocker comment - an assertion of impossibility that no longer holds
- **C3** silent-zero read - a read of a field that is structurally always zero
- **C4** duplicated or shadowed definition

---

## 1. `func_rot_button` spawns as a linear button - 36 instances, 22 maps

**C2 + present-and-wrong.** HLEntity.ZC:9884 asserts:

    //func_rot_button turns in HL and is spawned as a linear button here. It
    //appears in no HL1 map - the census is momentary_rot_button and
    //func_button only - so it shares the linear path

The census says otherwise: **36 `func_rot_button`, across 22 maps**, including
main-campaign c1a4 (1), c1a4b (3), c1a4i (4), c2a2a (3), c2a4b (3), c3a2c (3),
c3a2d (2), c3a2b (2), subtransit (2). All 36 carry a `distance` key with a real
rotation angle - 90 is the mode (15), then 45 (8), 180 (7), 360 (2), plus
30/35/80/20. Two carry `returnspeed`.

The comment is false and the branch it justifies is wrong: HLEntity.ZC:9887
sends them to `HLEntSpawnButton`, the linear mover, so 36 valve wheels and
levers slide along their `movedir` instead of turning through `distance`
degrees. SDK: `CRotButton::Spawn`, dlls/buttons.cpp:594, sets
`MOVETYPE_PUSH`/`SOLID_BSP` and drives `AngularMove`, not `LinearMove`.

The rotating machinery already exists in-tree - `HLEntSpawnRotDoor`
(HLEntity.ZC:9880 branch) and `HLEntSpawnMomentaryRot` are both angular movers.

**Effort: small.** Route the classname to an angular button reusing the
rot-door path; delete the comment.

## 2. `globalname` entity persistence across changelevel - 363 entities

**C2 + C1.** HLEntity.ZC:581 asserts:

    // The match is on targetname, not globalname: HLEnt.ZC parses no globalname
    // key.

HLEnt.ZC:1525 parses `globalname` into `e->global_name` (declared
HLEntity.ZC:461). The comment is stale, and the code 8000 lines below it
already contradicts the comment: HLEntity.ZC:8570 and :9044 match the carried
tracktrain on `car->global_name`.

The gap is what the *rest* of the key is for. **363 shipped entities carry
`globalname`**: 204 `func_breakable`, 63 `func_door`, 50 `func_pushable`, 22
`func_tracktrain`, 18 `func_train`, 4 `func_door_rotating`, 2 `monster_apache`.
`e->global_name` is read in exactly two places, both the tracktrain carry, so
**341 of the 363 have their globalname read by nothing.**

SDK: `CBaseEntity::Spawn`/`DispatchRestore` push globalname state into
`gGlobalState` (saverestore.cpp); an entity whose global is `GLOBAL_DEAD` is
removed on the destination map. That is how a crate you smashed stays smashed
and a door you opened stays open when the chapter loops back through a map.

Note this is **not** the `env_global` system, which is separate and works:
`hl_ent_globals` / `HLEntGlobalGet` / `HLEntGlobalSet` (HLEntity.ZC:732-793)
key off `e->global_state`, the `globalstate` key, and have live readers at
HLEntity.ZC:1965, 7722, 8292, 10449. The globalname table is the missing one.

**Effort: medium.** A second name-keyed table with OFF/ON/DEAD, written when a
breakable dies or a door settles, consulted in the spawn pass.

## 3. `trace.ent` is permanently -1 and three sites read it

**C3, the archetype, still live.** Every writer of the field:

    HLPhys.ZC:417   trace->ent = -1;
    HLPhys.ZC:447   trace->ent = -1;
    HLClip.ZC:184   trace->ent = -1;

Those are the three no-hit initialisers. **Nothing anywhere assigns a real
entity index.** Three sites read it as if it were live:

    HLClip.ZC:1488   hl_ride_probe_ent = tr.ent;
    HLClip.ZC:1506   if (tr.ent > 0) hl_ground_entity = tr.ent;
    HLClip.ZC:1528   hl_ground_entity = tr.ent;

`tr.ent > 0` is never true. The comment at HLClip.ZC:1504 ("prefer what the
probe named over what was held") describes a preference that never fires.

Knock-on: **`hl_ground_entity` (HLClip.ZC:765) is a write-only global.** It is
assigned at 765, 1083, 1458, 1501, 1506, 1528 and read nowhere in the tree.
The live ground link is `hl_ground_native`, set from `hl_trace_native_ent` /
`hl_trace_native_solid` at HLClip.ZC:1509 and :1531 and read at HLEntity.ZC:
8113, 12070, 12597. So the native-brush path already does the job and the
edict-numbered path beside it is vestigial.

**Effort: small.** Delete `ent` from the trace struct, delete
`hl_ground_entity` and `hl_ride_probe_ent`, and drop the dead branches. Or, if
a per-entity ground link is wanted, assign `trace->ent` where the sweep
actually names a brush.

## 4. Xen flora spawns inert - 184 instances across the Xen chapter

**Present but stubbed.** HLEntity.ZC:10870:

    if (!StrNICompare(e->classname, "func_tank", 9) ||
        !StrNICompare(e->classname, "xen_", 4))
    {
        HLEntSpawnInert(map, e);

Counts, all in c4a1-c4a3: `xen_plantlight` 76, `xen_hair` 35,
`xen_spore_small` 30, `xen_tree` 24, `xen_spore_medium` 15, `xen_spore_large`
4. Total 184.

Every one of these is a `CActAnimating` in the SDK (dlls/xen.cpp:64, 183, 261,
428) - they animate continuously. Spawned inert they stand frozen at frame 0.
Worse, `CXenTree` (xen.cpp:284) is an *attacker*: it owns a `CXenTreeTrigger`
child (xen.cpp:234), and `CXenTree::HandleAnimEvent` (xen.cpp:355-380) does
`TakeDamage(pev, pev, 25, DMG_CRUSH|DMG_SLASH)` plus a 15-degree punchangle to
everything in the trigger box. 24 shipped trees currently do nothing.
`CXenPLight` (xen.cpp:64) is the glowing pod that lights the Xen caves.

**Effort: medium.** The animation half is cheap if `CActAnimating` looping is
available; the tree's trigger-box melee is a small addition to the touch path.

## 5. Monsters that spawn as inert statues - 182 instances

**Absent AI, present spawn.** Any `monster_*` classname that
`HLAIMonKindFor` (HLAI.ZC:4295) does not resolve falls through to the generic
branch at HLEntity.ZC:10592, which gives it `MOVETYPE_STEP`, `SOLID_SLIDEBOX`,
20 hp and sequence 0 - a solid, shootable, motionless prop.

15 kinds are implemented (HLAI.ZC:1246-1260): headcrab, zombie, scientist,
barney, houndeye, hgrunt, islave, bullsquid, agrunt, controller, barnacle,
tripmine, sentry, cockroach, generic.

Missing, with measured counts and the maps they are in:

| classname | n | maps | SDK |
|---|---|---|---|
| `monster_leech` | 105 | c2a1a 12, c2a2a 20, c2a3 20, c2a3a 11, c2a3b 13, c3a1 17, c3a1a 12 | leech.cpp |
| `monster_gman` | 15 | c0a0d, c1a0, c1a1b, c1a2b, c1a3d, c2a1, c2a3b, c3a2c, **c5a1 x6** | gman.cpp |
| `monster_tentacle` | 8 | c1a4i 3, c2a5x 1, c4a1b 4 | monsters.cpp (CTentacle) |
| `monster_rat` | 8 | t0a0 2, t0a0b 3, t0a0b2 3 | h_ai.cpp |
| `monster_human_assassin` | 7 | c2a3d 3, c3a2e 4 | hassassin.cpp |
| `monster_gargantua` | 5 | c2a1, c2a5g, c4a1b, c4a3, hldemo1 | gargantua.cpp |
| `monster_ichthyosaur` | 5 | c2a3a, c2a3b, c2a5, c3a1a, c4a3 | ichthyosaur.cpp |
| `monster_apache` | 4 | c2a5, c2a5a, c2a5w, c2a5x | apache.cpp |
| `monster_miniturret` | 4 | c1a2, c1a2a, t0a0d 2 | turret.cpp |
| `monster_osprey` | 3 | c1a3b, c1a3c, c2a5e | osprey.cpp |
| `monster_flyer_flock` | 3 | c5a1 | aflock.cpp |
| `monster_grunt_repel` | 2 | hldemo3 | hgrunt.cpp |
| `monster_turret` | 1 | c3a1 | turret.cpp |
| `monster_bigmomma` | 1 | c4a2 | bigmomma.cpp |
| `monster_nihilanth` | 1 | c4a3 | nihilanth.cpp |

Total 182 instances. Note the shape of it: **`monster_leech` alone is 105 of
the 182**, seven maps of the On A Rail / Apprehension water sections, and it is
the cheapest of the lot - `CLeech` (leech.cpp) is a swimmer with no schedules,
a hand-rolled `SwimThink`. It is the single highest instance-count win here.

The five with only a model entry and nothing else - leech, gman, gargantua,
ichthyosaur, human_assassin - are resolved in HLEnt.ZC:570, 590, 594, 596, 597
(model paths only), which is why they draw the right thing while doing nothing.

`monster_turret`/`monster_miniturret` are the cheapest: `CBaseTurret` is
already ported for `monster_sentry` (HLAI.ZC:11817-11830, `HLAITurretMove`).
See item 10 - the comment there is wrong about which class needs the ceiling
mount.

**Effort: large in aggregate, but separable.** leech ~small, turret/miniturret
~small (reuse the sentry), tentacle/apache/osprey ~medium each, gargantua and
assassin ~medium, bigmomma and nihilanth ~large.

## 6. The Nihilanth fight and the Xen finale

**Absent.** `monster_nihilanth` is one instance in c4a3.bsp; `monster_bigmomma`
one instance in c4a2.bsp. Both spawn as inert statues per item 5.

dlls/nihilanth.cpp is 45.4K and is the largest single monster in the SDK - a
multi-stage boss with recharger spheres, teleport levels, and a scripted death.
dlls/bigmomma.cpp is 30.3K and is driven by **`info_bigmomma` path nodes, of
which 28 ship in the Xen chapter** (`info_bigmomma` total 28 across the tree),
so the map data for the fight is fully present and unused.

c5a1 (the ending map) additionally holds 6 `monster_gman` and all 3
`monster_flyer_flock`, and **ships no .nod graph** (see item 12).

The Xen chapter otherwise loads: the c4a*/c5a1 census is dominated by classes
that do work - 533 `info_node`, 398 `env_sprite`, 323 `path_corner`, 247
`ambient_generic`, 220 `info_node_air`, 180 `env_beam`, 171 `multi_manager`,
83 `monstermaker`, 38 `scripted_sequence`. So Xen is traversable; it is the two
bosses and the flora that are missing, not the chapter.

**Effort: large.** Nihilanth alone is a multi-week item.

## 7. `func_tankmortar` / `func_tanklaser` / `func_tankrocket` spawn inert - 18

**Present but stubbed.** Same prefix branch as item 4, HLEntity.ZC:10870.
Plain `func_tank` (24 instances) is dispatched explicitly and works; the three
subclasses are caught by the `func_tank` prefix test and sent to
`HLEntSpawnInert`.

`func_tankmortar` 9 (c2a5b 1, c2a5e 2, c2a5f 1, c3a1a 1, crossfire 2,
doublecross 2), `func_tanklaser` 5 (c3a1b 1, c4a1 4), `func_tankrocket` 4
(c2a2e, c2a2f, c2a5b, hldemo2). SDK: dlls/func_tank.cpp, `CFuncTankMortar`,
`CFuncTankLaser`, `CFuncTankRocket` - each overrides only `Fire()`.

`func_tankcontrols` (17) is handled separately and correctly at
HLEntity.ZC:10864.

**Effort: small.** Three `Fire()` overrides on top of the working `func_tank`.

## 8. Zero-caller functions - 35 confirmed

Established by stripping `//` comments from all 37 .ZC files and counting
identifier occurrences with word boundaries, so a bare no-arg call
(`HLSkillApply;`) counts. Each of these resolves to exactly **1** occurrence -
the definition, no caller. Split by whether it is a missing wire or dead weight.

### Missing wires - the code is right and something should be calling it

- **`HLSkySetName`** HLDraw.ZC:3118. "sv_skyname arriving from the server,
  overriding worldspawn". `HLSkySetColor` beside it (HLDraw.ZC:2822) *is*
  called (HLDraw.ZC:2949), so the colour half got wired and the name half did
  not. A server-set skybox is ignored. Small.
- **`HLSndEmitDyn`** HLSound.ZC:3771. The full `EMIT_SOUND_DYN` entry point,
  including the `!SENTENCE` dispatch. Callers use `HLSndPlayAt` directly (128
  refs), which skips the `!` test - so any code path handed a `!`-prefixed
  sample plays nothing rather than speaking. Small.
- **`HLSndAmbientRemove`** HLSound.ZC:2734, **`HLSndAmbientPitch`**
  HLSound.ZC:2725. The ambient table's teardown and pitch query. The header on
  `HLSndAmbientRemove` names its caller - "CAmbientGeneric::ToggleUse turning a
  loop off" - and `ambient_generic`'s use handler (HLEntity.ZC:10624,
  `HLM_AMBIENT_USE`) does not call it. **2018 shipped `ambient_generic`**, of
  which the ones with a targetname are meant to be switchable. Small.
- **`HLFxBlood`** HLPart.ZC:1175. `TE_BLOOD` / `R_Blood`, the plain particle
  spray. Blood decals go in via `HLDecalAdd` (7 refs) but the particle burst
  never fires. Small.
- **`HLPartEntityTrail`** HLPart.ZC:710. `CL_RelinkEntities` trail dispatch -
  rocket and grenade smoke trails. Small.
- **`HLEntTakeDamage`** HLEntity.ZC:4872. The untyped-damage convenience
  wrapper. Harmless: every caller correctly uses `HLEntTakeDamageType` (6
  refs). Dead weight rather than a wire, listed here because the name invites
  misuse.
- **`HLPakLoad`** HLPak.ZC:315, **`HLPakList`** HLPak.ZC:534. The whole PAK
  reader is present and never mounted. Matters only if any needed asset is
  inside a .pak rather than loose - the shipped tree is loose, so low priority.
- **`HLStudioBonePos`** HLStudio.ZC:2423, **`HLMdlFrameByName`**
  HLMDL.ZC:358. Attachment/bone queries with no consumer; needed by several of
  the missing monsters in item 5.

### Dead weight - superseded, safe to delete

- **`HLCheckStuck`** HLPhys.ZC:475. Superseded by `HLPMCheckStuck`
  (HLClip.ZC:1158, called HLClip.ZC:3077), which traces the hull the player is
  actually using. HLClip.ZC:1161 says so explicitly. See item 11 - three
  comments still point at the dead one.
- **`HLClipSetRotatingDraw`** HLClip.ZC:92 and **`HLClipIsRotating`**
  HLClip.ZC:110. C4 duplicates. The live pair is `HLClipSetRotating` (6 refs,
  called HLEntity.ZC:9931) and `HLClipIsRotatingDraw` (3 refs). Both dead
  members forward to or duplicate the live one, so behaviour is identical - no
  divergence risk, just clutter. The comment on `HLClipSetRotatingDraw` is
  stale, see item 11.
- **`HLBitReadBitCoord`** HLNet.ZC:997, **`HLBitWriteBitCoord`** HLNet.ZC:943,
  **`HLDeltaReadEntState`** HLNet.ZC:2052, **`HLDeltaWriteEntState`**
  HLNet.ZC:2040, **`HLMsgWriteHiresAngle`** HLNet.ZC:242, **`HLUserMsgFind`**
  HLNet.ZC:2949.
- **`HLNetCaptureClientData48`** HLNetSv.ZC:5221,
  **`HLNetCaptureState48`** HLNetSv.ZC:5158,
  **`HLNetWriteServerInfo48`** HLNetSv.ZC:5027,
  **`HLNetWriteUserInfo48`** HLNetSv.ZC:5086,
  **`HLNetWriteUserMsgDecl`** HLNetSv.ZC:5123,
  **`HLNetWriteResourceList`** HLNetSv.ZC:4958,
  **`HLNetWriteAllIdentities`** HLNetSv.ZC:716,
  **`HLSvBroadcastPrintf`** HLNetSv.ZC:2780,
  **`HLSvColorsForColormap`** HLNetDgrm.ZC:84,
  **`HLSlistInit`** HLNetDgrm.ZC:256,
  **`HLNet48SelfTest`** HLNetDgrm.ZC:2753,
  **`HLHostNameInit`** HLNet.ZC:568.
  A protocol-48 server block of ~12 functions with no entry point. Whether this
  is dead weight or the largest missing wire in the tree depends on whether
  protocol-48 hosting is a goal; other agents are editing HLNet*.ZC
  concurrently, so treat this list as a snapshot.
- **`HLPlayerDead`** HLPlayer.ZC:29, **`HLPlayerWalking`** HLPlayer.ZC:34.
  HLPlayer.ZC is 49 lines and both of its predicates are unused.
- **`HLPrEdictNum`, `HLPrFieldF`, `HLPrFieldI`, `HLPrFree`, `HLPrGetF`,
  `HLPrSetFieldF`, `HLPrStr`** - all of HLProgs.ZC. See item 9.
- **`HLFontHeight`** HLWad.ZC:173, **`HLPicDrawPart`** HLWad.ZC:553,
  **`HLMenuSlider`** HLMenu.ZC:2895, **`HLLogoColorIndex`** HLMenu.ZC:1520,
  **`HLQuotedField`**/`HLLocFind`/`HLLocLoad`/`HLActLoad` (HLMenu.ZC - these
  have 2 refs, def plus one call, so they are live; not listed as dead),
  **`HLWad3Report`** HLWad3.ZC:508, **`HLSndDebug`** HLSound.ZC:774,
  **`HLDlightClear`** HLDraw.ZC:236, **`HLMatRotateInv`** HLPhys.ZC:165,
  **`HLEntTitleFind`** HLEnt.ZC:849.

**Effort: the wires are individually small. Deletion is mechanical.**

## 9. HLProgs.ZC is 210 lines of confirmed-dead QuakeC vocabulary

**C1, and the C3 archetype now defused.** The `hl_fld_*` block is still there -
46 globals at HLProgs.ZC:37-110, all initialised to -1. Verified: each appears
exactly once in the tree, at its own definition. **No accessor reads them any
more**, so the silent-zero hazard the brief describes is gone; what remains is
pure dead weight.

The file's own header (HLProgs.ZC:1-11) is accurate and says so: "Nothing
allocates the edict pool, so every accessor below rejects and returns zero...
That path is itself unreachable - see the note in HLNetSv.ZC, and this file
goes with it when it does."

All seven accessor functions are zero-caller (item 8). `hl_ofs_serverflags`
(HLProgs.ZC:110) likewise.

**Effort: trivial.** Delete the file and its entry in the compile list.
Confirm first that the HLNetSv protocol-48 block (item 8) is going too.

## 10. `monster_sentry` orientation comment inverts the census

**C2.** HLAI.ZC:11828:

    // Deviation: only orientation 0, the floor mount, is handled. Every ceiling
    // turret in the shipped maps is monster_turret or monster_miniturret; no
    // monster_sentry in the campaign carries an "orientation" key.

The second sentence may be true, but the framing is backwards in a way that has
misdirected effort. Measured: **`monster_sentry` 28, `monster_miniturret` 4,
`monster_turret` 1.** The sentry is not the edge case, it is 85% of all turrets
in the game, and it is the one that is implemented. The two that are *not*
implemented total 5 instances and would reuse `HLAITurretMove`
(HLAI.ZC:11833) almost unchanged - `CTurret` and `CMiniTurret` are siblings of
`CSentry` under `CBaseTurret` in dlls/turret.cpp.

**Effort: small.** Reword the comment; the two subclasses are a cheap add.

## 11. Comments pointing at superseded code

**C2, low impact, high confusion cost.**

- HLClip.ZC:1181 "kept current for the fallback below, and for `HLCheckStuck`,
  which..." - `HLCheckStuck` has no callers (item 8).
- HLClip.ZC:1593 "embedded in geometry, `HLCheckStuck` recovers" - it does not;
  `HLPMCheckStuck` does.
- HLClip.ZC:3226 "leaking it leaves the next `HLCheckStuck` tracing..." - same.
- HLClip.ZC:94 "The spelling HLEntity.ZC's func_tracktrain branch still calls."
  It does not - HLEntity.ZC:9931 calls `HLClipSetRotating`, not
  `HLClipSetRotatingDraw`.
- HLEntity.ZC:3458 "Bank is not driven: the `bank` key is not parsed, and no
  shipped tracktrain sets it." **False.** 21 of 41 `func_tracktrain` carry a
  `bank` key and **8 carry a non-zero value** - 180 (x3), 60, 45, 25, 15, 10.
  The first clause stands (the key is not parsed); the justification does not.

**Effort: trivial** for the comments. Tracktrain bank is small-to-medium.

## 12. 30 maps ship without a node graph

**Understated comment (C2-adjacent) plus a real coverage gap.** HLAI.ZC:817
says "disposal.bsp ships no .nod and falls back to straight-line movement."
True but narrow. Measured: valve/maps/graphs holds 98 files against 125 maps,
and **30 maps have no .nod**:

    boot_camp bounce c0a0a c0a0b c0a0c c1a4g c2a3e c2a5x c4a1f c5a1
    contamination crossfire disposal doublecross frenzy gasworks pool_party
    rapidcore rocket_frenzy rustmill snark_pit stalkyard t0a0a t0a0b1 t0a0b2
    t0a0b t0a0 t0a0c undertow xen_dm

Most are deathmatch, but the campaign losses matter: the three c0a0 tram maps,
c1a4g, c2a3e, c2a5x, **c4a1f, and c5a1 (the ending)**, plus the whole Hazard
Course (t0a0*). Every monster in those maps routes by straight line.

**Effort: none to fix here** - the data is simply not shipped. The item is to
correct the comment and to know that graph-dependent AI degrades on those 30.

## 13. AI vocabulary coverage against the SDK

**Measured breadth, not a defect.** Distinct symbols:

| | port | SDK |
|---|---|---|
| schedules | 35 (`HLSCHED_`) | 80 (`SCHED_`) |
| tasks | 47 (`HLTASK_`) | 137 (`TASK_`) |
| conditions | 20 (`HLCOND_`) | 33 (`bits_COND_`) |
| activities | 24 (`HLACT_`) | 77 (`ACT_`, activity.h) |

Counts from `grep -c '#define HLSCHED_' HLAI.ZC` etc. against
`grep -ohE '\bSCHED_[A-Z0-9_]+' dlls/*.cpp dlls/*.h | sort -u`.

The SDK numbers are inflated - many schedules are per-monster subclass tables
for monsters the port does not have (item 5), and many activities are
model-specific. So this is not a 44%-complete reading. But the condition gap
(20 vs 33) is the one that constrains behaviour independent of which monsters
exist; HLAI.ZC:1101 already documents one deliberate omission
(`bits_COND_SMELL`/`_FOOD`, no scent system).

**Effort: not actionable as one item.** Recorded as the scale marker.

## 14. `ammo_9mmARclip` - 1 instance, correctly ignored

Not a gap. The census shows one `ammo_9mmARclip`, and the port's ammo chain
(HLWeapon.ZC:1808-1873) does not name it. Neither does the SDK: dlls/mp5.cpp:312
links `ammo_9mmAR`, and no `LINK_ENTITY_TO_CLASS` for `ammo_9mmARclip` exists
anywhere in dlls/. It is a mapper typo that spawns nothing in retail Half-Life
either. Listed so it is not "fixed".

---

## Already correct - previously suspected, verified good

Recorded because this tree has had fixes that inverted their own problem.

- **`ambient_generic` is handled.** 2018 instances, the 5th most common entity
  in the game. An early pass of this audit flagged it as unhandled; that was a
  bug in the audit's own regex, not in the port. HLEntity.ZC:10624 dispatches
  it, HLEnt.ZC:441 and :1482 parse its modulation keys, and HLSound.ZC:1912-2077
  implements `CAmbientGeneric`'s `dynpitchvol_t` envelopes and LFO. Only the
  ToggleUse teardown is unwired (item 8).
- **`HLAngleNorm` is defined once**, HLMath.ZC:167, 22 references. The
  previously-reported second definition is gone. HLEntity.ZC:3373 is
  `HLPathLookAhead`; an earlier scan mismatched it.
- **`HLEntPushPlayer` has one definition**, and one caller. The shadowed 2-arg
  version is gone.
- **The HLNetUdp.ZC "duplicates" are `#ifdef` pairs, not defects.** 17 function
  names each appear twice; all are bracketed by `#ifdef UDP_MAX_PORT` /
  `#else` / `#endif` at HLNetUdp.ZC:25, 338, 394 and 507, 606, 628. The second
  body of each is the no-net-stack stub. Correct as written.
- **`env_global` / `globalstate` works.** Distinct from item 2. Table at
  HLEntity.ZC:732-793 with four live readers.
- **All 14 weapons are implemented with both attack modes.** `HLWPN_CROWBAR`
  through `HLWPN_SNARK` (HLWeapon.ZC:103-116) covers every `weapon_*` the SDK
  links. The `HLFIRE_*` table (HLWeapon.ZC:150-172) carries one id per
  `PrimaryAttack`/`SecondaryAttack` body including the awkward ones - shotgun
  double-barrel, M203, satchel radio detonate, hornet fast mode, gauss charge,
  egon narrow, RPG laser designator, crossbow/python zoom. Ammo classnames map
  at HLWeapon.ZC:1808-1873 including the `ammo_9mmAR`/`ammo_mp5clip` and
  `ammo_gaussclip`/`ammo_egonclip` aliases.
- **`monster_furniture` is handled correctly**, HLEntity.ZC:10571, with the
  point hull `MonsterInit` leaves it, and the comment's claim of two shipped
  instances is exactly right (measured: 2, c1a0 and c1a1f).
- **`disposal.bsp` really does ship without a .nod.** The comment at
  HLAI.ZC:817 is true; it is only incomplete (item 12).
- **`func_tank` (24) and `func_tankcontrols` (17) are dispatched correctly**,
  HLEntity.ZC:10864 and the explicit `func_tank` branch. Only the three
  subclasses fall through (item 7).
- **The HUD is data-driven from `sprites/hud.txt`** rather than hardcoded
  (HLHud.ZC:1-64), with the four-resolution row sets and the four-frame
  directional damage indicator (`HLHUD_PAIN_UP`/`RIGHT`/`DOWN`/`LEFT`,
  HLHud.ZC:138-141). 170 .spr files ship. No gap found in the element set.
- **The skill system is wired.** `HLSkillLoad` is called at HLGame.ZC:368,
  reads valve/skill.cfg, and `HLSkillApply` (HLGame.ZC:184) pushes ~60
  constants into `hl_ai_mon_info` and `hl_wpn_info`. An earlier pass of this
  audit reported it zero-caller; that was a bug in the audit's counter. Bare
  no-arg calls (`HLSkillApply;`) are easy to miss - the brief's warning is
  correct and it caught me once.

---

## Coverage - what this audit did not do

- **Per-monster schedule/task fidelity was not checked.** Item 13 counts
  symbols; it does not verify that, say, the hgrunt's cover-and-suppress
  schedule matches `dlls/hgrunt.cpp`'s table entry for entry. That is the
  largest remaining unexamined surface.
- **The net stack was surveyed only for zero-callers.** HLNet.ZC, HLNetSv.ZC,
  HLNetDgrm.ZC and HLNetUdp.ZC total ~12k lines and other agents are editing
  them concurrently. The protocol-48 block in item 8 is a snapshot and may be
  stale by the time this is read. No claim is made about multiplayer
  correctness.
- **Save/load was checked structurally, not behaviourally.** HLSave.ZC has the
  writer, the entity record (HLSave.ZC:396) and a `CGlobalState` block
  (HLSave.ZC:1254-1270). I did not verify field-by-field round-tripping, and I
  did not test that a save taken mid-changelevel restores.
- **`trigger_transition` (35 instances) was read but not costed.**
  HLEntity.ZC:10904 spawns it inert with an honest comment explaining that the
  fixed-count entity table has no slot to create a carried entity in. That
  constraint is real and I did not evaluate what relaxing it would take. It is
  the structural blocker behind item 2's general case.
- **Sound: the sentence/`vox` system was not audited.** `HLSndSentenceLookup`
  and `HLSndSentenceQueue` exist and are called; coverage against
  `valve/sound/vox` was not measured.
- **Rendering, BSP, WAD, sprite and studio-model paths were not audited** other
  than for zero-callers.
- **The 46 remaining single-reference globals** beyond the `hl_fld_*` block
  (`hl_con_return_state`, `hl_net_mismatch`, `hl_sv_edict_line`,
  `hl_sv_edict_warned`, `hl_notice`, `hl_pic_p_multi`, `hl_lan_row`,
  `hl_bind_def_from_file`, `hl_act_from_file`, `hl_logo_color_name`) were
  identified but not individually classified.
