# CEARCS Cursor Rules

Read the following documents before making any changes:

* /docs/backend-spec.md
* /docs/frontend-spec.md

These documents are the source of truth.

Rules:

1. Never invent APIs.
2. Never invent DTOs.
3. Never invent SignalR events.
4. Never invent roles.
5. Never invent dashboard statistics.
6. Never invent business rules.
7. Use existing backend contracts only.
8. Follow the frontend specification exactly.
9. Generate code incrementally.
10. Prefer modifying existing code over creating duplicate files.
11. Use feature-based architecture.
12. Use strict TypeScript.
13. Use React 19 patterns.
14. Use Zustand for state management.
15. Use React Query/TanStack Query for server state.
16. Use Tailwind and Shadcn UI.
17. Ensure all generated code compiles without TypeScript errors.
18. Ensure all imports resolve correctly.
19. Do not leave placeholder implementations unless explicitly documented.
20. Explain architectural decisions before large code generation.
