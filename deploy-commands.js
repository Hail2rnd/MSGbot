require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) throw new Error('Set DISCORD_TOKEN and CLIENT_ID in .env.');
const modules = fs.readdirSync(path.join(__dirname, 'modules')).filter(f => f.endsWith('.js')).map(f => require(path.join(__dirname, 'modules', f)));
const msg = new SlashCommandBuilder().setName('msg').setDescription('Send a news post, detention, report, or help request');
for (const module of modules) msg.addSubcommand(module.subcommand);
const commands = [msg.toJSON()];
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);
  await rest.put(route, { body: commands });
  console.log(`Registered ${commands.length} MSG Guy slash commands${process.env.GUILD_ID ? ' in the configured server' : ' globally'}.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
