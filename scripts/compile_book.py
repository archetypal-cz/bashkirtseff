#!/usr/bin/env python3
"""
Compile Markdown files into a single document and convert to HTML.

This script combines all Markdown files from a specific directory
in src/{language}/ into a single Markdown file in the pub/{language}/ directory,
then converts it to HTML.
"""

import logging
import os
import re
from pathlib import Path
from typing import List, Optional

import markdown
import typer
from bs4 import BeautifulSoup
from jinja2 import Environment, FileSystemLoader
from rich.console import Console
from rich.logging import RichHandler

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)],
)
log = logging.getLogger("compile_book")
console = Console()


def find_markdown_files(directory: Path) -> List[Path]:
    """Find all Markdown files in the given directory and sort them by filename."""
    return sorted(directory.glob("*.md"))


from enum import Enum
from typing import NamedTuple, List
from datetime import datetime

class ParagraphType(Enum):
    DATE_HEADER = "date_header"
    PARAGRAPH_ID = "paragraph_id"
    DIARY_TEXT = "diary_text"
    HASHTAG_LINKS = "hashtag_links"
    RESEARCHER_NOTE = "researcher_note"
    TRANSLATOR_NOTE = "translator_note"
    EDITOR_NOTE = "editor_note"
    CONDUCTOR_NOTE = "conductor_note"
    PROJECT_ASSISTANT_NOTE = "project_assistant_note"
    VERSION_NOTE = "version_note"
    METADATA = "metadata"
    UNKNOWN = "unknown"

class ParsedParagraph(NamedTuple):
    type: ParagraphType
    content: str
    raw_content: str
    timestamp: datetime = None
    paragraph_id: str = None

def parse_markdown_content(content: str) -> List[ParsedParagraph]:
    """Parse markdown content into categorized paragraphs."""
    paragraphs = []
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if it's a comment block
        comment_match = re.match(r'\[//\]: # \((.*?)\)', line, re.DOTALL)
        if comment_match:
            comment_content = comment_match.group(1).strip()
            parsed = _parse_comment_block(comment_content, line)
            paragraphs.append(parsed)
        else:
            # Regular markdown content (for translations)
            if line.startswith('#'):
                paragraphs.append(ParsedParagraph(
                    type=ParagraphType.DATE_HEADER,
                    content=line.replace('#', '').strip(),
                    raw_content=line
                ))
            elif line:
                paragraphs.append(ParsedParagraph(
                    type=ParagraphType.DIARY_TEXT,
                    content=line,
                    raw_content=line
                ))
    
    return paragraphs

def _parse_comment_block(comment_content: str, raw_line: str) -> ParsedParagraph:
    """Parse a comment block and determine its type."""
    
    # Check for timestamp patterns (RSR, TR, RED, CON, PA notes)
    timestamp_pattern = r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\s+([A-Z]+):\s*(.*)'
    timestamp_match = re.match(timestamp_pattern, comment_content)
    
    if timestamp_match:
        timestamp_str, note_type, note_content = timestamp_match.groups()
        try:
            timestamp = datetime.fromisoformat(timestamp_str)
        except ValueError:
            timestamp = None
            
        type_mapping = {
            'RSR': ParagraphType.RESEARCHER_NOTE,
            'TR': ParagraphType.TRANSLATOR_NOTE,
            'RED': ParagraphType.EDITOR_NOTE,
            'CON': ParagraphType.CONDUCTOR_NOTE,
            'PA': ParagraphType.PROJECT_ASSISTANT_NOTE
        }
        
        return ParsedParagraph(
            type=type_mapping.get(note_type, ParagraphType.UNKNOWN),
            content=note_content,
            raw_content=raw_line,
            timestamp=timestamp
        )
    
    # Check for paragraph IDs (like "04.1", "01.23", etc.)
    paragraph_id_pattern = r'^\d{2}\.\d+$'
    if re.match(paragraph_id_pattern, comment_content):
        return ParsedParagraph(
            type=ParagraphType.PARAGRAPH_ID,
            content=comment_content,
            raw_content=raw_line,
            paragraph_id=comment_content
        )
    
    # Check for hashtag links
    if comment_content.startswith('#') or '[#' in comment_content:
        return ParsedParagraph(
            type=ParagraphType.HASHTAG_LINKS,
            content=comment_content,
            raw_content=raw_line
        )
    
    # Check for version notes
    if comment_content.startswith('V0'):
        return ParsedParagraph(
            type=ParagraphType.VERSION_NOTE,
            content=comment_content,
            raw_content=raw_line
        )
    
    # Check for metadata (like "End line in original file")
    metadata_patterns = [
        r'End line in original',
        r'Entry ends at line',
        r'Next entry starts at line'
    ]
    
    for pattern in metadata_patterns:
        if re.search(pattern, comment_content, re.IGNORECASE):
            return ParsedParagraph(
                type=ParagraphType.METADATA,
                content=comment_content,
                raw_content=raw_line
            )
    
    # Check for date headers (French date patterns)
    date_patterns = [
        r'(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)',
        r'\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)',
        r'\d{4}-\d{2}-\d{2}'
    ]
    
    for pattern in date_patterns:
        if re.search(pattern, comment_content, re.IGNORECASE):
            return ParsedParagraph(
                type=ParagraphType.DATE_HEADER,
                content=comment_content,
                raw_content=raw_line
            )
    
    # If none of the above, and it's substantial text, consider it diary content
    if len(comment_content.strip()) > 5:  # Minimum threshold for diary content
        return ParsedParagraph(
            type=ParagraphType.DIARY_TEXT,
            content=comment_content,
            raw_content=raw_line
        )
    
    # Default to unknown
    return ParsedParagraph(
        type=ParagraphType.UNKNOWN,
        content=comment_content,
        raw_content=raw_line
    )

