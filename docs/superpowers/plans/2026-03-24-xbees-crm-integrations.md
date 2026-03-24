# X-Bees CRM Integrations Platform - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-CRM integration platform for X-Bees that displays CRM contacts inside X-Bees chat/search, starting with Odoo as the first integration.

**Architecture:** Next.js App Router with per-integration client pages and server-side API route proxies. An adapter pattern abstracts each CRM behind a common interface, so adding a new integration means implementing a new adapter + login form without touching shared code. Credentials are encrypted client-side using a server-provided key and stored in X-Bees storage, then decrypted server-side when proxying API calls.

**Tech Stack:** Next.js 15 (App Router), React 18, TypeScript, MUI 5, `@wildix/xbees-connect`, `@wildix/xbees-connect-react`, Biome (linter), Vitest (testing), deployed on Vercel at `integrations.compalab.dev`.

---

## Architecture Decision: Next.js over Vite

The template uses Vite, but **Next.js is the better choice** for this project because:

1. **Built-in API routes** — The CORS proxy is a core requirement. Next.js API routes (`app/api/proxy/...`) eliminate the need for a separate backend server. With Vite, you'd need a standalone Express server or separate serverless functions.
2. **File-system routing** — Each integration gets its own URL path (`/odoo`, `/slope`) naturally via the `app/[integration]/page.tsx` pattern.
3. **Single deployment** — Both the iframe client code and the proxy API deploy as one unit on Vercel.
4. **The X-Bees connect library is client-only** — All X-Bees hooks and `Client` initialization happen in `"use client"` components, which Next.js handles fine. We don't lose any compatibility.

The main trade-off is slightly more complexity than Vite, but the proxy requirement alone justifies it.

## Authentication & Security Strategy

For integrations without SSO (like Odoo with API keys):

1. User enters credentials (Odoo URL, database name, API key) in the integration's login form
2. Client sends credentials to our `/api/proxy/[integration]/auth` endpoint
3. Server validates credentials against the CRM API
4. If valid, server encrypts credentials with AES-256-GCM using a server-side `ENCRYPTION_KEY` env var
5. Encrypted blob is returned to client, which stores it in X-Bees storage via `Client.saveToStorage()`
6. On every subsequent proxy request, client sends the encrypted blob in an `X-Credentials` header
7. Server decrypts and uses the credentials to call the CRM

**Why this approach:**
- No database needed (credentials live in X-Bees storage, encrypted)
- Server-side encryption key means the encrypted blob is useless without our server
- Credentials are never stored in plaintext on the client
- Stateless proxy — no server-side sessions to manage

## File Structure

```
xbees-integration/
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # Root layout (just html/body)
│   │   ├── page.tsx                            # Root redirect/info page
│   │   ├── api/
│   │   │   └── proxy/
│   │   │       └── odoo/
│   │   │           ├── auth/route.ts           # POST: validate & encrypt credentials
│   │   │           ├── search/route.ts         # GET: search contacts
│   │   │           └── contact/route.ts        # POST: create contact, GET: get contact
│   │   └── odoo/
│   │       └── page.tsx                        # Odoo iframe entry point
│   ├── core/
│   │   ├── types.ts                            # Shared types: Contact, ContactQuery, IntegrationConfig, etc.
│   │   ├── adapter.ts                          # IntegrationAdapter interface definition
│   │   ├── crypto.ts                           # Server-side AES-256-GCM encrypt/decrypt
│   │   └── proxy-utils.ts                      # Shared proxy helpers (decrypt credentials, error responses)
│   ├── integrations/
│   │   └── odoo/
│   │       ├── odoo-adapter.ts                 # Client-side: Odoo config, field mapping, URL builder
│   │       ├── odoo-api.ts                     # Server-side: Odoo JSON-RPC calls
│   │       ├── odoo-types.ts                   # Odoo-specific types (OdooCredentials, OdooPartner)
│   │       └── OdooLoginForm.tsx               # Odoo-specific login form
│   ├── components/
│   │   ├── IntegrationShell.tsx                # Main shell: X-Bees init, theme, viewport, auth guard
│   │   ├── ContactDetails.tsx                  # Display contact properties
│   │   ├── ContactEmpty.tsx                    # "No contact found" + create button
│   │   ├── ContactCreate.tsx                   # Create new contact form
│   │   ├── ContactProperty.tsx                 # Single property row (label + value + copy)
│   │   ├── ExternalLinkButton.tsx              # "Open in CRM" button
│   │   └── Loader.tsx                          # Loading spinner
│   ├── hooks/
│   │   ├── useXBeesInit.ts                     # Client.initialize + ready + auth state sync
│   │   ├── useCredentials.ts                   # Load/save encrypted credentials from X-Bees storage
│   │   └── useContactSearch.ts                 # Search contacts via proxy
│   └── lib/
│       └── xbees-handlers.ts                   # Register onSuggestContacts, onLookupAndMatchContact, etc.
├── next.config.ts
├── package.json
├── tsconfig.json
├── .env.local.example
├── biome.json
└── vitest.config.ts
```

## Adapter Interface

Each CRM integration implements this interface (client-side adapter):

```typescript
// src/core/adapter.ts
export interface LoginField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
}

export interface IntegrationAdapter {
  id: string;                           // "odoo", "slope", etc.
  name: string;                         // "Odoo", "Slope", etc.
  loginFields: LoginField[];            // Fields for the login form
  getContactUrl(contact: Contact, credentials: Record<string, string>): string;
  mapContactFields(contact: Contact): ContactDisplayField[];
}

export interface ContactDisplayField {
  label: string;
  value: string;
  variant?: 'text' | 'email' | 'phone' | 'link';
  onClick?: () => void;
}
```

Server-side, each integration provides API functions:

```typescript
// Pattern for each integration's server-side API
export async function validateCredentials(creds: OdooCredentials): Promise<boolean>;
export async function searchContacts(creds: OdooCredentials, query: string): Promise<Contact[]>;
export async function lookupContact(creds: OdooCredentials, query: ContactQuery): Promise<Contact | null>;
export async function createContact(creds: OdooCredentials, data: Partial<Contact>): Promise<Contact>;
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `biome.json`
- Create: `vitest.config.ts`
- Create: `.env.local.example`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/davide/Desktop/Progetti/xbees-integration
npx create-next-app@latest . --typescript --app --src-dir --tailwind=no --eslint=no --import-alias="@/*" --use-npm
```

