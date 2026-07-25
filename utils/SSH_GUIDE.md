# YKD SSH Client - User Guide

An SSH-2 client for ZealOS/YKD: interactive shells, one-off commands, and
Ed25519 public-key authentication. Password and public-key auth are supported.

> **Security note (read once).** This client does **not** verify the server's
> host key (accept-any), matching the TLS stack's posture. It protects against
> passive eavesdropping but **not** an active man-in-the-middle. Password
> prompts are shown in the clear. Use it accordingly.

---

## 1. Prerequisites

- The network stack must be up. After boot you should see an IP (e.g.
  `10.0.2.15`) in the Network Report. If not, bring the stack up first.
- Load the client:

```
#include "C:/Home/Net/Programs/SSH/SSH"
```

That single include pulls in the transport, crypto (SHA-512, Ed25519),
auth, channel, keygen, and terminal modules.

---

## 2. Quick smoke tests

Before trusting anything, run the built-in self-tests.

```
SSHCryptoTest;            // SHA-512 + Ed25519 known-answer tests - both must be GREEN
SSHTransportTest("HOST", 22);   // full handshake + cipher against a real server
```

`SSHTransportTest` prints each handshake stage inline:

```
[ssh] TCP connected.
[ssh] server version: SSH-2.0-OpenSSH_9.6
[ssh] KEXINIT exchanged (...).
[ssh] ECDH reply received.
[ssh] NEWKEYS done, keys derived. Channel encrypted.
SERVICE_ACCEPT received -- transport + cipher VERIFIED.
```

If it stops early, the last `[ssh]` line tells you which stage failed.

---

## 3. Interactive shell

```
SSH;                          // prompts for host, user, (password)
SSH("192.168.1.10");          // prompts for user, (password)
SSH("192.168.1.10", 22, "root");   // prompts only for password (if no key)
```

- If a key is loaded (see §5), it tries **public-key auth first**, no password.
- Otherwise it prompts for a password.
- **Shift+Esc** quits the session.

The terminal is a scrolling DolDoc view (not a full ANSI grid). It requests a
`dumb` pty, so colored prompts and full-screen apps (vim, htop) will look rough,
but shells, `ls`, `cat`, `git`, etc. work fine.

---

## 4. Run a single command

Capture the output of one command without opening a shell:

```
SSHRun("192.168.1.10", 22, "root", "PASSWORD", "uname -a");
SSHRun("192.168.1.10", 22, "root", "PASSWORD", "ls -la /etc");
```

Prints the command's stdout/stderr, then the exit status.
(`SSHRun` uses password auth; for key auth use the interactive `SSH` shell.)

---

## 5. Public-key authentication (Ed25519)

Public-key auth means the server recognizes your YKD key and lets you in with
no password. Do this once per machine.

### 5.1 Generate a key

```
SSHKeyGen;
```

This:
- generates an Ed25519 keypair,
- saves it to `C:/Home/Config/SSH/Ed25519.key` (private) and
  `C:/Home/Config/SSH/Ed25519.pub` (the public line),
- loads it into the in-memory agent,
- prints the line to install on the server, e.g.:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... YKD@zealos
```

> Keys live in a **visible** directory (`C:/Home/Config/SSH/`) - no hidden
> dotfolders. This is deliberate: ZealOS is flat and everything-is-visible.

### 5.2 Install the public key on the server

Copy the printed `ssh-ed25519 ...` line and append it to the server account's
`~/.ssh/authorized_keys` (one line). On the server:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAA... YKD@zealos' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

(Getting the key text out of the VM: use the network clipboard -
`ClipCopy` after `SSHKeyShow`, see `Programs/Clip`.)

### 5.3 Use it

```
SSH("192.168.1.10", 22, "root");     // logs in with the key, no password
```

### 5.4 After a reboot

The private key persists on disk, but the in-memory agent does not. Reload it:

```
#include "C:/Home/Net/Programs/SSH/SSH"
SSHKeyLoad;                          // loads C:/Home/Config/SSH/Ed25519.key
```

### 5.5 Other key commands

```
SSHKeyShow;     // reprint the public authorized_keys line for the loaded key
```

---

## 6. Command reference

| Call | What it does |
|------|--------------|
| `SSH(host, port=22, user=NULL)` | Interactive shell. Key auth if loaded, else password. Shift+Esc quits. |
| `SSHRun(host, port, user, pw, cmd)` | Run one command over password auth; print output + exit status. |
| `SSHTransportTest(host, port=22)` | Handshake + cipher smoke test with inline stage logging. |
| `SSHCryptoTest` | SHA-512 + Ed25519 known-answer self-test. |
| `SSHKeyGen` | Generate + save + load an Ed25519 key; print the authorized_keys line. |
| `SSHKeyLoad` | Load the saved key into the agent (do this after a reboot). |
| `SSHKeyShow` | Print the public authorized_keys line for the loaded key. |

---

## 7. Troubleshooting

- **"Transport handshake failed" / stops at ECDH** - usually an algorithm
  mismatch. The client offers `curve25519-sha256` + `chacha20-poly1305` only.
  Very old servers that disable these will drop the connection. Check the
  inline `[ssh]` stage and the Network Log.
- **"Authentication failed"** - wrong password, or the public key isn't in the
  server's `authorized_keys`, or the server disallows the user (e.g. root login
  disabled).
- **Nothing prints / freezes** - the network fetch/handshake blocks the
  terminal; give it a few seconds. If it never returns, the server/port may be
  unreachable (from the QEMU guest, a LAN host is only reachable if the host
  itself can reach it).
- **`SSHCryptoTest` red** - do not use public-key auth; the crypto build is
  wrong. Report it.

---

## 8. What's supported / not

Supported: SSH-2 transport (curve25519-sha256 KEX, chacha20-poly1305 cipher),
password auth, Ed25519 public-key auth, session channels, pty + shell, exec,
and an in-memory key agent.

Not (yet): host-key verification (known_hosts), key passphrases, RSA/ECDSA
keys, agent forwarding, port forwarding, and a full ANSI terminal.
