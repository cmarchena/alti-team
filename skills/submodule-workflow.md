# Git Submodule Workflow

Always commit submodules before updating the parent repository.

## Commit Order

### 1. Commit in Submodule

```bash
cd front  # or back
git add -A
git commit -m "feat: add new feature"
git push origin main
```

### 2. Commit Parent Repo

```bash
cd ..
git add front back
git commit -m "chore: update submodule references"
git push origin main
```

## Check Status

```bash
git submodule status
```

## Common Issues

If parent repo shows old commit hash:
1. Ensure submodule commit is pushed
2. Run `git submodule update --init --recursive`
3. Commit parent repo after update

## Key Points

- Submodule commits must be pushed BEFORE parent repo
- Parent repo stores commit references, not the code itself
- Always push in correct order to avoid broken references
