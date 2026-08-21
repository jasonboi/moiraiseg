from __future__ import annotations

import os
import subprocess
import sys
import unittest
from pathlib import Path


class CliEncodingTests(unittest.TestCase):
    def test_help_does_not_crash_with_limited_console_encoding(self) -> None:
        environment = os.environ.copy()
        environment["PYTHONIOENCODING"] = "cp1252"

        result = subprocess.run(
            [sys.executable, str(Path(__file__).parents[1] / "moiraiseg.py"), "--help"],
            env=environment,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )

        self.assertEqual(
            result.returncode,
            0,
            result.stderr.decode("ascii", errors="backslashreplace"),
        )
        help_text = result.stdout.decode("utf-8")
        self.assertIn("MoiraiSeg 二维影像序列分割工作台", help_text)


if __name__ == "__main__":
    unittest.main()
