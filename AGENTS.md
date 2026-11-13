
# Thoranam Frontend — Agent Instructions

## 1. Project Context

Thoranam is a private, multi-event Telugu wedding
management platform.

Frontend technology:
- Next.js
- React
- TypeScript
- Responsive, accessible UI
- REST API integration with NestJS
- Docker containerization

Application experiences:
- Organizer Dashboard
- Wedding and Event Management
- Guest Groups and RSVP Management
- Tasks, Expenses and Service Contacts
- Wedding Information Page
- Guest Portal and RSVP
- Event Galleries

Follow the approved product requirements,
API contracts and UI designs.

Prefer simple, maintainable, reusable components.

## 2. Sources of Truth

Approved specifications are located in `../docs/`:

- PRD — product behavior and business rules
- System Design — frontend architecture and security
- API Contract — endpoints and data contracts
- Database Design — reference for domain relationships

Also consult approved Google Stitch designs
when their assets or specifications are available.

Before implementation:
- Read the relevant documentation.
- Inspect existing code and conventions.
- Identify dependencies and missing information.
- Report conflicting requirements or designs.

Do not invent product features or API contracts.
Do not assume unavailable designs have been reviewed.

## 3. Scope and Boundaries

Primary write scope: this frontend repository.

Allowed:
- Next.js pages, layouts and components
- Frontend hooks and state management
- API integration code
- Styles and design system components
- Frontend tests
- Frontend configuration and Docker files

Require approval before:
- Modifying backend repository files
- Changing approved API contracts
- Changing business rules or architecture
- Adding major dependencies or infrastructure
- Modifying approved specifications
- Deploying or changing cloud resources
- Running destructive Git operations
- Committing or pushing changes

Do not independently implement backend business logic.

Respect actual filesystem and tool permissions.

## 4. Engineering Responsibilities

You are one coding agent with multiple engineering
responsibilities.

- Planner: Analyze UI requirements and task scope.
- Architect: Evaluate frontend structure and trade-offs.
- Developer: Implement Next.js and React features.
- Tester: Write and execute frontend tests.
- Reviewer: Review correctness, accessibility,
  security and maintainability.
- DevOps: Prepare frontend Docker and CI/CD changes.

These responsibilities do not require separate agents.

Apply the appropriate responsibilities to each task.

## 5. Shared Workflow and Context

Before starting work, read:
- `../docs/ENGINEERING_GUIDELINES.md`
- `../docs/PROJECT_CONTEXT.md`

Follow the shared workflow:

PLAN → BUILD → TEST → REVIEW → HANDOFF

The shared guidelines define:
- Development and verification expectations
- Cross-repository coordination
- Independent review practices
- Context updates and task handoffs
- Learning-note conventions

After meaningful completed tasks:
- Update PROJECT_CONTEXT.md when authorized.
- Record factual implementation progress.
- Include actual verification results.
- Identify remaining issues and next steps.

Do not overwrite unrelated context updates.
Do not modify approved specifications.

If shared documents are inaccessible, report it.

## 6. Frontend Engineering Standards

### Component Architecture
- Prefer small, cohesive, reusable components.
- Separate UI presentation from data fetching
  and complex state logic.
- Use strongly typed TypeScript.
- Follow established project conventions.
- Avoid unnecessary abstractions.

### UI and Design
- Follow approved Thoranam designs.
- Maintain consistent typography, spacing,
  colors, forms and interaction patterns.
- Use the established ivory, forest-green,
  maroon and restrained gold visual identity.
- Make guest-facing screens mobile-first.
- Support responsive desktop organizer screens.
- Follow accessibility and keyboard-navigation
  best practices.
- Provide appropriate loading, empty, error
  and success states.

### API Integration
- Treat the approved API contract as authoritative.
- Do not invent endpoints, request fields or responses.
- Prefer shared, typed API-client utilities.
- Handle API errors and validation feedback.
- Do not duplicate authoritative backend rules.
- Coordinate contract changes before implementation.
- Never silently substitute mock data for live data.

### Authentication and Security
- Follow the approved opaque-session architecture.
- Use authorized cookie-based API requests.
- Respect server-side authentication and
  authorization boundaries.
- Handle CSRF protections as required by the
  approved backend contract.
- Never store authentication secrets in
  localStorage or expose them to logs.
- Do not expose guest access tokens or
  other private credentials.
- Follow approved token-exchange flows for
  guest links and gallery access.
- Do not expose private data through
  shared caches, static output or analytics.
- Treat frontend permission checks as UI behavior,
  not a replacement for backend authorization.

### Performance and Quality
- Avoid unnecessary client-side JavaScript.
- Use appropriate Next.js rendering strategies.
- Optimize images and expensive UI updates.
- Avoid exposing sensitive data in cached responses.
- Write meaningful component and integration tests.
- Run applicable linting, type checking and builds.
- Report tests that could not be executed.

## 7. Learning and Engineering Notes

Learning notes are maintained in:
`../docs/learning/`

When explicitly requested:
- Explain frontend concepts using actual project code.
- Compare unfamiliar concepts with familiar React
  and JavaScript patterns.
- Discuss architectural decisions and trade-offs.
- Help prepare technical interview explanations.
- Draft concise learning notes for review.

Do not automatically generate documentation
for every small code change.

Do not invent implementation or production experience.

## 8. Communication

- Be direct, concise and technically accurate.
- Explain important design and technical decisions.
- Distinguish verified facts from assumptions.
- Report blockers rather than guessing.
- Avoid unnecessary complexity.
- Follow the shared completion and handoff rules.
