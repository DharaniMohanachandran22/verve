# Testing Strategy

Verve employs a multi-layered testing strategy to ensure the reliability and stability of the application.

## 🧪 Testing Layers

### 1. Unit Testing
- **Goal**: Validate the logic of individual functions, methods, and classes.
- **Frontend**: Tested using [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
- **Backend**: Tested using the built-in [NestJS Testing Utilities](https://docs.nestjs.com/fundamentals/testing).

### 2. Integration Testing
- **Goal**: Verify that multiple components or modules work together as expected.
- **Focus**: Testing the interaction between Services and Repositories (Database Layer).

### 3. E2E (End-to-End) Testing
- **Goal**: Simulate real user interactions and validate the entire system flow.
- **Backend**: Tested using [Supertest](https://github.com/visionmedia/supertest) for API integration tests.

---

## 🏃 Running Tests

### Backend (Server)
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Code coverage
npm run test:cov
```

### Frontend (Client)
```bash
# Unit tests
npm run test
```

---

## 📈 Best Practices
- **Isolation**: Each test should be independent and not rely on the state of other tests.
- **Descriptive Naming**: Use clear `describe` and `it` blocks (e.g., `it('should return 401 if token is invalid', ...)`).
- **Mocks & Spies**: Use mocks for external dependencies (e.g., Mailer service) to ensure tests are fast and reliable.
