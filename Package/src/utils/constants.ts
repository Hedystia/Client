export const OpCodes = {
  Dispatch: 0,
  Heartbeat: 1,
  Identify: 2,
  Presence_Update: 3,
  Voice_State_Update: 4,
  Resume: 6,
  Reconnect: 7,
  Request_Guild_Members: 8,
  Invalid_Session: 9,
  Hello: 10,
  Heartbeat_Ack: 11,
};

export const Activity = {
  Game: 0,
  Streaming: 1,
  Listening: 2,
  Watching: 3,
  Custom: 4,
  Competing: 5,
};

export const Status = {
  Online: "online",
  Dnd: "dnd",
  Idle: "idle",
  Invisible: "invisible",
  Offline: "offline",
};

export const ApplicationCommandOptionType = {
  Sub_Command: 1,
  Sub_Command_Group: 2,
  String: 3,
  Integer: 4,
  Boolean: 5,
  User: 6,
  Channel: 7,
  Role: 8,
  Mentionable: 9,
  Number: 10,
  Attachment: 11,
};

export const Routes = {
  autoModerationRule: (guildID: string, ruleID: string) =>
    `/guilds/${guildID}/auto-moderation/rules/${ruleID}`,
  autoModerationRules: (guildID: string) => `/guilds/${guildID}/auto-moderation/rules`,
  command: (applicationID: string, commandID: string) =>
    `/applications/${applicationID}/commands/${commandID}`,
  commandPermissions: (applicationID: string, guildID: string, commandID: string) =>
    `/applications/${applicationID}/guilds/${guildID}/commands/${commandID}/permissions`,
  commands: (applicationID: string) => `/applications/${applicationID}/commands`,
  channel: (chanID: string) => `/channels/${chanID}`,
  channelBulkDelete: (chanID: string) => `/channels/${chanID}/messages/bulk-delete`,
  channelCallRing: (chanID: string) => `/channels/${chanID}/call/ring`,
  channelCrosspost: (chanID: string, msgID: string) =>
    `/channels/${chanID}/messages/${msgID}/crosspost`,
  channelFollow: (chanID: string) => `/channels/${chanID}/followers`,
  channelInvites: (chanID: string) => `/channels/${chanID}/invites`,
  channelMessageReaction: (chanID: string, msgID: string, reaction: string) =>
    `/channels/${chanID}/messages/${msgID}/reactions/${reaction}`,
  channelMessageReactionUser: (chanID: string, msgID: string, reaction: string, userID: string) =>
    `/channels/${chanID}/messages/${msgID}/reactions/${reaction}/${userID}`,
  channelMessageReactions: (chanID: string, msgID: string) =>
    `/channels/${chanID}/messages/${msgID}/reactions`,
  channelMessage: (chanID: string, msgID: string) => `/channels/${chanID}/messages/${msgID}`,
  channelMessages: (chanID: string) => `/channels/${chanID}/messages`,
  channelMessagesSearch: (chanID: string) => `/channels/${chanID}/messages/search`,
  channelPermission: (chanID: string, overID: string) =>
    `/channels/${chanID}/permissions/${overID}`,
  channelPermissions: (chanID: string) => `/channels/${chanID}/permissions`,
  channelPin: (chanID: string, msgID: string) => `/channels/${chanID}/pins/${msgID}`,
  channelPins: (chanID: string) => `/channels/${chanID}/pins`,
  channelRecipient: (groupID: string, userID: string) =>
    `/channels/${groupID}/recipients/${userID}`,
  channelTyping: (chanID: string) => `/channels/${chanID}/typing`,
  channelVoiceStatus: (chanID: string) => `/channels/${chanID}/voice-status`,
  channelWebhooks: (chanID: string) => `/channels/${chanID}/webhooks`,
  channels: "/channels",
  customEmojiGuild: (emojiID: string) => `/emojis/${emojiID}/guild`,
  discoveryCategories: "/discovery/categories",
  discoveryValidation: "/discovery/valid-term",
  gateway: "/gateway",
  gatewayBot: "/gateway/bot",
  guild: (guildID: string) => `/guilds/${guildID}`,
  guildAuditLogs: (guildID: string) => `/guilds/${guildID}/audit-logs`,
  guildBan: (guildID: string, memberID: string) => `/guilds/${guildID}/bans/${memberID}`,
  guildBans: (guildID: string) => `/guilds/${guildID}/bans`,
  guildChannels: (guildID: string) => `/guilds/${guildID}/channels`,
  guildCommand: (applicationID: string, guildID: string, commandID: string) =>
    `/applications/${applicationID}/guilds/${guildID}/commands/${commandID}`,
  guildCommandPermissions: (applicationID: string, guildID: string) =>
    `/applications/${applicationID}/guilds/${guildID}/commands/permissions`,
  guildCommands: (applicationID: string, guildID: string) =>
    `/applications/${applicationID}/guilds/${guildID}/commands`,
  guildDiscovery: (guildID: string) => `/guilds/${guildID}/discovery-metadata`,
  guildDiscoveryCategory: (guildID: string, categoryID: string) =>
    `/guilds/${guildID}/discovery-categories/${categoryID}`,
  guildEmoji: (guildID: string, emojiID: string) => `/guilds/${guildID}/emojis/${emojiID}`,
  guildEmojis: (guildID: string) => `/guilds/${guildID}/emojis`,
  guildIntegration: (guildID: string, inteID: string) =>
    `/guilds/${guildID}/integrations/${inteID}`,
  guildIntegrationSync: (guildID: string, inteID: string) =>
    `/guilds/${guildID}/integrations/${inteID}/sync`,
  guildIntegrations: (guildID: string) => `/guilds/${guildID}/integrations`,
  guildInvites: (guildID: string) => `/guilds/${guildID}/invites`,
  guildMember: (guildID: string, memberID: string) => `/guilds/${guildID}/members/${memberID}`,
  guildMemberNick: (guildID: string, memberID: string) =>
    `/guilds/${guildID}/members/${memberID}/nick`,
  guildMemberRole: (guildID: string, memberID: string, roleID: string) =>
    `/guilds/${guildID}/members/${memberID}/roles/${roleID}`,
  guildMembers: (guildID: string) => `/guilds/${guildID}/members`,
  guildMembersSearch: (guildID: string) => `/guilds/${guildID}/members/search`,
  guildMessagesSearch: (guildID: string) => `/guilds/${guildID}/messages/search`,
  guildMfaLevel: (guildID: string) => `/guilds/${guildID}/mfa`,
  guildOnboarding: (guildID: string) => `/guilds/${guildID}/onboarding`,
  guildPreview: (guildID: string) => `/guilds/${guildID}/preview`,
  guildPrune: (guildID: string) => `/guilds/${guildID}/prune`,
  guildRole: (guildID: string, roleID: string) => `/guilds/${guildID}/roles/${roleID}`,
  guildRoles: (guildID: string) => `/guilds/${guildID}/roles`,
  guildScheduledEvent: (guildID: string, scheduledEventID: string) =>
    `/guilds/${guildID}/scheduled-events/${scheduledEventID}`,
  guildScheduledEventUsers: (guildID: string, scheduledEventID: string) =>
    `/guilds/${guildID}/scheduled-events/${scheduledEventID}/users`,
  guildScheduledEvents: (guildID: string) => `/guilds/${guildID}/scheduled-events`,
  guildSticker: (guildID: string, stickerID: string) => `/guilds/${guildID}/stickers/${stickerID}`,
  guildStickers: (guildID: string) => `/guilds/${guildID}/stickers`,
  guildTemplate: (code: string) => `/guilds/templates/${code}`,
  guildTemplateGuild: (guildID: string, code: string) => `/guilds/${guildID}/templates/${code}`,
  guildTemplates: (guildID: string) => `/guilds/${guildID}/templates`,
  guildVanityUrl: (guildID: string) => `/guilds/${guildID}/vanity-url`,
  guildVoiceRegions: (guildID: string) => `/guilds/${guildID}/regions`,
  guildWebhooks: (guildID: string) => `/guilds/${guildID}/webhooks`,
  guildWelcomeScreen: (guildID: string) => `/guilds/${guildID}/welcome-screen`,
  guildWidget: (guildID: string) => `/guilds/${guildID}/widget.json`,
  guildWidgetImage: (guildID: string) => `/guilds/${guildID}/widget.png`,
  guildWidgetSettings: (guildID: string) => `/guilds/${guildID}/widget`,
  guildVoiceState: (guildID: string, user: string) => `/guilds/${guildID}/voice-states/${user}`,
  guilds: "/guilds",
  interactionRespond: (interactID: string, interactToken: string) =>
    `/interactions/${interactID}/${interactToken}/callback`,
  invite: (inviteID: string) => `/invites/${inviteID}`,
  oauth2Application: (appID: string) => `/oauth2/applications/${appID}`,
  originalInteractionResponse: (appID: string, interactToken: string) =>
    `/webhooks/${appID}/${interactToken}`,
  pollAnswerVoters: (channelID: string, msgID: string, answerID: string) =>
    `/channels/${channelID}/polls/${msgID}/answers/${answerID}`,
  pollEnd: (channelID: string, msgID: string) => `/channels/${channelID}/polls/${msgID}/expire`,
  roleConnectionMetadataRecords: (appID: string) =>
    `/applications/${appID}/role-connections/metadata`,
  stageInstance: (channelID: string) => `/stage-instances/${channelID}`,
  stageInstances: "/stage-instances",
  sticker: (stickerID: string) => `/stickers/${stickerID}`,
  stickersNitro: "/stickers-packs",
  template: (code: string) => `/guilds/templates/${code}`,
  templates: (guildID: string) => `/guilds/${guildID}/templates`,
  thread: (threadID: string) => `/channels/${threadID}`,
  threadMember: (threadID: string, userID: string) =>
    `/channels/${threadID}/thread-members/${userID}`,
  threadMembers: (threadID: string) => `/channels/${threadID}/thread-members`,
  threadsActive: (guildID: string) => `/guilds/${guildID}/threads/active`,
  threadsPrivate: (chanID: string) => `/channels/${chanID}/threads/archived/private`,
  threadsPublic: (chanID: string) => `/channels/${chanID}/threads/archived/public`,
  user: (userID: string) => `/users/${userID}`,
  userChannels: (userID: string) => `/users/${userID}/channels`,
  userCreateDM: "/users/@me/channels",
  userConnections: (userID: string) => `/users/${userID}/connections`,
  userGuild: (userID: string, guildID: string) => `/users/${userID}/guilds/${guildID}`,
  userGuilds: (userID: string) => `/users/${userID}/guilds`,
  userProfile: (userID: string) => `/users/${userID}/profile`,
  userSettings: "/users/@me/settings",
  userSettingsProto: "/users/@me/settings-proto",
  users: "/users",
  webhook: (webID: string) => `/webhooks/${webID}`,
  webhookGitHub: (webID: string) => `/webhooks/${webID}/github`,
  webhookMessage: (webID: string, token: string, msgID: string) =>
    `/webhooks/${webID}/${token}/messages/${msgID}`,
  webhookMessageOriginal: (webID: string, token: string) =>
    `/webhooks/${webID}/${token}/messages/@original`,
  webhookSlack: (webID: string) => `/webhooks/${webID}/slack`,
  webhooks: "/webhooks",
};
