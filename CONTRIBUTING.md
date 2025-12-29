# Contributing to Registry

Thank you for contributing to the ZK Email Registry!

## Branch Strategy

This project uses three environment branches:

| Branch    | Purpose                          | Deploys to       |
|-----------|----------------------------------|------------------|
| `main`    | Production-ready code            | Production       |
| `staging` | QA and validation                | Staging          |
| `dev`     | Active development               | Development      |

## Workflow

### New Features

Features flow upward through environments:

```
dev ← feature branch
  ↓ merge (when feature complete)
staging (QA/validation)
  ↓ merge (when approved)
main (production)
```

1. Create a feature branch from `dev`
2. Develop and test locally
3. Open a PR to `dev`
4. Once merged, changes deploy to the development environment
5. When ready for QA, merge `dev` into `staging`
6. After validation, merge `staging` into `main` for production release

### Bug Fixes (Hotfixes)

Production bugs are fixed in `main` first, then propagated downward:

```
main ← hotfix branch
  ↓ merge/cherry-pick
staging
  ↓ merge/cherry-pick
dev
```

1. Create a hotfix branch from `main`
2. Fix the bug and open a PR to `main`
3. Once merged and deployed, cherry-pick or merge the fix into `staging`
4. Cherry-pick or merge the fix into `dev`

This ensures production issues are resolved quickly while keeping all environments in sync.

## Key Guidelines

### Do

- Use feature branches for all changes
- Write clear, descriptive commit messages
- Keep PRs focused and reasonably sized
- Test your changes locally before opening a PR
- Merge `main` back into `dev` periodically to prevent drift

### Don't

- Rebase shared branches (`main`, `staging`, `dev`) - use merges instead
- Push directly to environment branches without a PR
- Leave environments out of sync after hotfixes

## Getting Started

1. Clone the repository
2. Install dependencies: `bun install`
3. Start the development server: `bun run dev`
4. Create a feature branch: `git checkout -b feature/your-feature dev`

## Questions?

If you have questions about the contribution process, please open an issue or reach out to the maintainers.
