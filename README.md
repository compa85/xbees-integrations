# xbees-integrations

CRM integration platform for [X-Bees](https://www.x-bees.com/) by Wildix.

Each integration is loaded as an iframe inside X-Bees and allows you to:

- **Search contacts** during a chat or call
- **View contact details** (name, email, phone, company, …)
- **Open the contact** directly in the external app with one click
- **Create a new contact** in the CRM when no match is found

The app is hosted at **[x-bees.compalab.dev](https://x-bees.compalab.dev)**.

---

## Available integrations

| CRM                          | URL                              | Status       |
| ---------------------------- | -------------------------------- | ------------ |
| [Odoo](https://www.odoo.com) | `x-bees.compalab.dev/odoo` | ✅ Available |

---

## Architecture

```
xbees-integrations/
├── src/
│   ├── app/
│   │   ├── api/proxy/[integration]/   # Server-side proxy (resolves CORS)
│   │   └── [integration]/page.tsx     # iframe entry point for each CRM
│   ├── core/                          # Types, adapter interface, crypto, proxy utils
│   ├── integrations/[name]/           # CRM-specific logic
│   ├── components/                    # Shared UI (shell, contact display, forms)
│   └── hooks/                         # React hooks (credentials, search, X-Bees init)
```

**Stack:** Next.js 15, React 18, TypeScript, MUI 5, `@wildix/xbees-connect`, Vercel

### Credential security

Integrations without SSO (e.g. Odoo with an API key) use the following flow:

1. The user enters credentials in the login form
2. The server validates them against the CRM and encrypts them with **AES-256-GCM** using `ENCRYPTION_KEY`
3. The encrypted blob is stored in X-Bees storage (never in plaintext on the client)
4. Every proxy request sends the blob in the `x-credentials` header; the server decrypts it and calls the CRM

### Adding a new integration

1. Create `src/integrations/[name]/` with:
   - `[name]-types.ts` — CRM-specific types
   - `[name]-api.ts` — server-side CRM API calls
   - `[name]-adapter.ts` — implements `IntegrationAdapter` (client-side)
   - `[Name]LoginForm.tsx` — authentication form
2. Create `src/app/api/proxy/[name]/` with `auth`, `search`, and `contact` routes
3. Create `src/app/[name]/page.tsx` with `<IntegrationShell adapter={...} LoginForm={...} />`

---

## Local development

```bash
# Install dependencies
npm install

# Copy the example env file and generate a key
cp .env.local.example .env.local
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env.local

# Start the development server
npm run dev
```

To test the integration inside X-Bees, use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Register the ngrok URL in WMS > PBX > Integrations > x-bees Client Integrations
```

### Useful commands

| Command            | Description                  |
| ------------------ | ---------------------------- |
| `npm run dev`      | Start the development server |
| `npm run build`    | Production build             |
| `npm test`         | Run tests in watch mode      |
| `npm run test:run` | Run tests once               |
| `npm run lint`     | Check code with Biome        |
| `npm run lint:fix` | Auto-fix linting issues      |
