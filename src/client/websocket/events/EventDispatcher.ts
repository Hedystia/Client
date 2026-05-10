import { GatewayDispatchEvents, type GatewayDispatchPayload } from "discord-api-types/v10";
import ApplicationCommandPermissionsUpdate from "../../../events/applicationCommandPermissionsUpdate";
import AutoModerationActionExecution from "../../../events/autoModerationActionExecution";
import AutoModerationRuleCreate from "../../../events/autoModerationRuleCreate";
import AutoModerationRuleDelete from "../../../events/autoModerationRuleDelete";
import AutoModerationRuleUpdate from "../../../events/autoModerationRuleUpdate";
import ChannelCreate from "../../../events/channelCreate";
import ChannelDelete from "../../../events/channelDelete";
import ChannelPinsUpdate from "../../../events/channelPinsUpdate";
import ChannelUpdate from "../../../events/channelUpdate";
import EntitlementCreate from "../../../events/entitlementCreate";
import EntitlementDelete from "../../../events/entitlementDelete";
import EntitlementUpdate from "../../../events/entitlementUpdate";
import GuildAuditLogEntryCreate from "../../../events/guildAuditLogEntryCreate";
import GuildBanAdd from "../../../events/guildBanAdd";
import GuildBanRemove from "../../../events/guildBanRemove";
import GuildCreate from "../../../events/guildCreate";
import GuildDelete from "../../../events/guildDelete";
import GuildEmojisUpdate from "../../../events/guildEmojisUpdate";
import GuildIntegrationsUpdate from "../../../events/guildIntegrationsUpdate";
import GuildMemberAdd from "../../../events/guildMemberAdd";
import GuildMemberRemove from "../../../events/guildMemberRemove";
import GuildMembersChunk from "../../../events/guildMembersChunk";
import GuildMemberUpdate from "../../../events/guildMemberUpdate";
import GuildRoleCreate from "../../../events/guildRoleCreate";
import GuildRoleDelete from "../../../events/guildRoleDelete";
import GuildRoleUpdate from "../../../events/guildRoleUpdate";
import GuildScheduledEventCreate from "../../../events/guildScheduledEventCreate";
import GuildScheduledEventDelete from "../../../events/guildScheduledEventDelete";
import GuildScheduledEventUpdate from "../../../events/guildScheduledEventUpdate";
import GuildScheduledEventUserAdd from "../../../events/guildScheduledEventUserAdd";
import GuildScheduledEventUserRemove from "../../../events/guildScheduledEventUserRemove";
import GuildSoundboardSoundCreate from "../../../events/guildSoundboardSoundCreate";
import GuildSoundboardSoundDelete from "../../../events/guildSoundboardSoundDelete";
import GuildSoundboardSoundsUpdate from "../../../events/guildSoundboardSoundsUpdate";
import GuildSoundboardSoundUpdate from "../../../events/guildSoundboardSoundUpdate";
import GuildStickersUpdate from "../../../events/guildStickersUpdate";
import GuildUpdate from "../../../events/guildUpdate";
import IntegrationCreate from "../../../events/integrationCreate";
import IntegrationDelete from "../../../events/integrationDelete";
import IntegrationUpdate from "../../../events/integrationUpdate";
import InteractionCreate from "../../../events/interactionCreate";
import InviteCreate from "../../../events/inviteCreate";
import InviteDelete from "../../../events/inviteDelete";
import MessageCreate from "../../../events/messageCreate";
import MessageDelete from "../../../events/messageDelete";
import MessageDeleteBulk from "../../../events/messageDeleteBulk";
import MessagePollVoteAdd from "../../../events/messagePollVoteAdd";
import MessagePollVoteRemove from "../../../events/messagePollVoteRemove";
import MessageReactionAdd from "../../../events/messageReactionAdd";
import MessageReactionRemove from "../../../events/messageReactionRemove";
import MessageReactionRemoveAll from "../../../events/messageReactionRemoveAll";
import MessageReactionRemoveEmoji from "../../../events/messageReactionRemoveEmoji";
import MessageUpdate from "../../../events/messageUpdate";
import PresenceUpdate from "../../../events/presenceUpdate";
import Ready from "../../../events/ready";
import Resumed from "../../../events/resumed";
import SoundboardSounds from "../../../events/soundboardSounds";
import StageInstanceCreate from "../../../events/stageInstanceCreate";
import StageInstanceDelete from "../../../events/stageInstanceDelete";
import StageInstanceUpdate from "../../../events/stageInstanceUpdate";
import SubscriptionCreate from "../../../events/subscriptionCreate";
import SubscriptionDelete from "../../../events/subscriptionDelete";
import SubscriptionUpdate from "../../../events/subscriptionUpdate";
import ThreadCreate from "../../../events/threadCreate";
import ThreadDelete from "../../../events/threadDelete";
import ThreadListSync from "../../../events/threadListSync";
import ThreadMembersUpdate from "../../../events/threadMembersUpdate";
import ThreadMemberUpdate from "../../../events/threadMemberUpdate";
import ThreadUpdate from "../../../events/threadUpdate";
import TypingStart from "../../../events/typingStart";
import UserUpdate from "../../../events/userUpdate";
import VoiceChannelEffectSend from "../../../events/voiceChannelEffectSend";
import VoiceServerUpdate from "../../../events/voiceServerUpdate";
import VoiceStateUpdate from "../../../events/voiceStateUpdate";
import WebhooksUpdate from "../../../events/webhooksUpdate";
import type Client from "../..";

