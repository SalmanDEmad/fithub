# Contributing to FitHub

## 1. Code of Conduct

All contributors must be respectful and constructive in interactions.

## 2. Reporting Issues

Use the issue tracker with:
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, version, device)
- Relevant logs or screenshots

## 3. Feature Requests

Open an issue with:
- Clear description and use case
- Why it would be beneficial
- Considered alternatives

## 4. Development Setup

```bash
git clone https://github.com/yourusername/fithub.git
cd fithub
yarn install
```

## 5. Branch Naming

```
feature/description
fix/description
docs/description
refactor/description
```

## 6. Code Standards

- TypeScript strict mode
- Follow existing code patterns
- Keep functions focused and testable
- ESLint and Prettier enforced

## 7. Commit Messages

```
[type]: [description]

Types:
feat:     New feature
fix:      Bug fix
docs:     Documentation
refactor: Code refactoring
test:     Tests
chore:    Dependencies, config

Example:
feat: Add weekly goal notifications
fix: Resolve QR scanner freeze on iOS
```

## 8. Testing

Write tests for new features:

```bash
cd apps/api && yarn test
cd apps/web && yarn test
```

## 9. Pull Request Process

1. Keep fork updated with upstream
2. Create PR with clear title and description
3. Reference related issues with #123
4. Include screenshots for UI changes
5. Address review feedback
6. Maintain clean commit history

## 10. Review Guidelines

PRs will be reviewed for:
- Code quality and style
- Test coverage
- Documentation
- Performance impact
- Breaking changes

## 11. Merge Requirements

- All checks passing
- At least one approval
- No unresolved discussions
- Merge with squash recommended

## 12. Project Structure

**apps/api** - Backend (NestJS, Prisma)  
**apps/web** - Frontend (Next.js, Tailwind)  
**apps/mobile** - Mobile (React Native)  
**packages/** - Shared code

## 13. Development Commands

```bash
yarn api:dev                      # Start API
yarn web:dev                      # Start web
cd apps/mobile && npx expo start  # Start mobile
yarn build:packages               # Build shared
```

## 14. Documentation

Update docs for:
- New features
- API changes
- Configuration updates
- Deployment changes

## 15. License Agreement

By contributing, you agree your work is licensed under MIT.

