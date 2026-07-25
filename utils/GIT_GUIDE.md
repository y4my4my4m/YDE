# YKD Git Client - User Guide

A git client for ZealOS/YKD. Clones repositories two ways:

- **over HTTPS** (`GitClone`) - uses the TLS/HTTP stack, no auth needed for
  public repos.
- **over SSH** (`GitCloneSSH`) - uses the SSH client + your Ed25519 key, like
  `git clone git@host:repo.git`.

It fetches the packfile, inflates and delta-resolves the objects, and writes
the working tree to disk. It does **not** create a `.git` directory or loose
objects (ZealOS has no DEFLATE encoder) - you get the checked-out files.

---

## 1. Prerequisites

- Network stack up (an IP such as `10.0.2.15` in the Network Report).
- Load the client:

```
#include "C:/Home/Net/Programs/Git/Git"
```

This pulls in SHA-1, the smart-HTTP protocol, and the packfile unpacker.

Optionally validate SHA-1 first:

```
SHA1Test;        // GREEN = object naming is sound
```

---

## 2. List remote refs

The lightest operation - good for checking connectivity and that a repo is
reachable:

```
GitLsRemote("https://github.com/octocat/Hello-World");
```

Prints each `<sha>  <refname>` and a count.

---

## 3. Clone over HTTPS

```
GitClone("https://github.com/octocat/Hello-World");
```

- Clones into **`<current dir>/<repo-name>`** by default (the repo name is
  taken from the URL, `.git` stripped). Use `Cd("::/Home");` first to control
  where it lands.
- Pass a second argument for an explicit target directory:

```
GitClone("https://host/user/repo", "::/Home/myrepo");
```

Behavior:
- If the target directory already exists, you get a **No/Yes prompt** before it
  writes into it.
- Each file prints as it's written; large packs show periodic progress.
- Press **Esc** during unpack/checkout to **cancel** (the network fetch itself
  is not cancellable yet).

### Debug helper

Save just the raw packfile without unpacking:

```
GitFetchToFile("https://host/user/repo", "::/Tmp/repo.pack");
```

---

## 4. Clone over SSH

This works like `git clone git@host:repo.git` and uses your **Ed25519 key**
(no password). You must set the key up first - see §5.

### 4.1 Load the SSH + git + bridge modules

`GitCloneSSH` bridges the SSH client and the git code, so both must be loaded,
then the bridge:

```
#include "C:/Home/Net/Programs/SSH/SSH"
#include "C:/Home/Net/Programs/Git/Git"
#include "C:/Home/Net/Programs/Git/GitSSH"
```

### 4.2 Clone

`GitCloneSSH` does **not** take a `git@host:repo` URL string - split it into
`(host, port, user, repo)`:

```
# normal git:  git clone git@github.com:username/repository.git
#              └user┘ └────host────┘ └───────repo────────┘
SSHKeyLoad;   // load your key (once per boot)
GitCloneSSH("github.com", 22, "git", "username/repository.git");
```

Same idea for a LAN box / self-hosted forge:

```
# git clone git@192.168.1.10:user/repo.git
GitCloneSSH("192.168.1.10", 22, "git", "user/repo.git");
```

Arguments:

```
GitCloneSSH(host, port, user, repo, dir=NULL, password=NULL)
```

| URL piece | Arg | Example |
|-----------|-----|---------|
| after `@`, before `:` | `host` | `github.com` |
| (always 22 unless custom) | `port` | `22` |
| before `@` | `user` | `git` |
| after `:` | `repo` | `y4my4my4m/procpixel.git` |

- `user` - the SSH login (almost always `git` on GitHub/gitea; sometimes
  `root` on a homemade server).
- `repo` - the **server-side path** to the bare repository: GitHub-style
  `owner/name.git`, or an absolute path like `/srv/git/project.git`. Not a
  full URL.
- `dir` - target directory (default `<cwd>/<repo-name>`).
- `password` - optional; only needed if you have **no** key on the server.

Password fallback (no key):

```
GitCloneSSH("192.168.1.10", 22, "root", "/srv/repo.git", NULL, "PASSWORD");
```

The overwrite prompt, per-file progress, and Esc-cancel all work the same as
the HTTPS clone.

---

## 5. Setting up key auth (for `GitCloneSSH`)

Public-key auth is shared with the SSH client. Full details are in
`Programs/SSH/GUIDE.md` §5. The short version:

```
#include "C:/Home/Net/Programs/SSH/SSH"
SSHKeyGen;          // generates the key, prints the authorized_keys line
```

Copy the printed `ssh-ed25519 AAAA... YKD@zealos` line onto the git server:

```bash
# on the server, for the account you clone as (e.g. 'git' or 'root')
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAA... YKD@zealos' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

After that, `GitCloneSSH` (and `SSH`) log in with the key automatically. After
a reboot, run `SSHKeyLoad;` once to reload the key into memory.

> Tip: to get the key text out of the VM, use the network clipboard
> (`Programs/Clip`): run `SSHKeyShow;` then `ClipCopy(...)`, or just read it off
> the screen.

---

## 6. Command reference

| Call | What it does |
|------|--------------|
| `GitLsRemote(url)` | List a remote's refs over HTTPS. |
| `GitClone(url, dir=NULL)` | Full clone over HTTPS into `<cwd>/<repo>` or `dir`. |
| `GitFetchToFile(url, path)` | Debug: fetch + save the raw packfile. |
| `GitCloneSSH(host, port, user, repo, dir=NULL, password=NULL)` | Clone over SSH (key auth; password optional). |
| `SHA1Test` | SHA-1 known-answer self-test. |

---

## 7. Notes & limitations

- **Read-only clone.** No `push`, no commit, no `.git` metadata - you get the
  working tree of the default branch (`HEAD`).
- **Default branch only.** It fetches whatever `HEAD` points to.
- **GitHub over HTTPS** sometimes gates on a `git/` User-Agent. If `GitLsRemote`
  returns nothing against GitHub, try a **gitea** or **cgit** host, or your own
  server.
- **git-over-SSH** requires `git-upload-pack` on the server `PATH` (standard
  with any git install) and read access to the repo.
- Big repositories: the network fetch and delta resolution can take a while;
  progress prints during unpack/checkout, and Esc cancels those phases.
- The working tree is written directly - existing files in the target are
  overwritten (you're warned if the directory already exists).

---

## 8. End-to-end example

```
// one-time: make a key and install it on the server (see §5)
#include "C:/Home/Net/Programs/SSH/SSH"
SSHKeyGen;      // paste the printed line into the server's authorized_keys

// clone over SSH
#include "C:/Home/Net/Programs/Git/Git"
#include "C:/Home/Net/Programs/Git/GitSSH"
Cd("::/Home");;
// like: git clone git@github.com:y4my4my4m/procpixel.git
GitCloneSSH("github.com", 22, "git", "y4my4my4m/procpixel.git");
Dir("::/Home/procpixel");

// or clone a public repo over HTTPS
GitClone("https://gitea.example.com/user/project");
```
