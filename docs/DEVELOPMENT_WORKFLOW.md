# Development Workflow

This document outlines the standards and processes for contributing to the Verve project.

## Git Standards

### Commit Messages
We follow the **Conventional Commits** specification. This ensures a clean and readable history.

**Format**: `<type>(<scope>): <description>`

**Common Types**:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting (no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build tasks, package updates, etc.

**Example**:
```text
feat(boards): implement collaborative board editing
```

### Branching Strategy
- `main`: Production-ready code.
- `develop`: Integration branch for new features.
- `feature/[name]`: New feature development.
- `fix/[name]`: Bug fixes.

---

## Coding Standards

### General Principles
- **DRY** (Don't Repeat Yourself): Extract common logic into utilities or hooks.
- **KISS** (Keep It Simple, Stupid): Prefer readable code over complex "clever" solutions.
- **Clean Code**: Use descriptive variable and function names.

### Frontend (Next.js)
- Use functional components and hooks.
- Prefer Tailwind CSS classes over inline styles or CSS modules.
- Ensure all business logic is separated from UI components.

### Backend (NestJS)
- Follow the modular architecture (`[feature].module.ts`).
- Use DTOs (Data Transfer Objects) for request validation.
- Implement business logic in Services, not Controllers.

---

## Pull Request Process
1.  Create a feature branch from `develop`.
2.  Implement your changes and add tests.
3.  Ensure all tests pass locally.
4.  Open a Pull Request with a clear description of the changes.
5.  Address any review comments before merging.
