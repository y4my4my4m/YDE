#!/bin/sh
# grab.sh GUEST_PATH [DEST] - copy one file out of the ZealOS disk.
# GUEST_PATH is relative to the vdisk root, e.g. Home/mySong.YT3
cd "$(dirname "$0")" || exit 1
ZEALDISK=ZealOS.qcow2
TMPMOUNT=/tmp/zealtmp
QEMU_BIN_PATH=$(dirname "$(which qemu-system-x86_64)")

[ -z "$1" ] && echo "Usage: $0 GUEST_PATH [DEST]" && exit 1
DEST=${2:-.}

sudo modprobe nbd
sudo "$QEMU_BIN_PATH"/qemu-nbd -c /dev/nbd0 "$ZEALDISK" || exit 1
sudo partprobe /dev/nbd0
mkdir -p "$TMPMOUNT"
sudo mount -o ro /dev/nbd0p1 "$TMPMOUNT"
cp "$TMPMOUNT/$1" "$DEST" && echo "Copied $1 -> $DEST"
sudo umount "$TMPMOUNT"
sudo "$QEMU_BIN_PATH"/qemu-nbd -d /dev/nbd0
sudo rmdir "$TMPMOUNT" 2>/dev/null