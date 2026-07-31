#!/usr/bin/env python3
"""Single-pass declaration-order check for the HL1 ZealC tree.

ZealC compiles in one pass, so every symbol must be DECLARED before it is
USED - across files (in Run.ZC include order) and within a file (by line).
Getting this wrong produces errors that point at the use site and say nothing
about the declaration, e.g.

    Undefined identifier at "[" HLPak.ZC,117

Forward declarations are not a workaround: see the note at the top of
HLPhys.ZC, routing a call through one miscompiles on this compiler.

Run from anywhere:  python3 utils/hl1-checkorder.py
"""

import os
import re
import sys

APP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       '..', 'src', 'Apps', 'HL1')

DECL_PATTERNS = [
    # U0 HLFoo(...), CHLBar *HLBaz(...)
    r'^(?:U0|I0|I64|F64|U8|U16|U32|I32|Bool|CHL\w+)\s*\*?\s*(HL\w+)\s*\(',
    # class CHLFoo
    r'^class\s+(CHL\w+)',
    # globals: U8 hl_foo[..]  /  I64 hl_bar = 0;
    r'^\s*(?:U0|I64|F64|U8|U16|U32|I32|Bool|CHL\w+)\s*\*?\s*(hl_\w+)\s*[\[=;]',
    r'^#define\s+(HL\w+)',
]

USE_RE = re.compile(r'\b(HL[A-Z]\w*|CHL[A-Z]\w*|hl_\w+)\b')

# A declaration indented two tabs or more is inside a nested block. Scalars
# there are fine - the Quake port has them and compiles - but a CLASS-TYPED
# one crashes the compiler in ParseGlobalVarList with a NULL class pointer:
#
#     Fault: 0x0E Page Fault ... Fault Addr: FFFFFFFFFFFFFF8A
#
# Hoist those to the top of the function.
# HolyC has NO `continue` statement. The Quake port's only occurrences of the
# word are inside strings and comments; the kernel has none at all. It compiles
# as an undefined identifier:
#
#     ParseIf ERROR: Undefined identifier at ";"
#
# Use a label at the end of the loop body, which is this tree's existing idiom.
CONTINUE_RE = re.compile(r'^\s*continue\s*;')

NESTED_RE = re.compile(
    r'^\t{2,}(U0|I0|I64|F64|U8|U16|U32|I32|Bool|CHL\w+)\s+\*?\w+\s*[;=,\[]')


def strip_noise(src):
    """Blank out strings and // comments, preserving line numbering."""
    out = []
    for line in src.split('\n'):
        line = re.sub(r'"(\\.|[^"\\])*"', '""', line)
        i = line.find('//')
        if i >= 0:
            line = line[:i]
        out.append(line)
    return out


