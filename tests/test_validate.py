import importlib.util, json, shutil, tempfile, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('validate',ROOT/'scripts/validate.py')
mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)

class ValidateTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)
        for d in ('skills','.claude-plugin','scripts','docs'):
            shutil.copytree(ROOT/d,self.root/d)
    def tearDown(self): self.tmp.cleanup()
    def test_catalog_is_valid(self): self.assertEqual(mod.validate(self.root),[])
    def test_bad_name_fails(self):
        p=self.root/'skills/combat-security/SKILL.md'; p.write_text(p.read_text().replace('name: combat-security','name: BAD_NAME'))
        self.assertTrue(mod.validate(self.root))
    def test_missing_plugin_skill_fails(self):
        p=self.root/'.claude-plugin/marketplace.json'; data=json.loads(p.read_text()); data['plugins'][0]['skills'].append('./skills/missing'); p.write_text(json.dumps(data))
        self.assertTrue(mod.validate(self.root))
    def test_missing_router_entry_fails(self):
        p=self.root/'skills/security-router/SKILL.md'; p.write_text(p.read_text().replace('`combat-security`','combat-security'))
        self.assertTrue(mod.validate(self.root))
    def test_missing_reference_fails(self):
        p=self.root/'skills/combat-security/SKILL.md'; p.write_text(p.read_text()+'\nRead `references/not-found.md`.\n')
        self.assertTrue(mod.validate(self.root))
    def test_missing_script_reference_fails(self):
        p=self.root/'skills/combat-security/SKILL.md'; p.write_text(p.read_text()+'\nRun `scripts/not-found.py`.\n')
        self.assertTrue(mod.validate(self.root))
    def test_duplicate_marketplace_skill_fails(self):
        p=self.root/'.claude-plugin/marketplace.json'; data=json.loads(p.read_text())
        data['plugins'][2]['skills'].append('./skills/godot-security')
        p.write_text(json.dumps(data))
        self.assertTrue(mod.validate(self.root))
if __name__=='__main__': unittest.main()
