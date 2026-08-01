#!/usr/bin/env python3
"""Diff the HL1 save serialiser against the structures it serialises.

HLSave.ZC is a positional binary format: the field order in the writer IS the
schema. A field added to CHLEntity or CHLMonState and not added to the writer
is lost silently, and the record length prefix bounds only a skip, so nothing
at runtime notices.

Three things are checked per structure:

  missing   a declared field that neither the writer nor an exemption mentions
  exempt    an exemption naming a field that is written, or one that no longer
            exists in the class
  order     the writer's field sequence against the reader's

The exemption table below is the record of every field deliberately left out
and why. A new field forces an entry in one of the two places.

Companion to hl1-checkorder.py; neither tracks the other's failure mode.
"""

import os
import re
import sys

HL1 = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "src", "Apps", "HL1")

CHECKS = [
    ("CHLEntity",    "HLEnt.ZC",    "HLSaveWriteEntity",  "HLSaveReadEntity"),
    ("CHLMonState",  "HLAI.ZC",     "HLSaveWriteMon",     "HLSaveReadMon"),
    ("CHLCineState", "HLAI.ZC",     "HLSaveWriteCineRow", "HLSaveReadCineRow"),
    ("CHLTalkState", "HLAI.ZC",     "HLSaveWriteTalkRow", "HLSaveReadTalkRow"),
    ("CHLProj",      "HLWeapon.ZC", "HLSaveWriteProj",    "HLSaveReadProj"),
]

# field -> why it is not in the stream. Anything else must be written.
EXEMPT = {
    "CHLEntity": {
        # rebuilt from the entity's own state at restore
        "absmin":            "derived, HLEntSetAbsBox",
        "absmax":            "derived, HLEntSetAbsBox",
        "size":              "derived, HLEntSetAbsBox",
        "mdl":               "cache address, re-resolved by HLEntLoadModels",
        "studio":            "cache address, re-resolved by HLEntLoadModels",
        "spr":               "cache address, re-resolved by HLEntLoadModels",

        # only writer is KeyValue or Spawn, both of which re-run before the
        # restore pours over them
        "pose":              "map key, spawn pass",
        "weapons":           "map key, spawn pass",
        "damage_type":       "map key, spawn pass",
        "material":          "map key, spawn pass",
        "spawn_object":      "map key, spawn pass",
        "item_type":         "map key, spawn pass",
        "locked_snd":        "map key, spawn pass",
        "unlocked_snd":      "map key, spawn pass",
        "locked_sentence":   "map key, spawn pass",
        "unlocked_sentence": "map key, spawn pass",
        "beam_frame":        "map key, spawn pass",
        "beam_noise":        "map key, spawn pass",
        "beam_scroll":       "map key, spawn pass",
        "text_color":        "map key, spawn pass",
        "text_color2":       "map key, spawn pass",
        "preset":            "map key, spawn pass",
        "rot_amount":        "map key, spawn pass",
        "revert_message_time": "map key, spawn pass",
        "revert_load_time":  "map key, spawn pass",
        "push_friction":     "map key, spawn pass",
        "push_buoyancy":     "map key, spawn pass",
        "fan_friction":      "map key, spawn pass",
        "fan_atten":         "map key, spawn pass",
        "cam_accel":         "map key, spawn pass",
        "cam_decel":         "map key, spawn pass",
        "cam_moveto":        "map key, spawn pass",
        "track_top":         "map key, spawn pass",
        "track_bottom":      "map key, spawn pass",
        "track_train":       "map key, spawn pass",
        "global_name":       "map key, spawn pass",
        "ai_sentence":       "map key, spawn pass",
        "ai_listener":       "map key, spawn pass",
        "ai_refire":         "map key, spawn pass",
        "ai_atten":          "map key, spawn pass",
        "amb_pitch":         "map key, spawn pass",
        "amb_pitchstart":    "map key, spawn pass",
        "amb_spinup":        "map key, spawn pass",
        "amb_spindown":      "map key, spawn pass",
        "amb_volstart":      "map key, spawn pass",
        "amb_lfotype":       "map key, spawn pass",
        "amb_lforate":       "map key, spawn pass",
        "amb_lfomodpitch":   "map key, spawn pass",
        "amb_lfomodvol":     "map key, spawn pass",
        "amb_cspinup":       "map key, spawn pass",

        # derived at spawn from a key that is itself re-read; the derivation
        # re-runs
        "train_speed":       "derived at spawn from the speed key",
        "train_length":      "derived at spawn from the wheels key",
        "push_max_speed":    "derived at spawn from push_friction",

        # locksound_t debounce, dropped because CBaseDoor::m_SaveData drops it,
        # doors.cpp:80-90
        "lock_wait_snd":     "locksound_t debounce, dropped by the SDK too",
        "lock_wait_sent":    "locksound_t debounce, dropped by the SDK too",
        "lock_sent_ord":     "sentence cursor, restarts at the group head",
        "unlock_sent_ord":   "sentence cursor, restarts at the group head",
        "lock_sent_eof":     "sentence cursor, restarts at the group head",
        "unlock_sent_eof":   "sentence cursor, restarts at the group head",

        # R_LightPoint cache; light_valid comes back FALSE from the spawn pass
        # and the next draw re-samples
        "light_org":         "R_LightPoint cache, re-sampled",
        "light_value":       "R_LightPoint cache, re-sampled",
        "light_style":       "R_LightPoint cache, re-sampled",
        "light_style_val":   "R_LightPoint cache, re-sampled",
        "light_dlit":        "R_LightPoint cache, re-sampled",
        "light_valid":       "R_LightPoint cache, re-sampled",
    },
    "CHLMonState": {},
    "CHLCineState": {},
    "CHLTalkState": {},
    "CHLProj": {
        "next_puff": "rocket trail cadence, on the render clock",
    },
}

