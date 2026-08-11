#!/bin/sh
# NVMe test VM.
#
# Default   AHCI/IDE boot disk + an NVMe namespace as a data drive.
# BOOT=nvme Boot off the NVMe disk instead (SeaBIOS reads NVMe via INT13h);
#           the IDE disk stays attached as a fallback but is second in the
#           boot order.
#
# The kernel mounts NVMe namespaces at the first free letter in K..N
# (Letter2BlkDevType). A blank image has no partition table and mounts whole,
# so partition it once from inside the guest:
#
#   DiskPart('K');
#
# NVME_SIZE sets the scratch image size, NVME_NS=2 attaches a second namespace.
set -e
cd "$(dirname "$0")"

NVME_IMG="${NVME_IMG:-nvme0.qcow2}"
NVME_SIZE="${NVME_SIZE:-2G}"

[ -f "$NVME_IMG" ] || qemu-img create -f qcow2 "$NVME_IMG" "$NVME_SIZE"

if [ "${BOOT:-ide}" = "nvme" ]; then
  NVME_BOOT=",bootindex=0"
  IDE_BOOT=",bootindex=1"
else
  NVME_BOOT=""
  IDE_BOOT=",bootindex=0"
fi

NVME_ARGS="-drive file=$NVME_IMG,format=qcow2,if=none,id=nvm0 \
           -device nvme,serial=zeal0,drive=nvm0$NVME_BOOT"

if [ "${NVME_NS:-1}" = "2" ]; then
  NVME_IMG2="${NVME_IMG2:-nvme1.qcow2}"
  [ -f "$NVME_IMG2" ] || qemu-img create -f qcow2 "$NVME_IMG2" "$NVME_SIZE"
  NVME_ARGS="$NVME_ARGS \
             -drive file=$NVME_IMG2,format=qcow2,if=none,id=nvm1 \
             -device nvme,serial=zeal1,drive=nvm1"
fi

AUDIODEV="pipewire"
qemu-system-x86_64 -audiodev help 2>/dev/null | grep -qx "$AUDIODEV" || AUDIODEV="pa"

qemu-system-x86_64 -audiodev ${AUDIODEV},id=snd0 \
    -machine q35,kernel_irqchip=on,pcspk-audiodev=snd0,accel=kvm \
    -device AC97,audiodev=snd0 \
    -drive file=ZealOS.qcow2,format=qcow2,if=none,id=hd0 \
    -device ide-hd,drive=hd0,bus=ide.0$IDE_BOOT \
    $NVME_ARGS \
    -m 2G -smp "$(nproc)" -rtc base=localtime \
    -nic user,model=rtl8139