Note: We use `--eslint=no` because we'll use Biome instead.

- [ ] **Step 2: Install dependencies**

```bash
npm install @wildix/xbees-connect @wildix/xbees-connect-react @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @biomejs/biome @types/node
```

Note: The IntegrationShell uses React state for view switching (no router needed inside the iframe).

- [ ] **Step 3: Configure Biome**

Create `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 120
  }
}
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Note: Also install the Vite React plugin as a dev dependency:
```bash
npm install -D @vitejs/plugin-react
```

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Create .env.local.example**

```
ENCRYPTION_KEY=your-32-byte-hex-key-here
```

- [ ] **Step 6: Update package.json scripts**

Add to `"scripts"`:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "biome check src",
  "lint:fix": "biome check --write src",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 7: Create root layout**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'X-Bees Integrations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create root page**

`src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main>
      <h1>X-Bees Integrations</h1>
      <p>This application serves CRM integrations for X-Bees.</p>
    </main>
  );
}
```

- [ ] **Step 9: Verify project builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with MUI, xbees-connect, Biome, Vitest"
```

---

## Task 2: Core Types & Adapter Interface

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/adapter.ts`

- [ ] **Step 1: Write test for types**

Create `src/core/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { Contact, ContactQuery, ContactDisplayField, EncryptedCredentials } from '../types';