TYPES = ("U0", "U8", "I8", "U16", "I16", "U32", "I32", "U64", "I64",
         "F64", "Bool")


def strip(src):
    """Blank out comments, strings and char literals, keeping every offset."""
    out = []
    i = 0
    n = len(src)
    while i < n:
        c = src[i]
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            while i < n and src[i] != "\n":
                out.append(" ")
                i += 1
        elif c == "/" and i + 1 < n and src[i + 1] == "*":
            out.append("  ")
            i += 2
            while i + 1 < n and not (src[i] == "*" and src[i + 1] == "/"):
                out.append("\n" if src[i] == "\n" else " ")
                i += 1
            out.append("  ")
            i = min(i + 2, n)
        elif c in "\"'":
            q = c
            out.append(" ")
            i += 1
            while i < n and src[i] != q:
                if src[i] == "\\":
                    out.append(" ")
                    i += 1
                    if i < n:
                        out.append("\n" if src[i] == "\n" else " ")
                        i += 1
                    continue
                out.append("\n" if src[i] == "\n" else " ")
                i += 1
            out.append(" ")
            i += 1
        else:
            out.append(c)
            i += 1
    return "".join(out)


FIELD_RE = re.compile(
    r"^\s*([A-Za-z_]\w*)\s+\**\s*([a-z_]\w*)\s*(\[[^;\]]*\])?\s*;")


def class_fields(path, name):
    src = strip(open(path, encoding="utf-8", errors="replace").read())
    m = re.search(r"^class\s+%s\s*$" % re.escape(name), src, re.M)
    if not m:
        sys.exit("%s: class %s not found" % (path, name))

    i = src.index("{", m.end())
    depth = 0
    j = i
    while j < len(src):
        if src[j] == "{":
            depth += 1
        elif src[j] == "}":
            depth -= 1
            if depth == 0:
                break
        j += 1

    fields = []
    for line in src[i + 1:j].split("\n"):
        fm = FIELD_RE.match(line)
        if fm and fm.group(1) in TYPES or (fm and fm.group(1).startswith("CHL")):
            fields.append(fm.group(2))
    return fields


def func_body(src, name):
    """Body text and the name of the row pointer parameter."""
    m = re.search(r"^[A-Za-z_]\w*\s+\**%s\s*\(([^)]*)\)" % re.escape(name),
                  src, re.M)
    if not m:
        return None, None
    arg = re.findall(r"\*\s*([A-Za-z_]\w*)", m.group(1))
    i = src.index("{", m.end())
    depth = 0
    j = i
    while j < len(src):
        if src[j] == "{":
            depth += 1
        elif src[j] == "}":
            depth -= 1
            if depth == 0:
                break
        j += 1
    return src[i + 1:j], (arg[0] if arg else None)


