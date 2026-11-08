#!/usr/bin/env python3
"""Validate repository-local skill and marketplace structure (no dependencies)."""
import json, re, sys
from pathlib import Path

NAME = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")

def validate(root):
    root = Path(root); errors=[]; names=set()
    skill_root = root / "skills"
    paths = sorted(skill_root.glob("*/SKILL.md"))
    if not paths: errors.append("No skills found")
    for path in paths:
        folder=path.parent.name
        try:
            text=path.read_text(encoding="utf-8")
            parts=text.split("---", 2)
            if len(parts)!=3 or parts[0].strip(): raise ValueError("invalid frontmatter fences")
            meta={}
            for line in parts[1].strip().splitlines():
                key, val=line.split(":", 1); meta[key.strip()]=val.strip()
            if set(meta)!={"name","description"}: raise ValueError("expected name and description")
            name=meta["name"]
            if name != folder or not NAME.fullmatch(name) or len(name)>64: raise ValueError("invalid name/folder")
            if name in names: raise ValueError("duplicate name")
            names.add(name)
            description=json.loads(meta["description"])
            if not isinstance(description,str) or not (0<len(description)<=1024): raise ValueError("invalid description")
            if len(parts[2].strip()) < 100: raise ValueError("empty or very short body")
            for rel in re.findall(r"`(references/[^`]+)`",parts[2]):
                target=(path.parent / rel).resolve()
                if not target.is_relative_to(path.parent.resolve()) or not target.is_file(): raise ValueError("missing/unsafe reference "+rel)
        except Exception as e: errors.append(str(path.relative_to(root))+": "+str(e))
    try:
        for base in ("skills", "docs"):
            base_dir = root / base
            if not base_dir.is_dir(): continue
            for f in base_dir.rglob("*.md"):
                for rel in re.findall(r"`(scripts/[^`]+)`", f.read_text(encoding="utf-8")):
                    target=(root / rel).resolve()
                    if not target.is_relative_to(root.resolve()) or not target.is_file():
                        raise ValueError("missing/unsafe script reference "+rel)
    except Exception as e: errors.append("script references: "+str(e))
    try:
        manifest=json.loads((root/'.claude-plugin/marketplace.json').read_text(encoding='utf-8'))
        if not manifest.get('name') or not manifest.get('owner',{}).get('name'): raise ValueError('missing marketplace name or owner')
        plugins=manifest['plugins']; plugin_names=set()
        if not plugins: raise ValueError('no plugins')
        for p in plugins:
            if not p.get('name') or p['name'] in plugin_names: raise ValueError('missing or duplicate plugin name')
            plugin_names.add(p['name'])
            if p.get('source') != './' or p.get('strict') is not False: raise ValueError('unsupported source/strict in '+p['name'])
            seen=set()
            for rel in p.get('skills',[]):
                if rel in seen: raise ValueError('duplicate skill '+rel+' in '+p['name'])
                seen.add(rel)
                target=(root / rel).resolve()
                if not target.is_relative_to(root.resolve()) or not (target/'SKILL.md').is_file(): raise ValueError('invalid skill path '+rel)
        all_plugin=next(p for p in plugins if p['name']=='game-security')
        covered={Path(p).name for p in all_plugin['skills']}
        if covered != names: raise ValueError('all-skills plugin coverage mismatch')
        router=(root/'skills/security-router/SKILL.md').read_text()
        missing=[n for n in names if n!='security-router' and ('`'+n+'`') not in router]
        if missing: raise ValueError('router missing: '+', '.join(missing))
    except Exception as e: errors.append('marketplace/router: '+str(e))
    return errors

if __name__=='__main__':
    root=Path(__file__).resolve().parent.parent
    errors=validate(root)
    if errors:
        print('\n'.join('ERROR: '+e for e in errors)); sys.exit(1)
    print('OK: validated skill frontmatter, names, router coverage, marketplace paths, script references')
