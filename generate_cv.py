# /// script
# requires-python = ">=3.12"
# dependencies = ["rendercv[full]"]
# ///
#
# Run: uv run generate_cv.py
# Output: rendercv_output/Mohamad_Reza_Jafarzade_CV.pdf

import json
import re
import subprocess
import sys
from pathlib import Path

import ruamel.yaml


def parse_period(period: str) -> tuple[str, str | None]:
    parts = re.split(r"\s*[—–]\s*", period)
    start = parts[0].strip()
    end = parts[1].strip() if len(parts) > 1 else None
    if end and end.lower() in ("present", "now", "ongoing"):
        end = "present"
    return start, end


def parse_degree(degree_text: str) -> tuple[str | None, str]:
    if " — " in degree_text:
        parts = degree_text.split(" — ", 1)
        return parts[0].strip(), parts[1].strip()
    m = re.match(r"^([A-Z][a-zA-Z.]+\.)\s+(.*)", degree_text)
    if m:
        return m.group(1), m.group(2)
    return None, degree_text


def build_cv(d: dict) -> dict:
    sections: dict = {}

    sections["summary"] = [d["bio"]]

    exp = []
    for job in d["experience"]:
        start, end = parse_period(job["period"])
        title = job["title"]
        if job.get("titleSuffix"):
            title = f"{title} {job['titleSuffix']}"
        exp.append(
            {
                "company": job["company"],
                "position": title,
                "start_date": start,
                "end_date": end,
                "location": job.get("location"),
                "highlights": job["bullets"],
            }
        )
    sections["experience"] = exp

    projects = []
    for proj in d["projects"]:
        if not proj.get("showInPdf", True):
            continue
        name = proj["title"]
        if proj.get("url"):
            name = f"[{name}]({proj['url']})"
        if proj.get("pdfHighlights") is not None:
            highlights = list(proj["pdfHighlights"])
        else:
            highlights = list(proj.get("highlights", []))
            if proj.get("metrics"):
                for m in proj["metrics"]:
                    val = m["count"]
                    if isinstance(val, float):
                        val = f"{val:.{m.get('decimals', 0)}f}"
                    highlights.append(f"{val}{m.get('suffix', '')} {m['label']}")

        badge = proj.get("badge", "")
        date_match = re.search(r"(\d{4})\s*[—–]\s*(Now|Present|now|present)", badge)
        start_date = end_date = date_kw = None
        if date_match:
            start_date = date_match.group(1)
            end_date = "present"
        else:
            year_match = re.search(r"\b(\d{4})\b", badge)
            if year_match:
                date_kw = year_match.group(1)

        if date_kw:
            name = f"{name} ({date_kw})"
        entry: dict = {"name": name, "summary": proj["description"]}
        if start_date:
            entry["start_date"] = start_date
            entry["end_date"] = end_date
        if highlights:
            entry["highlights"] = highlights
        projects.append(entry)
    sections["projects"] = projects

    education = []
    for edu in d["education"]:
        start, end = parse_period(edu["period"])
        degree, area = parse_degree(edu["degree"])
        education.append(
            {
                "institution": edu["school"],
                "area": area,
                "degree": degree,
                "start_date": start,
                "end_date": end,
            }
        )
    sections["education"] = education

    skills = []
    for sg in d["skills"]:
        skills.append({"label": sg["category"], "details": ", ".join(sg["items"])})
    sections["skills"] = skills

    honors = []
    for h in d.get("honors", []):
        honors.append(
            {"label": f"{h['rank']} — {h['description']}", "details": h["detail"]}
        )
    sections["honors_and_awards"] = honors

    name = d["name"]
    links = d["links"]
    social = []
    if "linkedin" in links:
        social.append(
            {"network": "LinkedIn", "username": links["linkedin"].rstrip("/").split("/")[-1]}
        )
    if "github" in links:
        social.append(
            {"network": "GitHub", "username": links["github"].rstrip("/").split("/")[-1]}
        )

    return {
        "cv": {
            "name": f"{name['first']} {name['last']}",
            "location": d.get("location"),
            "email": d.get("email"),
            "social_networks": social,
            "sections": sections,
        },
        "design": {
            "theme": "classic",
            "page": {
                "size": "a4",
                "top_margin": "1.5cm",
                "bottom_margin": "1.5cm",
                "left_margin": "2cm",
                "right_margin": "2cm",
            },
        },
    }