ACCESS_RE = re.compile(r"(?:->|\.)([a-z_]\w*)")


def accesses(body, fields):
    """Field names touched, in source order, duplicates collapsed to the run."""
    seq = []
    known = set(fields)
    for m in ACCESS_RE.finditer(body):
        f = m.group(1)
        if f in known and (not seq or seq[-1] != f):
            seq.append(f)
    return seq


def brace_check(path):
    src = strip(open(path, encoding="utf-8", errors="replace").read())
    depth = 0
    line = 1
    worst = 0
    for c in src:
        if c == "\n":
            line += 1
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth < 0 and worst == 0:
                worst = line
    return depth, worst


def main():
    save = strip(open(os.path.join(HL1, "HLSave.ZC"),
                      encoding="utf-8", errors="replace").read())
    bad = 0

    for cls, cfile, wname, rname in CHECKS:
        fields = class_fields(os.path.join(HL1, cfile), cls)
        wbody, warg = func_body(save, wname)
        rbody, rarg = func_body(save, rname)

        if wbody is None or rbody is None:
            print("%-13s FAIL  %s missing from HLSave.ZC"
                  % (cls, wname if wbody is None else rname))
            bad += 1
            continue

        ex = EXEMPT.get(cls, {})

        # an exempt field the reader clears by hand - the cache pointers
        # HLSaveReadEntity drops on a model change - is not part of either walk
        walked = [f for f in fields if f not in ex]
        wseq = accesses(wbody, walked)
        rseq = accesses(rbody, walked)
        written = set(wseq)

        # the stale test needs the writer's untrimmed reach: an exempt field is
        # not in `walked`, so `written` can never contradict its exemption
        wall = set(accesses(wbody, fields))

        missing = [f for f in walked if f not in written]
        stale = [f for f in ex if f in wall]
        ghost = [f for f in ex if f not in fields]
        unread = [f for f in wseq if f not in set(rseq)]

        # a field dropped from the class while the serialiser still names it.
        # Not caught by the walks above, which only see declared names
        gone = []
        for arg, body, fn in ((warg, wbody, wname), (rarg, rbody, rname)):
            if not arg:
                continue
            for f in re.findall(r"\b%s->(\w+)" % re.escape(arg), body):
                if f not in fields and (fn, f) not in gone:
                    gone.append((fn, f))

        for fn, f in gone:
            print("%s: %s->%s is not a field of %s" % (fn, arg, f, cls))

        for f in missing:
            print("%s.%s: written by neither the serialiser nor the exemption "
                  "table" % (cls, f))
        for f in stale:
            print("%s.%s: exempt but written; drop the exemption" % (cls, f))
        for f in ghost:
            print("%s.%s: exempt but no longer declared" % (cls, f))
        for f in unread:
            print("%s.%s: written, never read" % (cls, f))

        if wseq != rseq and not unread:
            for k, (a, b) in enumerate(zip(wseq, rseq)):
                if a != b:
                    print("%s: writer/reader diverge at field %d, writer has "
                          "%s, reader has %s" % (cls, k, a, b))
                    break
            else:
                print("%s: writer has %d fields, reader %d"
                      % (cls, len(wseq), len(rseq)))

        n = len(missing) + len(stale) + len(ghost) + len(unread) + len(gone)
        if wseq != rseq:
            n += 1
        bad += n

        print("%-13s %3d declared  %3d saved  %3d exempt  %d problem(s)"
              % (cls, len(fields), len(written), len(ex), n))

    for f in ("HLSave.ZC", "HLTest.ZC"):
        depth, worst = brace_check(os.path.join(HL1, f))
        print("%-13s brace depth %d%s"
              % (f, depth, "" if worst == 0 else " (went negative at line %d)"
                 % worst))
        if depth or worst:
            bad += 1

    print("\n%d problem(s)" % bad)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
