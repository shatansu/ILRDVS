"""
PP-Structure adapter that preserves real table cells, merged-cell spans,
and produces a Khata-centric hierarchical JSON output.

Output format for tables:
  {
    "headers": [...],
    "rows": [...],        // raw row dicts
    "merged_cells": [...],
    "khata_hierarchy": [  // hierarchical Khata-centric view
      {
        "khata_no": "45",
        "owners": [
          {
            "name": "Ram Singh",
            "father_name": "Shiv Prasad",
            "survey_numbers": ["127/2", "128/1"],
            "area": "2.50 Acre",
            "share": "1/2"
          }
        ]
      }
    ]
  }
"""

from __future__ import annotations

from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from thefuzz import fuzz
except ImportError:
    from difflib import SequenceMatcher

    class _FallbackFuzz:
        @staticmethod
        def partial_ratio(left: str, right: str) -> int:
            return int(SequenceMatcher(None, left, right).ratio() * 100)

    fuzz = _FallbackFuzz()  # type: ignore[assignment]


@dataclass
class TableStructureResult:
    headers: List[str] = field(default_factory=list)
    rows: List[Dict[str, Dict[str, Any]]] = field(default_factory=list)
    merged_cells: List[Dict[str, int]] = field(default_factory=list)
    raw_html: str = ""
    structured_json: Dict[str, Any] = field(default_factory=dict)


# ─── HTML Table Parser ────────────────────────────────────────────────────────

class _TableHTMLParser(HTMLParser):
    """Parses the HTML table output from PP-StructureV3."""

    def __init__(self) -> None:
        super().__init__()
        self.rows: List[List[Dict[str, Any]]] = []
        self._row: List[Dict[str, Any]] = []
        self._cell: Optional[Dict[str, Any]] = None

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag == "tr":
            self._row = []
        elif tag in {"td", "th"}:
            attributes = dict(attrs)
            self._cell = {
                "text": "",
                "is_header": tag == "th",
                "row_span": int(attributes.get("rowspan", "1")),
                "col_span": int(attributes.get("colspan", "1")),
            }

    def handle_data(self, data: str) -> None:
        if self._cell is not None:
            self._cell["text"] += data.strip()

    def handle_endtag(self, tag: str) -> None:
        if tag in {"td", "th"} and self._cell is not None:
            self._row.append(self._cell)
            self._cell = None
        elif tag == "tr" and self._row:
            self.rows.append(self._row)
            self._row = []


# ─── Header → Semantic Role Mapping ──────────────────────────────────────────

# Maps table column headers (Hindi/English) to semantic roles for Khata hierarchy.
# This is used to build the hierarchical Khata-centric JSON output.
HEADER_ROLE_ALIASES: Dict[str, List[str]] = {
    "khata_no": ["खाता", "खाता संख्यांक", "खाता संख्या", "khata", "khata no"],
    "owner_name": ["भूमिस्वामी", "स्वामी", "खातेदार", "owner", "name"],
    "father_name": ["पिता", "father", "s/o", "d/o", "w/o"],
    "survey_no": ["सर्वेक्षण", "भू-खण्ड", "भू-खंड", "खसरा", "survey", "khasra", "plot"],
    "area": ["क्षेत्रफल", "रकबा", "area", "plot area"],
    "share": ["हिस्सा", "अंश", "भाग", "share", "fraction"],
    "land_class": ["भूमि वर्ग", "भूमि प्रकार", "land class", "classification"],
}


def _map_header_to_role(header: str) -> Optional[str]:
    """Maps a table column header text to a semantic role using fuzzy matching."""
    cleaned = header.lower().strip()
    for role, aliases in HEADER_ROLE_ALIASES.items():
        for alias in aliases:
            if alias.lower() in cleaned:
                return role
            if fuzz.partial_ratio(cleaned, alias.lower()) >= 75:
                return role
    return None


