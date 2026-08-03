# Unreal Tournament 99 for ZealOS

Native ZealC port against UT99 public headers and `Help/PACKAGES.md`
(FaultyRAM/Ut99PubSrc). Epic did not release Engine/Core `.cpp` or SoftDrv.

**Render path: CPU software only.** ZealOS has no GPU. This port mirrors
Quake/HL1 SoftDrv-style indexed framebuffer + `draw_it` blit. OpenGLDrv,
D3DDrv, XMesaGLDrv, and DirectDraw are not ported and are not linked.

## Runs

```
Cd("::/Apps/UT99");;ExeFile("Run");
```

Or **Unreal Tournament** in the YDE launcher.

SoftDrv demo room: procedural BSP box with P8 checker/grid textures, cube
mesh, WASD + mouse look, ESC quit. No retail packages required.

After quit: `UTTest;` — F32, FCompactIndex, GetAxes, mesh wire, SoftDrv
span/tile stats, optional package table load.

Log: `::/Apps/UT99/UT99LOG.TXT`.

## SoftDrv (CPU)

`SoftDrv.dll` is absent from Ut99PubSrc. Stand-in:

| Module | Upstream | Role |
|---|---|---|
| `UTDraw.ZC` | SoftDrv raster + QDraw pattern | P8 canvas, Z, textured tri, span, tile, blit |
| `UTSpan.ZC` | `FSpan` / `FSpanBuffer` | Per-row open segments, clip + punch |
| `UTTex.ZC` | `UTexture` / `FMipmap` P8 | Power-of-two indexed mips |
| `UTSoft.ZC` | `URenderDevice` | `SpanBased=TRUE` Lock/Unlock/Draw* |

`URenderDevice::SpanBased` is TRUE. Lock clears screen + span buffer. DrawTile /
DrawGouraud path write the indexed canvas; Unlock does not blit — `UTDrawIt`
copies palette→ARGB like Quake.

Not present: hardware devices, fog maps, DXT, lightmaps, portals.

## Game data

Retail tree under `::/Apps/UT99/` (same as `Default.ini` `Paths=`):

| Dir | Ext | Role |
|---|---|---|
| `System/` | `*.u` `*.ini` `*.int` | classes + config |
| `Maps/` | `*.unr` | levels |
| `Textures/` | `*.utx` | P8 mips, fonts (`UWindowFonts.utx`) |
| `Sounds/` | `*.uax` | SFX |
| `Music/` | `*.umx` | music |
| `SystemLocalized/` | locale stubs | `LangPaths` |
| `data/` | optional | ad-hoc package drops for `UTPkgLoad` |

Path roots: `UT99_*_DIR` in `UTFmt.ZC`. `UTTest` probes `System/Engine.u`,
`Textures/UWindowFonts.utx`, `Maps/DM-Codex.unr`. Tag `0x9E2A83C1`, version 69.
Object serial payloads undocumented in the public tree.

Not copied: `*.dll` / `*.exe` / SoftDrv / OpenGL / D3D / Movies (none in this
install). Game data is gitignored — sync host → VM for the binary packages.

## Files

| File | Role |
|---|---|
| `UTFmt.ZC` | LE readers, F32, FCompactIndex, log |
| `UTMath.ZC` | FVector, GetAxes, FMeshVert |
| `UTPkg.ZC` | Package summary + name/import/export |
| `UTPal.ZC` | 256 palette → ARGB |
| `UTTex.ZC` | SoftDrv P8 textures |
| `UTSpan.ZC` | SoftDrv span buffer |
| `UTDraw.ZC` | SoftDrv canvas / raster / blit |
| `UTSoft.ZC` | SoftDrv device facade |
| `UTMesh.ZC` | FMeshTri + demo cube |
| `UTBsp.ZC` | FBspNode fields + textured room |
| `UTIn.ZC` | Mouse look + WASD |
| `UTTest.ZC` | Self-checks |
| `UT99.ZC` | Frame loop |
| `Run.ZC` | Include chain |
| `PACKAGES.upstream.md` | Epic package-format doc |

## Present

- SoftDrv-shaped CPU P8 raster (spans, tiles, textured tris)
- Package header/table loader
- Math / meshvert / demo walkable scene
- Input shell (Quake/HL1 raw mouse)

## Absent

- SoftDrv.dll source (never public)
- OpenGL / D3D / XMesa / DirectDraw drivers (excluded by design)
- Engine.dll / Core.dll bodies
- UnrealScript VM
- Full UMesh / UModel / UTexture Serialize
- Netplay, bots, retail HUD art

## Highest-value gaps (soft path)

1. Perspective span edge walker (replace barycentric fill for walls)
2. Decode UTexture P8 mips from a real `.utx`
3. UModel node serial → SoftDrv DrawComplexSurface facets
