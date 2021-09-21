module.exports = {
  name: "leave",
  aliases: ["dc"],
  description: "Disconnect the bot",
  execute(message) {
    message.guild.me.voice.channel.leave();

    try {
      message.react("☑");
    } catch (error) {
      console.log(error);
    }
  }
};
