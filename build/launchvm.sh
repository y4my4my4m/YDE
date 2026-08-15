# qemu-system-x86_64 -audiodev sdl,id=snd0 -machine q35,kernel_irqchip=on,pcspk-audiodev=snd0,accel=kvm -cdrom ZealOS-*.iso -hda ZealOS.qcow2 -m 2G -smp $(nproc) -rtc base=localtime -nic user,model=pcnet

# qemu-system-x86_64 -audiodev sdl,id=snd0 -machine q35,kernel_irqchip=on,pcspk-audiodev=snd0,accel=kvm -hda ZealOS.qcow2 -m 2G -smp $(nproc) -rtc base=localtime -nic user,model=pcnet



cd "$(dirname "$0")" || exit 1

DISK=ZealOS.qcow2
# Newest distro ISO. build-iso.sh stamps the name with the build time.
ISO=$(ls -1t ZealOS-PublicDomain-BIOS-*.iso 2>/dev/null | head -1)

[ -f "$DISK" ] || {
	echo "No $DISK. Creating a 8G disk; boot the ISO and run the installer."
	qemu-img create -f qcow2 "$DISK" 8G || exit 1
}
[ -n "$ISO" ] || {
	echo "No ZealOS-PublicDomain-BIOS-*.iso here. Run ./build-iso.sh first."
	exit 1
}

# Audio backend: this host runs PipeWire. The 'sdl' audiodev is often silent
# here; 'pipewire' is native. Fall back to 'pa' then 'sdl' if unavailable.
AUDIODEV="pipewire"
qemu-system-x86_64 -audiodev help 2>/dev/null | grep -qx "$AUDIODEV" || AUDIODEV="pa"

# The AC97 codec is driven at 48kHz stereo s16 (System/AC97.ZC QSND_MIX_RATE).
# Pinning the host stream to the same format keeps QEMU's resampler out of
# the path.
AUDIOFMT="out.frequency=48000,out.channels=2,out.format=s16"

# HOSTFWD=1 → Ironwail path (single SLIRP NIC + UDP 26000).
# Default     → Zeal↔Zeal MP via socket netdev (mp_test.sh connects :1234).
#
# ZealOS Net drives ONE rtl8139 (PCIDevFind first match). A second hostfwd NIC
# is orphaned — Ironwail packets never reach Quake. Do not dual-NIC here.
if [ "${HOSTFWD:-0}" = "1" ]; then
  # Bind all host interfaces; Ironwail on 127.0.0.1 still works.
  NETDEV="-netdev user,id=n0,hostfwd=udp::26000-:26000"
  echo "Ironwail mode: UDP host:26000 -> guest:26000 (mp_test.sh N/A — plain ./launchvm.sh for Zeal↔Zeal)"
else
  NETDEV="-netdev socket,id=n0,listen=:1234"
fi

qemu-system-x86_64 -audiodev ${AUDIODEV},id=snd0,${AUDIOFMT} \
    -machine q35,kernel_irqchip=on,pcspk-audiodev=snd0,accel=kvm \
    -device AC97,audiodev=snd0 \
    -cdrom "$ISO" \
    -drive file="$DISK",format=qcow2,if=ide \
    -m 2G -smp "$(nproc)" -rtc base=localtime  \
    $NETDEV \
    -device rtl8139,netdev=n0,mac=52:54:00:12:34:01



# qemu-system-x86_64 -audiodev sdl,id=snd0 -machine q35,kernel_irqchip=on,pcspk-audiodev=snd0,accel=kvm -hda ZealOS.qcow2 -m 2G -smp $(nproc) -rtc base=localtime -nic user,model=pcnet



# qemu-system-x86_64 -audiodev sdl,id=snd0 \
#   -machine q35,kernel_irqchip=on,pcspk-audiodev=snd0,accel=kvm \
#   -cdrom ZealOS-PublicDomain-BIOS-2026-07-17-22_04_05.iso \
#   -drive file=ZealOS.qcow2,format=qcow2,if=ide \
#   -m 2G -smp "$(nproc)" -rtc base=localtime