/**
 * Result returned by {@link EventDispatcher.dispatch}, used by
 * {@link WebSocketShard} to update its session-related state.
 */
export interface DispatchResult {
  /** Updated `session_id` after a READY frame, or `null`. */
  sessionId?: string | null;
  /** Updated `resume_gateway_url` after a READY frame, or `null`. */
  resumeGatewayURL?: string | null;
  /** `true` if the dispatch corresponds to READY or RESUMED. */
  ready?: boolean;
}

/**
 * Routes Discord dispatch payloads to their corresponding event class.
 *
 * @remarks
 * Preserves the original "instantiate per event" pattern. Event classes
 * normalize raw gateway data into structures and emit on the {@link Client}.
 */
export class EventDispatcher {
  /**
   * @param client - The owning client whose event classes will be invoked.
   */
  public constructor(private readonly client: Client) {}

  /**
   * Dispatches a single gateway packet, instantiating the matching event
   * handler.
   *
   * @returns Optional state updates the shard should apply.
   */
  public dispatch(packet: GatewayDispatchPayload): DispatchResult {
    const client = this.client;

    switch (packet.t) {
      // APPLICATION
      case GatewayDispatchEvents.ApplicationCommandPermissionsUpdate:
        new ApplicationCommandPermissionsUpdate(client, packet);
        break;

      // AUTO MODERATION
      case GatewayDispatchEvents.AutoModerationActionExecution:
        new AutoModerationActionExecution(client, packet);
        break;
      case GatewayDispatchEvents.AutoModerationRuleCreate:
        new AutoModerationRuleCreate(client, packet);
        break;
      case GatewayDispatchEvents.AutoModerationRuleDelete:
        new AutoModerationRuleDelete(client, packet);
        break;
      case GatewayDispatchEvents.AutoModerationRuleUpdate:
        new AutoModerationRuleUpdate(client, packet);
        break;

      // CHANNEL
      case GatewayDispatchEvents.ChannelCreate:
        new ChannelCreate(client, packet);
        break;
      case GatewayDispatchEvents.ChannelDelete:
        new ChannelDelete(client, packet);
        break;
      case GatewayDispatchEvents.ChannelPinsUpdate:
        new ChannelPinsUpdate(client, packet);
        break;
      case GatewayDispatchEvents.ChannelUpdate:
        new ChannelUpdate(client, packet);
        break;

      // ENTITLEMENT
      case GatewayDispatchEvents.EntitlementCreate:
        new EntitlementCreate(client, packet);
        break;
      case GatewayDispatchEvents.EntitlementDelete:
        new EntitlementDelete(client, packet);
        break;
      case GatewayDispatchEvents.EntitlementUpdate:
        new EntitlementUpdate(client, packet);
        break;

      // GUILD
      case GatewayDispatchEvents.GuildAuditLogEntryCreate:
        new GuildAuditLogEntryCreate(client, packet);
        break;
      case GatewayDispatchEvents.GuildBanAdd:
        new GuildBanAdd(client, packet);
        break;
      case GatewayDispatchEvents.GuildBanRemove:
        new GuildBanRemove(client, packet);
        break;
      case GatewayDispatchEvents.GuildCreate:
        new GuildCreate(client, packet);
        break;
      case GatewayDispatchEvents.GuildDelete:
        new GuildDelete(client, packet);
        break;
      case GatewayDispatchEvents.GuildEmojisUpdate:
        new GuildEmojisUpdate(client, packet);
        break;
      case GatewayDispatchEvents.GuildIntegrationsUpdate:
        new GuildIntegrationsUpdate(client, packet);
        break;
      case GatewayDispatchEvents.GuildMemberAdd:
        new GuildMemberAdd(client, packet);
        break;
      case GatewayDispatchEvents.GuildMemberRemove:
        new GuildMemberRemove(client, packet);
        break;
      case GatewayDispatchEvents.GuildMembersChunk:
        new GuildMembersChunk(client, packet);
        break;
      case GatewayDispatchEvents.GuildMemberUpdate:
        new GuildMemberUpdate(client, packet);
        break;
      case GatewayDispatchEvents.GuildRoleCreate:
        new GuildRoleCreate(client, packet);
        break;
      case GatewayDispatchEvents.GuildRoleDelete:
        new GuildRoleDelete(client, packet);
        break;
      case GatewayDispatchEvents.GuildRoleUpdate:
        new GuildRoleUpdate(client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventCreate:
        new GuildScheduledEventCreate(client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventDelete:
        new GuildScheduledEventDelete(client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventUpdate:
        new GuildScheduledEventUpdate(client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventUserAdd:
        new GuildScheduledEventUserAdd(client, packet);
        break;
      case GatewayDispatchEvents.GuildScheduledEventUserRemove:
        new GuildScheduledEventUserRemove(client, packet);
        break;
      case GatewayDispatchEvents.GuildSoundboardSoundCreate:
        new GuildSoundboardSoundCreate(client, packet);
        break;
      case GatewayDispatchEvents.GuildSoundboardSoundDelete:
        new GuildSoundboardSoundDelete(client, packet);
        break;
      case GatewayDispatchEvents.GuildSoundboardSoundsUpdate:
        new GuildSoundboardSoundsUpdate(client, packet);
        break;
      case GatewayDispatchEvents.GuildSoundboardSoundUpdate:
        new GuildSoundboardSoundUpdate(client, packet);
        break;
      case GatewayDispatchEvents.GuildStickersUpdate:
        new GuildStickersUpdate(client, packet);
        break;
      case GatewayDispatchEvents.GuildUpdate:
        new GuildUpdate(client, packet);
        break;

      // SOUNDBOARD
      case GatewayDispatchEvents.SoundboardSounds:
        new SoundboardSounds(client, packet);
        break;

      // INTEGRATION
      case GatewayDispatchEvents.IntegrationCreate:
        new IntegrationCreate(client, packet);
        break;
      case GatewayDispatchEvents.IntegrationDelete:
        new IntegrationDelete(client, packet);
        break;
      case GatewayDispatchEvents.IntegrationUpdate:
        new IntegrationUpdate(client, packet);
        break;

      // INTERACTION
      case GatewayDispatchEvents.InteractionCreate:
        new InteractionCreate(client, packet);
        break;

      // INVITE
      case GatewayDispatchEvents.InviteCreate:
        new InviteCreate(client, packet);
        break;
      case GatewayDispatchEvents.InviteDelete:
        new InviteDelete(client, packet);
        break;

      // MESSAGE
      case GatewayDispatchEvents.MessageCreate:
        new MessageCreate(client, packet);
        break;
      case GatewayDispatchEvents.MessageDelete:
        new MessageDelete(client, packet);
        break;
      case GatewayDispatchEvents.MessageDeleteBulk:
        new MessageDeleteBulk(client, packet);
        break;
      case GatewayDispatchEvents.MessagePollVoteAdd:
        new MessagePollVoteAdd(client, packet);
        break;
      case GatewayDispatchEvents.MessagePollVoteRemove:
        new MessagePollVoteRemove(client, packet);
        break;
      case GatewayDispatchEvents.MessageReactionAdd:
        new MessageReactionAdd(client, packet);
        break;
      case GatewayDispatchEvents.MessageReactionRemove:
        new MessageReactionRemove(client, packet);
        break;
      case GatewayDispatchEvents.MessageReactionRemoveAll:
        new MessageReactionRemoveAll(client, packet);
        break;
      case GatewayDispatchEvents.MessageReactionRemoveEmoji:
        new MessageReactionRemoveEmoji(client, packet);
        break;
      case GatewayDispatchEvents.MessageUpdate:
        new MessageUpdate(client, packet);
        break;

      // PRESENCE
      case GatewayDispatchEvents.PresenceUpdate:
        new PresenceUpdate(client, packet);
        break;

      // READY
      case GatewayDispatchEvents.Ready: {
        new Ready(client, packet);
        return {
          sessionId: packet.d.session_id,
          resumeGatewayURL: packet.d.resume_gateway_url,
          ready: true,
        };
      }

      // RESUMED
      case GatewayDispatchEvents.Resumed:
        new Resumed(client);
        return { ready: true };

      // STAGE
      case GatewayDispatchEvents.StageInstanceCreate:
        new StageInstanceCreate(client, packet);
        break;
      case GatewayDispatchEvents.StageInstanceDelete:
        new StageInstanceDelete(client, packet);
        break;
      case GatewayDispatchEvents.StageInstanceUpdate:
        new StageInstanceUpdate(client, packet);
        break;

      // SUBSCRIPTION
      case GatewayDispatchEvents.SubscriptionCreate:
        new SubscriptionCreate(client, packet);
        break;
      case GatewayDispatchEvents.SubscriptionDelete:
        new SubscriptionDelete(client, packet);
        break;
      case GatewayDispatchEvents.SubscriptionUpdate:
        new SubscriptionUpdate(client, packet);
        break;

      // THREAD
      case GatewayDispatchEvents.ThreadCreate:
        new ThreadCreate(client, packet);
        break;
      case GatewayDispatchEvents.ThreadDelete:
        new ThreadDelete(client, packet);
        break;
      case GatewayDispatchEvents.ThreadListSync:
        new ThreadListSync(client, packet);
        break;
      case GatewayDispatchEvents.ThreadMembersUpdate:
        new ThreadMembersUpdate(client, packet);
        break;
      case GatewayDispatchEvents.ThreadMemberUpdate:
        new ThreadMemberUpdate(client, packet);
        break;
      case GatewayDispatchEvents.ThreadUpdate:
        new ThreadUpdate(client, packet);
        break;

      // TYPING
      case GatewayDispatchEvents.TypingStart:
        new TypingStart(client, packet);
        break;

      // USER
      case GatewayDispatchEvents.UserUpdate:
        new UserUpdate(client, packet);
        break;

      // VOICE
      case GatewayDispatchEvents.VoiceChannelEffectSend:
        new VoiceChannelEffectSend(client, packet);
        break;
      case GatewayDispatchEvents.VoiceServerUpdate:
        new VoiceServerUpdate(client, packet);
        break;
      case GatewayDispatchEvents.VoiceStateUpdate:
        new VoiceStateUpdate(client, packet);
        break;

      // WEBHOOK
      case GatewayDispatchEvents.WebhooksUpdate:
        new WebhooksUpdate(client, packet);
        break;
    }

    return {};
  }
}
