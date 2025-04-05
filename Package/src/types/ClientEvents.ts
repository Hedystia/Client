import { EventEmitter } from "node:events";
import type {
  GatewayApplicationCommandPermissionsUpdateDispatchData,
  GatewayAutoModerationActionExecutionDispatchData,
  GatewayAutoModerationRuleCreateDispatchData,
  GatewayAutoModerationRuleDeleteDispatchData,
  GatewayAutoModerationRuleUpdateDispatchData,
  GatewayChannelCreateDispatchData,
  GatewayChannelDeleteDispatchData,
  GatewayChannelPinsUpdateDispatchData,
  GatewayChannelUpdateDispatchData,
  GatewayEntitlementCreateDispatchData,
  GatewayEntitlementDeleteDispatchData,
  GatewayEntitlementUpdateDispatchData,
  GatewayGuildAuditLogEntryCreateDispatchData,
  GatewayGuildBanAddDispatchData,
  GatewayGuildBanRemoveDispatchData,
  GatewayGuildCreateDispatchData,
  GatewayGuildDeleteDispatchData,
  GatewayGuildEmojisUpdateDispatchData,
  GatewayGuildIntegrationsUpdateDispatchData,
  GatewayGuildMemberAddDispatchData,
  GatewayGuildMemberRemoveDispatchData,
  GatewayGuildMembersChunkDispatchData,
  GatewayGuildMemberUpdateDispatchData,
  GatewayGuildRoleCreateDispatchData,
  GatewayGuildRoleDeleteDispatchData,
  GatewayGuildRoleUpdateDispatchData,
  GatewayGuildScheduledEventCreateDispatchData,
  GatewayGuildScheduledEventDeleteDispatchData,
  GatewayGuildScheduledEventUpdateDispatchData,
  GatewayGuildScheduledEventUserAddDispatchData,
  GatewayGuildScheduledEventUserRemoveDispatchData,
  GatewayGuildSoundboardSoundCreateDispatchData,
  GatewayGuildSoundboardSoundDeleteDispatchData,
  GatewayGuildSoundboardSoundsUpdateDispatchData,
  GatewayGuildSoundboardSoundUpdateDispatchData,
  GatewaySoundboardSoundsDispatchData,
  GatewayGuildStickersUpdateDispatchData,
  GatewayGuildUpdateDispatchData,
  GatewayIntegrationCreateDispatchData,
  GatewayIntegrationDeleteDispatchData,
  GatewayIntegrationUpdateDispatchData,
  GatewayInteractionCreateDispatchData,
  GatewayInviteCreateDispatchData,
  GatewayInviteDeleteDispatchData,
  GatewayMessageCreateDispatchData,
  GatewayMessageDeleteDispatchData,
  GatewayMessageDeleteBulkDispatchData,
  GatewayMessagePollVoteDispatchData,
  GatewayMessageReactionAddDispatchData,
  GatewayMessageReactionRemoveDispatchData,
  GatewayMessageReactionRemoveAllDispatchData,
  GatewayMessageReactionRemoveEmojiDispatchData,
  GatewayMessageUpdateDispatchData,
  GatewayPresenceUpdateDispatchData,
  GatewayReadyDispatchData,
  GatewayStageInstanceCreateDispatchData,
  GatewayStageInstanceDeleteDispatchData,
  GatewayStageInstanceUpdateDispatchData,
  GatewaySubscriptionCreateDispatchData,
  GatewaySubscriptionDeleteDispatchData,
  GatewaySubscriptionUpdateDispatchData,
  GatewayThreadCreateDispatchData,
  GatewayThreadDeleteDispatchData,
  GatewayThreadListSyncDispatchData,
  GatewayThreadMembersUpdateDispatchData,
  GatewayThreadMemberUpdateDispatchData,
  GatewayThreadUpdateDispatchData,
  GatewayTypingStartDispatchData,
  GatewayUserUpdateDispatchData,
  GatewayVoiceChannelEffectSendDispatchData,
  GatewayVoiceServerUpdateDispatchData,
  GatewayVoiceStateUpdateDispatchData,
  GatewayWebhooksUpdateDispatchData,
  GatewayDispatchPayload,
} from "discord-api-types/v10";

export interface ClientEvents {
  // APPLICATION
  applicationCommandPermissionsUpdate: [GatewayApplicationCommandPermissionsUpdateDispatchData];

  // AUTO MODERATION
  autoModerationActionExecution: [GatewayAutoModerationActionExecutionDispatchData];
  autoModerationRuleCreate: [GatewayAutoModerationRuleCreateDispatchData];
  autoModerationRuleDelete: [GatewayAutoModerationRuleDeleteDispatchData];
  autoModerationRuleUpdate: [GatewayAutoModerationRuleUpdateDispatchData];

  // CHANNEL
  channelCreate: [GatewayChannelCreateDispatchData];
  channelDelete: [GatewayChannelDeleteDispatchData];
  channelPinsUpdate: [GatewayChannelPinsUpdateDispatchData];
  channelUpdate: [GatewayChannelUpdateDispatchData];

  // ENTITLEMENT
  entitlementCreate: [GatewayEntitlementCreateDispatchData];
  entitlementDelete: [GatewayEntitlementDeleteDispatchData];
  entitlementUpdate: [GatewayEntitlementUpdateDispatchData];

