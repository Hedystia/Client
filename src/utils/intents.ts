/**
 * Gateway Intents
 * @returns {number} The intents
 * @link https://discord.com/developers/docs/topics/gateway#gateway-intents
 */
enum GatewayIntents {
  guilds = 1 << 0,
  guildMembers = 1 << 1,
  guildModeration = 1 << 2,
  guildExpressions = 1 << 3,
  guildIntegrations = 1 << 4,
  guildWebhooks = 1 << 5,
  guildInvites = 1 << 6,
  guildVoiceStates = 1 << 7,
  guildPresences = 1 << 8,
  guildMessages = 1 << 9,
  guildMessageReactions = 1 << 10,
  guildMessageTyping = 1 << 11,
  directMessages = 1 << 12,
  directMessageReactions = 1 << 13,
  directMessageTyping = 1 << 14,
  messageContent = 1 << 15,
  guildScheduledEvents = 1 << 16,
  autoModerationConfiguration = 1 << 20,
  autoModerationExecution = 1 << 21,
  guildMessagePolls = 1 << 24,
  directMessagePolls = 1 << 25,

  allNonPrivileged = GatewayIntents.guilds |
    GatewayIntents.guildModeration |
    GatewayIntents.guildExpressions |
    GatewayIntents.guildIntegrations |
    GatewayIntents.guildWebhooks |
    GatewayIntents.guildInvites |
    GatewayIntents.guildVoiceStates |
    GatewayIntents.guildMessages |
    GatewayIntents.guildMessageReactions |
    GatewayIntents.guildMessageTyping |
    GatewayIntents.directMessages |
    GatewayIntents.directMessageReactions |
    GatewayIntents.directMessageTyping |
    GatewayIntents.guildScheduledEvents |
    GatewayIntents.autoModerationConfiguration |
    GatewayIntents.autoModerationExecution |
    GatewayIntents.guildMessagePolls |
    GatewayIntents.directMessagePolls,

  allPrivileged = GatewayIntents.guildMembers |
    GatewayIntents.guildPresences |
    GatewayIntents.messageContent,

  all = GatewayIntents.allNonPrivileged | GatewayIntents.allPrivileged,
}

export default GatewayIntents;
