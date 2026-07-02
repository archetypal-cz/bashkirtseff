// GitHub source links — every content page can link to its markdown source
// in the public repo so readers can inspect the raw file (frontmatter,
// %%-comments, translation history).

export const GITHUB_REPO_URL = 'https://github.com/archetypal-cz/bashkirtseff';
export const GITHUB_BRANCH = 'main';

/**
 * Build a GitHub URL for a repo-relative path.
 * Files (*.md) get /blob/ URLs, directories get /tree/ URLs.
 */
export function githubSourceUrl(repoPath: string): string {
  const kind = repoPath.endsWith('.md') ? 'blob' : 'tree';
  return `${GITHUB_REPO_URL}/${kind}/${GITHUB_BRANCH}/${repoPath}`;
}