describe('Core types', () => {
  it('should allow creating a Contact', () => {
    const contact: Contact = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      company: 'Acme Inc',
      externalUrl: 'https://crm.example.com/contact/1',
    };
    expect(contact.id).toBe('1');
    expect(contact.name).toBe('John Doe');
  });

  it('should allow creating a ContactQuery', () => {
    const query: ContactQuery = { email: 'john@example.com', phone: '+1234567890' };
    expect(query.email).toBe('john@example.com');
  });

  it('should allow partial Contact for creation', () => {
    const data: Partial<Contact> = { name: 'Jane', email: 'jane@example.com' };
    expect(data.name).toBe('Jane');
    expect(data.id).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/__tests__/types.test.ts
```

Expected: FAIL — module `../types` not found.

- [ ] **Step 3: Create core types**

`src/core/types.ts`:

```typescript
export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  externalUrl?: string;
  [key: string]: string | undefined;
}

export interface ContactQuery {
  email?: string;
  phone?: string;
}

export interface ContactDisplayField {
  label: string;
  value: string;
  variant?: 'text' | 'email' | 'phone' | 'link';
}

export interface EncryptedCredentials {
  encrypted: string;
  iv: string;
}

export interface LoginField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/core/__tests__/types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write test for adapter interface**

Create `src/core/__tests__/adapter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { IntegrationAdapter } from '../adapter';
import type { Contact, ContactDisplayField } from '../types';

describe('IntegrationAdapter interface', () => {
  it('should allow implementing a mock adapter', () => {
    const mockAdapter: IntegrationAdapter = {
      id: 'test',
      name: 'Test CRM',
      loginFields: [
        { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter key', required: true },
      ],
      getContactUrl: (contact: Contact) => `https://test.com/contact/${contact.id}`,
      mapContactFields: (contact: Contact): ContactDisplayField[] => [
        { label: 'Name', value: contact.name, variant: 'text' },
      ],
    };

    expect(mockAdapter.id).toBe('test');
    expect(mockAdapter.loginFields).toHaveLength(1);

    const contact: Contact = { id: '1', name: 'John' };
    expect(mockAdapter.getContactUrl(contact)).toBe('https://test.com/contact/1');
    expect(mockAdapter.mapContactFields(contact)).toEqual([
      { label: 'Name', value: 'John', variant: 'text' },
    ]);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run src/core/__tests__/adapter.test.ts
```

Expected: FAIL — module `../adapter` not found.

- [ ] **Step 7: Create adapter interface**

`src/core/adapter.ts`:

```typescript
import type { Contact, ContactDisplayField, LoginField } from './types';

export interface IntegrationAdapter {
  id: string;
  name: string;
  loginFields: LoginField[];
  getContactUrl(contact: Contact, credentials: Record<string, string>): string;
  mapContactFields(contact: Contact): ContactDisplayField[];
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
npx vitest run src/core/__tests__/adapter.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/core/
git commit -m "feat: add core types and IntegrationAdapter interface"
```

---

## Task 3: Server-Side Encryption Utilities

**Files:**
- Create: `src/core/crypto.ts`

- [ ] **Step 1: Write test for encryption**

Create `src/core/__tests__/crypto.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../crypto';

describe('crypto', () => {
  const testKey = 'a'.repeat(64); // 32-byte hex key

  it('should encrypt and decrypt a string', () => {
    const plaintext = JSON.stringify({ url: 'https://odoo.example.com', apiKey: 'secret123' });
    const encrypted = encrypt(plaintext, testKey);

    expect(encrypted.encrypted).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.encrypted).not.toBe(plaintext);

    const decrypted = decrypt(encrypted, testKey);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for same plaintext', () => {
    const plaintext = 'test data';
    const enc1 = encrypt(plaintext, testKey);
    const enc2 = encrypt(plaintext, testKey);
    expect(enc1.encrypted).not.toBe(enc2.encrypted);
  });

  it('should fail decryption with wrong key', () => {
    const plaintext = 'secret';
    const encrypted = encrypt(plaintext, testKey);
    const wrongKey = 'b'.repeat(64);

    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/__tests__/crypto.test.ts
```

Expected: FAIL — module `../crypto` not found.

- [ ] **Step 3: Implement encryption module**

`src/core/crypto.ts`:

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { EncryptedCredentials } from './types';

const ALGORITHM = 'aes-256-gcm';

export function encrypt(plaintext: string, hexKey: string): EncryptedCredentials {
  const key = Buffer.from(hexKey, 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encrypted: encrypted + ':' + authTag,
    iv: iv.toString('hex'),
  };
}

export function decrypt(data: EncryptedCredentials, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex');
  const iv = Buffer.from(data.iv, 'hex');
  const [encryptedText, authTag] = data.encrypted.split(':');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return key;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/core/__tests__/crypto.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/crypto.ts src/core/__tests__/crypto.test.ts
git commit -m "feat: add AES-256-GCM encryption utilities for credential storage"
```

---

## Task 4: Server-Side Proxy Utilities

**Files:**
- Create: `src/core/proxy-utils.ts`

- [ ] **Step 1: Write test for proxy utilities**

Create `src/core/__tests__/proxy-utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { decryptCredentials, errorResponse, successResponse } from '../proxy-utils';

describe('proxy-utils', () => {
  it('errorResponse should return a JSON Response with error', () => {
    const response = errorResponse('Something went wrong', 400);
    expect(response.status).toBe(400);
  });

  it('successResponse should return a JSON Response with data', () => {
    const response = successResponse({ contacts: [] });
    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/core/__tests__/proxy-utils.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement proxy utilities**

`src/core/proxy-utils.ts`:

```typescript
import { NextResponse } from 'next/server';
import { decrypt, getEncryptionKey } from './crypto';
import type { EncryptedCredentials } from './types';

export function decryptCredentials<T>(headerValue: string | null): T {
  if (!headerValue) {
    throw new Error('Missing credentials');
  }

  const parsed: EncryptedCredentials = JSON.parse(headerValue);
  const key = getEncryptionKey();
  const decrypted = decrypt(parsed, key);

  return JSON.parse(decrypted) as T;
}

export function errorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/core/__tests__/proxy-utils.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/proxy-utils.ts src/core/__tests__/proxy-utils.test.ts
git commit -m "feat: add proxy utility functions for credential decryption and responses"
```

---

## Task 5: Odoo Server-Side API Module

**Files:**
- Create: `src/integrations/odoo/odoo-types.ts`
- Create: `src/integrations/odoo/odoo-api.ts`

- [ ] **Step 1: Create Odoo types**

`src/integrations/odoo/odoo-types.ts`:

```typescript
export interface OdooCredentials {
  url: string;       // e.g. "https://mycompany.odoo.com"
  database: string;  // e.g. "mycompany"
  username: string;  // e.g. "admin@mycompany.com"
  apiKey: string;    // Odoo API key
}

export interface OdooPartner {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  mobile: string | false;
  company_name: string | false;
  street: string | false;
  city: string | false;
  website: string | false;
}

export const ODOO_PARTNER_FIELDS = [
  'id', 'name', 'email', 'phone', 'mobile',
  'company_name', 'street', 'city', 'website',
] as const;
```

- [ ] **Step 2: Write test for Odoo API**

Create `src/integrations/odoo/__tests__/odoo-api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapOdooPartnerToContact } from '../odoo-api';
import type { OdooPartner } from '../odoo-types';

describe('odoo-api', () => {
  describe('mapOdooPartnerToContact', () => {
    it('should map an Odoo partner to a Contact', () => {
      const partner: OdooPartner = {
        id: 42,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        mobile: '+0987654321',
        company_name: 'Acme Inc',
        street: '123 Main St',
        city: 'Springfield',
        website: 'https://acme.com',
      };
      const baseUrl = 'https://mycompany.odoo.com';

      const contact = mapOdooPartnerToContact(partner, baseUrl);

      expect(contact.id).toBe('42');
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@example.com');
      expect(contact.phone).toBe('+1234567890');
      expect(contact.company).toBe('Acme Inc');
      expect(contact.externalUrl).toBe('https://mycompany.odoo.com/web#id=42&model=res.partner&view_type=form');
    });

    it('should handle false values from Odoo', () => {
      const partner: OdooPartner = {
        id: 1,
        name: 'Jane',
        email: false,
        phone: false,
        mobile: '+111',
        company_name: false,
        street: false,
        city: false,
        website: false,
      };

      const contact = mapOdooPartnerToContact(partner, 'https://odoo.test');

      expect(contact.email).toBeUndefined();
      expect(contact.phone).toBe('+111');
      expect(contact.company).toBeUndefined();
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/integrations/odoo/__tests__/odoo-api.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Implement Odoo API module**

`src/integrations/odoo/odoo-api.ts`:

```typescript
import type { Contact, ContactQuery } from '@/core/types';
import type { OdooCredentials, OdooPartner } from './odoo-types';
import { ODOO_PARTNER_FIELDS } from './odoo-types';

export function mapOdooPartnerToContact(partner: OdooPartner, baseUrl: string): Contact {
  return {
    id: String(partner.id),
    name: partner.name,
    email: partner.email || undefined,
    phone: partner.phone || partner.mobile || undefined,
    company: partner.company_name || undefined,
    externalUrl: `${baseUrl}/web#id=${partner.id}&model=res.partner&view_type=form`,
  };
}

async function odooJsonRpc(
  url: string,
  service: string,
  method: string,
  args: unknown[],
): Promise<unknown> {
  const response = await fetch(`${url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service, method, args },
      id: Date.now(),
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || 'Odoo API error');
  }

  return data.result;
}

export async function odooAuthenticate(creds: OdooCredentials): Promise<number> {
  const uid = await odooJsonRpc(creds.url, 'common', 'authenticate', [
    creds.database,
    creds.username,
    creds.apiKey,
    {},
  ]);

  if (!uid || uid === false) {
    throw new Error('Invalid Odoo credentials');
  }

  return uid as number;
}

async function odooExecuteKw(
  creds: OdooCredentials,
  uid: number,
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<unknown> {
  return odooJsonRpc(creds.url, 'object', 'execute_kw', [
    creds.database,
    uid,
    creds.apiKey,
    model,
    method,
    args,
    kwargs,
  ]);
}

export async function searchOdooContacts(creds: OdooCredentials, query: string): Promise<Contact[]> {
  const uid = await odooAuthenticate(creds);

  const domain = query
    ? ['|', '|', '|',
        ['name', 'ilike', query],
        ['email', 'ilike', query],
        ['phone', 'ilike', query],
        ['mobile', 'ilike', query],
      ]
    : [];

  const partners = await odooExecuteKw(
    creds, uid, 'res.partner', 'search_read',
    [domain],
    { fields: [...ODOO_PARTNER_FIELDS], limit: 10 },
  ) as OdooPartner[];

  return partners.map((p) => mapOdooPartnerToContact(p, creds.url));
}

export async function lookupOdooContact(creds: OdooCredentials, query: ContactQuery): Promise<Contact | null> {
  const uid = await odooAuthenticate(creds);

  const conditions: unknown[][] = [];
  if (query.email) conditions.push(['email', '=', query.email]);
  if (query.phone) {
    conditions.push(['|', ['phone', '=', query.phone], ['mobile', '=', query.phone]]);
  }

  if (conditions.length === 0) return null;

  const domain = conditions.length > 1
    ? ['|', ...conditions.flat()]
    : conditions[0];

  const partners = await odooExecuteKw(
    creds, uid, 'res.partner', 'search_read',
    [domain],
    { fields: [...ODOO_PARTNER_FIELDS], limit: 1 },
  ) as OdooPartner[];

  return partners.length > 0 ? mapOdooPartnerToContact(partners[0], creds.url) : null;
}

export async function createOdooContact(
  creds: OdooCredentials,
  data: Partial<Contact>,
): Promise<Contact> {
  const uid = await odooAuthenticate(creds);

  const partnerData: Record<string, unknown> = {};
  if (data.name) partnerData.name = data.name;
  if (data.email) partnerData.email = data.email;
  if (data.phone) partnerData.phone = data.phone;
  if (data.company) partnerData.company_name = data.company;

  const newId = await odooExecuteKw(
    creds, uid, 'res.partner', 'create',
    [partnerData],
  ) as number;

  return {
    id: String(newId),
    name: data.name || '',
    email: data.email,
    phone: data.phone,
    company: data.company,
    externalUrl: `${creds.url}/web#id=${newId}&model=res.partner&view_type=form`,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/integrations/odoo/__tests__/odoo-api.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/integrations/odoo/
git commit -m "feat: add Odoo server-side API module with JSON-RPC and contact mapping"
```

---

## Task 6: Odoo Client-Side Adapter

**Files:**
- Create: `src/integrations/odoo/odoo-adapter.ts`

- [ ] **Step 1: Write test for Odoo adapter**

Create `src/integrations/odoo/__tests__/odoo-adapter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { odooAdapter } from '../odoo-adapter';

describe('odooAdapter', () => {
  it('should have correct id and name', () => {
    expect(odooAdapter.id).toBe('odoo');
    expect(odooAdapter.name).toBe('Odoo');
  });

  it('should define login fields for url, database, username, apiKey', () => {
    const fieldNames = odooAdapter.loginFields.map((f) => f.name);
    expect(fieldNames).toContain('url');
    expect(fieldNames).toContain('database');
    expect(fieldNames).toContain('username');
    expect(fieldNames).toContain('apiKey');
  });

  it('should generate correct external URL', () => {
    const url = odooAdapter.getContactUrl(
      { id: '42', name: 'Test' },
      { url: 'https://mycompany.odoo.com' },
    );
    expect(url).toBe('https://mycompany.odoo.com/web#id=42&model=res.partner&view_type=form');
  });

  it('should map contact fields for display', () => {
    const fields = odooAdapter.mapContactFields({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+123',
      company: 'Acme',
    });

    expect(fields.find((f) => f.label === 'Name')?.value).toBe('John Doe');
    expect(fields.find((f) => f.label === 'Email')?.variant).toBe('email');
    expect(fields.find((f) => f.label === 'Phone')?.variant).toBe('phone');
    expect(fields.find((f) => f.label === 'Company')?.variant).toBe('text');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/integrations/odoo/__tests__/odoo-adapter.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement Odoo adapter**

`src/integrations/odoo/odoo-adapter.ts`:

```typescript
import type { IntegrationAdapter } from '@/core/adapter';
import type { Contact, ContactDisplayField } from '@/core/types';

export const odooAdapter: IntegrationAdapter = {
  id: 'odoo',
  name: 'Odoo',

  loginFields: [
    { name: 'url', label: 'Odoo URL', type: 'url', placeholder: 'https://mycompany.odoo.com', required: true },
    { name: 'database', label: 'Database', type: 'text', placeholder: 'mycompany', required: true },
    { name: 'username', label: 'Username / Email', type: 'text', placeholder: 'admin@mycompany.com', required: true },
    { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Odoo API key', required: true },
  ],

  getContactUrl(contact: Contact, credentials: Record<string, string>): string {
    const baseUrl = credentials.url || '';
    return `${baseUrl}/web#id=${contact.id}&model=res.partner&view_type=form`;
  },

  mapContactFields(contact: Contact): ContactDisplayField[] {
    const fields: ContactDisplayField[] = [
      { label: 'Name', value: contact.name, variant: 'text' },
    ];

    if (contact.email) {
      fields.push({ label: 'Email', value: contact.email, variant: 'email' });
    }
    if (contact.phone) {
      fields.push({ label: 'Phone', value: contact.phone, variant: 'phone' });
    }
    if (contact.company) {
      fields.push({ label: 'Company', value: contact.company, variant: 'text' });
    }

    return fields;
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/integrations/odoo/__tests__/odoo-adapter.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/integrations/odoo/odoo-adapter.ts src/integrations/odoo/__tests__/odoo-adapter.test.ts
git commit -m "feat: add Odoo client-side adapter with login fields and contact mapping"
```

---

## Task 7: Proxy API Routes (Odoo)

**Files:**
- Create: `src/app/api/proxy/odoo/auth/route.ts`
- Create: `src/app/api/proxy/odoo/search/route.ts`
- Create: `src/app/api/proxy/odoo/contact/route.ts`

- [ ] **Step 1: Create auth proxy route**

`src/app/api/proxy/odoo/auth/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { encrypt, getEncryptionKey } from '@/core/crypto';
import { errorResponse, successResponse } from '@/core/proxy-utils';
import { odooAuthenticate } from '@/integrations/odoo/odoo-api';
import type { OdooCredentials } from '@/integrations/odoo/odoo-types';

export async function POST(request: NextRequest) {
  try {
    const credentials: OdooCredentials = await request.json();

    // Validate by attempting authentication
    await odooAuthenticate(credentials);

    // Encrypt credentials for client storage
    const key = getEncryptionKey();
    const encrypted = encrypt(JSON.stringify(credentials), key);

    return successResponse({ encrypted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return errorResponse(message, 401);
  }
}
```

- [ ] **Step 2: Create search proxy route**

`src/app/api/proxy/odoo/search/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { decryptCredentials, errorResponse, successResponse } from '@/core/proxy-utils';
import { searchOdooContacts } from '@/integrations/odoo/odoo-api';
import type { OdooCredentials } from '@/integrations/odoo/odoo-types';

export async function GET(request: NextRequest) {
  try {
    const credentials = decryptCredentials<OdooCredentials>(
      request.headers.get('x-credentials'),
    );
    const query = request.nextUrl.searchParams.get('query') || '';
    const contacts = await searchOdooContacts(credentials, query);

    return successResponse({ data: contacts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return errorResponse(message, 500);
  }
}
```

- [ ] **Step 3: Create contact proxy route**

`src/app/api/proxy/odoo/contact/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { decryptCredentials, errorResponse, successResponse } from '@/core/proxy-utils';
import { lookupOdooContact, createOdooContact } from '@/integrations/odoo/odoo-api';
import type { OdooCredentials } from '@/integrations/odoo/odoo-types';

export async function GET(request: NextRequest) {
  try {
    const credentials = decryptCredentials<OdooCredentials>(
      request.headers.get('x-credentials'),
    );
    const email = request.nextUrl.searchParams.get('email') || undefined;
    const phone = request.nextUrl.searchParams.get('phone') || undefined;
    const contact = await lookupOdooContact(credentials, { email, phone });

    return successResponse({ data: contact });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lookup failed';
    return errorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const credentials = decryptCredentials<OdooCredentials>(
      request.headers.get('x-credentials'),
    );
    const contactData = await request.json();
    const contact = await createOdooContact(credentials, contactData);

    return successResponse({ data: contact }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create failed';
    return errorResponse(message, 500);
  }
}
```

- [ ] **Step 4: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/
git commit -m "feat: add Odoo proxy API routes for auth, search, and contact CRUD"
```

---

## Task 8: Client-Side Hooks

**Files:**
- Create: `src/hooks/useCredentials.ts`
- Create: `src/hooks/useContactSearch.ts`
- Create: `src/hooks/useXBeesInit.ts`

- [ ] **Step 1: Implement useCredentials hook**

`src/hooks/useCredentials.ts`:

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import Client from '@wildix/xbees-connect';
import type { EncryptedCredentials } from '@/core/types';

const STORAGE_KEY_PREFIX = 'credentials_';

export function useCredentials(integrationId: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${integrationId}`;
  const [credentials, setCredentials] = useState<EncryptedCredentials | null>(null);
  const [rawCredentials, setRawCredentials] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = Client.getInstance().getFromStorage<EncryptedCredentials>(storageKey);
      const raw = Client.getInstance().getFromStorage<Record<string, string>>(`${storageKey}_raw`);
      if (stored) setCredentials(stored);
      if (raw) setRawCredentials(raw);
    } catch {
      // No stored credentials
    }
    setIsLoading(false);
  }, [storageKey]);

  const saveCredentials = useCallback(
    (encrypted: EncryptedCredentials, raw: Record<string, string>) => {
      Client.getInstance().saveToStorage(storageKey, encrypted);
      // Store a non-sensitive subset for URL building (just the base URL)
      const safeRaw: Record<string, string> = {};
      if (raw.url) safeRaw.url = raw.url;
      Client.getInstance().saveToStorage(`${storageKey}_raw`, safeRaw);
      setCredentials(encrypted);
      setRawCredentials(safeRaw);
    },
    [storageKey],
  );

  const clearCredentials = useCallback(() => {
    Client.getInstance().saveToStorage(storageKey, null);
    Client.getInstance().saveToStorage(`${storageKey}_raw`, null);
    setCredentials(null);
    setRawCredentials(null);
  }, [storageKey]);

  const isAuthenticated = credentials !== null;

  return { credentials, rawCredentials, isAuthenticated, isLoading, saveCredentials, clearCredentials };
}
```

- [ ] **Step 2: Implement useContactSearch hook**

`src/hooks/useContactSearch.ts`:

```typescript
'use client';

import { useCallback } from 'react';
import type { Contact, ContactQuery, EncryptedCredentials } from '@/core/types';

export function useContactSearch(integrationId: string, credentials: EncryptedCredentials | null) {
  const credHeader = credentials ? JSON.stringify(credentials) : '';

  const searchContacts = useCallback(
    async (query: string): Promise<Contact[]> => {
      if (!credentials) return [];

      const url = new URL(`/api/proxy/${integrationId}/search`, window.location.origin);
      url.searchParams.set('query', query);

      const response = await fetch(url.toString(), {
        headers: { 'x-credentials': credHeader },
      });

      if (!response.ok) return [];

      const result = await response.json();
      return result.data ?? [];
    },
    [integrationId, credHeader],
  );

  const lookupContact = useCallback(
    async (query: ContactQuery): Promise<Contact | null> => {
      if (!credentials) return null;

      const url = new URL(`/api/proxy/${integrationId}/contact`, window.location.origin);
      if (query.email) url.searchParams.set('email', query.email);
      if (query.phone) url.searchParams.set('phone', query.phone);

      const response = await fetch(url.toString(), {
        headers: { 'x-credentials': credHeader },
      });

      if (!response.ok) return null;

      const result = await response.json();
      return result.data ?? null;
    },
    [integrationId, credHeader],
  );

  const createContact = useCallback(
    async (data: Partial<Contact>): Promise<Contact | null> => {
      if (!credentials) return null;

      const response = await fetch(`/api/proxy/${integrationId}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-credentials': credHeader,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) return null;

      const result = await response.json();
      return result.data ?? null;
    },
    [integrationId, credHeader],
  );

  return { searchContacts, lookupContact, createContact };
}
```

- [ ] **Step 3: Implement useXBeesInit hook**

`src/hooks/useXBeesInit.ts`:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import Client from '@wildix/xbees-connect';
import type { Contact, ContactQuery, EncryptedCredentials } from '@/core/types';

interface UseXBeesInitOptions {
  isAuthenticated: boolean;
  onSearch: (query: string) => Promise<Contact[]>;
  onLookup: (query: ContactQuery) => Promise<Contact | null>;
  onStartUI: () => void;
}

export function useXBeesInit({ isAuthenticated, onSearch, onLookup, onStartUI }: UseXBeesInitOptions) {
  const initialized = useRef(false);
  // Use refs to avoid stale closures in event handlers registered once
  const isAuthRef = useRef(isAuthenticated);
  const onSearchRef = useRef(onSearch);
  const onLookupRef = useRef(onLookup);

  useEffect(() => { isAuthRef.current = isAuthenticated; }, [isAuthenticated]);
  useEffect(() => { onSearchRef.current = onSearch; }, [onSearch]);
  useEffect(() => { onLookupRef.current = onLookup; }, [onLookup]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    Client.initialize(() => {
      onStartUI();
    });

    const client = Client.getInstance();

    client.onSuggestContacts(async (query, resolve, reject) => {
      if (!isAuthRef.current) {
        return client.isNotAuthorized();
      }
      try {
        const contacts = await onSearchRef.current(query);
        resolve(contacts as unknown as import('@wildix/xbees-connect/dist-types/types').Contact[]);
      } catch (error) {
        reject(`${error}`);
      }
    });

    client.onLookupAndMatchContact(async (query, resolve, reject) => {
      if (!isAuthRef.current) {
        return client.isNotAuthorized();
      }
      try {
        const contact = await onLookupRef.current({
          email: query.email,
          phone: query.phone,
        });
        if (contact) {
          resolve(contact as unknown as import('@wildix/xbees-connect/dist-types/types').Contact);
        } else {
          reject('not found');
        }
      } catch (error) {
        reject(`${error}`);
      }
    });

    void client.ready();

    if (!isAuthRef.current) {
      void client.isNotAuthorized();
    } else {
      void client.isAuthorized();
    }
  }, []);

  // Sync auth state changes
  useEffect(() => {
    const client = Client.getInstance();
    if (isAuthenticated) {
      void client.isAuthorized();
    } else {
      void client.isNotAuthorized();
    }
  }, [isAuthenticated]);
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add client-side hooks for credentials, contact search, and X-Bees init"
```

---

## Task 9: Shared UI Components

**Files:**
- Create: `src/components/Loader.tsx`
- Create: `src/components/ContactProperty.tsx`
- Create: `src/components/ContactDetails.tsx`
- Create: `src/components/ContactEmpty.tsx`
- Create: `src/components/ContactCreate.tsx`
- Create: `src/components/ExternalLinkButton.tsx`
- Create: `src/components/IntegrationShell.tsx`

- [ ] **Step 1: Create Loader component**

`src/components/Loader.tsx`:

```tsx
'use client';

import { Box, CircularProgress } from '@mui/material';

export function Loader() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={4}>
      <CircularProgress size={24} />
    </Box>
  );
}
```

- [ ] **Step 2: Create ContactProperty component**

`src/components/ContactProperty.tsx`:

```tsx
'use client';

import { styled } from '@mui/material/styles';
import Link from '@mui/material/Link';
import { CopyInfoButton } from '@wildix/xbees-connect-react';
import Client from '@wildix/xbees-connect';

const PropertyRoot = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  padding: '8px 0',
  alignItems: 'center',
  ' .MuiSvgIcon-root': { display: 'none' },
  '&:hover .MuiSvgIcon-root': { display: 'inherit' },
});

const PropertyTitle = styled('div')({
  minWidth: '80px',
  maxWidth: '150px',
  fontSize: '13px',
  lineHeight: '20px',
});

const PropertyValueText = styled('div')({
  fontWeight: '500',
  fontSize: 13,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  lineHeight: '20px',
});

const PropertyValueLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 13,
  cursor: 'pointer',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
}));

const HoverContainer = styled('div')({
  display: 'flex',
  gap: 4,
  minWidth: 0,
  whiteSpace: 'nowrap',
});

interface ContactPropertyProps {
  label: string;
  value: string;
  variant?: 'text' | 'email' | 'phone' | 'link';
  href?: string;
}

export function ContactProperty({ label, value, variant = 'text', href }: ContactPropertyProps) {
  let valueEl: React.ReactNode;

  switch (variant) {
    case 'email':
      valueEl = (
        <PropertyValueLink href={`mailto:${value}`} underline="none" target="_blank" rel="noopener">
          {value}
        </PropertyValueLink>
      );
      break;
    case 'phone':
      valueEl = (
        <PropertyValueLink underline="none" onClick={() => Client.getInstance().startCall(value)}>
          {value}
        </PropertyValueLink>
      );
      break;
    case 'link':
      valueEl = (
        <PropertyValueLink href={href || value} underline="none" target="_blank" rel="noopener">
          {value}
        </PropertyValueLink>
      );
      break;
    default:
      valueEl = <PropertyValueText>{value}</PropertyValueText>;
  }

  return (
    <PropertyRoot>
      <PropertyTitle>{label}:</PropertyTitle>
      <HoverContainer>
        {valueEl}
        <CopyInfoButton value={value} size={20} />
      </HoverContainer>
    </PropertyRoot>
  );
}
```

- [ ] **Step 3: Create ExternalLinkButton component**

`src/components/ExternalLinkButton.tsx`:

```tsx
'use client';

import { Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface ExternalLinkButtonProps {
  url: string;
  label: string;
}

export function ExternalLinkButton({ url, label }: ExternalLinkButtonProps) {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<OpenInNewIcon />}
      href={url}
      target="_blank"
      rel="noopener"
      sx={{ mt: 1 }}
    >
      {label}
    </Button>
  );
}
```

Note: `@mui/icons-material` was already installed in Task 1 Step 2.

- [ ] **Step 4: Create ContactDetails component**

`src/components/ContactDetails.tsx`:

```tsx
'use client';

import { Stack, Divider } from '@mui/material';
import type { ContactDisplayField, Contact } from '@/core/types';
import { ContactProperty } from './ContactProperty';
import { ExternalLinkButton } from './ExternalLinkButton';

interface ContactDetailsProps {
  contact: Contact;
  fields: ContactDisplayField[];
  integrationName: string;
}

export function ContactDetails({ contact, fields, integrationName }: ContactDetailsProps) {
  return (
    <Stack spacing={0}>
      {fields.map((field) => (
        <ContactProperty
          key={field.label}
          label={field.label}
          value={field.value}
          variant={field.variant}
        />
      ))}
      <Divider sx={{ my: 1 }} />
      {contact.externalUrl && (
        <ExternalLinkButton
          url={contact.externalUrl}
          label={`Open in ${integrationName}`}
        />
      )}
    </Stack>
  );
}
```

- [ ] **Step 5: Create ContactEmpty component**

`src/components/ContactEmpty.tsx`:

```tsx
'use client';

import { Stack, Typography, Button } from '@mui/material';
import type { ContactQuery } from '@/core/types';

interface ContactEmptyProps {
  query: ContactQuery;
  onCreateClick: () => void;
}

export function ContactEmpty({ query, onCreateClick }: ContactEmptyProps) {
  return (
    <Stack spacing={1} alignItems="center" p={2}>
      <Typography variant="subtitle1">No contact found for</Typography>
      {query.email && <Typography variant="body2">{query.email}</Typography>}
      {query.phone && <Typography variant="body2">{query.phone}</Typography>}
      <Button variant="contained" size="small" onClick={onCreateClick}>
        Create contact
      </Button>
    </Stack>
  );
}
```

- [ ] **Step 6: Create ContactCreate component**

`src/components/ContactCreate.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Stack, TextField, Button, Typography } from '@mui/material';
import { useViewPortEffect } from '@wildix/xbees-connect-react';
import type { Contact, ContactQuery } from '@/core/types';

interface ContactCreateProps {
  query: ContactQuery;
  existingContact?: Contact | null;
  onSubmit: (data: Partial<Contact>) => Promise<void>;
}

export function ContactCreate({ query, existingContact, onSubmit }: ContactCreateProps) {
  useViewPortEffect();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    await onSubmit({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      company: formData.get('company') as string,
    });

    setIsSubmitting(false);
  };

  return (
    <Stack spacing={1} p={1}>
      <Typography variant="subtitle1">
        {existingContact ? 'Edit contact' : 'Create new contact'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={1.5}>
          <TextField
            required
            fullWidth
            size="small"
            name="name"
            label="Name"
            defaultValue={existingContact?.name}
          />
          <TextField
            fullWidth
            size="small"
            name="email"
            label="Email"
            defaultValue={existingContact?.email ?? query.email}
          />
          <TextField
            fullWidth
            size="small"
            name="phone"
            label="Phone"
            defaultValue={existingContact?.phone ?? query.phone}
          />
          <TextField
            fullWidth
            size="small"
            name="company"
            label="Company"
            defaultValue={existingContact?.company}
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={isSubmitting}
          >
            {existingContact ? 'Update' : 'Create'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
```

- [ ] **Step 7: Create IntegrationShell component**

`src/components/IntegrationShell.tsx`:

```tsx
'use client';

import { StrictMode, useState, useCallback, useEffect } from 'react';
import { ThemeProvider as XBeesThemeProvider, useViewPortEffect } from '@wildix/xbees-connect-react';
import { CssBaseline } from '@mui/material';
import Client from '@wildix/xbees-connect';

import type { IntegrationAdapter } from '@/core/adapter';
import type { Contact, ContactQuery } from '@/core/types';
import { useCredentials } from '@/hooks/useCredentials';
import { useContactSearch } from '@/hooks/useContactSearch';
import { useXBeesInit } from '@/hooks/useXBeesInit';
import { ContactDetails } from './ContactDetails';
import { ContactEmpty } from './ContactEmpty';
import { ContactCreate } from './ContactCreate';
import { Loader } from './Loader';

interface IntegrationShellProps {
  adapter: IntegrationAdapter;
  LoginForm: React.ComponentType<{
    onSuccess: (encrypted: { encrypted: string; iv: string }, raw: Record<string, string>) => void;
  }>;
}

function IntegrationContent({ adapter, LoginForm }: IntegrationShellProps) {
  const { credentials, rawCredentials, isAuthenticated, isLoading, saveCredentials, clearCredentials } = useCredentials(adapter.id);
  const { searchContacts, lookupContact, createContact } = useContactSearch(adapter.id, credentials);
  const [uiReady, setUiReady] = useState(false);
  const [context, setContext] = useState<ContactQuery | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [view, setView] = useState<'loading' | 'details' | 'empty' | 'create' | 'login'>('loading');

  useXBeesInit({
    isAuthenticated,
    onSearch: searchContacts,
    onLookup: lookupContact,
    onStartUI: () => setUiReady(true),
  });

  // Load context and find contact on auth
  const loadContact = useCallback(async () => {
    if (!isAuthenticated) {
      setView('login');
      return;
    }

    try {
      const contextMessage = await Client.getInstance().getContext();
      const query = contextMessage?.payload?.contact;

      if (!query) {
        setView('empty');
        return;
      }

      setContext(query);
      const found = await lookupContact({ email: query.email, phone: query.phone });

      if (found) {
        setContact(found);
        setView('details');
        void Client.getInstance().contactUpdated(query, found as unknown as import('@wildix/xbees-connect/dist-types/types').Contact);
      } else {
        setView('empty');
      }
    } catch {
      setView('empty');
    }
  }, [isAuthenticated, lookupContact]);

  // Trigger on auth change or UI ready
  useEffect(() => {
    if (uiReady || !isLoading) {
      void loadContact();
    }
  }, [uiReady, isLoading, loadContact]);

  if (isLoading) return <Loader />;

  if (!isAuthenticated || view === 'login') {
    return (
      <LoginForm
        onSuccess={(encrypted, raw) => {
          saveCredentials(encrypted, raw);
          void loadContact();
        }}
      />
    );
  }

  if (view === 'loading') return <Loader />;

  if (view === 'create') {
    return (
      <ContactCreate
        query={context || {}}
        existingContact={contact}
        onSubmit={async (data) => {
          const created = await createContact(data);
          if (created) {
            setContact(created);
            setView('details');
          }
        }}
      />
    );
  }

  if (view === 'details' && contact) {
    const fields = adapter.mapContactFields(contact);
    return (
      <ContactDetails
        contact={contact}
        fields={fields}
        integrationName={adapter.name}
      />
    );
  }

  return (
    <ContactEmpty
      query={context || {}}
      onCreateClick={() => setView('create')}
    />
  );
}

export function IntegrationShell({ adapter, LoginForm }: IntegrationShellProps) {
  useViewPortEffect();

  return (
    <StrictMode>
      {/* ThemeProvider from xbees-connect-react syncs MUI theme with X-Bees (colors, typography, dark/light mode) */}
      <XBeesThemeProvider>
        <IntegrationContent adapter={adapter} LoginForm={LoginForm} />
      </XBeesThemeProvider>
    </StrictMode>
  );
}
```

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/
git commit -m "feat: add shared UI components for contact display, creation, and integration shell"
```

---

## Task 10: Odoo Login Form

**Files:**
- Create: `src/integrations/odoo/OdooLoginForm.tsx`

- [ ] **Step 1: Implement Odoo login form**

`src/integrations/odoo/OdooLoginForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Stack, TextField, Button, Typography, Alert } from '@mui/material';
import { useViewPortEffect } from '@wildix/xbees-connect-react';
import { odooAdapter } from './odoo-adapter';

interface OdooLoginFormProps {
  onSuccess: (encrypted: { encrypted: string; iv: string }, raw: Record<string, string>) => void;
}

export function OdooLoginForm({ onSuccess }: OdooLoginFormProps) {
  useViewPortEffect();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw: Record<string, string> = {};
    odooAdapter.loginFields.forEach((field) => {
      raw[field.name] = (formData.get(field.name) as string) || '';
    });

    try {
      const response = await fetch('/api/proxy/odoo/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(raw),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Authentication failed');
        return;
      }

      onSuccess(result.encrypted, raw);
    } catch {
      setError('Connection failed. Please check the Odoo URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack spacing={2} p={2} alignItems="center">
      <Typography variant="h6" align="center">
        Connect to Odoo
      </Typography>
      <Typography variant="body2" align="center" color="text.secondary">
        Enter your Odoo credentials to get started
      </Typography>

      {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <Stack spacing={1.5}>
          {odooAdapter.loginFields.map((field) => (
            <TextField
              key={field.name}
              required={field.required}
              fullWidth
              size="small"
              name={field.name}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
            />
          ))}
          <Button type="submit" variant="contained" size="small" disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/integrations/odoo/OdooLoginForm.tsx
git commit -m "feat: add Odoo login form component"
```

---

## Task 11: Odoo Integration Page

**Files:**
- Create: `src/app/odoo/page.tsx`

- [ ] **Step 1: Create Odoo page**

`src/app/odoo/page.tsx`:

```tsx
'use client';

import { IntegrationShell } from '@/components/IntegrationShell';
import { odooAdapter } from '@/integrations/odoo/odoo-adapter';
import { OdooLoginForm } from '@/integrations/odoo/OdooLoginForm';

export default function OdooPage() {
  return <IntegrationShell adapter={odooAdapter} LoginForm={OdooLoginForm} />;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Manual test plan**

To test the integration locally:

1. Run `npm run dev`
2. Set up ngrok: `ngrok http 3000`
3. Register the ngrok URL in WMS under PBX > Integrations > Cloud Integrations > x-bees Client Integrations
4. Set the iframe URL to `<ngrok-url>/odoo`
5. Open X-Bees and verify:
   - Login form appears for unauthenticated users
   - After entering valid Odoo credentials, contact lookup works
   - Contact details display correctly (name, email, phone, company)
   - "Open in Odoo" button opens the correct Odoo URL
   - "Create contact" flow works when no match is found
   - Contact search suggestions work in X-Bees search

- [ ] **Step 4: Commit**

```bash
git add src/app/odoo/
git commit -m "feat: add Odoo integration page wiring adapter and login form"
```

---

## Task 12: X-Bees Event Handlers (handleSystemStart)

**Files:**
- Create: `src/lib/xbees-handlers.ts`

This module registers the global X-Bees event handlers (onSuggestContacts, onLookupAndMatchContact, onLookupAndMatchBatchContacts, onStorage, onLogout) following the pattern from the template's `handleSystemStart.ts`. The IntegrationShell already handles most of this via the `useXBeesInit` hook, but this file provides the standalone initialization for cases where the shell isn't rendering yet.

- [ ] **Step 1: Refactor useXBeesInit to support batch contacts**

Update `src/hooks/useXBeesInit.ts` to add `onLookupAndMatchBatchContacts` support:

Add after the `onLookupAndMatchContact` handler:

```typescript
client.onLookupAndMatchBatchContacts(async (queries, returnResults) => {
  if (!isAuthRef.current) {
    return client.isNotAuthorized();
  }

  const resultsMap = new Map();
  const searchPromises = queries.map(async (query) => {
    try {
      const contact = await onLookupRef.current({ email: query.email, phone: query.phone });
      return { query, contact };
    } catch {
      return { query, contact: null };
    }
  });

  const results = await Promise.all(searchPromises);
  results.forEach(({ query, contact }) => {
    resultsMap.set(query, contact);
  });

  returnResults(resultsMap);
});

client.onLogout(() => {
  // Will be handled by credentials hook clearing
});

void client.createContactIsSupported();
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useXBeesInit.ts
git commit -m "feat: add batch contact lookup and logout handlers to X-Bees init"
```

---

## Task 13: Vercel Deployment Configuration

**Files:**
- Create: `vercel.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Create vercel.json**

```json
{
  "rewrites": [
    { "source": "/proxy/:path*", "destination": "/api/proxy/:path*" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "ALLOWALL" },
        { "key": "Content-Security-Policy", "value": "frame-ancestors *" }
      ]
    }
  ]
}
```

Note: `X-Frame-Options: ALLOWALL` and `frame-ancestors *` are required because X-Bees loads our app in an iframe. In production, restrict to specific X-Bees domains.

- [ ] **Step 2: Update next.config.ts for iframe support**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 3: Set environment variables on Vercel**

In the Vercel dashboard, add:
- `ENCRYPTION_KEY`: Generate with `openssl rand -hex 32`

- [ ] **Step 4: Deploy**

```bash
npx vercel --prod
```

Verify that `integrations.compalab.dev/odoo` loads correctly.

- [ ] **Step 5: Commit**

```bash
git add vercel.json next.config.ts
git commit -m "chore: add Vercel deployment config with iframe headers and proxy rewrites"
```

---

## Task 14: Run All Tests

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Run linter**

```bash
npx biome check src
```

Expected: No errors.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Fix any issues found**

Address any test failures, lint errors, or build issues.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: ensure all tests pass, linting clean, build succeeds"
```

---

## Adding a New Integration (Future Reference)

To add a new CRM integration (e.g., Slope), create these files:

1. **`src/integrations/slope/slope-types.ts`** — CRM-specific types
2. **`src/integrations/slope/slope-api.ts`** — Server-side API calls
3. **`src/integrations/slope/slope-adapter.ts`** — Client-side adapter implementing `IntegrationAdapter`
4. **`src/integrations/slope/SlopeLoginForm.tsx`** — Login form component
5. **`src/app/api/proxy/slope/auth/route.ts`** — Auth proxy route
6. **`src/app/api/proxy/slope/search/route.ts`** — Search proxy route
7. **`src/app/api/proxy/slope/contact/route.ts`** — Contact CRUD proxy route
8. **`src/app/slope/page.tsx`** — Integration page

The shared components (`IntegrationShell`, `ContactDetails`, `ContactEmpty`, `ContactCreate`, `ContactProperty`, `ExternalLinkButton`) and hooks (`useCredentials`, `useContactSearch`, `useXBeesInit`) are reused unchanged.
