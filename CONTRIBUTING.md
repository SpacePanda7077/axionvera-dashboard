# Contributing to Axionvera Dashboard

Thank you for your interest in contributing to the Axionvera Dashboard! We strive to maintain a high standard of code quality and professional collaboration.

## 🛠 Development Setup

1. **Clone the repository**
2. **Install dependencies**: `npm install` (Ensure Node.js `v18+` and npm `v9+` are used)
3. **Set up Environment**: `cp .env.example .env.local` and fill in necessary variables.
4. **Start development server**: `npm run dev`

## 🌿 Branch Naming Convention

To maintain a clean and searchable git history, we follow a strict branching strategy:

| Prefix | Use Case | Example |
| :--- | :--- | :--- |
| `feat/` | New features or enhancements | `feat/staking-ui` |
| `fix/` | Bug fixes and patches | `fix/wallet-disconnect` |
| `docs/` | Documentation updates | `docs/api-ref` |
| `refactor/` | Code restructuring (no logic change) | `refactor/auth-hook` |
| `chore/` | Maintenance and dependencies | `chore/update-nextjs` |

## 🧪 Quality Standards

Before submitting a Pull Request, please ensure all checks pass:

```bash
npm run lint       # Linting check
npm run typecheck  # TypeScript validation
npm run test       # Unit and Integration tests
```

## 📝 Pull Request Guidelines

1. **Atomic Commits**: Keep commits focused and descriptive.
2. **Feature Branches**: Never commit directly to `main`.
3. **Linked Issues**: Reference the relevant issue number in your PR description.
4. **Documentation**: Update the README or inline docs if your changes affect public APIs or setup.

## 🛡 Security

If you discover a security vulnerability, please do NOT open a public issue. Email the maintainers at security@axionvera.network or contact us via our official channels.

---

*Axionvera - Standardizing open-source excellence on Stellar.*

