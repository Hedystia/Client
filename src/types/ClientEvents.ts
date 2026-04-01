import { EventEmitter } from "node:events";
import type {
  APIUnavailableGuild,
  GatewayDispatchPayload,
  GatewayGuildEmojisUpdateDispatchData,
  GatewayGuildIntegrationsUpdateDispatchData,
  GatewayGuildMembersChunkDispatchData,
  GatewayGuildScheduledEventUserAddDispatchData,
  GatewayGuildScheduledEventUserRemoveDispatchData,
  GatewayGuildSoundboardSoundsUpdateDispatchData,
  GatewayGuildSoundboardSoundUpdateDispatchData,
  GatewayGuildStickersUpdateDispatchData,
  GatewayInteractionCreateDispatchData,
  GatewayMessageDeleteBulkDispatchData,
  GatewayMessageDeleteDispatchData,
  GatewayMessageReactionRemoveAllDispatchData,
  GatewayMessageReactionRemoveEmojiDispatchData,
  GatewayReadyDispatchData,
  GatewaySoundboardSoundsDispatchData,
} from "discord-api-types/v10";
import type { ApplicationCommandPermissionsStructureInstance } from "../structures/ApplicationCommandPermissionsStructure";
import type { AuditLogEntryStructureInstance } from "../structures/AuditLogEntryStructure";
import type { AutoModerationActionStructureInstance } from "../structures/AutoModerationActionStructure";
import type { AutoModerationRuleStructureInstance } from "../structures/AutoModerationRuleStructure";
import type { ChannelPinsStructureInstance } from "../structures/ChannelPinsStructure";
import type { ChannelStructureInstance } from "../structures/ChannelStructure";
import type { EntitlementStructureInstance } from "../structures/EntitlementStructure";
import type { GuildBanStructureInstance } from "../structures/GuildBanStructure";
import type { GuildScheduledEventStructureInstance } from "../structures/GuildScheduledEventStructure";
import type { GuildSoundboardSoundStructureInstance } from "../structures/GuildSoundboardSoundStructure";
import type { GuildStructureInstance } from "../structures/GuildStructure";
import type { IntegrationStructureInstance } from "../structures/IntegrationStructure";
import type { InviteStructureInstance } from "../structures/InviteStructure";
import type { MemberStructureInstance } from "../structures/MemberStructure";
import type { MessagePollVoteStructureInstance } from "../structures/MessagePollVoteStructure";
import type { MessageReactionStructureInstance } from "../structures/MessageReactionStructure";
import type { MessageStructureInstance } from "../structures/MessageStructure";
import type { PresenceStructureInstance } from "../structures/PresenceStructure";
import type { RoleStructureInstance } from "../structures/RoleStructure";
import type { StageInstanceStructureInstance } from "../structures/StageInstanceStructure";
import type { SubscriptionStructureInstance } from "../structures/SubscriptionStructure";
import type { ThreadListSyncStructureInstance } from "../structures/ThreadListSyncStructure";
import type { ThreadMemberStructureInstance } from "../structures/ThreadMemberStructure";
import type { ThreadMembersStructureInstance } from "../structures/ThreadMembersStructure";
import type { TypingStartStructureInstance } from "../structures/TypingStartStructure";
import type { UserStructureInstance } from "../structures/UserStructure";
import type { VoiceChannelEffectSendStructureInstance } from "../structures/VoiceChannelEffectSendStructure";
import type { VoiceServerUpdateStructureInstance } from "../structures/VoiceServerUpdateStructure";
import type { VoiceStateStructureInstance } from "../structures/VoiceStateStructure";
import type { WebhookStructureInstance } from "../structures/WebhookStructure";

export interface ClientEvents {
  // APPLICATION
  applicationCommandPermissionsUpdate: [ApplicationCommandPermissionsStructureInstance];

  // AUTO MODERATION
  autoModerationActionExecution: [AutoModerationActionStructureInstance];
  autoModerationRuleCreate: [AutoModerationRuleStructureInstance];
  autoModerationRuleDelete: [AutoModerationRuleStructureInstance];
  autoModerationRuleUpdate: [AutoModerationRuleStructureInstance];

  // CHANNEL
  channelCreate: [ChannelStructureInstance];
  channelDelete: [ChannelStructureInstance];
  channelPinsUpdate: [ChannelPinsStructureInstance];
  channelUpdate: [ChannelStructureInstance];

  // ENTITLEMENT
  entitlementCreate: [EntitlementStructureInstance];
  entitlementDelete: [EntitlementStructureInstance];
  entitlementUpdate: [EntitlementStructureInstance];