def extract_diary_content(content: str) -> str:
    """Extract only diary text from parsed content."""
    paragraphs = parse_markdown_content(content)
    
    diary_paragraphs = []
    for paragraph in paragraphs:
        if paragraph.type == ParagraphType.DIARY_TEXT:
            diary_paragraphs.append(paragraph.content)
    
    return '\n\n'.join(diary_paragraphs)


def has_substantial_content(content: str, is_original: bool = False) -> bool:
    """Check if the content has substantial text."""
    if is_original:
        # For original files, check if we have diary content
        diary_content = extract_diary_content(content)
        return len(diary_content.strip()) > 20  # Require at least 20 characters of diary content
    else:
        # For translations, check visible content
        content_without_comments = re.sub(r'\[//\]: # \(.*?\)', '', content, flags=re.DOTALL)
        visible_content = content_without_comments.strip()
        return len(visible_content) > 10


def compile_markdown(files: List[Path], output_path: Path) -> None:
    """Combine multiple Markdown files into a single file."""
    with output_path.open("w", encoding="utf-8") as outfile:
        # Write header
        book_name = output_path.stem
        outfile.write(f"# {book_name}\n\n")

        # Determine if we're processing original files or translations
        parts = output_path.parts
        language_index = parts.index("pub") + 1
        language = parts[language_index]
        is_original = language == "_original"

        for file_path in files:
            log.info(f"Processing {file_path}")

            # Read the file content first
            with file_path.open("r", encoding="utf-8") as infile:
                content = infile.read()

            # Skip files with no substantial content
            if not has_substantial_content(content, is_original):
                log.info(f"Skipping {file_path} - no substantial content")
                continue

            # Extract date for header
            if is_original:
                # For original files, use Marie's French date from first comment if available
                marie_date = None
                first_line = content.split("\n", 1)[0] if content else ""
                marie_date_match = re.search(r"\[\//\]: # \((.*?)\)", first_line)
                if marie_date_match:
                    marie_date = marie_date_match.group(1).strip()
                
                # Extract ISO date from filename as fallback
                date_match = re.search(r"(\d{4}-\d{2}-\d{2})", file_path.name)
                iso_date = date_match.group(1) if date_match else file_path.stem
                
                # Use Marie's date if available, otherwise use ISO date
                header_date = marie_date if marie_date else iso_date
            else:
                # For translations, use the translated date from the first line (after #)
                first_line = content.split("\n", 1)[0] if content else ""
                if first_line.startswith("#"):
                    # Extract the translated date from the header
                    header_date = first_line.replace("#", "").strip()
                else:
                    # Fallback to ISO date if no header found
                    date_match = re.search(r"(\d{4}-\d{2}-\d{2})", file_path.name)
                    header_date = date_match.group(1) if date_match else file_path.stem

            # Create anchor ID from ISO date for better URL structure
            date_match = re.search(r"(\d{4}-\d{2}-\d{2})", file_path.name)
            anchor_id = date_match.group(1) if date_match else file_path.stem
            
            # Add file header without link (links break in HTML export)
            outfile.write(f"## {header_date} {{#{anchor_id}}}\n\n")

            # Write the content based on file type
            if is_original:
                # For original files, extract diary content using the new parser
                diary_content = extract_diary_content(content)
                if diary_content:
                    # Remove duplicate date from the beginning if it matches the header
                    lines = diary_content.split('\n')
                    if lines and lines[0].strip() == header_date:
                        diary_content = '\n'.join(lines[1:]).strip()
                    outfile.write(diary_content)
                else:
                    # Fallback to original content if extraction fails
                    outfile.write(content)
            else:
                # For translations, use content as-is but remove duplicate header
                content_lines = content.split('\n')
                # Skip the first line if it's a header that matches our header_date
                if content_lines and content_lines[0].startswith('#'):
                    content_to_write = '\n'.join(content_lines[1:]).strip()
                else:
                    content_to_write = content.strip()
                outfile.write(content_to_write)
            
            outfile.write("\n\n")

    log.info(f"Markdown compilation complete. Output saved to {output_path}")


