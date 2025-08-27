# Contributing to EiQ™ Platform

## Development Process

### Change Management
1. **Create Issue**: Use appropriate issue template for changes
2. **Classification**: All changes are classified as:
   - **Feature addition** (feat): New functionality
   - **Enhancement** (enhance): Improvements to existing features
   - **Bug fix** (fix): Error corrections
   - **Integration** (integrate): Third-party integrations
   - **Documentation** (docs): Documentation updates

### Approval Workflow
- **Small Changes**: Direct implementation with peer review
- **Medium Changes**: Technical review required
- **Large Changes**: Architecture review and stakeholder approval

### Quality Gates
- All code must pass automated tests
- Accessibility compliance (WCAG 2.1 AA) validation
- Database migrations must be tested
- Documentation updates for API changes

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL (via Neon serverless)

### Installation
```bash
pnpm install
npm run db:push
npm run dev
```

### Testing
```bash
# Run all tests
pnpm test

# Run accessibility tests
pnpm test:a11y

# Run integration tests
pnpm test:integration
```

## Code Standards

### TypeScript
- Strict type checking enabled
- Use proper type annotations
- Avoid `any` types

### React Components
- Use functional components with hooks
- Include proper data-testid attributes
- Maintain accessibility standards

### Database
- Use Drizzle ORM for all database operations
- Never modify ID column types
- Use `npm run db:push --force` for schema changes

## MVP-7 Certification Requirements
All contributions must maintain:
- Internationalization support (5 languages)
- Accessibility compliance (WCAG 2.1 AA)
- Multi-tenant architecture compatibility
- Audit logging and compliance standards
- Production-ready performance standards