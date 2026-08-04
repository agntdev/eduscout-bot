# StudyCrafter — Bot specification

**Archetype:** education

**Voice:** student-friendly and encouraging — write every user-facing message, button label, error, and empty state in this voice.

Telegram bot for discovering, organizing, and downloading educational resources with free tier and premium subscription features. Admins manage content via Telegram with real-time alerts. Mobile-first interface with search, bookmarks, and study tracking.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- students
- educators
- self-learners

## Success criteria

- 1000+ active monthly users
- 200+ premium subscriptions
- 5000+ curated educational resources

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu with categorized entry points and search bar
- **Home** (button, actor: user, callback: home:main) — Show categorized resource entry points and search bar
- **Search** (button, actor: user, callback: search:init) — Open natural language search interface with filters
- **Bookmarks** (button, actor: user, callback: bookmarks:list) — Show saved resources with sync status
- **History** (button, actor: user, callback: history:list) — Show recently viewed resources with progress tracking
- **admin:login** (button, actor: admin, callback: admin:login) — Secure admin interface for resource management

## Flows

### Resource browsing
_Trigger:_ home:main

1. Show category grid
2. Filter by class/subject
3. Show paginated resource list
4. View resource metadata
5. Bookmark/download resource

_Data touched:_ Resource, User Profile

### Admin upload
_Trigger:_ admin:upload

1. Confirm admin privileges
2. Receive file
3. Detect duplicates
4. Set metadata
5. Categorize resource

_Data touched:_ Resource, Admin

### Premium access
_Trigger:_ download:confirm

1. Check subscription status
2. Show premium gate
3. Process Telegram payment
4. Grant download access

_Data touched:_ User Profile, Resource

## Owner-supplied settings

The OWNER provides these; they are collected in chat and injected into the environment at deploy. Read each one from the environment where it is used (`ctx.env.<KEY>` / `env.<KEY>` on Cloudflare Workers; `process.env.<KEY>` only as a Node/harness fallback — never the sole read). Do NOT invent your own way of learning the value, do NOT ask for it in a bot message, and do NOT hardcode a default.

- **ADMIN_CHAT_ID** — Receive urgent admin notifications
  - this is the OWNER's own chat id; the platform already knows it. Read `ADMIN_CHAT_ID` via `ctx.env` (prefer toolkit `adminChatId` / `requireOwner`) — never ask a user, never treat whoever writes first as the admin, never invent claim-admin or open manage for everyone.
  - may be UNSET at runtime: the bot must still start, and the feature needing ADMIN_CHAT_ID must say so plainly instead of failing.
- **OPENAI_API_KEY** — Power search and content suggestions
  - may be UNSET at runtime: the bot must still start, and the feature needing OPENAI_API_KEY must say so plainly instead of failing.

Your behavioral specs run WITHOUT these values, so no spec may depend on one.

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

An entity that merely NAMES an owner-supplied setting above (an admin chat, an API account) is not something to store or discover — read it from the environment.

- **Resource** _(retention: persistent)_ — Educational content with metadata
  - fields: id, title, type, file_id, size, format, class, subject, premium_flag
- **User Profile** _(retention: persistent)_ — User account and subscription data
  - fields: telegram_id, premium_until, bookmarks
- **Broadcast** _(retention: persistent)_ — Scheduled notifications
  - fields: target_segment, message

## Integrations

- **Telegram Bot API** (required) — Messaging, payments, file storage
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Manage resources via Telegram
- Approve manual payments
- Schedule broadcasts
- Monitor analytics

## Notifications

- New resource alerts
- Premium subscription reminders
- Broadcast previews

## Permissions & privacy

- End-to-end encryption for file transfers
- User consent for data storage
- Anonymous analytics tracking

## Edge cases

- Duplicate file detection
- Large file download confirmation
- Payment gateway failures

## Required tests

- End-to-end search flow
- Premium access gate
- Admin upload workflow

## Assumptions

- Owner provides Telegram ID for admin alerts
- Moderators appointed via admin command
- OpenAI API handles search ranking
