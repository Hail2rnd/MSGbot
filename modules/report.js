
const { config, getTextOption, makeEmbed, sendToChannel } = require('../lib');
module.exports = {
  subcommand: sub => sub.setName('report').setDescription('Report a member to the moderation team')
    .addUserOption(o => o.setName('user').setDescription('Member being reported').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('What happened?').setRequired(true).setMaxLength(2000)),
  async execute(interaction) {
    const reported = interaction.options.getUser('user', true);
    if (reported.id === interaction.user.id) throw new Error('You cannot report yourself.');
    const message = getTextOption(interaction, 'message');
    const embed = makeEmbed('REPORT REQUEST', `**From:** ${interaction.user}\n**Message:** ${message}\n**Reported:** ${reported}`, interaction.user);
    await sendToChannel(interaction.client, config.channels.reports, { content: `<@&${config.roles.adm}> <@&${config.roles.moderation}>`, embeds: [embed], allowedMentions: { users: [interaction.user.id, reported.id], roles: [config.roles.adm, config.roles.moderation] } });
    await interaction.reply({ content: 'Your report was sent to the moderation team.', ephemeral: true });
  }
};
