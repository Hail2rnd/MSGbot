require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events, SlashCommandBuilder } = require('discord.js');
const { loadJson } = require('./lib');

if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is missing. Copy .env.example to .env and add your token.');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.commands = new Collection();
const modulesDir = path.join(__dirname, 'modules');
for (const file of fs.readdirSync(modulesDir).filter(name => name.endsWith('.js'))) {
  const module = require(path.join(modulesDir, file));
  if (typeof module.subcommand !== 'function' || typeof module.execute !== 'function') throw new Error(`Invalid command module: ${file}`);
  client.commands.set(file.slice(0, -3), module);
}
const msgCommand = new SlashCommandBuilder().setName('msg').setDescription('Send a news post, detention, report, or help request');
for (const module of client.commands.values()) msgCommand.addSubcommand(module.subcommand);
client.commandData = [msgCommand];

client.once(Events.ClientReady, async readyClient => {
  console.log(`MSG Guy online as ${readyClient.user.tag}; loaded ${client.commands.size} commands.`);
  const detention = client.commands.get('detention');
  if (detention) {
    const records = loadJson('./data/detentions.json', {});
    for (const [key, record] of Object.entries(records)) {
      const [guildId, userId] = key.split(':');
      detention.scheduleRestore(client, guildId, userId, record.expiresAt);
    }
  }
});
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'msg') return;
  const command = client.commands.get(interaction.options.getSubcommand());
  if (!command) return;
  try { await command.execute(interaction); }
  catch (error) {
    console.error(`[${interaction.commandName}]`, error);
    const message = error?.message || 'An unexpected error occurred.';
    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: message, ephemeral: true }).catch(() => null);
    else await interaction.reply({ content: message, ephemeral: true }).catch(() => null);
  }
});
client.login(process.env.DISCORD_TOKEN);
