/**
 * GitHub Service - Fetches commit messages from GitHub API
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

const GITHUB_OWNER = 'R0mul0s';
const GITHUB_REPO = 'Looters-land';
const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

export interface ParsedCommit {
  sha: string;
  date: string;
  message: string;
  body?: string;
  url: string;
  type?: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore' | 'perf';
  scope?: string;
}

/**
 * Fetch recent commits from GitHub repository
 *
 * @param page - Page number for pagination (default: 1)
 * @param perPage - Number of commits per page (default: 30, max: 100)
 * @returns Array of GitHub commits
 */
export async function fetchGitHubCommits(page: number = 1, perPage: number = 30): Promise<GitHubCommit[]> {
  try {
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?page=${page}&per_page=${perPage}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const commits: GitHubCommit[] = await response.json();
    return commits;
  } catch (error) {
    console.error('Failed to fetch GitHub commits:', error);
    return [];
  }
}

/**
 * Parse conventional commit message
 * Format: type(scope): subject
 *
 * @param message - Full commit message
 * @returns Parsed commit type and scope
 */
function parseCommitMessage(message: string): { type?: string; scope?: string; subject: string; body?: string } {
  const lines = message.split('\n');
  const firstLine = lines[0];
  const body = lines.slice(1).join('\n').trim();

  // Match conventional commit format: type(scope): subject
  const conventionalMatch = firstLine.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);

  if (conventionalMatch) {
    const [, type, scope, subject] = conventionalMatch;
    return { type, scope, subject, body: body || undefined };
  }

  // If not conventional format, return the whole first line as subject
  return { subject: firstLine, body: body || undefined };
}

/**
 * Parse GitHub commits into structured format
 *
 * @param commits - Array of GitHub commits
 * @returns Array of parsed commits
 */
export function parseCommits(commits: GitHubCommit[]): ParsedCommit[] {
  return commits.map(commit => {
    const parsed = parseCommitMessage(commit.commit.message);
    const date = new Date(commit.commit.author.date);

    return {
      sha: commit.sha.substring(0, 7), // Short SHA
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      message: parsed.subject,
      body: parsed.body,
      url: commit.html_url,
      type: parsed.type as ParsedCommit['type'],
      scope: parsed.scope
    };
  });
}

/**
 * Group commits by date
 *
 * @param commits - Array of parsed commits
 * @returns Map of date to commits
 */
export function groupCommitsByDate(commits: ParsedCommit[]): Map<string, ParsedCommit[]> {
  const grouped = new Map<string, ParsedCommit[]>();

  commits.forEach(commit => {
    const existing = grouped.get(commit.date) || [];
    existing.push(commit);
    grouped.set(commit.date, existing);
  });

  return grouped;
}

/**
 * Group commits by type (feat, fix, docs, etc.)
 *
 * @param commits - Array of parsed commits
 * @returns Map of type to commits
 */
export function groupCommitsByType(commits: ParsedCommit[]): Map<string, ParsedCommit[]> {
  const grouped = new Map<string, ParsedCommit[]>();

  commits.forEach(commit => {
    const type = commit.type || 'other';
    const existing = grouped.get(type) || [];
    existing.push(commit);
    grouped.set(type, existing);
  });

  return grouped;
}

/**
 * Get commit type emoji
 *
 * @param type - Commit type
 * @returns Emoji for the type
 */
export function getCommitTypeEmoji(type?: string): string {
  switch (type) {
    case 'feat': return '✨';
    case 'fix': return '🐛';
    case 'docs': return '📚';
    case 'style': return '💎';
    case 'refactor': return '♻️';
    case 'test': return '🧪';
    case 'chore': return '🔧';
    case 'perf': return '⚡';
    default: return '📝';
  }
}

/**
 * Get commit type label
 *
 * @param type - Commit type
 * @returns Human-readable label
 */
export function getCommitTypeLabel(type?: string): string {
  switch (type) {
    case 'feat': return 'Features';
    case 'fix': return 'Fixes';
    case 'docs': return 'Documentation';
    case 'style': return 'Styling';
    case 'refactor': return 'Refactoring';
    case 'test': return 'Tests';
    case 'chore': return 'Maintenance';
    case 'perf': return 'Performance';
    default: return 'Other';
  }
}
