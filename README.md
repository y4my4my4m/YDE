# YDE

The Y4m Desktop Environment, on a heavily modified [ZealOS](https://github.com/Zeal-Operating-System/ZealOS).
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
- Storage: AHCI/SATA, ATAPI, USB mass storage, NVMe
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

Needs qemu, xorriso, mtools, git and a C toolchain, plus VT-x/AMD-V. No root.

`build-iso.sh` boots `build/AUTO.ISO` to install a minimal system onto a
scratch disk, copies this tree into it, recompiles the kernel and the OS, and
writes two ISOs: a native RedSea one for BIOS and a limine hybrid for UEFI.
Twenty minutes or so on the first run.

`launchvm.sh` boots the newest of those ISOs against `build/ZealOS.qcow2`,
creating that disk if it is absent. From the ISO, run `OSInstall;` to install
onto it, then boot the disk and sync in either direction.

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
