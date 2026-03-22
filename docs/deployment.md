# Deployment

## Goals
This project has two deployment targets:
- the web application and API, deployed with Docker
- the Android application, distributed as an APK with a user-approved self-update flow

The deployment approach should remain simple, reproducible, and understandable by the team.

## Deployment Principles
- one clear build pipeline per target
- reproducible builds
- environment-specific configuration
- safe database migration handling
- clear rollback options
- no hidden release logic
- update flows that respect user consent

## Web Deployment with Docker

### Recommended Shape
Deploy the system as separate containers:
- frontend web app
- backend API
- database
- reverse proxy if needed

This can be handled with Docker Compose for simpler environments and later adapted to orchestration if scale requires it.

### Suggested Services
- `web`: frontend static app or server-rendered frontend
- `api`: Express backend
- `db`: PostgreSQL
- `proxy`: optional Nginx or Traefik

### Environment Variables
Typical deployment variables:
```env
NODE_ENV=production
DATABASE_URL=
SESSION_SECRET=
LLM_API_KEY=
LLM_MODEL=
API_BASE_URL=
APP_BASE_URL=
```

Keep secrets out of source control. Use secret injection through the deployment platform.

## Dockerfile Guidance

### Frontend
Use a multi-stage build:
1. install dependencies with pnpm
2. build the frontend
3. serve the result from a lightweight runtime image

If the frontend is static, Nginx is a good final image. If server-side behavior is added later, use an application runtime instead.

### Backend
Use a multi-stage build:
1. install dependencies
2. compile TypeScript
3. run the production build in a smaller image

The final runtime image should only include:
- production dependencies
- built output
- runtime configuration

### Example Deployment Philosophy
- build once
- promote the same image through environments when possible
- avoid environment-specific code paths in the image
- configure behavior through environment variables

## Docker Compose Direction
A practical starting setup can include:
- API container connected to PostgreSQL
- web container exposed publicly
- reverse proxy for TLS termination if needed
- persistent volume for database storage

Do not pack everything into one container. Keep boundaries clear.

## Development Compose
For local development, it is reasonable to start with a smaller Compose setup that runs only PostgreSQL while the web app and API continue to run from local source with `pnpm dev`.

That keeps:
- database state reproducible
- the frontend/backend edit loop fast
- migrations easy to test before production container work starts

## Reverse Proxy and TLS
For public deployment:
- terminate TLS at a reverse proxy or load balancer
- route frontend and API traffic clearly
- set appropriate security headers
- configure compression and caching intentionally

## Database Migrations
Handle schema migrations explicitly during deployment.

Recommended rule:
- migrations run as a deliberate deployment step, not hidden inside normal application startup

This avoids:
- unclear startup failures
- multiple containers racing migrations
- unexpected schema changes

## Logging and Monitoring
At minimum, monitor:
- API availability
- frontend availability
- database health
- error rates
- response time
- LLM failure rate
- Android update check failures if applicable

Logs should be structured and searchable.

## Web Release Flow
A practical release flow:
1. run tests
2. build Docker images
3. push tagged images
4. deploy to staging
5. run smoke tests
6. apply migrations
7. deploy to production
8. verify health checks
9. monitor errors

## Rollback Strategy
Plan rollback before first production launch.

Minimum rollback capability:
- redeploy previous image tags
- restore database backups when truly needed
- keep migration strategy conservative and reversible where possible

## Android APK Deployment

## Packaging Approach
The Android app will be created from the web frontend using Capacitor.

Recommended release pipeline:
1. build the web app
2. sync Capacitor assets
3. build the Android project
4. generate signed APK or AAB
5. publish the release artifact
6. publish update metadata for the app to consume

## Signing
Android signing must be managed carefully:
- keep the keystore secure
- do not commit signing files to the repository
- store signing credentials in a secure CI secret store
- document the signing process clearly for team continuity

