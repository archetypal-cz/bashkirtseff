#!/usr/bin/env python3
"""
Generate index.html for the pub directory.

This script scans the pub/ directory for HTML files and creates an index.html
file that links to all available books and translations.
"""

import logging
import os
from pathlib import Path
from typing import Dict, List, Tuple

import typer
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
log = logging.getLogger("generate_index")
console = Console()


def scan_html_files(pub_dir: Path) -> Dict[str, List[Tuple[str, str]]]:
    """
    Scan pub directory for HTML files and organize them by language.
    
    Returns:
        Dict mapping language codes to list of (book_name, file_path) tuples
    """
    books = {}
    
    for html_file in pub_dir.rglob("*.html"):
        # Skip if it's the index.html we're about to create
        if html_file.name == "index.html":
            continue
            
        # Get relative path from pub directory
        rel_path = html_file.relative_to(pub_dir)
        
        # Determine language from directory structure
        if rel_path.parent.name == "_original":
            language = "Français (Original)"
            lang_code = "fr"
        elif rel_path.parent.name == "cz":
            language = "Čeština"
            lang_code = "cz"
        else:
            # Handle other languages if they exist
            language = rel_path.parent.name.title()
            lang_code = rel_path.parent.name
            
        # Extract book name from filename
        book_name = html_file.stem
        if book_name.startswith("cz_"):
            book_name = book_name[3:]  # Remove language prefix
            
        # Format book name for display
        if book_name.startswith("_"):
            display_name = book_name[1:].replace("_", " ").title()
        else:
            display_name = f"Book {book_name}"
            
        if lang_code not in books:
            books[lang_code] = {
                "language": language,
                "books": []
            }
            
        books[lang_code]["books"].append((display_name, str(rel_path)))
    
    # Sort books within each language
    for lang_data in books.values():
        lang_data["books"].sort(key=lambda x: x[0])
    
    return books


def generate_index_html(books: Dict[str, List[Tuple[str, str]]], output_path: Path) -> None:
    """Generate the index.html file."""
    
    # Create Jinja2 environment
    template_dir = Path(__file__).parent / "templates"
    if not template_dir.exists():
        template_dir.mkdir(exist_ok=True)
    
    # Create index template if it doesn't exist
    index_template_path = template_dir / "index_template.html"
    if not index_template_path.exists():
        template_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marie Bashkirtseff - Journal</title>
    <style>
        body {
            font-family: Georgia, serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #faf8f5;
            color: #333;
        }
        h1 {
            color: #8b4513;
            text-align: center;
            border-bottom: 3px solid #deb887;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            color: #cd853f;
            border-bottom: 1px solid #deb887;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        .language-section {
            margin-bottom: 30px;
        }
        .book-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .book-link {
            display: block;
            padding: 15px;
            background-color: #fff;
            border: 1px solid #deb887;
            border-radius: 5px;
            text-decoration: none;
            color: #8b4513;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .book-link:hover {
            background-color: #f5f5dc;
            border-color: #cd853f;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .book-title {
            font-weight: bold;
            font-size: 1.1em;
            margin-bottom: 5px;
        }
        .book-path {
            font-size: 0.9em;
            color: #666;
            font-style: italic;
        }
        .intro {
            text-align: center;
            font-style: italic;
            margin-bottom: 40px;
            color: #666;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #deb887;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <h1>Marie Bashkirtseff - Journal</h1>
    
    <div class="intro">
        <p>The diary of Marie Bashkirtseff (1858-1884), a young Ukrainian artist who wrote in French.</p>
        <p>This digital edition presents her journal in multiple languages with comprehensive annotations.</p>
    </div>

    {% for lang_code, lang_data in books.items() %}
    <div class="language-section">
        <h2>{{ lang_data.language }}</h2>
        <div class="book-grid">
            {% for book_name, file_path in lang_data.books %}
            <a href="{{ file_path }}" class="book-link">
                <div class="book-title">{{ book_name }}</div>
                <div class="book-path">{{ file_path }}</div>
            </a>
            {% endfor %}
        </div>
    </div>
    {% endfor %}

    <div class="footer">
        <p>Generated automatically from the journal transcription project.</p>
    </div>
</body>
</html>"""
        index_template_path.write_text(template_content, encoding="utf-8")
    
    # Load and render template
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("index_template.html")
    
    html_content = template.render(books=books)
    
    # Write the index.html file
    output_path.write_text(html_content, encoding="utf-8")
    log.info(f"Generated index.html at {output_path}")


def main(pub_dir: str = "pub") -> None:
    """Generate index.html for the pub directory."""
    pub_path = Path(pub_dir)
    
    if not pub_path.exists():
        console.print(f"[red]Error: pub directory '{pub_path}' does not exist[/red]")
        raise typer.Exit(1)
    
    log.info(f"Scanning for HTML files in {pub_path}")
    books = scan_html_files(pub_path)
    
    if not books:
        console.print("[yellow]Warning: No HTML files found in pub directory[/yellow]")
        return
    
    # Generate index.html
    index_path = pub_path / "index.html"
    generate_index_html(books, index_path)
    
    console.print(f"[green]Successfully generated index.html with {sum(len(lang_data['books']) for lang_data in books.values())} books[/green]")


if __name__ == "__main__":
    typer.run(main)