def main():
    if os.path.exists(os.path.join(APP_DIR, 'RunLib.ZC')):
        os.chdir(APP_DIR)
    elif not os.path.exists('RunLib.ZC'):
        print('cannot find src/Apps/HL1/RunLib.ZC', file=sys.stderr)
        return 2

    # RunLib.ZC builds the engine, Run.ZC then builds the shell on top. The
    # effective single-pass order is the concatenation of the two.
    order = []
    for script in ('RunLib.ZC', 'Run.ZC'):
        if not os.path.exists(script):
            continue
        for l in open(script):
            if l.startswith('#include "HL'):
                name = l.split('"')[1]
                if name not in order:
                    order.append(name)

    # symbol -> (file index, line number) of its declaration
    declared = {}
    lines = {}

    for fi, name in enumerate(order):
        path = name + '.ZC'
        if not os.path.exists(path):
            print('  missing include target: %s' % path)
            continue

        lines[name] = strip_noise(open(path).read())

        for ln, line in enumerate(lines[name], 1):
            for pat in DECL_PATTERNS:
                m = re.match(pat, line)
                if m and m.group(1) not in declared:
                    declared[m.group(1)] = (fi, ln)

    bad = 0
    for fi, name in enumerate(order):
        if name not in lines:
            continue

        for ln, line in enumerate(lines[name], 1):
            for sym in USE_RE.findall(line):
                if sym not in declared:
                    continue

                dfi, dln = declared[sym]

                # the declaration line itself is not a use
                if dfi == fi and dln == ln:
                    continue

                if dfi > fi:
                    print('  %s:%d uses %s -> declared later in %s'
                          % (name, ln, sym, order[dfi]))
                    bad += 1
                elif dfi == fi and dln > ln:
                    print('  %s:%d uses %s -> declared below at line %d'
                          % (name, ln, sym, dln))
                    bad += 1

    # Globals that are never assigned outside their own declaration.
    #
    # ZealC does not honour a declaration initialiser on a global, and globals
    # are not zeroed, so `Bool x = TRUE;` with no runtime assignment is
    # whatever was in memory. This has caused: a garbage game root that made
    # every file lookup fail, garbage display ramps that turned the frame to
    # noise, a garbage master volume, and a garbage sprite table that GP
    # faulted inside HLSprFree.
    GLOBAL_RE = re.compile(
        r'^(?:U0|I0|I64|F64|U8|U16|U32|I32|Bool|CHL\w+)\s*\*?\s*'
        r'(hl_\w+)\s*(\[[^\]]*\])?\s*(=)?')

    declared_globals = {}
    for name in order:
        if name not in lines:
            continue
        for ln, line in enumerate(lines[name], 1):
            m = GLOBAL_RE.match(line)
            if m and m.group(1) not in declared_globals:
                declared_globals[m.group(1)] = (name, ln, bool(m.group(3)))

    # ADVISORY ONLY, not a gate. 29 of these are inherited from the Quake
    # port and that tree works - hl_res_w[] = {320, 400, ...} among them - so
    # ZealC clearly honours at least array initialisers. Worth eyeballing when
    # a global behaves as though it were never set, not worth failing on.
    advisory = []
    for g, (f, ln, has_init) in sorted(declared_globals.items()):
        assigned = False
        for name in order:
            if name not in lines:
                continue
            for j, line in enumerate(lines[name], 1):
                if name == f and j == ln:
                    continue
                if re.search(r'\b' + g + r'\s*(\[[^\]]*\])?\s*(\.|->)?\w*\s*=[^=]',
                             line) or \
                   re.search(r'(MemSet|MemCopy|HLVecSet|HLStrCopy|HLRdName)'
                             r'\s*\(\s*&?' + g, line):
                    assigned = True
                    break
            if assigned:
                break

        # Only flag globals that CARRY an initialiser. A scratch buffer with
        # no initialiser is fine - it is written before it is read, and the
        # author knew that. `Bool x = TRUE;` that is never assigned is the
        # dangerous shape: it reads as deliberate and is not.
        if not assigned and has_init:
            advisory.append('  %s:%d %s' % (f, ln, g))

    # `continue` statements
    conts = 0
    for name in order:
        if name not in lines:
            continue
        for ln, line in enumerate(lines[name], 1):
            if CONTINUE_RE.match(line):
                print('  %s:%d `continue` - HolyC has no such statement, '
                      'use a goto label at the end of the loop body'
                      % (name, ln))
                conts += 1

    # nested class-typed declarations
    nested = 0
    for name in order:
        if name not in lines:
            continue
        for ln, line in enumerate(lines[name], 1):
            m = NESTED_RE.match(line)
            if m and m.group(1).startswith('CHL'):
                print('  %s:%d declares %s inside a nested block - hoist it'
                      % (name, ln, m.group(1)))
                nested += 1

    # undefined HL* calls
    #
    # An undefined identifier stops the compiler at that file, so every later
    # file in the include list never compiles and reports its own cascade of
    # errors. The real fault is always the first one.
    #
    # Definitions are matched loosely on "<type> HLName(" at column 0. Anything
    # never defined anywhere and never seen as a #define is reported.
    defined = set()
    macros = set()
    call_re = re.compile(r'\b(HL[A-Za-z0-9_]+)\s*\(')
    def_re = re.compile(r'^[A-Za-z_][A-Za-z0-9_ \t\*]*?\b(HL[A-Za-z0-9_]+)\s*\(')
    mac_re = re.compile(r'^\s*#define\s+(HL[A-Za-z0-9_]+)')

    for name in order:
        if name not in lines:
            continue
        for line in lines[name]:
            m = def_re.match(line)
            if m:
                defined.add(m.group(1))
            m = mac_re.match(line)
            if m:
                macros.add(m.group(1))

    undef = 0
    for name in order:
        if name not in lines:
            continue
        for ln, line in enumerate(lines[name], 1):
            code = line.split('//', 1)[0]
            for m in call_re.finditer(code):
                sym = m.group(1)
                if sym in defined or sym in macros:
                    continue
                print('  %s:%d calls %s, which is defined nowhere'
                      % (name, ln, sym))
                undef += 1

    # undefined constants and globals
    #
    # A deletion pass that removes a #define or a global while a consumer
    # survives leaves every counter above at 0 - the undefined-call check only
    # matches an identifier followed by "(". HLBEAM_LIGHT went that way.
    all_macros = set()
    mac_any_re = re.compile(r'^\s*#define\s+([A-Za-z_][A-Za-z0-9_]*)')
    # plain globals and the U0 (*name)(args) function-pointer hook form
    glob_re = re.compile(r'^\s*(?:extern\s+|public\s+)*'
                         r'(?:U0|I8|U8|I16|U16|I32|U32|I64|U64|F64|Bool|'
                         r'C[A-Za-z0-9_]+)\s*\(?\**\s*([a-z_][A-Za-z0-9_]*)')
    declared_syms = set()

    for name in order:
        if name not in lines:
            continue
        for line in lines[name]:
            m = mac_any_re.match(line)
            if m:
                all_macros.add(m.group(1))
            m = glob_re.match(line)
            if m:
                declared_syms.add(m.group(1))

    # locals and parameters are declared with leading whitespace, which the
    # global pattern above rejects, so collect them separately and forgive them
    local_re = re.compile(r'^\s+(?:U0|I8|U8|I16|U16|I32|U32|I64|U64|F64|Bool|'
                          r'C[A-Za-z0-9_]+)\s*\**\s*([a-z_][A-Za-z0-9_]*)')
    for name in order:
        if name not in lines:
            continue
        for line in lines[name]:
            m = local_re.match(line)
            if m:
                declared_syms.add(m.group(1))

    const_use_re = re.compile(r'\b(HL[A-Z][A-Z0-9_]*)\b(?!\s*\()')
    glob_use_re = re.compile(r'\b(hl_[a-z0-9_]+)\b')

    undef_sym = 0
    for name in order:
        if name not in lines:
            continue
        for ln, line in enumerate(lines[name], 1):
            code = line.split('//', 1)[0]
            if code.lstrip().startswith('#define'):
                continue
            for m in const_use_re.finditer(code):
                sym = m.group(1)
                if sym in all_macros or sym in defined:
                    continue
                print('  %s:%d uses %s, which is #defined nowhere'
                      % (name, ln, sym))
                undef_sym += 1
            for m in glob_use_re.finditer(code):
                sym = m.group(1)
                if sym in declared_syms or sym in all_macros:
                    continue
                print('  %s:%d uses %s, which is declared nowhere'
                      % (name, ln, sym))
                undef_sym += 1

    # duplicate global declarations across files
    #
    # ZealC binds each reference to the most recent declaration, so a name
    # declared in two files is TWO variables: writers in later files miss
    # readers in earlier ones. hl_map_name was declared in HLBSP.ZC and again
    # as HLMenu.ZC's chapter list; the shell wrote the menu's copy and the AI
    # read HLBSP's, which held junk - the node graph never loaded once.
    decl_re = re.compile(r'^(?:U0|I8|U8|I16|U16|I32|U32|I64|U64|F64|Bool|'
                         r'C[A-Za-z0-9_]+)\s*\(?\**\s*(hl_[a-z0-9_]+)')
    decl_where = {}
    dup_globals = 0
    for name in order:
        if name not in lines:
            continue
        for ln, line in enumerate(lines[name], 1):
            m = decl_re.match(line)
            if not m:
                continue
            g = m.group(1)
            if g in decl_where and decl_where[g][0] != name:
                print('  %s:%d re-declares %s, first declared %s:%d - '
                      'two variables, split readers and writers'
                      % (name, ln, g, decl_where[g][0], decl_where[g][1]))
                dup_globals += 1
            elif g not in decl_where:
                decl_where[g] = (name, ln)

    if os.environ.get('HL1_ADVISORY') and advisory:
        print('advisory - globals with an unreassigned initialiser:')
        for a in advisory:
            print(a)

    print('order violations: %d, nested class declarations: %d, '
          'continue statements: %d, undefined calls: %d, '
          'undefined symbols: %d, duplicate globals: %d '
          '(%d advisory, set HL1_ADVISORY=1 to list)'
          % (bad, nested, conts, undef, undef_sym, dup_globals, len(advisory)))
    return 1 if (bad or nested or conts or undef or undef_sym or dup_globals) else 0


if __name__ == '__main__':
    sys.exit(main())
