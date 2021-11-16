const { canModifyQueue } = require("../util/Util");
const { MessageEmbed } = require("discord.js");
const { EMBED_COLOR } = require("../util/Util");
const i18n = require("../util/i18n");

const pattern = /^[0-9]*(\s*,\s*[0-9]*)*$/;

module.exports = {
  name: "remove",
  aliases: ["rm"],
  description: i18n.__("remove.description"),
  execute(message, args) {
    const queue = message.client.queue.get(message.guild.id);

    const removeEmbed = new MessageEmbed()
      .setDescription(`Usage: ${message.client.prefix}remove <Queue Number>`)
      .setColor(EMBED_COLOR);

    const arguments = args.join("");

    if (!queue) {
      removeEmbed.setDescription("Queue is empty")
    } else if (!canModifyQueue(message.member)) {
      removeEmbed.setDescription("User must be in the voice channel");
    } else if (arguments && pattern.test(arguments)) {
      const songs = arguments.split(",").map((arg) => parseInt(arg));
      let removed = [];
      queue.songs = queue.songs.filter((item, index) => {
        if (songs.find((songIndex) => songIndex - 1 === index)) removed.push(item);
        else return true;
      });

      if (removed.length) {
        removeEmbed.setDescription(
          `Removed ${removed.map((song) => `[${song.title}](${song.url})`).join(", ")} [${message.author}]`
        )        
      } else {
        removeEmbed.setDescription(
          `Unable to remove song(s)`
        )
      }

    }
    
    return message.channel.send(removeEmbed);
  }
};
