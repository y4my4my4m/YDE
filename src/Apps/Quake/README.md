# Quake for ZealOS

A Quake engine written natively in ZealC. No C source is translated from id's
release: everything here is written against the published file format specs
(PAK, BSP29, MDL, SPR, WAD2, progs.dat) and the NetQuake protocol.

It plays: software rasterizer, QuakeC VM, save/load, demos, sound, and UDP
multiplayer against other ZealOS boxes or a stock NetQuake client.


## Game data

`id1/PAK0.PAK` is the shareware archive (id's freely redistributable episode 1).
It is gitignored - fetch it separately:

    curl -O https://ftp.gwdg.de/pub/misc/ftp.idsoftware.com/idstuff/quake/quake106.zip
    unzip quake106.zip                 # yields resource.1, an LHA self-extractor
    7z x -oout resource.1              # yields out/ID1/PAK0.PAK
    cp out/ID1/PAK0.PAK src/Apps/Quake/id1/

Expected: 18689235 bytes, md5 `5906e5998fc3d896ddaf5e6a62e03abb`, 339 entries.

Drop `PAK1.PAK` beside it for the registered game - episodes 2-4, the deathmatch
maps and `gfx/pop.lmp` live there. That file IS the registration test, the same
one `COM_CheckRegistered` uses, so the shareware gates open by themselves once
it is present.

Mission packs go in their own directory next to `id1` and are selected with
`game <dir>` at the console. Both `PAK0.PAK` and `pak0.pak` are tried, since
what you get out of an archive depends on where it came from.


## Running

    Cd("::/Apps/Quake");;ExeFile("Run");        // single player
    Cd("::/Apps/Quake");;ExeFile("RunNet");     // single player + UDP

Or pick **Quake** from the YDE launcher menu.

`RunNet.ZC` is a separate entry point rather than a runtime switch because the
binding is compile-time: the compiler is single-pass, so `UDPSocket` has to
resolve when `QNetUdp.ZC` is read. Choosing Multiplayer from the menu is far too
late. It is not free either - the driver probe throws on a machine with no
supported NIC, which is why plain `Run` exists.


## Multiplayer

One machine hosts and the rest join; there is no dedicated server, same as
NetQuake. Multiplayer -> New Game opens Game Options (game type, max players,
teamplay, skill, frag and time limits, episode and level), and Join either takes
a typed address or searches the LAN.

Set a static address first if the link has no DHCP - `qip 10.0.0.2`, then
`connect 10.0.0.1`. `slist` broadcasts for servers; picking one from the Join
page connects to the address it answered from rather than the one it advertises,
which is what makes discovery work behind a NAT that a stock client cannot cross.

Trouser colour is the team, exactly as `Host_Color_f` has it - `color 4 4` puts
you on team 5. `teamplay 1` blocks damage between team mates, `2` allows it.
`noexit 1` gibs anyone touching a level exit, which is how a deathmatch is kept
from ending when someone wanders into a portal.

Cheats (`god`, `noclip`, `fly`, `give`, `notarget`) refuse to run while
`deathmatch` is set, as the original's do.


## Files

| File | Role |
|---|---|
| `QFmt.ZC` | Little-endian byte readers, exact binary32 -> F64 widening, logging |
| `QPak.ZC` | PAK mount / lookup / load / unmount |
| `QPal.ZC` | `palette.lmp` + `colormap.lmp`, truecolor expansion, gamma and tint |
| `QMath.ZC` | Vectors, angles, `vectoangles` |
| `QBSP.ZC` | BSP29 loader, all 15 lumps, surface extents, miptex |
| `QVis.ZC` | PVS decompression and the visible-leaf walk |
| `QDraw.ZC` | Span rasterizer, surface cache, lightmaps, dynamic lights, sky, turb |
| `QMDL.ZC` | Alias models, frame groups, skin translation, model cache |
| `QSpr.ZC` | Sprites |
| `QPart.ZC` | Particles and `R_RocketTrail` |
| `QWad.ZC` | WAD2 / `gfx.wad` lumps and the console font |
| `QSbar.ZC` | Status bar, scoreboards, intermission and finale |
| `QMenu.ZC` | Menus, console, command dispatch, key bindings, config |
| `QProgs.ZC` | QuakeC VM - bytecode, globals, edicts, strings |
| `QBuiltin.ZC` | The builtin table QuakeC calls into |
| `QGame.ZC` | Server world: physics, pushers, thinks, entity spawning |
| `QEnt.ZC` | Entity lump parsing |
| `QClip.ZC` | Hull traces, `SV_FlyMove`, player movement |
| `QPhys.ZC` | Trace structures and shared physics helpers |
| `QPlayer.ZC` | The local player as a QuakeC client edict |
| `QSound.ZC` | Channels, spatialization, ambients, music |
| `QSave.ZC` | Savegames |
| `QDemo.ZC` | `.dem` playback and the attract loop |
| `QNet.ZC` | Message buffers, entity delta encode / decode |
| `QNetUdp.ZC` | UDP sockets, ARP, broadcast |
| `QNetDgrm.ZC` | Datagram layer, reliable channel, control packets, host cache |
| `QNetSv.ZC` | Server frame, client slots, signon, and the client's own parse |
| `Quake.ZC` | Frame loop, view, teardown |
| `QTest.ZC` | In-guest self-checks |
| `Run.ZC` | Include chain and entry point |
| `RunNet.ZC` | Same, with the net stack loaded first |


## ZealC constraints this code is written around

These are silent-failure traps, not style preferences:

- **No struct overlay on file bytes.** ZealC arithmetic is F64-only and postfix
  casts (`x(F64)`) are no-ops. Every on-disk field is decoded explicitly and
  binary32 is widened by rebuilding the double's bit pattern.
- **Globals are not zeroed** by the JIT, and a declaration initializer is not
  honoured either. Anything read before its first write needs an explicit init
  function that actually runs.
- **`ToI64` on a `Bool` reads the seven bytes past it.** A one-byte flag came
  back as 1819242241. Branch to widen one, never cast.
- **`<<` and `>>` bind tighter than `*` and `/`** (opposite of C). Shift
  expressions mixed with arithmetic are parenthesized.
- **No `continue`, no ternary, no function-like `#define`.** Loops use `goto` to
  a label at the end of the body.
- **Locals are function-scoped**, so declarations are hoisted to the top.
- **Brace initializers only at global scope.**
- **A raw `$` in source is a DolDoc command** to the lexer, even inside a
  comment. Use the byte value `0x24`. A stray backtick is the same hazard.
- **Mutual recursion through a forward declaration miscompiles.** BSP traversal
  must use direct self-recursion.
- **Single-pass compile**, so `Run.ZC` include order is load-bearing - a symbol
  has to be defined in a file that appears earlier than every file using it.
  This is why the game-mode publish, the host cache and the deferred gamedir
  switch all live further up the chain than the code that triggers them.


## Verifying the data layer

    Cd("::/Apps/Quake");;ExeFile("Run");

`QTest` is not run automatically - Quake clears the document on startup and would
wipe anything printed first. Run `QTest;` from the prompt after quitting. It
should print values matching this host-computed ground truth for `maps/e1m1.bsp`
(BSP version 29):

    planes 1810  vertices 7358  edges 13497  surfedges 26702
    nodes 2750   leafs 1531     texinfo 489  faces 5516
    marksurfaces 7073  models 58
    visdata 40843 bytes  lightdata 168590 bytes  entities 26284 bytes

    vert bounds  x  -592.0 .. 1504.0
                 y  -416.0 .. 3064.0
                 z  -592.0 ..  272.0

    solid leafs 1 of 1531
    textures: slipbotsd(16x64) +0slipbot(64x64) slipside(16x16)
              sliplite(16x16) sfloor4_2(64x64)
    model0 mins  -607.0 -431.0 -607.0
    model0 maxs  1519.0 3071.0  287.0

    pal[0] = 00000000   pal[15] = 00EBEBEB   pal[255] = 009F5B53

The vertex bounds are the sharpest check on the binary32 decoder: a mantissa or
exponent mistake shows up there immediately.


## Debugging

Everything the engine has to say goes to `::/Apps/Quake/QUAKELOG.TXT`, flushed
eagerly so a crash still leaves the evidence on disk. Teardown is breadcrumbed
step by step - the last line in the file names the step that was running.

Note the log buffer is fixed and **drops writes once full**, so a chatty
diagnostic will silently swallow the quiet one you actually wanted.

    diskwrite 0     stop writing the log, to rule it out
    heapcheck 1     walk the heap at each checkpoint (needs _CONFIG_HEAP_DEBUG)
    edicts <class>  dump entities of a class with their .enemy / .owner links
    netstat         local address, peer, packet counts
    status          connected clients
