"""
Canonical prototype taxonomy for Indian land-record extraction.

Field definitions, aliases, and regex extraction patterns are organized as
configurable state-specific registries so new state terminology can be added
without modifying matcher logic.

To add support for a new state (e.g., Rajasthan, UP):
  1. Create a new dict like MP_FIELD_PATTERNS in this file.
  2. Register it in STATE_PATTERN_REGISTRY.
  3. The FieldMatcher will automatically pick it up.
"""

from __future__ import annotations

import re
from typing import Dict, List, Any

# ─── Core Field Taxonomy ─────────────────────────────────────────────────────
# These are the canonical field IDs used across the entire system.
# category_label is used directly in the frontend UI cards.

LAND_RECORD_FIELDS = [
    {"id": "owner_name",     "category": "owner",          "category_label": "Owner Details",        "label": "Owner Name / भूमिस्वामी-नाम"},
    {"id": "father_name",    "category": "owner",          "category_label": "Owner Details",        "label": "Father's Name / पिता का नाम"},
    {"id": "khasra_no",      "category": "identification", "category_label": "Land Identification",  "label": "Khasra / Survey No. / सर्वेक्षण संख्यांक"},
    {"id": "khata_no",       "category": "identification", "category_label": "Land Identification",  "label": "Khata Number / खाता संख्यांक"},
    {"id": "plot_area",      "category": "details",        "category_label": "Land Details",         "label": "Plot Area / क्षेत्रफल"},
    {"id": "land_class",     "category": "details",        "category_label": "Land Details",         "label": "Land Classification / भूमि वर्ग"},
    {"id": "share_fraction", "category": "details",        "category_label": "Land Details",         "label": "Share / हिस्सा"},
    {"id": "village",        "category": "location",       "category_label": "Location Details",     "label": "Village / ग्राम"},
    {"id": "tehsil",         "category": "location",       "category_label": "Location Details",     "label": "Tehsil / तहसील"},
    {"id": "district",       "category": "location",       "category_label": "Location Details",     "label": "District / जिला"},
]

FIELD_BY_ID: Dict[str, Dict[str, str]] = {f["id"]: f for f in LAND_RECORD_FIELDS}

# ─── Generic (All-India) Aliases ─────────────────────────────────────────────
# These are fuzzy-matched against OCR text and table headers.
# More specific state patterns below override/supplement these.

FIELD_ALIASES: Dict[str, List[str]] = {
    "owner_name":     ["owner", "owner name", "name of owner", "स्वामी", "खातेदार", "भूमिस्वामी", "भूमिस्वामी-नाम"],
    "father_name":    ["father", "father name", "s/o", "d/o", "w/o", "पिता", "पिता का नाम", "पिताजी"],
    "khasra_no":      ["khasra", "khasra no", "survey no", "survey number", "खसरा", "सर्वे", "सर्वेक्षण संख्यांक", "भू-खण्ड संख्यांक", "भू-खण्ड", "भू-खंड"],
    "khata_no":       ["khata", "khata no", "khata number", "खाता", "खाता संख्यांक", "खाता संख्या"],
    "plot_area":      ["area", "plot area", "rakba", "रकबा", "क्षेत्रफल", "भूमि क्षेत्र", "हे.आर."],
    "land_class":     ["land class", "classification", "land use", "land type", "भूमि वर्ग", "भूमि प्रकार", "भू-उपयोग"],
    "share_fraction": ["share", "fraction", "हिस्सा", "अंश", "भाग"],
    "village":        ["village", "gram", "ग्राम", "गाँव", "गांव"],
    "tehsil":         ["tehsil", "tahsil", "taluk", "taluka", "तहसील", "तालुका"],
    "district":       ["district", "zila", "जिला", "ज़िला"],
}

# ─── State-Specific Regex Extraction Patterns ────────────────────────────────
# Each pattern is a compiled regex with a named group `value` that captures
# the extracted field value. Multiple patterns per field are tried in order.
#
# HOW TO ADD A NEW STATE:
#   1. Copy MP_FIELD_PATTERNS and rename it (e.g., RJ_FIELD_PATTERNS for Rajasthan)
#   2. Adjust the Hindi/regional terms and regex patterns
#   3. Register in STATE_PATTERN_REGISTRY at the bottom

