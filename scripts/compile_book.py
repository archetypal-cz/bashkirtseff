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


def compile_markdown(files: List[Path], output_path: Path) -> None:
    """Combine multiple Markdown files into a single file."""
    with output_path.open("w", encoding="utf-8") as outfile:
        # Write header
        book_name = output_path.stem
        outfile.write(f"# {book_name}\n\n")

        for file_path in files:
            log.info(f"Processing {file_path}")

            # Extract ISO date from filename for the link
            date_match = re.search(r"(\d{4}-\d{2}-\d{2})", file_path.name)
            iso_date = date_match.group(1) if date_match else file_path.stem

            # Get the relative path for the link
            # Extract book_id and language from the output path
            parts = output_path.parts
            language_index = parts.index("pub") + 1
            language = parts[language_index]

            # Create the link to the original file
            file_link = f"../{file_path.name}"
            if language != "_original":
                # For translations, link back to the original file
                file_link = f"../../_original/{file_path.parent.name}/{file_path.name}"

            # Read the file content
            with file_path.open("r", encoding="utf-8") as infile:
                content = infile.read()

                # Extract Marie's date from the first line if available
                marie_date = None
                first_line = content.split("\n", 1)[0] if content else ""
                marie_date_match = re.search(r"\[\//\]: # \((.*?)\)", first_line)
                if marie_date_match:
                    marie_date = marie_date_match.group(1).strip()

                # Use Marie's date if available, otherwise use ISO date
                header_date = marie_date if marie_date else iso_date

                # Add file header with link
                outfile.write(f"## [{header_date}]({file_link})\n\n")

                # Write the content
                outfile.write(content)
                outfile.write("\n\n")

    log.info(f"Markdown compilation complete. Output saved to {output_path}")


def convert_to_html(
    markdown_path: Path, html_path: Path, template_path: Optional[Path] = None
) -> None:
    """Convert a Markdown file to HTML."""
    # Read markdown content
    with markdown_path.open("r", encoding="utf-8") as md_file:
        md_content = md_file.read()

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
