# MSG Guy Discord Bot

Modular Discord bot with slash commands for news, detention, reports, and help requests. Each command is a separate file in `modules/`; `main.js` automatically loads every `.js` command module in that folder.

## Requirements
- Node.js 20.11 or newer
- A Discord application and bot
- Bot invited with `bot` and `applications.commands` scopes
- Bot role placed above roles it must remove/restore, including `Detention`
- Bot permissions: Manage Roles, View Channels, Send Messages, Embed Links, Read Message History
- Enable **Server Members Intent** in the Developer Portal

## Setup
1. Copy `.env.example` to `.env` and fill `DISCORD_TOKEN`, `CLIENT_ID`, and `GUILD_ID` (recommended for immediate command registration).
2. Install dependencies: `npm install`
3. Register slash commands: `npm run register`
4. Start the bot: `npm start`

Keep `.env` private. Never share the bot token.

## Commands
- `/msg news title message [image]` — staff roles only; posts an embed to the configured news channel.
- `/msg detention user reason duration` — staff roles only; duration format `DD:HH:MM`. Saves manageable member roles, applies Detention, then restores saved roles automatically when time expires. The member receives the fixed detention notice by DM. Active detentions persist across restarts in `data/detentions.json`.
- `/msg report user message` — available to members; sends an embed and pings Adm and Moderation in the reports channel.
- `/msg help message` — available to members; sends an embed and pings Moderation in the help channel. Sector-a takes precedence if a member has both sector roles.

## Important behavior and limitations
- Discord does not let a bot remove roles above or equal to its highest role, managed/integration roles, or `@everyone`. Those roles are left alone and cannot be restored by the bot.
- The bot stores/restores only roles it can manage. Keep its highest role above all member roles that should be temporarily removed.
- Detention role channel visibility and send permissions are configured in Discord, not by this bot.
- The bot sends the detention notice by DM. It does not post to a detention channel.
- This project uses a local JSON state file. Back up `data/detentions.json` along with the bot files.
- To add a command, add a module file in `modules/` exporting `subcommand(subcommandBuilder)` and `execute(interaction)`, then run `npm run register` again.