MP_FIELD_PATTERNS: Dict[str, List[re.Pattern]] = {
    "owner_name": [
        re.compile(r"भूमिस्वामी[\s\-]*(?:का\s*)?नाम\s*[:\-–—]?\s*(?P<value>.+)", re.UNICODE),
        re.compile(r"(?:स्वामी|खातेदार)\s*(?:का\s*)?नाम\s*[:\-–—]?\s*(?P<value>.+)", re.UNICODE),
        re.compile(r"Owner\s*(?:Name)?\s*[:\-–—]?\s*(?P<value>.+)", re.IGNORECASE),
    ],
    "father_name": [
        re.compile(r"पिता\s*(?:का\s*)?नाम\s*[:\-–—]?\s*(?P<value>.+)", re.UNICODE),
        re.compile(r"(?:S/O|D/O|W/O|पुत्र|पुत्री)\s*[:\-–—]?\s*(?P<value>.+)", re.IGNORECASE | re.UNICODE),
        re.compile(r"Father(?:'s)?\s*(?:Name)?\s*[:\-–—]?\s*(?P<value>.+)", re.IGNORECASE),
    ],
    "khasra_no": [
        re.compile(r"(?:सर्वेक्षण|भू[\-\s]*खण्ड|भू[\-\s]*खंड)\s*संख्यांक\s*[:\-–—]?\s*(?P<value>[\d/\-\s]+)", re.UNICODE),
        re.compile(r"खसरा\s*(?:संख्या|नं|न.)?\s*[:\-–—]?\s*(?P<value>[\d/\-\s]+)", re.UNICODE),
        re.compile(r"(?:Khasra|Survey)\s*(?:No|Number|#)?\s*[:\-–—]?\s*(?P<value>[\d/\-\s]+)", re.IGNORECASE),
    ],
    "khata_no": [
        re.compile(r"खाता\s*(?:संख्यांक|संख्या|नं|क्र)\s*[:\-–—]?\s*(?P<value>[\d/\-\s]+)", re.UNICODE),
        re.compile(r"(?:Khata|Khewat)\s*(?:No|Number|#)?\s*[:\-–—]?\s*(?P<value>[\d/\-\s]+)", re.IGNORECASE),
    ],
    "plot_area": [
        re.compile(r"क्षेत्रफल\s*[:\-–—]?\s*(?P<value>[\d.,\s]+\s*(?:हे|एकड़|बीघा|एकड|Acre|Hectare|Bigha)?.*)", re.UNICODE | re.IGNORECASE),
        re.compile(r"रकबा\s*[:\-–—]?\s*(?P<value>[\d.,\s]+.*)", re.UNICODE),
        re.compile(r"(?:Plot\s*)?Area\s*[:\-–—]?\s*(?P<value>[\d.,\s]+.*)", re.IGNORECASE),
    ],
    "land_class": [
        re.compile(r"भूमि\s*(?:वर्ग|प्रकार|उपयोग)\s*[:\-–—]?\s*(?P<value>.+)", re.UNICODE),
        re.compile(r"(?:Land\s*)?(?:Class|Classification|Use|Type)\s*[:\-–—]?\s*(?P<value>.+)", re.IGNORECASE),
    ],
    "share_fraction": [
        re.compile(r"(?:हिस्सा|अंश|भाग)\s*[:\-–—]?\s*(?P<value>.+)", re.UNICODE),
        re.compile(r"Share\s*(?:Fraction)?\s*[:\-–—]?\s*(?P<value>.+)", re.IGNORECASE),
    ],
    "village": [
        re.compile(r"(?:ग्राम|गाँव|गांव)\s*[:\-–—]?\s*(?P<value>.+)", re.UNICODE),
        re.compile(r"Village\s*[:\-–—]?\s*(?P<value>.+)", re.IGNORECASE),
    ],
    "tehsil": [
        re.compile(r"(?:तहसील|तालुका)\s*[:\-–—]?\s*(?P<value>.+)", re.UNICODE),
        re.compile(r"(?:Tehsil|Tahsil|Taluk)\s*[:\-–—]?\s*(?P<value>.+)", re.IGNORECASE),
    ],
    "district": [
        re.compile(r"(?:जिला|ज़िला)\s*[:\-–—]?\s*(?P<value>.+)", re.UNICODE),
        re.compile(r"District\s*[:\-–—]?\s*(?P<value>.+)", re.IGNORECASE),
    ],
}

# ─── State Pattern Registry ──────────────────────────────────────────────────
# Maps state abbreviation → field_id → compiled regex patterns.
# "default" is used when no state is specified (uses MP patterns as base).
#
# To add a new state, create XY_FIELD_PATTERNS above and register here:
#   STATE_PATTERN_REGISTRY["RJ"] = RJ_FIELD_PATTERNS

STATE_PATTERN_REGISTRY: Dict[str, Dict[str, List[re.Pattern]]] = {
    "default": MP_FIELD_PATTERNS,
    "MP": MP_FIELD_PATTERNS,
}


def get_patterns_for_state(state_code: str = "default") -> Dict[str, List[re.Pattern]]:
    """Returns the regex extraction patterns for a given state code."""
    return STATE_PATTERN_REGISTRY.get(state_code.upper(), STATE_PATTERN_REGISTRY["default"])