def write_yaml(data: dict, output_path: Path) -> None:
    yaml = ruamel.yaml.YAML()
    yaml.default_flow_style = False
    yaml.width = 120
    yaml.allow_unicode = True
    with open(output_path, "w") as f:
        yaml.dump(data, f)


def check_ats(pdf_path: Path, d: dict) -> None:
    result = subprocess.run(["pdftotext", str(pdf_path), "-"], capture_output=True, text=True)
    if result.returncode != 0:
        print("\npdftotext not available — install poppler-utils to verify ATS output.")
        return

    text = result.stdout
    lines = text.splitlines()

    checks: list[tuple[str, bool, str]] = []

    # Name
    full_name = f"{d['name']['first']} {d['name']['last']}"
    checks.append(("Name extracted", full_name in text, full_name))

    # Email
    email = d.get("email", "")
    checks.append(("Email present", email in text, email))

    # Key sections
    for section in ("Experience", "Education", "Skills", "Summary"):
        checks.append((f"Section: {section}", section in text, ""))

    # No garbled ligatures (common PDF-to-text artifact)
    garbled = any(c in text for c in ("ï¬", "ﬁ", "ﬀ", "ﬃ", "�"))
    checks.append(("No garbled characters", not garbled, "check for ligature artifacts"))

    # Logical order: name before experience before education
    name_pos = text.find(full_name)
    exp_pos = text.find("Experience")
    edu_pos = text.find("Education")
    order_ok = 0 <= name_pos < exp_pos < edu_pos
    checks.append(("Section order (name → exp → edu)", order_ok, ""))

    # Page count via form-feed character
    pages = text.rstrip("\f").count("\f") + 1
    checks.append(("Page count 1–2", pages <= 2, f"{pages} page(s)"))

    # Contact info in first 20 lines
    header_block = "\n".join(lines[:20])
    checks.append(("Contact in header", email in header_block, "email in first 20 lines"))

    # Print report
    print("\n--- ATS checks ---")
    passed = 0
    for label, ok, note in checks:
        icon = "✓" if ok else "✗"
        suffix = f"  ({note})" if note else ""
        print(f"  {icon}  {label}{suffix}")
        if ok:
            passed += 1
    print(f"\n  {passed}/{len(checks)} checks passed")

    if "--verbose" in sys.argv:
        print("\n--- Raw text (first 3000 chars) ---")
        print(text[:3000])


def main() -> None:
    root = Path(__file__).parent
    content_path = root / "content.json"
    yaml_path = root / "Mohamad_Reza_Jafarzade_CV.yaml"
    output_dir = root / "rendercv_output"

    with open(content_path) as f:
        d = json.load(f)

    cv = build_cv(d)
    write_yaml(cv, yaml_path)
    print(f"Generated {yaml_path.name}")

    rendercv_bin = Path(sys.executable).parent / "rendercv"
    result = subprocess.run(
        [str(rendercv_bin), "render", str(yaml_path), "-o", str(output_dir)],
        cwd=root,
    )
    if result.returncode != 0:
        print("rendercv render failed.", file=sys.stderr)
        sys.exit(1)

    name = d["name"]
    pdf_name = f"{name['first'].replace(' ', '_')}_{name['last']}_CV.pdf"
    pdf_path = output_dir / pdf_name
    if not pdf_path.exists():
        pdfs = list(output_dir.glob("*.pdf"))
        if pdfs:
            pdf_path = pdfs[0]
    if pdf_path.exists():
        check_ats(pdf_path, d)


if __name__ == "__main__":
    main()