def convert_to_html(
    markdown_path: Path, html_path: Path, template_path: Optional[Path] = None
) -> None:
    """Convert a Markdown file to HTML."""
    # Read markdown content
    with markdown_path.open("r", encoding="utf-8") as md_file:
        md_content = md_file.read()

    # Special handling for glossary: transform internal glossary links to same-file anchors
    if "_glossary" in str(markdown_path):
        # Transform links like [Entry_Name](/src/_original/_glossary/Entry_Name.md) to [Entry_Name](#Entry_Name)
        glossary_link_pattern = r'\[([^\]]+)\]\(/src/_original/_glossary/([^)]+)\.md\)'
        md_content = re.sub(glossary_link_pattern, r'[\1](#\2)', md_content)
        
        # Transform links like [#Entry_Name](Entry_Name.md) to [#Entry_Name](#Entry_Name)
        # This matches filenames without paths
        glossary_link_pattern2 = r'\[([^\]]+)\]\(([^/\)]+)\.md\)'
        md_content = re.sub(glossary_link_pattern2, r'[\1](#\2)', md_content)

    # Convert markdown to HTML
    html_content = markdown.markdown(
        md_content,
        extensions=[
            "markdown.extensions.extra",
            "markdown.extensions.toc",
            "markdown.extensions.smarty",
        ],
    )

    # If a template is provided, use it
    if template_path and template_path.exists():
        template_dir = template_path.parent
        template_name = template_path.name
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template(template_name)

        # Extract title from HTML
        soup = BeautifulSoup(html_content, "html.parser")
        title = soup.find("h1")
        title_text = title.text if title else "Marie Bashkirtseff's Diary"

        # Render template
        html_content = template.render(title=title_text, content=html_content)
    else:
        # Create a basic HTML document
        html_content = f"""<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marie Bashkirtseff's Diary</title>
    <style>
        body {{
            font-family: 'Georgia', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }}
        h1, h2, h3 {{
            font-family: 'Helvetica', 'Arial', sans-serif;
        }}
        h2 {{
            margin-top: 2em;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.3em;
        }}
        blockquote {{
            border-left: 4px solid #ddd;
            padding-left: 1em;
            margin-left: 0;
            color: #555;
        }}
        .footnote {{
            font-size: 0.9em;
            color: #555;
        }}
    </style>
</head>
<body>
    {html_content}
</body>
</html>"""

    # Write HTML to file
    with html_path.open("w", encoding="utf-8") as html_file:
        html_file.write(html_content)

    log.info(f"HTML conversion complete. Output saved to {html_path}")


def main(
    book_id: str = typer.Argument(..., help="Book ID (e.g., '01' for first book)"),
    language: str = typer.Option("cz", help="Language code (e.g., 'cz' for Czech)"),
    template: Optional[Path] = typer.Option(None, help="Path to HTML template file"),
    output_dir: Path = typer.Option(Path("pub"), help="Directory for output files"),
) -> None:
    """Compile all Markdown files for a specific book into a single document and convert to HTML."""
    # Define paths
    source_dir = Path(f"src/{language}/{book_id}")
    if not source_dir.exists():
        log.error(f"Source directory {source_dir} does not exist")
        raise typer.Exit(1)

    # Create language-specific output directory if it doesn't exist
    language_output_dir = output_dir / language
    language_output_dir.mkdir(parents=True, exist_ok=True)

    # Define output filenames
    if language == "_original":
        # For original files, use simpler naming
        md_output = language_output_dir / f"{book_id}.md"
        html_output = language_output_dir / f"{book_id}.html"
    else:
        # For translations, use language prefix
        md_output = language_output_dir / f"{language}_{book_id}.md"
        html_output = language_output_dir / f"{language}_{book_id}.html"

    # Find all Markdown files
    files = find_markdown_files(source_dir)
    log.info(f"Found {len(files)} Markdown files in {source_dir}")

    if not files:
        log.warning(f"No Markdown files found in {source_dir}")
        raise typer.Exit(1)

    # Compile files to Markdown
    compile_markdown(files, md_output)

    # Convert to HTML
    convert_to_html(md_output, html_output, template)

    log.info(f"Book compilation complete: {html_output}")


if __name__ == "__main__":
    typer.run(main)
