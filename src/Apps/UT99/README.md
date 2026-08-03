# Unreal Tournament 99 for ZealOS

Native ZealC SoftDrv port. Formats from FaultyRAM/Ut99PubSrc + retail packages.

**Render: CPU SoftDrv only.**

## Runs

```
Cd("::/Apps/UT99");;ExeFile("Run");
```

WASD mouse SPACE jump LMB/RMB fire `[` `]` weapons Tab scores K suicide T taunt.
ESC menu: map / DM-CTF-DOM / fraglimit / bots / apply / quit.
Maps: 1–4 favorites, `n`/`b` cycle, 5–8 filter.

## Present

- SoftDrv P8 + FTB BSP + FSpan; per-surf `.utx`
- Light actors → facet shade (`LightBrightness`/`LightRadius`, WorldLightRadius=25*(r+1))
- SoftDrv pause menu (map catalog, gametype, fraglimit, bot count)
- Armor layers: ShieldBelt 100% → body 75% → ThighPads 50%; health caps 100/199
- Property bag + Class defaults; Botpack 13-weapon table + Hammer charge / Translocator solid check
- Announcer.uax + Male2Voice taunts (name match)
- IT `.umx` pattern player; LodMesh Faces/Wedges
- Map catalog all `Maps/{DM,CTF,DOM}-*.unr`
- CTF FlagBase + DOM ControlPoint; ZoneInfo gravity/water/hurt
- SoftDrv blood/scorch; DM bots death cam pickups fraglimit

## Gaps

- Latent UScript / IpDrv net
- Full IT NNA; property-offset linker
- Zone volumes: Location radius; BSP zone portals absent
- Lightmaps absent; SoftDrv index-shade only

## Modules

`UTLight` `UTMenu` `UTProp` `UTWeap` `UTZone` `UTCTF` `UTDecal` `UTMap` `UTGame` `UTSnd` …