  // GUILD
  guildAuditLogEntryCreate: [AuditLogEntryStructureInstance];
  guildBanAdd: [GuildBanStructureInstance];
  guildBanRemove: [GuildBanStructureInstance];
  guildCreate: [GuildStructureInstance];
  guildDelete: [GuildStructureInstance];
  guildEmojisUpdate: [GatewayGuildEmojisUpdateDispatchData];
  guildIntegrationsUpdate: [GatewayGuildIntegrationsUpdateDispatchData];
  guildMemberAdd: [MemberStructureInstance];
  guildMemberRemove: [MemberStructureInstance];
  guildMembersChunk: [GatewayGuildMembersChunkDispatchData];
  guildMemberUpdate: [MemberStructureInstance];
  guildRoleCreate: [RoleStructureInstance];
  guildRoleDelete: [RoleStructureInstance];
  guildRoleUpdate: [RoleStructureInstance];
  guildScheduledEventCreate: [GuildScheduledEventStructureInstance];
  guildScheduledEventDelete: [GuildScheduledEventStructureInstance];
  guildScheduledEventUpdate: [GuildScheduledEventStructureInstance];
  guildScheduledEventUserAdd: [GatewayGuildScheduledEventUserAddDispatchData];
  guildScheduledEventUserRemove: [GatewayGuildScheduledEventUserRemoveDispatchData];
  guildSoundboardSoundCreate: [GuildSoundboardSoundStructureInstance];
  guildSoundboardSoundDelete: [GuildSoundboardSoundStructureInstance];
  guildSoundboardSoundsUpdate: [GatewayGuildSoundboardSoundsUpdateDispatchData];
  guildSoundboardSoundUpdate: [GatewayGuildSoundboardSoundUpdateDispatchData];
  guildStickersUpdate: [GatewayGuildStickersUpdateDispatchData];
  guildUnavailable: [APIUnavailableGuild];
  guildUpdate: [GuildStructureInstance];

  // SOUNDBOARD
  soundboardSounds: [GatewaySoundboardSoundsDispatchData];

  // INTEGRATION
  integrationCreate: [IntegrationStructureInstance];
  integrationDelete: [IntegrationStructureInstance];
  integrationUpdate: [IntegrationStructureInstance];

  // INTERACTION
  interactionCreate: [GatewayInteractionCreateDispatchData];

  // INVITE
  inviteCreate: [InviteStructureInstance];
  inviteDelete: [InviteStructureInstance];

  // MESSAGE
  messageCreate: [MessageStructureInstance];
  messageDelete: [GatewayMessageDeleteDispatchData];
  messageDeleteBulk: [GatewayMessageDeleteBulkDispatchData];
  messagePollVoteAdd: [MessagePollVoteStructureInstance];
  messagePollVoteRemove: [MessagePollVoteStructureInstance];
  messageReactionAdd: [MessageReactionStructureInstance];
  messageReactionRemove: [MessageReactionStructureInstance];
  messageReactionRemoveAll: [GatewayMessageReactionRemoveAllDispatchData];
  messageReactionRemoveEmoji: [GatewayMessageReactionRemoveEmojiDispatchData];
  messageUpdate: [MessageStructureInstance];

  // PRESENCE
  presenceUpdate: [PresenceStructureInstance];

  // READY
  ready: [GatewayReadyDispatchData];

  // RESUMED
  resumed: [];

  // STAGE
  stageInstanceCreate: [StageInstanceStructureInstance];
  stageInstanceDelete: [StageInstanceStructureInstance];
  stageInstanceUpdate: [StageInstanceStructureInstance];

  // SUBSCRIPTION
  subscriptionCreate: [SubscriptionStructureInstance];
  subscriptionDelete: [SubscriptionStructureInstance];
  subscriptionUpdate: [SubscriptionStructureInstance];

  // THREAD
  threadCreate: [ChannelStructureInstance];
  threadDelete: [ChannelStructureInstance];
  threadListSync: [ThreadListSyncStructureInstance];
  threadMembersUpdate: [ThreadMembersStructureInstance];
  threadMemberUpdate: [ThreadMemberStructureInstance];
  threadUpdate: [ChannelStructureInstance];

  // TYPING
  typingStart: [TypingStartStructureInstance];

  // USER
  userUpdate: [UserStructureInstance];

  // VOICE
  voiceChannelEffectSend: [VoiceChannelEffectSendStructureInstance];
  voiceServerUpdate: [VoiceServerUpdateStructureInstance];
  voiceStateUpdate: [VoiceStateStructureInstance];

  // WEBHOOK
  webhooksUpdate: [WebhookStructureInstance];

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
  shardRateLimited: [{ id: number; delay?: number; resetAfter?: number }];
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
