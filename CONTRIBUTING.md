# Contributing to Looters Land

## Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This ensures:
- **Automatic changelog generation** - Commits are displayed in the in-game changelog grouped by type
- **Clear commit history** - Easy to understand what each commit does
- **Semantic versioning** - Easy to determine version bumps

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type (Required)
Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, whitespace, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (updating dependencies, build scripts, etc.)
- **build**: Changes to build system or external dependencies
- **ci**: Changes to CI/CD configuration
- **revert**: Reverting a previous commit

#### Scope (Optional)
The scope should be the name of the affected module/feature:
- `ui` - User interface components
- `hero` - Hero system
- `dungeon` - Dungeon mechanics
- `inventory` - Inventory system
- `gacha` - Gacha/summoning system
- `buildings` - Town buildings
- `api` - API/backend
- etc.

#### Subject (Required)
- Use imperative, present tense: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters

#### Body (Optional)
- Use imperative, present tense
- Include motivation for the change
- Explain what and why, not how

#### Footer (Optional)
- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`

### Examples

**Feature with scope:**
```
feat(gacha): add pity system for legendary heroes

Implemented a pity counter that guarantees a legendary hero
after 90 summons without one. Counter resets after obtaining
a legendary hero.

Closes #42
```

**Bug fix:**
```
fix(inventory): prevent duplicate item stacking bug

Items with different enchantments were incorrectly stacking
together. Now checks enchantment properties before stacking.
```

**Documentation:**
```
docs: update API documentation for hero service
```

**Chore:**
```
chore: update dependencies to latest versions
```

**Style refactoring:**
```
style(ui): refactor LastUpdates component with design tokens

Replace hardcoded colors and spacing with COLORS and SPACING
tokens for consistency across the application.
```

### Validation

Commits are automatically validated using [commitlint](https://commitlint.js.org/). If your commit message doesn't follow the conventional format, the commit will be rejected.

**Testing your commit message manually:**
```bash
npm run commitlint
```

### Tips

1. **Keep commits atomic** - One commit should do one thing
2. **Write clear subjects** - Someone should understand what changed without reading the code
3. **Use the body** - Explain the "why" if it's not obvious
4. **Reference issues** - Always link related issues in the footer

### Breaking Changes

If your commit introduces breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api): change hero data structure

BREAKING CHANGE: Hero class constructor now requires rarity parameter
as the fourth argument instead of being optional.
```

---

**Generated with Claude Code** 🤖