## Distribution Options
Possible distribution models:
- direct APK distribution from your own infrastructure
- managed enterprise distribution if relevant
- app store distribution later if desired

If using direct APK distribution, the app must guide users clearly through installation and updates.

## Self-Update Requirement
The Android application should support self-update with explicit user acceptance.

This means:
- the app checks whether a newer version is available
- the app presents release information to the user
- the user chooses whether to download and install
- the app never forces silent installation outside platform rules

On Android, true silent installation is generally restricted. The correct product behavior is a guided user-approved update flow.

## Recommended Self-Update Design

### 1. Version Metadata Endpoint
Host a version manifest on your backend or static release host.

Example fields:
- latest version
- minimum supported version
- release notes
- APK download URL
- checksum or signature metadata
- release date
- rollout flags if needed

Example shape:
```json
{
  "latestVersion": "1.3.0",
  "minimumSupportedVersion": "1.1.0",
  "releaseNotes": [
    "Improved correction feedback",
    "Added new review exercise variants"
  ],
  "apkUrl": "https://example.com/releases/app-1.3.0.apk",
  "apkSha256": "checksum-here",
  "publishedAt": "2026-03-21T10:00:00Z"
}
```

### 2. Client Update Check
The app checks the manifest:
- on app start
- on settings screen
- optionally at reasonable intervals

Do not check excessively.

### 3. User Prompt
If a new version exists, show:
- current version
- available version
- short release notes
- update size if available
- whether the update is recommended or required

The user must explicitly accept download and installation.

### 4. Secure Download
Download the APK from a trusted HTTPS source.
Before prompting install:
- verify checksum if provided
- validate integrity
- handle partial or failed downloads clearly

### 5. Installation Handoff
After download and verification, prompt the user to install through the Android package installer.

The platform will require user interaction to complete installation. That is expected and correct.

## Required vs Recommended Updates
Support two update modes:

### Recommended update
The user can continue using the app and update later.

### Required update
Used only when necessary, such as:
- incompatible API changes
- critical security issue
- unsupported app version

Even in required-update mode, installation still requires user consent through platform mechanisms. The app can block continued use after communicating the reason if the version is below minimum supported level.

## Update UX Guidelines
- be transparent about what changed
- never surprise-install
- allow deferral for non-critical updates
- explain why an update is required when applicable
- show download and verification status clearly
- recover gracefully from failure

## Security Rules for APK Updates
- serve manifests and APKs over HTTPS
- verify downloaded artifact integrity
- keep release artifacts immutable
- sign builds consistently
- never trust update metadata from insecure sources
- log update failures for diagnostics

## Backend Support for Updates
The backend or release infrastructure should provide:
- current release manifest
- downloadable APK assets
- release notes
- checksum metadata
- minimum supported version flag

This can be hosted:
- directly by the API
- on object storage with CDN
- through a dedicated release service

## Suggested Release Separation
Treat these as separate concerns:
- web release
- API release
- Android release metadata
- Android binary artifact publishing

They can be coordinated in one pipeline, but should remain logically distinct.

## CI/CD Recommendations
A practical CI/CD design:
- run lint and tests on every merge
- build Docker images for web and API
- publish images with version tags
- build signed Android artifacts on release workflows
- publish APK and update manifest together
- keep release notes versioned

## Versioning
Use one visible application version strategy across the product where possible.

A simple approach:
- semantic versioning for releases
- backend compatibility rules documented explicitly
- Android manifest and web release notes aligned to the same release number when appropriate

## Operational Checklist
Before release:
- tests pass
- migrations reviewed
- environment variables validated
- Docker images built and tagged
- APK signed
- update manifest published
- release notes written
- rollback path confirmed

After release:
- verify web availability
- verify API health
- verify database migration state
- verify Android update detection
- verify APK download integrity
- verify install handoff works on a test device

## Documentation Rule
Every production deployment process should be runnable by another developer from documentation alone. Keep deployment scripts and release steps boring, explicit, and easy to audit.
