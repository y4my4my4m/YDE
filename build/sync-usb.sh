#!/bin/sh
#
# Incremental update of a USB install from the repo.
#
# Source is src/, not ZealOS.qcow2: sync.sh copies with cp, which rewrites every
# mtime, so an rsync from the vdisk re-sends the whole tree.
#
# Apps/ source only by default: the game trees are several GB of pak/mpq/utx
# data that never changes, so only *.ZC/*.HH/*.HC/*.PRJ under Apps/ is sent.
# --apps sends the data too, --no-apps skips Apps/ entirely.
#
# No --delete: the stick holds /Boot/Kernel.ZXE, Home/Registry.ZC, saves and Tmp
# that do not exist in the repo. Paths removed from the repo go in STALE below.
#
# Kernel.ZXE is not built here. After syncing, run BootHDIns('W') on the stick.
#
# Usage: ./sync-usb.sh [--apps|--no-apps] [/dev/sdX]
set -e
cd "$(dirname "$0")"

SRC=../src
USB=/dev/sda
APPS=src

for a in "$@"; do
	case "$a" in
		--apps) APPS=all ;;
		--no-apps) APPS=none ;;
		/dev/*) USB="$a" ;;
		*) echo "Usage: $0 [--apps|--no-apps] [/dev/sdX]"; exit 1 ;;
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

# vfat mounts read-only when the dirty bit is set, and ZealOS does not clear it
# on power off. Without this the run sprays one error per file and reports
# success bytes it never wrote.
if ! touch "$DST/.rwtest" 2>/dev/null; then
	echo "ERROR: $DST is mounted read-only"
	findmnt -no OPTIONS "$DST" | tr ',' '\n' | grep -qx ro && \
		echo "  the FAT dirty bit is set - an unclean unmount"
	echo "  udisksctl unmount -b ${USB}2"
	echo "  sudo fsck.vfat -a -w ${USB}2"
	echo "  then re-run $0"
	exit 1
fi
rm -f "$DST/.rwtest"

EXCL="--exclude=Apps/QuakePlus/qbj3/ARTVAU~1.7Z"
PRUNE=""
case "$APPS" in
	none)
		EXCL="$EXCL --exclude=Apps/"
		echo "src $SRC -> $DST   (Apps/ skipped)"
		;;
	src)
		# first match wins: keep the dirs so rsync can descend, keep the
		# sources, drop everything else under Apps/. -m prunes the game
		# directories left empty by the exclude.
		EXCL="$EXCL --include=/Apps/ --include=/Apps/**/"
		EXCL="$EXCL --include=/Apps/**/*.ZC --include=/Apps/**/*.HH"
		EXCL="$EXCL --include=/Apps/**/*.HC --include=/Apps/**/*.PRJ"
		EXCL="$EXCL --exclude=/Apps/**"
		PRUNE="-m"
		echo "src $SRC -> $DST   (Apps/ sources only; --apps for game data)"
		;;
	all)
		echo "src $SRC -> $DST   (including Apps/ game data)"
		;;
esac

# -rt not -a: FAT has no owners or symlinks.
# --ignore-times: compare content, not size+mtime. A header whose timestamp
# matched but whose content did not shipped a kernel that would not compile.
# With Apps/ excluded the tree is ~50MB, so the cost is seconds.
# shellcheck disable=SC2086
# progress2 is a single updating line of overall percent/rate/ETA; stats2 is
# the summary at the end. --ignore-times reads every file, so without this the
# run is silent for the whole transfer.
sudo rsync -rt --ignore-times -h --info=progress2,stats2 $PRUNE $EXCL \
	"$SRC"/ "$DST"/

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
