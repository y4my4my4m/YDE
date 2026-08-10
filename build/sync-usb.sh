#!/bin/sh
#
# Incremental update of a USB install from the repo.
#
# Source is src/, not ZealOS.qcow2: sync.sh copies with cp, which rewrites every
# mtime, so an rsync from the vdisk re-sends the whole tree.
#
# Apps/ is skipped by default. The game trees are several GB of pak/mpq/utx data
# that never changes; pass --apps when app sources have.
#
# No --delete: the stick holds /Boot/Kernel.ZXE, Home/Registry.ZC, saves and Tmp
# that do not exist in the repo. Paths removed from the repo go in STALE below.
#
# Kernel.ZXE is not built here. After syncing, run BootHDIns('W') on the stick.
#
# Usage: ./sync-usb.sh [--apps] [/dev/sdX]
set -e
cd "$(dirname "$0")"

SRC=../src
USB=/dev/sda
APPS=0

for a in "$@"; do
	case "$a" in
		--apps) APPS=1 ;;
		/dev/*) USB="$a" ;;
		*) echo "Usage: $0 [--apps] [/dev/sdX]"; exit 1 ;;
	esac
done

# Directories deleted from the repo. rsync without --delete leaves them, and a
# stale copy of a subsystem is worse than none: System/Usb was a second USB
# stack fighting the kernel one over the same controller.
STALE="System/Usb"

[ -d "$SRC" ] || { echo "No $SRC"; exit 1; }
[ -b "${USB}2" ] || { echo "${USB}2 is not a block device"; exit 1; }

udisksctl mount -b "${USB}2" >/dev/null 2>&1 || true
DST=$(findmnt -no TARGET "${USB}2" || true)
[ -n "$DST" ] || { echo "ERROR: ${USB}2 is not mounted"; exit 1; }

case "$DST" in
	/|/home|/boot|/etc|/usr) echo "ERROR: refusing to write to $DST"; exit 1 ;;
esac

EXCL="--exclude=Apps/QuakePlus/qbj3/ARTVAU~1.7Z"
if [ "$APPS" = 0 ]; then
	EXCL="$EXCL --exclude=Apps/"
	echo "src $SRC -> $DST   (Apps/ skipped; --apps to include)"
else
	echo "src $SRC -> $DST   (including Apps/)"
fi

# -rt not -a: FAT has no owners or symlinks.
# --ignore-times: compare content, not size+mtime. A header whose timestamp
# matched but whose content did not shipped a kernel that would not compile.
# With Apps/ excluded the tree is ~50MB, so the cost is seconds.
# shellcheck disable=SC2086
sudo rsync -rt --ignore-times --info=stats2 $EXCL "$SRC"/ "$DST"/

for p in $STALE; do
	if [ -e "$DST/$p" ]; then
		echo "removing stale $p"
		sudo rm -rf "${DST:?}/$p"
	fi
done

echo
echo -n "Kernel.ZXE on stick: "
stat -c '%y  (%s bytes)' "$DST/Boot/Kernel.ZXE" 2>/dev/null || echo "MISSING"

sync
udisksctl unmount -b "${USB}2" >/dev/null 2>&1 || true
echo "Done. Boot the stick and run BootHDIns('W'); to rebuild the kernel."
