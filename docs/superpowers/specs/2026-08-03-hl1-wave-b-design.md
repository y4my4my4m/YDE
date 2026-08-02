# HL1 Wave B — Soft-Raster Performance

**Date:** 2026-08-03  
**Status:** draft for user review  
**Scope:** `src/Apps/HL1` renderer/hot paths (+ tiny callers)  
**Fidelity:** hybrid C — playable visuals OK; mark `Deviation:` if lighting shortcuts  
**Verify:** `r_speeds` / `HLRSpeeds` before/after on same map+view; `HLTest` off-screen render still passes  

**Depends on:** Wave A may land first or in parallel **only if** file conflicts avoided (`HLDraw.ZC` is B-owned; A should not rewrite span loop). Prefer A then B serially per roadmap E.

## Goal

Cut CPU cost of the software GoldSrc path enough that campaign maps stay interactive at the port’s native canvas sizes, without a hardware GL backend (that remains out of scope forever unless a later wave says otherwise).

## Non-goals

- OpenGL / Vulkan / GPU path
- Wave A gameplay features
- Net / prediction (Wave C)
- Gouraud / chrome / seq groups as fidelity features (Wave D) — **except** where a perf change shares code with flat lighting and must not break mean-light triangles
- Voice, spray, fauna, AI (Wave A/L)

## Known ground truth (do not re-fix myths)

| Claim | Reality |
|---|---|
| Flashlight rebuilds every face every frame | `HLFLASH_DLIGHT_KEY` + `HLSurfLightKey` already hash dlight origin/radius/colour, not `hl_dlight_frame`. Audit remaining **unkeyed** dlights and mip0 thrash (`HLDraw.ZC` scoped FOV mip0 note). |
| “No surface cache” | Cache exists (`HLSurfCacheGet`); miss → slow per-texel path in span loop. |
| Span FIXME asm | Still open (`HLDraw.ZC:10`). ZealC supports inline asm (see `src/Demo/Lectures/Optimization.ZC`). |

## Architecture

### 1. Span hot loop (highest leverage)

- Extract / rewrite inner texel loop (`while (x < xe)` cached `surf32` path first) in ZealC asm or tightly unrolled C with fewer branches.
- Keep uncached pal×lightmap path correct but rare — goal is **raise surf cache hit rate** so asm path dominates.
- Gate with `r_speeds`: `span_px` time proxy via build counts; no fake timers required if counters move the right way.

### 2. Surface cache / dlight hygiene

- Grep all `HLLightAlloc` / dlight add sites: every per-frame re-add **must** use a stable key (flashlight already `-1`).
- Quantization / key stability for slow-moving lights: keep `HLDLIGHT_KEY_QUANT`; tune only with before/after `dlit` / `surf build` counters.
- Avoid `MAlloc` on rebuild mid-frame where a recycled slot buffer exists — prefer existing cache slot memory.
- Scoped FOV / mip0 thrash: stop forcing mip0 in ways that evict the whole cache when zooming (crossbow); document if a `Deviation:` mip bias is accepted for speed.

### 3. `HLLightPoint` cache

- NORMAL sprites / tents call `HLLightPoint` every instance every frame (`HLPart` / `HLSpr`).
- Add short-lived cache: quantize origin to grid (e.g. 16–32 uu), reuse RGB for same frame or N ms.
- Invalidate on `hl_dlight_frame` change or style pulse if needed for correctness near muzzleflashes (`Deviation:` one-frame lag OK if marked).

### 4. Brush model face submission

- `HLDrawBrushModel` currently submits **all** faces (“no PVS”).
- Add cheap rejects before `HLDrawFace`: backface in camera space when unrotated; frustum AABB of submodel; optional leaf/PVS only when origin static and angles identity.
- Rotated movers: AABB frustum only (no wrong plane cull) — already noted in comments.

### 5. Clear / blit budget

- Full canvas + depth clear every frame is O(pixels). Options (pick after measuring):
  - Clear only used scissor / view rect if letterboxed.
  - Skip colour clear when sky always fills (dangerous; only if sky guaranteed).
  - `HLDrawBlitFit` stretch: avoid resampling when window size == canvas; nearest already cheapest path — ensure no accidental filter.
- Expose or honour existing low-res canvas (`HLSCR_W` etc.) as the primary dial; document in README.

### 6. Studio draw reuse

- Cache bone matrices for `(model*, sequence, frame quant, body, controllers)` within the frame when the same MDL is drawn twice (viewmodel rare; corpses / identical NPCs common).
- Do **not** implement Gouraud here (Wave D); keep one light per poly.

### 7. Secondary scans (only if time left in wave)

- Clip: avoid full SOLID_BSP entity scan per trace when spatial hash cheap — only if profiling shows traces dominate after raster wins.
- AI path O(n²) open-set → heap: **Wave L**, not B, unless trivial and isolated.

## Files (primary)

| File | Role |
|---|---|
| `HLDraw.ZC` | span asm/unroll, surf cache, brush cull, clear policy, LightPoint cache helpers |
| `HLPart.ZC` / `HLSpr.ZC` | use LightPoint cache |
| `HLStudio.ZC` | bone matrix reuse within frame |
| `HL1.ZC` | blit path; optional canvas size dial wiring |
| `HLMenu.ZC` / weapon FX | only if unkeyed dlight sites live there |
| `HLTest.ZC` | still renders c1a0 off-screen; optional counter smoke |
| `README.md` | note perf dials / what changed |

## Measurement protocol

1. Fixed map + fixed view (e.g. `c1a0` spawn or `HLTest` render).
2. `HLRSpeeds(TRUE)` — record `surf build`, `dlit`, `span_px`, `lightpt`, `model tris`.
3. Change one lever; re-record; keep change only if build/dlit/lightpt drop without obvious visual break.
4. User smoke: flashlight on, standing still — surf build must not stay ~equal to visible faces every frame.

## Success criteria

- Measurable drop in `surf build` and/or `lightpt` and/or wall-clock frame time on the same machine/VM.
- Flashlight-still case: cache hits dominate (`surf hit` >> `surf build`).
- `HLTest` render path still succeeds.
- No requirement to match GoldSrc pixel-identical lighting under dlights if `Deviation:` documents the shortcut.

## Risks

- Asm span: easy to break masking / turb / blend; keep C fallback under `#ifndef` or parallel function selectable by cvar `r_spanasm`.
- Over-culling brush faces → holes in doors/trains; prefer false negatives (draw extra) over holes.
- LightPoint cache lag near explosions — accept one-frame stale or disable cache when `hl_dlight_any`.

## Ordering vs Wave A

- **Serial default:** finish Wave A merge, then B.
- **Parallel allowed:** A owns `HLAI` / `HLEntity` / weapon gameplay; B owns `HLDraw` / `HLStudio` span-cache. Conflict files (`HLWeapon` dlights, `HL1` blit) serialize in B after A or use tiny coordinated patches.
