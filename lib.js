const fs = require('node:fs');
const path = require('node:path');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('./config');

const STAFF_ROLE_IDS = [config.roles.adm, config.roles.moderation, config.roles.queque];
function hasAnyRole(member, ids) {
  return Boolean(member?.roles?.cache?.some(role => ids.includes(role.id)));
}
function requireStaff(interaction) {
  if (!hasAnyRole(interaction.member, STAFF_ROLE_IDS)) {
    throw new Error('This action is restricted to the Adm, Moderation, and Queque roles.');
  }
}
function getTextOption(interaction, name) {
  return interaction.options.getString(name, true).trim();
}
function parseDuration(input) {
  const match = /^(\d{1,3}):(\d{2}):(\d{2})$/.exec(input);
  if (!match) throw new Error('Duration must use DD:HH:MM (for example, 00:02:30).');
  const days = Number(match[1]);
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  if (hours > 23 || minutes > 59 || (days === 0 && hours === 0 && minutes === 0)) {
    throw new Error('Use a valid, non-zero DD:HH:MM duration.');
  }
  const ms = (((days * 24) + hours) * 60 + minutes) * 60 * 1000;
  if (ms > 365 * 24 * 60 * 60 * 1000) throw new Error('Detention cannot exceed 365 days.');
  return ms;
}
function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
function saveJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, file);
}
function makeEmbed(title, description, user) {
  const embed = new EmbedBuilder().setColor(0x5865F2).setTitle(title).setDescription(description).setTimestamp();
  if (user) embed.setThumbnail(user.displayAvatarURL({ size: 256 }));
  return embed;
}
async function sendToChannel(client, channelId, payload) {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased() || !channel.send) throw new Error(`Configured destination channel ${channelId} is unavailable or not a text channel.`);
  return channel.send(payload);
}
function canManageRole(guild, role) {
  const me = guild.members.me;
  return role && !role.managed && role.id !== guild.id && me?.permissions.has(PermissionFlagsBits.ManageRoles) && role.position < me.roles.highest.position;
}
module.exports = { config, STAFF_ROLE_IDS, hasAnyRole, requireStaff, getTextOption, parseDuration, loadJson, saveJson, makeEmbed, sendToChannel, canManageRole };