  // GUILD
  guildAuditLogEntryCreate: [GatewayGuildAuditLogEntryCreateDispatchData];
  guildBanAdd: [GatewayGuildBanAddDispatchData];
  guildBanRemove: [GatewayGuildBanRemoveDispatchData];
  guildCreate: [GatewayGuildCreateDispatchData];
  guildDelete: [GatewayGuildDeleteDispatchData];
  guildEmojisUpdate: [GatewayGuildEmojisUpdateDispatchData];
  guildIntegrationsUpdate: [GatewayGuildIntegrationsUpdateDispatchData];
  guildMemberAdd: [GatewayGuildMemberAddDispatchData];
  guildMemberRemove: [GatewayGuildMemberRemoveDispatchData];
  guildMembersChunk: [GatewayGuildMembersChunkDispatchData];
  guildMemberUpdate: [GatewayGuildMemberUpdateDispatchData];
  guildRoleCreate: [GatewayGuildRoleCreateDispatchData];
  guildRoleDelete: [GatewayGuildRoleDeleteDispatchData];
  guildRoleUpdate: [GatewayGuildRoleUpdateDispatchData];
  guildScheduledEventCreate: [GatewayGuildScheduledEventCreateDispatchData];
  guildScheduledEventDelete: [GatewayGuildScheduledEventDeleteDispatchData];
  guildScheduledEventUpdate: [GatewayGuildScheduledEventUpdateDispatchData];
  guildScheduledEventUserAdd: [GatewayGuildScheduledEventUserAddDispatchData];
  guildScheduledEventUserRemove: [GatewayGuildScheduledEventUserRemoveDispatchData];
  guildSoundboardSoundCreate: [GatewayGuildSoundboardSoundCreateDispatchData];
  guildSoundboardSoundDelete: [GatewayGuildSoundboardSoundDeleteDispatchData];
  guildSoundboardSoundsUpdate: [GatewayGuildSoundboardSoundsUpdateDispatchData];
  guildSoundboardSoundUpdate: [GatewayGuildSoundboardSoundUpdateDispatchData];
  guildStickersUpdate: [GatewayGuildStickersUpdateDispatchData];
  guildUpdate: [GatewayGuildUpdateDispatchData];

  // SOUNDBOARD
  soundboardSounds: [GatewaySoundboardSoundsDispatchData];

  // INTEGRATION
  integrationCreate: [GatewayIntegrationCreateDispatchData];
  integrationDelete: [GatewayIntegrationDeleteDispatchData];
  integrationUpdate: [GatewayIntegrationUpdateDispatchData];

  // INTERACTION
  interactionCreate: [GatewayInteractionCreateDispatchData];

  // INVITE
  inviteCreate: [GatewayInviteCreateDispatchData];
  inviteDelete: [GatewayInviteDeleteDispatchData];

  // MESSAGE
  messageCreate: [GatewayMessageCreateDispatchData];
  messageDelete: [GatewayMessageDeleteDispatchData];
  messageDeleteBulk: [GatewayMessageDeleteBulkDispatchData];
  messagePollVoteAdd: [GatewayMessagePollVoteDispatchData];
  messagePollVoteRemove: [GatewayMessagePollVoteDispatchData];
  messageReactionAdd: [GatewayMessageReactionAddDispatchData];
  messageReactionRemove: [GatewayMessageReactionRemoveDispatchData];
  messageReactionRemoveAll: [GatewayMessageReactionRemoveAllDispatchData];
  messageReactionRemoveEmoji: [GatewayMessageReactionRemoveEmojiDispatchData];
  messageUpdate: [GatewayMessageUpdateDispatchData];

  // PRESENCE
  presenceUpdate: [GatewayPresenceUpdateDispatchData];

  // READY
  ready: [GatewayReadyDispatchData];

  // RESUMED
  resumed: [];

  // STAGE
  stageInstanceCreate: [GatewayStageInstanceCreateDispatchData];
  stageInstanceDelete: [GatewayStageInstanceDeleteDispatchData];
  stageInstanceUpdate: [GatewayStageInstanceUpdateDispatchData];

  // SUBSCRIPTION
  subscriptionCreate: [GatewaySubscriptionCreateDispatchData];
  subscriptionDelete: [GatewaySubscriptionDeleteDispatchData];
  subscriptionUpdate: [GatewaySubscriptionUpdateDispatchData];

  // THREAD
  threadCreate: [GatewayThreadCreateDispatchData];
  threadDelete: [GatewayThreadDeleteDispatchData];
  threadListSync: [GatewayThreadListSyncDispatchData];
  threadMembersUpdate: [GatewayThreadMembersUpdateDispatchData];
  threadMemberUpdate: [GatewayThreadMemberUpdateDispatchData];
  threadUpdate: [GatewayThreadUpdateDispatchData];

  // TYPING
  typingStart: [GatewayTypingStartDispatchData];

  // USER
  userUpdate: [GatewayUserUpdateDispatchData];

  // VOICE
  voiceChannelEffectSend: [GatewayVoiceChannelEffectSendDispatchData];
  voiceServerUpdate: [GatewayVoiceServerUpdateDispatchData];
  voiceStateUpdate: [GatewayVoiceStateUpdateDispatchData];

  // WEBHOOK
  webhooksUpdate: [GatewayWebhooksUpdateDispatchData];

  // DISPATCH
  dispatch: [GatewayDispatchPayload, number];
  hello: [number, number];
  heartbeatACK: [number];
  heartbeat: [number];
  invalidSession: [];
  reconnect: [];

  // Sharding Events
  shardReady: [number];
  shardDisconnect: [{ id: number; code: number }];
  shardReconnecting: [number];
  shardError: [{ id: number; error: Error }];
}

export default class Client extends EventEmitter {
  public on<K extends keyof ClientEvents>(
    event: K,
    listener: (...args: ClientEvents[K]) => void,
  ): this {
    return super.on(event, listener);
  }

  public emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean {
    return super.emit(event, ...args);
  }
}
