# YDE

The Y Desktop Environment, on a heavily modified [ZealOS](https://github.com/Zeal-Operating-System/ZealOS).
64-bit, ring-0, single address space, written in ZealC. No ELFs, no libc, no X.

![](/screenshots/yde-desktop.png)

## What it is

A truecolor compositing desktop that runs on ZealOS. The window manager, the
toolkit, the decoders and the applications are all ZealC source in this tree,
compiled at boot.

- Compositor with per-window glass blur (optional), z-buffered wallpaper
- Taskbar, start menu, settings, palette editor, calendar, calculator
- yViewer image viewer, yPainter, YTracker, ZMail, yIRC, Zinc web browser
- Images: PNG, JPG, GIF, WEBP, TGA, SVG
- Audio: MP3, Ogg Vorbis, WAV, MOD, AC97, HDA, USB audio
- Net: TCP/IP, DHCP, DNS, HTTP, TLS 1.3, WebSocket, SSH, git, IRC, IMAP/SMTP
- 8x8 and 8x16 system fonts, switchable at runtime

![](/screenshots/yde-startmenu.png)

Email client:
![](/screenshots/yde-zemail.png)

Paint:
![](/screenshots/yde-ypainter.png)

Browser:
![](/screenshots/yde-zinc.png)

## Ports

QuakePlus (Fitz/QS/Ironwail-class), Half-Life (GoldSrc, software
renderer), Diablo (Devilution-like with some DevilutionX features). Native, no emulation.

![](/screenshots/yde-quake.png)

![](/screenshots/yde-hl1.png)

![](/screenshots/yde-diablo.png)

## YTracker

A sample tracker written for YDE. NES-style waveforms are generated into
looping samples at startup, so one voice path drives chiptune and imported PCM
alike: portamento, vibrato and arpeggio work on both.

![](/screenshots/yde-ytracker1.png)

![](/screenshots/yde-ytracker2.png)

![](/screenshots/yde-tracker3.png)

## Build and run

```sh
build/build-iso.sh      # distro ISO
build/launchvm.sh       # QEMU, KVM, AC97, rtl8139
build/sync.sh           # merge changes made inside the VM back to the repo
```

Requires VT-x/AMD-V. The ISO installs to a qcow2 disk; after that, boot the
disk and sync in either direction.

## Layout

```
src/Kernel      AOT kernel: memory, tasks, FS, USB, fonts
src/Compiler    ZealC compiler
src/System      graphics, audio, net, decoders
src/DE          the desktop
src/Apps        ports and applications
```

## License

Public domain, as upstream. ZealOS is a fork of TempleOS by Terry A. Davis.
