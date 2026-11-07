
const { config, getTextOption, makeEmbed, sendToChannel } = require('../lib');
module.exports = {
  subcommand: sub => sub.setName('help').setDescription('Request help from the moderation team')
    .addStringOption(o => o.setName('message').setDescription('Describe what you need help with').setRequired(true).setMaxLength(2000)),
  async execute(interaction) {
    const message = getTextOption(interaction, 'message');
    const roles = interaction.member?.roles?.cache;
    let sector = 'Sector not specified';
    if (roles?.has(config.roles.sectorA)) sector = 'from Sector-a';
    else if (roles?.has(config.roles.sectorB)) sector = 'from Sector-b';
    const embed = makeEmbed(`HELP REQUEST FROM ${interaction.user.username}`, `**Message:** ${message}\n\n**${sector}**`, interaction.user);
    await sendToChannel(interaction.client, config.channels.help, { content: `<@&${config.roles.moderation}>`, embeds: [embed], allowedMentions: { users: [interaction.user.id], roles: [config.roles.moderation] } });
    await interaction.reply({ content: 'Your help request was sent.', ephemeral: true });
  }
};
