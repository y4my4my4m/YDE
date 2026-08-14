#!/bin/sh

set -e

# Build OS using AUTO.ISO minimal auto-install as bootstrap to merge codebase, recompile system, attempt build limine UEFI hybrid ISO

# make sure we are in the correct directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
SCRIPT_NAME="$(basename "$0")"
EXPECTED_DIR="$(pwd -P)"

if test "${EXPECTED_DIR}" != "${SCRIPT_DIR}"
then
	( cd "$SCRIPT_DIR" || exit ; "./$SCRIPT_NAME" "$@" );
	exit
fi

[ "$1" = "--headless" ] && QEMU_HEADLESS='-display none'

KVM=''
(lsmod | grep -q kvm) && KVM=' -accel kvm'

# Set this true if you want to test ISOs in QEMU after building.
TESTING=false

for tool in qemu-system-x86_64 qemu-img xorriso mcopy mmd mdel git make tar
do
	command -v "$tool" >/dev/null || { echo "ERROR: $tool not found in \$PATH."; exit 1; }
done

[ -f AUTO.ISO ] || { echo "ERROR: no AUTO.ISO in $SCRIPT_DIR."; exit 1; }

TMPDIR="$(mktemp -d)"
TMPISODIR="$TMPDIR/iso"
TMPSRC="$TMPDIR/src"
TMPDISK="$TMPDIR/ZealOS.raw"

# Change this if your default QEMU version does not work and you have installed a different version elsewhere.
QEMU_BIN_PATH="$(dirname "$(which qemu-system-x86_64)")"

# The install is FAT32, so mtools reaches it with no root, no nbd and no kernel
# filesystem driver. IMG is set once the partition table exists.
export MTOOLS_SKIP_CHECK=1
IMG=""

set_img() {
	# MBR partition entry 0: LBA of first sector at byte 454, 4 bytes little-endian.
	start=$(od -An -tu4 -j454 -N4 "$TMPDISK" | tr -d ' ')
	IMG="$TMPDISK@@$((start * 512))"
}

script_cleanup() {
	echo "Deleting temp folder ..."
	rm -rf "$TMPDIR"
}

trap 'script_cleanup' EXIT

mkdir -p "$TMPISODIR" "$TMPSRC"

echo "Building ZealBooter..."
make -C ../zealbooter distclean all || ( echo "ERROR: ZealBooter build failed !" && false )

echo "Making temp vdisk, running auto-install ..."
"$QEMU_BIN_PATH/qemu-img" create -f raw "$TMPDISK" 1024M
"$QEMU_BIN_PATH/qemu-system-x86_64" -machine q35 $KVM -drive format=raw,file="$TMPDISK" -m 1G -rtc base=localtime -smp 4 -cdrom AUTO.ISO -device isa-debug-exit $QEMU_HEADLESS || true
set_img

# Game data and other ignored blobs live under src/ but are not part of the OS,
# and the bootstrap vdisk is 1 GiB. Take tracked and untracked-but-not-ignored
# files only.
echo "Staging src/ ..."
rm -f ../src/Home/Registry.ZC
rm -f ../src/Home/MakeHome.ZC
rm -f ../src/Boot/Kernel.ZXE
( cd .. && git ls-files -co --exclude-standard -z -- src | tar --null -T - -cf - ) | \
	tar -xf - -C "$TMPSRC"

echo "Copying all src/ code into vdisk Tmp/OSBuild/ ..."
mmd -i "$IMG" ::/Tmp/OSBuild
mcopy -s -Q -o -i "$IMG" "$TMPSRC"/src/* ::/Tmp/OSBuild/

# The install carries the AUTO.ISO copy of the bootstrap chain, which is only as
# new as the ISO. Run the ones in this tree instead.
mcopy -Q -o -i "$IMG" ../src/Misc/Auto/AutoFullDistro*.ZC ::/Misc/Auto/

echo "Rebuilding kernel headers, kernel, OS, and building Distro ISO ..."
"$QEMU_BIN_PATH/qemu-system-x86_64" -machine q35 $KVM -drive format=raw,file="$TMPDISK" -m 1G -rtc base=localtime -smp 4 -device isa-debug-exit $QEMU_HEADLESS || true

LIMINE_BINARY_BRANCH="v10.x-binary"

if [ -d "limine" ]
then
	cd limine
	git remote set-branches origin $LIMINE_BINARY_BRANCH
	git fetch
	git remote set-head origin $LIMINE_BINARY_BRANCH
	git switch $LIMINE_BINARY_BRANCH
	git config --local pull.ff true
	git config --local pull.rebase true
	git pull
	rm limine

	cd ..
else
    git clone https://github.com/limine-bootloader/limine.git --branch=$LIMINE_BINARY_BRANCH --depth=1
fi
make -C limine

touch limine/Limine-BIOS-HDD.HH
echo "/*\$WW,1\$" > limine/Limine-BIOS-HDD.HH
cat limine/LICENSE >> limine/Limine-BIOS-HDD.HH
echo "*/\$WW,0\$" >> limine/Limine-BIOS-HDD.HH
cat limine/limine-bios-hdd.h >> limine/Limine-BIOS-HDD.HH
sed -i 's/const uint8_t/U8/g' limine/Limine-BIOS-HDD.HH
sed -i "s/\[\]/\[$(grep -o "0x" ./limine/limine-bios-hdd.h | wc -l)\]/g" limine/Limine-BIOS-HDD.HH