def _build_khata_hierarchy(
    headers: List[str], rows: List[Dict[str, Dict[str, Any]]]
) -> List[Dict[str, Any]]:
    """
    Builds hierarchical Khata-centric JSON from flat table rows.

    Structure: Khata → owners[] → { survey_numbers[], area, share }

    Handles merged cells by carrying forward Khata numbers across rows
    that share the same Khata entry.
    """
    # Map each header to its semantic role
    header_roles: Dict[str, str] = {}
    for h in headers:
        role = _map_header_to_role(h)
        if role:
            header_roles[h] = role

    # No recognizable header roles → return empty hierarchy
    if not header_roles:
        return []

    # Group rows into Khata entries
    khata_map: Dict[str, Dict[str, Any]] = {}  # khata_no → {owners: [...]}
    current_khata = "unknown"

    for row in rows:
        row_data: Dict[str, str] = {}
        for header_text, cell in row.items():
            value = cell.get("value", "").strip() if isinstance(cell, dict) else str(cell).strip()
            role = header_roles.get(header_text)
            if role and value:
                row_data[role] = value

        # Determine Khata number for this row (carry forward from previous if merged cell)
        if "khata_no" in row_data and row_data["khata_no"]:
            current_khata = row_data["khata_no"]

        if current_khata not in khata_map:
            khata_map[current_khata] = {"khata_no": current_khata, "owners": []}

        # Build owner entry for this row
        owner_entry: Dict[str, Any] = {}
        if "owner_name" in row_data:
            owner_entry["name"] = row_data["owner_name"]
        if "father_name" in row_data:
            owner_entry["father_name"] = row_data["father_name"]

        survey_no = row_data.get("survey_no", "")
        if survey_no:
            owner_entry["survey_numbers"] = [s.strip() for s in survey_no.replace(",", "/").split("/") if s.strip()]
        else:
            owner_entry["survey_numbers"] = []

        if "area" in row_data:
            owner_entry["area"] = row_data["area"]
        if "share" in row_data:
            owner_entry["share"] = row_data["share"]
        if "land_class" in row_data:
            owner_entry["land_class"] = row_data["land_class"]

        # Only add if there's meaningful data
        if owner_entry.get("name") or owner_entry.get("survey_numbers"):
            khata_map[current_khata]["owners"].append(owner_entry)

    return list(khata_map.values())


# ─── Table Structure Engine ──────────────────────────────────────────────────

class TableStructureEngine:
    """Uses PP-StructureV3 to detect table structure and extract cells."""

    def analyze(self, image_path: Path) -> TableStructureResult:
        """
        Runs PP-Structure table analysis on an image and returns structured result
        with both flat rows and Khata-centric hierarchical JSON.
        """
        try:
            from paddleocr import PPStructure
        except ImportError as exc:
            raise RuntimeError(
                "PaddleOCR PP-Structure is not installed. "
                "Install paddleocr from Backend/requirements.txt."
            ) from exc

        try:
            engine = PPStructure(show_log=False, lang="hi", layout=False, table=True, ocr=True)
            results = engine(str(image_path))
        except Exception as exc:
            raise RuntimeError(f"PP-Structure table analysis failed: {exc}") from exc

        # Extract HTML table from PP-Structure results
        html = ""
        for result in results or []:
            if result.get("type") == "table":
                result_data = result.get("res", {})
                html = result_data.get("html", "") if isinstance(result_data, dict) else ""
                if html:
                    break

        # Parse HTML into rows
        parser = _TableHTMLParser()
        parser.feed(html)
        parsed_rows = parser.rows

        headers = [cell["text"] for cell in parsed_rows[0]] if parsed_rows else []

        # Build flat row dicts
        rows: List[Dict[str, Dict[str, Any]]] = []
        merged_cells: List[Dict[str, int]] = []

        for row_index, cells in enumerate(parsed_rows[1:], start=1):
            row: Dict[str, Dict[str, Any]] = {}
            for col_index, cell in enumerate(cells):
                header = (
                    headers[col_index]
                    if col_index < len(headers) and headers[col_index]
                    else f"column_{col_index + 1}"
                )
                row[header] = {
                    "value": cell["text"],
                    "row": row_index,
                    "column": col_index,
                }
                if cell["row_span"] > 1 or cell["col_span"] > 1:
                    merged_cells.append({
                        "row": row_index,
                        "column": col_index,
                        "row_span": cell["row_span"],
                        "col_span": cell["col_span"],
                    })
            if row:
                rows.append(row)

        # Build hierarchical Khata-centric JSON
        khata_hierarchy = _build_khata_hierarchy(headers, rows)

        structured = {
            "headers": headers,
            "rows": rows,
            "merged_cells": merged_cells,
            "khata_hierarchy": khata_hierarchy,
        }

        return TableStructureResult(
            headers=headers,
            rows=rows,
            merged_cells=merged_cells,
            raw_html=html,
            structured_json=structured,
        )
