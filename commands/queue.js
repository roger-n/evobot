const { MessageEmbed } = require("discord.js");
const i18n = require("../util/i18n");
const { EMBED_COLOR } = require("../util/Util");

module.exports = {
  name: "queue",
  cooldown: 5,
  aliases: ["q"],
  description: i18n.__("queue.description"),
  async execute(message) {
    const permissions = message.channel.permissionsFor(message.client.user);

    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.channel.send(i18n.__("queue.errorNotQueue"));

    let currentPage = 0;
    const embeds = generateQueueEmbed(message, queue.songs);

    const queueEmbed = await message.channel.send(
      `**${i18n.__mf("queue.currentPage")} ${currentPage + 1}/${embeds.length}**`,
      embeds[currentPage]
    );

    try {
      await queueEmbed.react("⬅️");
      // await queueEmbed.react("⏹");
      await queueEmbed.react("➡️");
    } catch (error) {
      console.error(error);
      message.channel.send(error.message).catch(console.error);
    }

    const filter = (reaction, user) =>
      ["⬅️", "⏹", "➡️"].includes(reaction.emoji.name) && message.author.id === user.id;
    const collector = queueEmbed.createReactionCollector(filter, { time: 60000 });

    collector.on("collect", async (reaction, user) => {
      try {
        if (reaction.emoji.name === "➡️") {
          if (currentPage < embeds.length - 1) {
            currentPage++;
            queueEmbed.edit(
              i18n.__mf("queue.currentPage", { page: currentPage + 1, length: embeds.length }),
              embeds[currentPage]
            );
          }
        } else if (reaction.emoji.name === "⬅️") {
          if (currentPage !== 0) {
            --currentPage;
            queueEmbed.edit(
              i18n.__mf("queue.currentPage", { page: currentPage + 1, length: embeds.length }),
              embeds[currentPage]
            );
          }
        } else {
          collector.stop();
          reaction.message.reactions.removeAll();
        }
        // If bot lacks role to manage members' emotes, error 50013 thrown (handled below)
        await reaction.users.remove(message.author.id);
      } catch (error) {
        if (error.code === 50013) {
          console.log("Bot missing permissions to remove members' emotes");
        } else {
          console.error(error);
          return message.channel.send(error.message).catch(console.error);
        }
      }
    });
  }
};

function generateQueueEmbed(message, queue) {
  let embeds = [];
  let k = 10;

  for (let i = 0; i < queue.length; i += 10) {
    const current = queue.slice(i, k);
    let j = i;
    k += 10;

    const info = current.map((track) => `${++j} - [${track.title}](${track.url})`).join("\n");

    const embed = new MessageEmbed()
      .setTitle(i18n.__("queue.embedTitle"))
      .setThumbnail(message.guild.iconURL())
      .setColor(EMBED_COLOR)
      .setDescription(
        i18n.__mf("queue.embedCurrentSong", { title: queue[0].title, url: queue[0].url, info: info })
      );
    embeds.push(embed);
  }

  return embeds;
}
