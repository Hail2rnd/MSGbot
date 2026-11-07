
const { config, requireStaff, getTextOption, makeEmbed, sendToChannel } = require('../lib');
module.exports = {
  subcommand: sub => sub.setName('news').setDescription('Publish a server news post')
    .addStringOption(o => o.setName('title').setDescription('News title').setRequired(true).setMaxLength(256))
    .addStringOption(o => o.setName('message').setDescription('News text').setRequired(true).setMaxLength(4000))
    .addAttachmentOption(o => o.setName('image').setDescription('Optional image to include')),
  async execute(interaction) {
    requireStaff(interaction);
    const title = getTextOption(interaction, 'title');
    const message = getTextOption(interaction, 'message');
    const image = interaction.options.getAttachment('image');
    const embed = makeEmbed(title, message);
    if (image && image.contentType?.startsWith('image/')) embed.setImage(image.url);
    await sendToChannel(interaction.client, config.channels.news, { embeds: [embed] });
    await interaction.reply({ content: 'News published.', ephemeral: true });
  }
};
