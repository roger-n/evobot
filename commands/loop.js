const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { MessageEmbed } = require("discord.js");
const { EMBED_COLOR } = require("../util/Util");

module.exports = {
  name: "loop",
  aliases: ["l"],
  description: i18n.__("loop.description"),
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);

    const loopEmbed = new MessageEmbed().setColor(EMBED_COLOR);

    if (!queue) {
      loopEmbed.setDescription("Queue is empty");
    } else if (!canModifyQueue(message.member)) {
      loopEmbed.setDescription("User must be in the voice channel");
    } else {
      queue.loop = !queue.loop;
      loopEmbed.setDescription(queue.loop ? "Now looping the **queue**" : "Looping is now **disabled**");
    }

    return message.channel.send(loopEmbed);
  }
};
