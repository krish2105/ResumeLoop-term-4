"""Versioned contract for fictional review cases, not official course data."""
import csv
import hashlib
import io
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, ValidationError

SCHEMA_VERSION = 'synthetic-cases/v1'
HEADERS = ['id', 'title', 'subtitle', 'metric_value', 'metric_label', 'status', 'evidence']
Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
Status = Literal['ready', 'needs-review', 'blocked', 'approved', 'rejected']


class DemoCase(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    id: str = Field(pattern=r'^D-[A-Za-z0-9][A-Za-z0-9_-]*$', max_length=100)
    title: Text
    subtitle: Text
    # Preserve the declared display value; never infer a unit or silently coerce it.
    metric_value: str = Field(pattern=r'^(0|[1-9][0-9]*)(\.[0-9]+)?$', max_length=40)
    metric_label: Text
    status: Status
    evidence: Text


class CSVImport(BaseModel):
    model_config = ConfigDict(extra='forbid')
    csv_text: str = Field(min_length=1, max_length=150000)


class InvalidCSV(ValueError):
    def __init__(self, errors):
        self.errors = errors


def validate_csv(csv_text: str) -> dict:
    """Rows are logical CSV records (header is 1); quoted newlines stay one row."""
    reader = csv.reader(io.StringIO(csv_text, newline=''), strict=True)
    errors, rows, seen = [], [], set()
    row_number = 1
    try:
        if next(reader, None) != HEADERS:
            raise InvalidCSV([{'row': 1, 'field': 'headers', 'message': 'Use the exact template headers in order.'}])
        for row_number, cells in enumerate(reader, start=2):
            if row_number > 251:
                errors.append({'row': row_number, 'field': 'file', 'message': 'Maximum 250 data rows.'})
                break
            if len(cells) != len(HEADERS):
                errors.append({'row': row_number, 'field': 'row', 'message': f'Expected 7 cells; found {len(cells)}.'})
                continue
            try:
                case = DemoCase.model_validate(dict(zip(HEADERS, cells))).model_dump()
            except ValidationError as exc:
                errors.extend({'row': row_number, 'field': str(e['loc'][0]), 'message': e['msg']} for e in exc.errors())
                continue
            if case['id'] in seen:
                errors.append({'row': row_number, 'field': 'id', 'message': 'Duplicate ID within this upload.'})
            seen.add(case['id'])
            rows.append(case)
    except csv.Error:
        errors.append({'row': row_number + 1, 'field': 'row', 'message': 'Malformed quoting. Check the CSV template.'})
    if not rows and not errors:
        errors.append({'row': 2, 'field': 'file', 'message': 'Add at least one data row.'})
    if errors:
        raise InvalidCSV(errors)
    return {'schema_version': SCHEMA_VERSION, 'sha256': hashlib.sha256(csv_text.encode('utf-8')).hexdigest(),
            'source_type': 'SYNTHETIC', 'row_count': len(rows), 'rows': rows}
