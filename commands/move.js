const move = require("array-move");
const { canModifyQueue } = require("../util/Util");
const i18n = require("../util/i18n");
const { MessageEmbed } = require("discord.js");
const { EMBED_COLOR } = require("../util/Util");

module.exports = {
  name: "move",
  aliases: ["mv"],
  description: i18n.__("move.description"),
  execute(message, args) {
    const queue = message.client.queue.get(message.guild.id);

    const moveEmbed = new MessageEmbed()
      .setDescription(`Usage: ${message.client.prefix}move <Source> <Destination (Optional: Default 2)>`)
      .setColor(EMBED_COLOR);

    if (!queue) {
      moveEmbed.setDescription("Queue is empty");
    } else if (!canModifyQueue(message.member)) {
      moveEmbed.setDescription("User must be in the voice channel");
    } else if (!isNaN(args[0]) && args[0] > queue.songs.length) {
      moveEmbed.setDescription("Song index is out of bounds");
    } else if (args.length && !(isNaN(args[0]) || args[0] <= 1)) {
      let song = queue.songs[args[0] - 1];

      queue.songs = move(queue.songs, args[0] - 1, !args[1] || args[1] == 1 ? 1 : args[1] - 1);

      moveEmbed.setDescription(
        `Moved **${song.title}** to position **${!args[1] || args[1] == 1 ? 2 : args[1]}**`
      );
    }
    return message.channel.send(moveEmbed);
  }
};
