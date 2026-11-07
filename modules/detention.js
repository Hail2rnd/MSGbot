
const { config, requireStaff, getTextOption, parseDuration, loadJson, saveJson, canManageRole } = require('../lib');
const storeFile = config.detentionStore;
const timers = new Map();
function loadStore() { return loadJson(storeFile, {}); }
function scheduleRestore(client, guildId, userId, expiresAt) {
  const key = `${guildId}:${userId}`;
  if (timers.has(key)) clearTimeout(timers.get(key));
  const wait = Math.max(0, expiresAt - Date.now());
  const timer = setTimeout(() => restoreDetention(client, guildId, userId).catch(console.error), Math.min(wait, 2_147_000_000));
  timer.unref?.();
  timers.set(key, timer);
}
async function restoreDetention(client, guildId, userId) {
  const store = loadStore();
  const key = `${guildId}:${userId}`;
  const record = store[key];
  if (!record) return;
  if (record.expiresAt > Date.now()) { scheduleRestore(client, guildId, userId, record.expiresAt); return; }
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  const member = guild && await guild.members.fetch(userId).catch(() => null);
  if (guild && member) {
    const detentionRole = guild.roles.cache.get(config.roles.detention);
    if (detentionRole && member.roles.cache.has(detentionRole.id) && canManageRole(guild, detentionRole)) await member.roles.remove(detentionRole, 'Detention period ended');
    const roles = record.roles.map(id => guild.roles.cache.get(id)).filter(role => canManageRole(guild, role));
    if (roles.length) await member.roles.add(roles, 'Restore roles after detention');
  }
  delete store[key]; saveJson(storeFile, store); timers.delete(key);
}
module.exports = {
  subcommand: sub => sub.setName('detention').setDescription('Detain a member for a set duration')
    .addUserOption(o => o.setName('user').setDescription('Member to detain').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for detention').setRequired(true).setMaxLength(1000))
    .addStringOption(o => o.setName('duration').setDescription('Duration in DD:HH:MM format').setRequired(true).setMaxLength(10)),
  async execute(interaction) {
    requireStaff(interaction);
    const targetUser = interaction.options.getUser('user', true);
    const reason = getTextOption(interaction, 'reason');
    const duration = getTextOption(interaction, 'duration');
    const durationMs = parseDuration(duration);
    const guild = interaction.guild;
    if (!guild) throw new Error('This command can only be used in a server.');
    const member = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) throw new Error('That member is not in this server.');
    if (member.id === interaction.user.id) throw new Error('You cannot detain yourself.');
    if (member.id === interaction.client.user.id) throw new Error('The bot cannot detain itself.');
    const detentionRole = guild.roles.cache.get(config.roles.detention);
    if (!detentionRole || !canManageRole(guild, detentionRole)) throw new Error('The bot cannot manage the Detention role. Move the bot role above Detention and grant Manage Roles.');
    const rolesToSave = member.roles.cache.filter(role => role.id !== guild.id && role.id !== detentionRole.id && canManageRole(guild, role)).map(role => role.id);
    const store = loadStore();
    const key = `${guild.id}:${member.id}`;
    const previous = store[key];
    const savedRoles = previous ? [...new Set([...previous.roles, ...rolesToSave])] : rolesToSave;
    const manageableCurrent = member.roles.cache.filter(role => role.id !== guild.id && role.id !== detentionRole.id && canManageRole(guild, role));
    if (manageableCurrent.size) await member.roles.remove(manageableCurrent, `Detention: ${reason}`);
    await member.roles.add(detentionRole, `Detention: ${reason}`);
    const expiresAt = Date.now() + durationMs;
    store[key] = { roles: savedRoles, expiresAt, reason, moderatorId: interaction.user.id };
    saveJson(storeFile, store);
    scheduleRestore(interaction.client, guild.id, member.id, expiresAt);
    await member.send(config.detentionNotice).catch(() => null);
    await interaction.reply({ content: `${member.user.tag} has been detained for ${duration}. Their manageable roles will be restored automatically.`, ephemeral: true });
  },
  restoreDetention,
  scheduleRestore
};