echo "Extracting MyDistro ISO from vdisk ..."
mcopy -i "$IMG" ::/Tmp/MyDistro.ISO.C ./ZealOS-MyDistro.iso
mdel -i "$IMG" ::/Tmp/MyDistro.ISO.C
echo "Setting up temp ISO directory contents for use with limine xorriso command ..."
mcopy -s -Q -i "$IMG" "::/*" "$TMPISODIR/"
rm -f "$TMPISODIR/Boot/OldMBR.BIN"
rm -f "$TMPISODIR/Boot/BootMHD2.BIN"
mkdir -p "$TMPISODIR/EFI/BOOT"
cp limine/Limine-BIOS-HDD.HH "$TMPISODIR/Boot/Limine-BIOS-HDD.HH"
cp limine/BOOTX64.EFI "$TMPISODIR/EFI/BOOT/BOOTX64.EFI"
cp limine/limine-uefi-cd.bin "$TMPISODIR/Boot/Limine-UEFI-CD.BIN"
cp limine/limine-bios-cd.bin "$TMPISODIR/Boot/Limine-BIOS-CD.BIN"
cp limine/limine-bios.sys "$TMPISODIR/Boot/Limine-BIOS.SYS"
cp ../zealbooter/bin/kernel "$TMPISODIR/Boot/ZealBooter.ELF"
cp ../zealbooter/limine.conf "$TMPISODIR/Boot/Limine.CONF"
echo "Copying DVDKernel.ZXE over ISO Boot/Kernel.ZXE ..."
mcopy -i "$IMG" ::/Tmp/DVDKernel.ZXE "$TMPISODIR/Boot/Kernel.ZXE"
rm -f "$TMPISODIR/Tmp/DVDKernel.ZXE"

truncate -s 32K bios_boot.img

xorriso -as mkisofs -R -r -J -b Boot/Limine-BIOS-CD.BIN \
        -no-emul-boot -boot-load-size 4 -boot-info-table \
        --efi-boot Boot/Limine-UEFI-CD.BIN \
        -efi-boot-part --efi-boot-image --protective-msdos-label \
        -append_partition 4 21686148-6449-6E6F-744E-656564454649 bios_boot.img \
        -appended_part_as_gpt \
        "$TMPISODIR" -o ZealOS-limine.iso

rm bios_boot.img

./limine/limine bios-install ZealOS-limine.iso --no-gpt-to-mbr-isohybrid-conversion

if [ "$TESTING" = true ]; then
	if [ ! -d "ovmf" ]; then
	    echo "Downloading OVMF..."
	    mkdir ovmf
	    cd ovmf
	    curl -o OVMF-X64.zip https://efi.akeo.ie/OVMF/OVMF-X64.zip
	    7z x OVMF-X64.zip
	    cd ..
	fi
	echo "Testing limine-zealbooter-xorriso isohybrid boot in UEFI mode ..."
	"$QEMU_BIN_PATH/qemu-system-x86_64" -machine q35 $KVM -m 1G -rtc base=localtime -bios ovmf/OVMF.fd -smp 4 -cdrom ZealOS-limine.iso $QEMU_HEADLESS
	echo "Testing limine-zealbooter-xorriso isohybrid boot in BIOS mode ..."
	"$QEMU_BIN_PATH/qemu-system-x86_64" -machine q35 $KVM -m 1G -rtc base=localtime -smp 4 -cdrom ZealOS-limine.iso $QEMU_HEADLESS
	echo "Testing native ZealC MyDistro legacy ISO in BIOS mode ..."
	"$QEMU_BIN_PATH/qemu-system-x86_64" -machine q35 $KVM -m 1G -rtc base=localtime -smp 4 -cdrom ZealOS-MyDistro.iso $QEMU_HEADLESS
fi

# comment these 2 lines if you want lingering old Distro ISOs
rm -f ./ZealOS-PublicDomain-BIOS-*.iso
rm -f ./ZealOS-BSD2-UEFI-*.iso

mv ./ZealOS-MyDistro.iso ./ZealOS-PublicDomain-BIOS-$(date +%Y-%m-%d-%H_%M_%S).iso
mv ./ZealOS-limine.iso ./ZealOS-BSD2-UEFI-$(date +%Y-%m-%d-%H_%M_%S).iso

echo "Finished."
echo
echo "ISOs built:"
ls | grep ZealOS-P
ls | grep ZealOS-B
echo
