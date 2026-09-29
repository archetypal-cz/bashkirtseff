"""Tests for the source-completeness report name. Run: just test-rebuild-plan"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from paths import report_path  # noqa: E402


class ReportPath(unittest.TestCase):
    def test_same_day_rerun_overwrites_unless_keep(self):
        with tempfile.TemporaryDirectory() as d:
            reports = Path(d)
            first = report_path(reports, '2026-09-29', keep=False)
            self.assertEqual(first.name, 'source-completeness-2026-09-29.md')
            first.write_text('x')
            self.assertEqual(report_path(reports, '2026-09-29', keep=False), first)
            self.assertEqual(report_path(reports, '2026-09-29', keep=True).name, 'source-completeness-2026-09-29-2.md')


if __name__ == '__main__':
    unittest.main()
