# Contributing to Registry

Thank you for contributing to the ZK Email Registry!

## Branch Strategy

This project uses two environment branches:

| Branch    | Purpose                          | Deploys to       |
|-----------|----------------------------------|------------------|
| `main`    | Production-ready code            | Production       |
| `staging` | Active development and QA        | Staging          |

## Workflow

### New Features

Features flow upward through environments:

```
staging ← feature branch
  ↓ merge (after QA validation)
main (production)
```

1. Create a feature branch from `staging`
2. Develop and test locally
3. Open a PR to `staging`
4. Once merged, changes deploy to staging for QA
5. After validation, merge `staging` into `main` for production release

### Bug Fixes (Hotfixes)

Production bugs are fixed in `main` first, then propagated back to `staging`:

```
main ← hotfix branch
  ↓ merge (to keep staging in sync)
staging
```

1. Create a hotfix branch from `main`
2. Fix the bug and open a PR to `main`
3. Once merged and deployed, merge `main` into `staging` so the two stay in sync

This ensures production issues are resolved quickly while keeping environments aligned.

## Key Guidelines

### Do

- Use feature branches for all changes
- Write clear, descriptive commit messages
- Keep PRs focused and reasonably sized
- Test your changes locally before opening a PR
- Merge `main` back into `staging` after a hotfix to prevent drift

### Don't

- Rebase shared branches (`main`, `staging`) - use merges instead
- Push directly to environment branches without a PR
- Leave `staging` out of sync with `main` after hotfixes

## Getting Started

1. Clone the repository
2. Install dependencies: `bun install`
3. Start the development server: `bun run dev`
4. Create a feature branch: `git checkout -b feature/your-feature staging`

## Questions?

If you have questions about the contribution process, please open an issue or reach out to the maintainers.
