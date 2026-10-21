# Connecting your API

The site is frontend-only today. Every page gets its data through one service layer, so connecting your existing API is a configuration and mapping job. No page or component has to change.

```
Pages / components
      │  api.coaches.list(), api.contact.send(form) …
      ▼
src/services/api.js  ──►  src/services/api/
                            config.js      reads VITE_API_* env vars, decides mock vs live per resource
                            endpoints.js   every URL path in one place
                            client.js      fetch wrapper: timeout, errors, response unwrapping
                            programs.js    ┐
                            coaches.js     │ one module per resource:
                            memberships.js │ mock data while offline, your API when live,
                            schedule.js    │ with a map*() function that converts your
                            contact.js     ┘ API's JSON into the shape the UI expects
      ▼
src/data/mock/*  (used only until a resource is switched to the API)
```

`src/services/catalog.js` holds the few static lookups that must render instantly (menu program names, route slugs, coach filter chips). ESLint blocks pages from importing `src/data/mock/` directly, so the boundary stays clean.

## Step by step

### 1. Set the base URL

Copy `.env.example` to `.env` (local) and set the same variables in your host's dashboard (Vercel → Settings → Environment Variables, Netlify → Site configuration → Environment variables):

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_SITE_URL=https://www.yourdomain.com
```

Vite bakes env vars into the bundle **at build time**, so redeploy after you change them.

### 2. Switch resources over one at a time (optional)

```bash
VITE_API_RESOURCES=coaches,contact
```

Only those resources use the API; the rest stay on mock data. Leave it empty to use the API for everything. Valid names: `programs`, `coaches`, `memberships`, `schedule`, `contact`.

### 3. Match the paths

Edit `src/services/api/endpoints.js`:

| Function | Default request |
|---|---|
| `api.programs.list()` | `GET /programs/` |
| `api.programs.get(slug)` | `GET /programs/<slug>/` |
| `api.coaches.list({ specialization, program })` | `GET /coaches/?specialization=…&program=…` |
| `api.coaches.get(slug)` | `GET /coaches/<slug>/` |
| `api.memberships.listPlans()` | `GET /membership-plans/` |
| `api.schedule.list({ program })` | `GET /schedule/?program=…` |
| `api.contact.send(form)` | `POST /contact/` |
| `api.contact.requestTrial(form)` | `POST /trial-requests/` |

Lists can be a bare array, Django REST Framework pagination (`{ results: [...] }`), or `{ data: [...] }` / `{ items: [...] }`. Single items can be bare or wrapped in `{ data: {...} }`.

### 4. Map field names

If your API's field names differ from the UI's, edit the `map*` function in that resource's module. Examples are already written in the comments:

| Resource | Mapper | UI shape reference |
|---|---|---|
| Programs | `mapProgram` in `programs.js` | `src/data/mock/programs.js` (header lists every section type) |
| Coaches | `mapCoach` in `coaches.js` | `src/data/mock/coaches.js` |
| Plans | `mapPlan` in `memberships.js` | `src/data/mock/memberships.js` |
| Schedule | `mapClass` in `schedule.js` | `src/data/mock/schedule.js` |
| Contact payload | `toPayload` in `contact.js` | — |

The contact payload sent today:

```json
{
  "name": "…", "phone": "…", "email": "…", "program": "boxing", "message": "…",
  "child_name": "…", "child_age": 9, "preferred_time": "…",
  "topic": "general | trial | parent", "source_page": "/contact",
  "website": ""
}
```

`website` is a honeypot field. Real visitors leave it empty, so your API should discard any submission where it's filled. `child_*` and `preferred_time` are only sent by the trial and parent forms.

### 5. What your API must return for forms

- **2xx**: the form shows "Message sent". This is the **only** path to a success message.
- **4xx with field errors**, e.g. DRF `{"phone": ["Enter a valid number."]}`: shown under the matching field.
- **4xx/5xx with `{ "detail": "…" }`, `{ "message": "…" }` or `{ "error": "…" }`**: shown as the error text.
- Network failure or timeout (`VITE_API_TIMEOUT_MS`): "Your message was not sent… try again".
- No API configured: "Your message has not been sent. Online messages are not connected yet", plus WhatsApp (pre-filled with what they typed) and a phone link.

### 6. Server-side requirements (on your API, not here)

- **CORS:** allow your site's origin. For Django, use `django-cors-headers` with `CORS_ALLOWED_ORIGINS = ["https://www.yourdomain.com"]`.
- **CSRF:** the contact endpoints are public POSTs from another origin. Exempt them from CSRF (for example with `@csrf_exempt`, or DRF with no `SessionAuthentication` on that view) and protect them with throttling instead.
- **Spam protection:** rate-limit by IP and drop honeypot hits. Add a CAPTCHA later if needed. Its *site* key can live in a `VITE_` var; its *secret* key stays on the server.
- **Delivery:** email, a database table, or WhatsApp Business API messages are all sent by your server. The browser never holds those credentials.

### 7. Cookies or auth headers

The public site needs no authentication. If your API still requires cookies, set `credentials: 'include'` in `src/services/api/config.js`. **Never** put API keys, tokens or passwords in `VITE_*` variables, because everything in them ships in public JavaScript.

### 8. New programs and coaches from the API

While `programs` or `coaches` are on mock data, unknown slugs go to the 404 page. Once a resource is live, any slug is allowed through and the page shows "not found" only if your API returns 404.

Menus and the build-time SEO pages still use `src/services/catalog.js` (the local program list). When you add a program in the API, add its slug, name and SEO text to `src/data/mock/programs.js` too, or generate that file from the API in a prebuild step.

## Testing the integration

```bash
npm test                 # includes API-layer tests with a mocked fetch
VITE_MOCK_DELAY_MS=1500 npm run dev   # preview loading skeletons on mock data
```

To preview error states, point `VITE_API_BASE_URL` at an address that doesn't exist (e.g. `http://localhost:9`) and reload. Each section shows its error panel with a **Try again** button.
