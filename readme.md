# @hedystia/discord

A modern, type-safe Discord client library built with TypeScript and designed for Bun/Node.js runtime.

## Installation

```bash
bun add @hedystia/discord
# or
npm install @hedystia/discord
# or
yarn add @hedystia/discord
```

## Quick Start

```typescript
import Client, { Intents } from "@hedystia/discord";

const client = new Client({
  token: process.env.DISCORD_TOKEN!,
  intents: Intents.allNonPrivileged,
});

client.on("ready", () => {
  console.log(`Logged in as ${client.me?.username}!`);
});

await client.login();
```

---

## Table of Contents

- [Client Configuration](#client-configuration)
- [Events](#events)
- [Slash Commands](#slash-commands)
- [Voice Module](#voice-module)
- [Builders](#builders)
- [Collectors](#collectors)
- [Managers](#managers)
- [Structures](#structures)
- [REST API](#rest-api)
- [Utilities](#utilities)

---

## Client Configuration

### Basic Setup

```typescript
import Client, { Intents, ActivityType } from "@hedystia/discord";

const client = new Client({
  token: "YOUR_BOT_TOKEN",
  
  // Gateway intents (required for events)
  intents: Intents.guilds | Intents.guildMessages | Intents.messageContent,
  
  // Bot presence
  presence: {
    activities: [
      { name: "your game", type: ActivityType.Playing },
      { name: "music", type: ActivityType.Listening },
    ],
    status: "online", // online, idle, dnd, invisible
  },
  
  // Sharding
  shardsCount: "auto", // or a specific number like 4
  
  // Cache configuration
  cache: {
    guilds: { maxSize: 1000, ttl: 3600000 },
    users: { maxSize: 10000, ttl: 1800000, dynamicTTL: true },
    channels: { maxSize: 5000 },
    members: { maxSize: 50000 },
  },
});

await client.login();
```

### Intents

```typescript
import { Intents } from "@hedystia/discord";

// Individual intents
Intents.guilds;
Intents.guildMembers;
Intents.guildBans;
Intents.guildEmojisAndStickers;
Intents.guildIntegrations;
Intents.guildWebhooks;
Intents.guildInvites;
Intents.guildVoiceStates;
Intents.guildPresences;
Intents.guildMessages;
Intents.guildMessageReactions;
Intents.guildMessageTyping;
Intents.directMessages;
Intents.directMessageReactions;
Intents.directMessageTyping;
Intents.messageContent;
Intents.guildScheduledEvents;
Intents.autoModerationConfiguration;
Intents.autoModerationExecution;
Intents.guildMessagePolls;
Intents.directMessagePolls;

// Presets
Intents.allNonPrivileged; // All except privileged intents
Intents.allPrivileged; // guildMembers, guildPresences, messageContent
Intents.all; // Every intent
```

### Client Properties

```typescript
// Managers
client.users;      // UserManager
client.channels;   // ChannelManager
client.guilds;     // GuildManager
client.members;    // MemberManager
client.roles;      // RoleManager
client.emojis;     // EmojiManager
client.stickers;   // StickerManager
client.bans;       // GuildBanManager
client.invites;    // InviteManager
client.webhooks;   // WebhookManager
client.voice;      // VoiceManager

// REST API
client.rest;       // REST client

// Bot info
client.me;         // Current bot user (APIUser)
client.readyAt;    // Date when client became ready
client.uptime;     // Uptime in milliseconds
client.ping;       // WebSocket ping
client.isReady;    // Whether client is ready
client.ws;         // WebSocket options
```

---

## Events

The client extends Node.js `EventEmitter` with full TypeScript support.

### Core Events

```typescript
// Ready event
client.on("ready", (data) => {
  console.log(`Logged in as ${client.me?.username}#${client.me?.discriminator}`);
  console.log(`Serving ${client.guilds.cache.size} guilds`);
});

// Resumed event (after reconnection)
client.on("resumed", () => {
  console.log("Session resumed");
});

// Interaction received
client.on("interactionCreate", (interaction) => {
  // Handle interactions (commands, buttons, select menus)
});
```

### Message Events

```typescript
import type { MessageStructureInstance } from "@hedystia/discord";

client.on("messageCreate", (message: MessageStructureInstance) => {
  if (message.author.bot) return;
  
  if (message.content === "!ping") {
    message.reply("Pong!");
  }
});

client.on("messageUpdate", (oldMessage, newMessage) => {
  console.log("Message edited");
});

client.on("messageDelete", (message) => {
  console.log("Message deleted:", message.content);
});
```

### Guild Events

```typescript
client.on("guildCreate", (guild) => {
  console.log(`Joined guild: ${guild.name}`);
});

client.on("guildDelete", (guild) => {
  console.log(`Left guild: ${guild.name}`);
});

client.on("guildMemberAdd", (member) => {
  console.log(`New member: ${member.displayName}`);
});

client.on("guildMemberRemove", (member) => {
  console.log(`Member left: ${member.displayName}`);
});

client.on("guildRoleCreate", (role) => {
  console.log(`Role created: ${role.name}`);
});
```

### Channel Events

```typescript
client.on("channelCreate", (channel) => {
  console.log("Channel created:", channel.name);
});

client.on("channelDelete", (channel) => {
  console.log("Channel deleted:", channel.name);
});

client.on("threadCreate", (thread) => {
  console.log("Thread created:", thread.name);
});
```

### Voice Events

```typescript
client.on("voiceStateUpdate", (oldState, newState) => {
  console.log("Voice state changed");
});

client.on("voiceServerUpdate", (data) => {
  console.log("Voice server updated");
});
```

### All Available Events

<details>
<summary>Click to expand full event list</summary>

- `ready`, `resumed`
- `interactionCreate`
- `messageCreate`, `messageUpdate`, `messageDelete`, `messageDeleteBulk`
- `messageReactionAdd`, `messageReactionRemove`, `messageReactionRemoveAll`, `messageReactionRemoveEmoji`
- `guildCreate`, `guildDelete`, `guildUpdate`, `guildUnavailable`
- `guildMemberAdd`, `guildMemberRemove`, `guildMemberUpdate`
- `guildBanAdd`, `guildBanRemove`
- `guildRoleCreate`, `guildRoleDelete`, `guildRoleUpdate`
- `guildEmojisUpdate`, `guildStickersUpdate`
- `guildIntegrationsUpdate`, `guildScheduledEventCreate`, `guildScheduledEventDelete`, `guildScheduledEventUpdate`, `guildScheduledEventUserAdd`, `guildScheduledEventUserRemove`
- `channelCreate`, `channelDelete`, `channelUpdate`, `channelPinsUpdate`
- `threadCreate`, `threadDelete`, `threadUpdate`, `threadListSync`, `threadMemberUpdate`, `threadMembersUpdate`
- `voiceStateUpdate`, `voiceServerUpdate`, `voiceChannelEffectSend`
- `presenceUpdate`, `typingStart`
- `webhooksUpdate`, `integrationCreate`, `integrationDelete`, `integrationUpdate`
- `inviteCreate`, `inviteDelete`
- `autoModerationActionExecution`, `autoModerationRuleCreate`, `autoModerationRuleDelete`, `autoModerationRuleUpdate`
- `entitlementCreate`, `entitlementDelete`, `entitlementUpdate`
- `subscriptionCreate`, `subscriptionUpdate`
- `stageInstanceCreate`, `stageInstanceDelete`, `stageInstanceUpdate`
- `guildSoundboardSoundCreate`, `guildSoundboardSoundDelete`, `guildSoundboardSoundUpdate`, `soundboardSound`
- `userInstall`, `passiveSubscriptionUpdate`

</details>

---

## Slash Commands

### Registering Commands

```typescript
import { SlashCommandBuilder } from "@hedystia/discord";

// Wait for client to be ready
client.on("ready", async () => {
  // Register global commands (takes up to 1 hour to propagate)
  await client.registerCommands([
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with Pong!"),
    
    new SlashCommandBuilder()
      .setName("echo")
      .setDescription("Repeats your message")
      .addStringOption((option) =>
        option
          .setName("text")
          .setDescription("The text to repeat")
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(2000)
      ),
  ]);
  
  // Register guild-specific commands (instant, for testing)
  await client.registerGuildCommands("GUILD_ID", [
    new SlashCommandBuilder()
      .setName("test")
      .setDescription("Test command for this guild"),
  ]);
});
```

### Command Options

```typescript
new SlashCommandBuilder()
  .setName("command")
  .setDescription("A command with all option types")
  .setDefaultMemberPermissions(0n) // Permission bits (0 = no one)
  .setDMPermission(false)          // Disable in DMs
  .setNSFW(true)                   // Mark as NSFW
  
  // Text options
  .addStringOption((option) =>
    option
      .setName("text")
      .setDescription("Some text")
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(100)
      .addChoice("Option 1", "value1")
      .addChoice("Option 2", "value2")
  )
  
  // Number options
  .addIntegerOption((option) =>
    option
      .setName("number")
      .setDescription("An integer")
      .setMinValue(0)
      .setMaxValue(100)
  )
  .addNumberOption((option) =>
    option
      .setName("decimal")
      .setDescription("A decimal number")
  )
  
  // Boolean option
  .addBooleanOption((option) =>
    option.setName("toggle").setDescription("Toggle something")
  )
  
  // Discord objects
  .addUserOption((option) =>
    option.setName("user").setDescription("Target user")
  )
  .addChannelOption((option) =>
    option.setName("channel").setDescription("Target channel")
  )
  .addRoleOption((option) =>
    option.setName("role").setDescription("Target role")
  )
  
  // Mentionable (users or roles)
  .addMentionableOption((option) =>
    option.setName("mention").setDescription("Mention someone")
  )
  
  // File attachment
  .addAttachmentOption((option) =>
    option.setName("file").setDescription("Upload a file")
  )
  
  // Subcommands
  .addSubcommand((sub) =>
    sub
      .setName("subcommand")
      .setDescription("A subcommand")
      .addStringOption((opt) => opt.setName("arg").setDescription("Argument"))
  )
  
  // Subcommand groups
  .addSubcommandGroup((group) =>
    group
      .setName("group")
      .setDescription("A group of subcommands")
      .addSubcommand((sub) =>
        sub.setName("nested").setDescription("Nested subcommand")
      )
  );
```

### Handling Interactions

```typescript
client.on("interactionCreate", async (interaction) => {
  // Application commands (slash commands)
  if (interaction.type === 2) {
    const { name, options } = interaction.data;

    if (name === "ping") {
      // Reply to interaction (initial response)
      await interaction.reply({
        content: "Pong! 🏓",
      });
    }

    if (name === "echo") {
      const text = options?.[0]?.value;
      
      // Defer first (shows "thinking..." state)
      await interaction.defer();
      
      // Then edit the original response
      await interaction.editOriginal({ content: text });
    }
    
    if (name === "secret") {
      // Ephemeral response (only visible to the user)
      await interaction.reply({
        content: "This is secret!",
        flags: 64, // ephemeral flag
      });
    }
  }

  // Component interactions (buttons, select menus)
  if (interaction.type === 3) {
    const { custom_id } = interaction.data;

    if (custom_id === "my_button") {
      // Reply to button click (ephemeral)
      await interaction.reply({
        content: "Button clicked!",
        flags: 64,
      });
    }
  }
  
  // Using other interaction methods
  if (needsFollowUp) {
    // Send additional messages after initial response
    await interaction.sendFollowUp({
      content: "Follow-up message",
      ephemeral: true,
    });
  }
  
  // Delete original response
  await interaction.deleteOriginal();
});
```

---

## Voice Module

### Joining Voice Channels

```typescript
import { AudioPlayer } from "@hedystia/discord";

// Join a voice channel
const connection = await client.voice.joinVoiceChannel({
  guildId: "GUILD_ID",
  channelId: "VOICE_CHANNEL_ID",
  selfMute: false,
  selfDeaf: false,
  selfVideo: false,
});

console.log("Joined voice channel!");
```

### Playing Audio

```typescript
// Create audio player
const player = new AudioPlayer();
player.setConnection(connection);

// Play audio file (requires ffmpeg)
player.play("path/to/audio.mp3", {
  volume: 0.5,    // 0.0 to 1.0
  loop: false,    // Loop the audio
  seek: 0,        // Start at seconds
});

// Play from URL
player.play("https://example.com/audio.mp3", {
  volume: 0.8,
});
```

### Player Controls

```typescript
// Playback control
player.pause();
player.resume();
player.stop();

// Volume control
player.setVolume(0.5);  // 50%
player.getVolume();     // Get current volume

// Seek
player.seek(30);        // Jump to 30 seconds
player.getCurrentTime(); // Get current position

// Events
player.on("start", () => console.log("Started playing"));
player.on("finish", () => console.log("Finished playing"));
player.on("error", (err) => console.error("Player error:", err));
player.on("debug", (info) => console.log("Debug:", info));
```

### Connection Events

```typescript
connection.on("ready", (data) => {
  console.log("Voice connection ready", data);
});

connection.on("error", (error) => {
  console.error("Voice connection error:", error);
});

connection.on("close", () => {
  console.log("Voice connection closed");
});

connection.on("stateChange", (oldState, newState) => {
  console.log("State changed:", oldState, newState);
});
```

### Leaving Voice Channels

```typescript
// Leave specific guild
await client.voice.leaveVoiceChannel("GUILD_ID");

// Leave all voice channels
for (const guildId of client.voice.connections.keys()) {
  await client.voice.leaveVoiceChannel(guildId);
}
```

---

## Builders

Builders are fluent interfaces for constructing Discord objects. They provide method chaining for easy configuration.

### EmbedBuilder

```typescript
import { EmbedBuilder } from "@hedystia/discord";

const embed = new EmbedBuilder()
  .setTitle("My Embed")
  .setDescription("This is the description")
  .setURL("https://example.com")
  .setColor("#FF0000")      // Hex or number: 0xFF0000
  .setTimestamp()            // Current time
  .setFooter({
    text: "Footer text",
    iconURL: "https://example.com/icon.png",
  })
  .setThumbnail("https://example.com/thumbnail.png")
  .setImage("https://example.com/image.png")
  .setAuthor({
    name: "Author Name",
    url: "https://example.com",
    iconURL: "https://example.com/author.png",
  })
  .addField({
    name: "Field 1",
    value: "Field value",
    inline: true,
  })
  .addFields(
    { name: "Field 2", value: "Value 2" },
    { name: "Field 3", value: "Value 3", inline: true }
  );

// Send with a channel (assuming you have a channel object)
channel.send({
  content: "Check this out!",
  embeds: [embed],
});

// Or with interaction response
interaction.reply({
  embeds: [embed],
});
```

### ButtonBuilder

```typescript
import { ButtonBuilder, ButtonStyle } from "@hedystia/discord";

// Primary button
const primary = new ButtonBuilder()
  .setLabel("Click Me")
  .setCustomId("my_button")
  .setStyle(ButtonStyle.Primary);

// Preset styles
ButtonBuilder.primary()
  .setLabel("Primary")
  .setCustomId("primary");

ButtonBuilder.secondary()
  .setLabel("Secondary")
  .setCustomId("secondary");

ButtonBuilder.success()
  .setLabel("Success")
  .setCustomId("success");

ButtonBuilder.danger()
  .setLabel("Danger")
  .setCustomId("danger");

// Link button (opens URL)
ButtonBuilder.link()
  .setLabel("Visit Site")
  .setURL("https://example.com");

// With emoji
button.setEmoji("👍");
// or
button.setEmoji({ id: "emoji_id", name: "emoji", animated: false });

// Disabled state
button.setDisabled(true);
```

### ActionRowBuilder

```typescript
import { ActionRowBuilder } from "@hedystia/discord";

const row = new ActionRowBuilder()
  .addComponents(
    ButtonBuilder.primary().setLabel("Button 1").setCustomId("btn1"),
    ButtonBuilder.secondary().setLabel("Button 2").setCustomId("btn2")
  );

// Or set all components at once
row.setComponents(button1, button2, button3);

// Send with message (builders are auto-converted)
channel.send({
  content: "Click a button!",
  components: [row],
});
```

### Select Menu Builders

```typescript
import {
  ChannelSelectBuilder,
  MentionableSelectBuilder,
  RoleSelectBuilder,
  UserSelectBuilder,
} from "@hedystia/discord";

// Channel select
const channelSelect = new ChannelSelectBuilder()
  .setCustomId("channel_select")
  .setPlaceholder("Select a channel")
  .setMaxValues(3)
  .setMinValues(1);

// User select
const userSelect = new UserSelectBuilder()
  .setCustomId("user_select")
  .setPlaceholder("Select a user")
  .setMaxValues(5);

// Role select
const roleSelect = new RoleSelectBuilder()
  .setCustomId("role_select")
  .setPlaceholder("Select a role");

// Mentionable select (users or roles)
const mentionableSelect = new MentionableSelectBuilder()
  .setCustomId("mentionable_select")
  .setPlaceholder("Select someone");
```

### Other Component Builders

```typescript
import {
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  ThumbnailBuilder,
} from "@hedystia/discord";

// Text display (markdown)
const textDisplay = new TextDisplayBuilder()
  .setContent("# Hello\nThis is **markdown** content");

// Separator
const separator = new SeparatorBuilder()
  .setSpacing(1); // or 2, 3

// Section with components
const section = new SectionBuilder()
  .addComponents(textDisplay, button);

// Container for grouping
const container = new ContainerBuilder()
  .addComponents(section, separator);

// Media gallery
const gallery = new MediaGalleryBuilder()
  .addItems({
    url: "https://example.com/image.jpg",
    description: "Image description",
  });

// Thumbnail
const thumbnail = new ThumbnailBuilder()
  .setURL("https://example.com/thumb.jpg")
  .setHeight(100)
  .setWidth(100);
```

---

## Collectors

Collectors allow you to collect and handle multiple events over a period of time.

### MessageCollector

```typescript
import { MessageCollector } from "@hedystia/discord";

const collector = new MessageCollector(client, {
  time: 60000,           // 1 minute
  max: 10,               // Max 10 messages
  maxProcessing: 5,      // Max 5 per second
  filter: (msg) => msg.author.id === "USER_ID",
  channelId: "CHANNEL_ID",
  guildId: "GUILD_ID",
  userId: "USER_ID",
  dispose: true,         // Remove from cache on dispose
  resetTimer: true,      // Reset timer on each collect
});

collector.on("collect", (message) => {
  console.log("Collected:", message.content);
});

collector.on("ignore", (message) => {
  console.log("Ignored:", message.content);
});

collector.on("dispose", (message) => {
  console.log("Disposed:", message.content);
});

collector.on("end", (collected, reason) => {
  console.log(`Ended: ${reason}`);
  console.log(`Collected ${collected.size} messages`);
  
  // Iterate over collected messages
  for (const [id, msg] of collected.entries()) {
    console.log(id, msg.content);
  }
});

// Stop manually
collector.stop("user");
```

### InteractionCollector (Buttons & Select Menus)

```typescript
import { InteractionCollector } from "@hedystia/discord";

// Button collector
const buttonCollector = InteractionCollector.createButtonCollector(
  client,
  "my_button_id",  // Custom ID to filter
  {
    time: 30000,
    max: 5,
    channelId: "CHANNEL_ID",
    guildId: "GUILD_ID",
    userId: "USER_ID",
  }
);

buttonCollector.on("collect", async (interaction) => {
  console.log("Button clicked by:", interaction.user?.id);

  // Acknowledge interaction
  await interaction.reply({
    content: "Button clicked!",
  });
});

// Select menu collector
const selectCollector = InteractionCollector.createSelectMenuCollector(
  client,
  "select_id",
  { time: 60000 }
);

selectCollector.on("collect", (interaction) => {
  const values = interaction.data.values;
  console.log("Selected:", values);
});

// Message component collector (all interactions on a message)
const messageCollector = InteractionCollector.createMessageCollector(
  client,
  "MESSAGE_ID",
  { time: 120000 }
);
```

### ReactionCollector

```typescript
import { ReactionCollector } from "@hedystia/discord";

const collector = new ReactionCollector(client, {
  messageId: "MESSAGE_ID",
  channelId: "CHANNEL_ID",
  guildId: "GUILD_ID",
  userId: "USER_ID",
  emoji: "👍",           // Filter by emoji
  maxReactions: 10,      // Max total reactions
  time: 60000,
});

collector.on("collect", (reaction, userId) => {
  console.log(`Reaction ${reaction.emoji.name} by ${userId}`);
});

collector.on("end", (collected, reason) => {
  console.log(`Total unique reactions: ${collector.uniqueReactions}`);
  console.log(`Total reactions: ${collector.totalReactions}`);
});

// Static helpers
ReactionCollector.createMessageCollector(client, "MESSAGE_ID");
ReactionCollector.createEmojiCollector(client, "👍");
```

### Collector Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `time` | `number` | Time in milliseconds before stopping |
| `max` | `number` | Maximum number of items to collect |
| `maxProcessing` | `number` | Maximum items per second |
| `filter` | `function` | Filter function `(item, ...args) => boolean` |
| `dispose` | `boolean` | Whether to dispose items when removed |
| `resetTimer` | `boolean` | Whether to reset timer on each collect |
| `messageId` | `string` | Filter by message ID |
| `channelId` | `string` | Filter by channel ID |
| `guildId` | `string` | Filter by guild ID |
| `userId` | `string` | Filter by user ID |
| `emoji` | `string` | Filter by emoji (ReactionCollector) |
| `customId` | `string` | Filter by custom ID (InteractionCollector) |
| `componentType` | `number` | Filter by component type |

---

## Managers

Managers handle caching and fetching of Discord objects.

### UserManager

```typescript
// Fetch a user
const user = await client.users.fetch("USER_ID");

// Access cache
const cached = client.users.cache.get("USER_ID");

// Iterate cache
for (const [id, user] of client.users.cache.entries()) {
  console.log(id, user.username);
}
```

### GuildManager

```typescript
// Fetch a guild
const guild = await client.guilds.fetch("GUILD_ID");

// Access cache
const cached = client.guilds.cache.get("GUILD_ID");

// Get all guilds
const allGuilds = await client.guilds.fetchAll();
```

### ChannelManager

```typescript
// Fetch a channel
const channel = await client.channels.fetch("CHANNEL_ID");

// Access cache
const cached = client.channels.cache.get("CHANNEL_ID");
```

### MemberManager

```typescript
// Fetch a member
const member = await client.members.fetch("GUILD_ID", "USER_ID");

// Access cache
const cached = client.members.cache.get("USER_ID");

// Get all members in a guild
const guildMembers = await client.members.fetchGuildMembers("GUILD_ID");
```

### RoleManager

```typescript
// Fetch a role
const role = await client.roles.fetch("GUILD_ID", "ROLE_ID");

// Access cache
const cached = client.roles.cache.get("ROLE_ID");
```

### EmojiManager

```typescript
// Fetch all emojis from a guild
const emojis = await client.emojis.fetch("GUILD_ID");

// Fetch single emoji
const emoji = await client.emojis.fetchOne("GUILD_ID", "EMOJI_ID");

// Access cache
const cached = client.emojis.cache.get("EMOJI_ID");
```

### Cache Configuration

```typescript
const client = new Client({
  cache: {
    managers: {
      users: {
        enabled: true,
        maxSize: 10000,
        ttl: 1800000,        // 30 minutes
        dynamicTTL: true,    // Extend TTL on access
      },
      guilds: {
        enabled: true,
        maxSize: 1000,
      },
      channels: {
        enabled: true,
        maxSize: 5000,
      },
    },
  },
});
```

---

## Structures

Structures are rich wrappers around Discord API data.

### InteractionStructure

```typescript
// Properties
interaction.id;                 // Interaction ID
interaction.type;               // Interaction type
interaction.token;              // Interaction token
interaction.data;               // Interaction data
interaction.message;            // Message (for component interactions)
interaction.user;               // User who triggered
interaction.member;             // Member (in guilds)
interaction.customId;           // Custom ID (for components)
interaction.userId;             // User ID who triggered
interaction.isButton;           // Is from a button
interaction.isSelectMenu;       // Is from a select menu
interaction.isMessageComponent; // Is a message component

// Methods - Response handling
await interaction.reply({               // Initial response
  content: "Hello!",
  embeds: [embed],
  components: [row],
  flags: 64,            // ephemeral (optional)
});

await interaction.defer(ephemeral);     // "thinking..." state
await interaction.editOriginal({        // Edit original response
  content: "Edited!",
  embeds: [newEmbed],
});
await interaction.deleteOriginal();     // Delete original response
await interaction.sendFollowUp({        // Additional message
  content: "Follow-up",
  ephemeral: true,
});

// Methods - Collectors
interaction.createMessageComponentCollector(options);
interaction.createButtonCollector(customId, options);
interaction.createSelectMenuCollector(customId, options);
```

### MessageStructure

```typescript
// Properties
message.mention;                    // Message URL
message.author;                     // Author info
message.isFromCurrentUser;          // Boolean
message.isCrossposted;              // Boolean
message.isAutomaticModerationAction;
message.createdTimestamp;           // Unix timestamp
message.createdAt;                  // Date object
message.editedTimestamp;
message.editedAt;
message.isEditable;
message.isDeletable;
message.isPinnable;
message.hasEmbeds;
message.hasAttachments;
message.hasReactions;
message.mentionsEveryone;

// Check mentions
message.mentionsRole("ROLE_ID");
message.mentionsUser("USER_ID");
message.mentionsChannel("CHANNEL_ID");

// Actions
await message.react("👍");
await message.reply("Reply content");
await message.edit("New content");
await message.delete();
await message.pin();
await message.unpin();
await message.fetch();              // Refetch from API
await message.crosspost();          // For news channels
await message.startThread("Name", 1440); // 1440 = 24h

// Create collectors on message
message.createReactionCollector({ time: 60000 });
message.createButtonCollector("button_id", { time: 30000 });
message.createSelectMenuCollector("select_id");
message.createMessageComponentCollector({ time: 60000 });
```

### GuildStructure

```typescript
// URLs
guild.iconURL({ size: 1024, extension: "png" });
guild.bannerURL({ size: 1024 });
guild.splashURL();
guild.discoverySplashURL();

// Timestamps
guild.createdTimestamp;
guild.createdAt;

// Cache access
guild.members;      // Members array from cache
guild.channels;     // Channels array from cache
guild.roles;        // Roles array from cache

// Properties
guild.isOwner;      // Is current user the owner?
guild.available;    // Is guild available?
guild.isLarge;      // Is guild large (>250 members)?

// Comparison
guild.equals(otherGuild);
```

### MemberStructure

```typescript
// Mentions
member.mention;             // <@user_id>
member.nicknameMention;     // <@!user_id> or null

// Display name
member.displayName;         // Nickname or username

// Avatar
member.avatarURL({ size: 1024, extension: "png" });
member.bannerURL({ size: 1024 });

// Timestamps
member.joinedTimestamp;
member.joinedAt;
member.premiumSinceTimestamp;
member.premiumSince;
member.communicationDisabledUntilTimestamp;
member.communicationDisabledUntil;

// Properties
member.isCommunicationDisabled;
member.isPremium;           // Is boosting
member.isPending;           // Pending verification

// Role checks
member.hasRole("ROLE_ID");
member.hasAnyRole("ROLE1", "ROLE2");
member.hasAllRoles("ROLE1", "ROLE2");
```

### RoleStructure

```typescript
// Mention
role.mention;               // <@&role_id> or @everyone

// Color
role.hexColor;              // #RRGGBB

// Timestamp
role.createdTimestamp;
role.createdAt;

// Properties
role.isEveryone;            // Is @everyone
role.isBotRole;             // Has bot_id tag
role.isIntegrationRole;     // Has integration_id tag
role.isPremiumSubscriberRole;
role.isAvailableForPurchase;
role.isGuildLinkedRole;
```

### UserStructure

```typescript
// Mention
user.mention;               // <@user_id>

// Avatar
user.avatarURL({ size: 1024, extension: "png", forceStatic: false });
user.defaultAvatarURL;      // Default Discord avatar

// Banner
user.bannerURL({ size: 1024 });

// Properties
user.isBot;
user.isSystem;
user.displayName;           // Global name or username

// Timestamps
user.createdTimestamp;
user.createdAt;
```

---

## REST API

> **Note:** For most use cases, prefer using the high-level methods from Structures (like `channel.send()`, `message.edit()`, `interaction.reply()`). Use the REST API directly only when you need low-level control or when a method isn't available in the structures.

### Making Requests

```typescript
import REST from "@hedystia/discord";

const rest = new REST({
  token: "Bot YOUR_TOKEN",
  version: 10,
  restRequestTimeout: 10000,
});

// GET request
const user = await rest.get("/users/@me");

// POST request
const message = await rest.post("/channels/CHANNEL_ID/messages", {
  body: {
    content: "Hello!",
    embeds: [embed],
  },
});

// PUT request (update)
await rest.put("/channels/CHANNEL_ID/messages/MSG_ID", {
  body: { content: "Updated content" },
});

// PATCH request (partial update)
await rest.patch("/users/@me", {
  body: { username: "New Name" },
});

// DELETE request
await rest.delete("/channels/CHANNEL_ID/messages/MSG_ID");
```

### Request Options

```typescript
await rest.get("/users/USER_ID", {
  headers: {
    "X-Custom-Header": "value",
  },
  query: {
    with_counts: "true",
  },
  reason: "Audit log reason",
  auth: true,  // Include auth header
});
```

### Routes Helper

```typescript
import { Routes } from "@hedystia/discord";

// User routes
Routes.user(userId);
Routes.channel(channelId);

// Guild routes
Routes.guild(guildId);
Routes.guildChannels(guildId);
Routes.guildMembers(guildId);
Routes.guildMember(guildId, userId);
Routes.guildRoles(guildId);
Routes.guildRole(guildId, roleId);
Routes.guildBans(guildId);
Routes.guildBan(guildId, userId);
Routes.guildEmojis(guildId);
Routes.guildEmoji(guildId, emojiId);

// Command routes
Routes.applicationCommands(applicationId);
Routes.applicationCommand(applicationId, commandId);
Routes.applicationGuildCommands(applicationId, guildId);
Routes.applicationGuildCommand(applicationId, guildId, commandId);

// Interaction routes
Routes.interactionCallback(interactionId, token);

// Other routes
Routes.gatewayBot();
Routes.webhook(webhookId, token);
Routes.webhookMessage(webhookId, token, messageId);
```

### Rate Limit Handling

```typescript
// Automatic rate limit handling
const info = rest.getRateLimitInfo("GET", "/channels/CHANNEL_ID/messages");
console.log(info.remaining, info.resetAfter);

// Check if rate limited
const isLimited = rest.isRateLimited("POST", "/channels/CHANNEL_ID/messages");
const timeUntilReset = rest.getTimeUntilReset("GET", "/users/@me");
```

### CDN Helper

```typescript
import { CDN, ImageFormat } from "@hedystia/discord";

// Avatar
const avatarUrl = CDN.avatar(userId, hash, {
  size: 1024,
  format: ImageFormat.PNG,
});

// Guild icons
const iconUrl = CDN.guildIcon(guildId, hash);
const bannerUrl = CDN.guildBanner(guildId, hash);
const splashUrl = CDN.splash(guildId, hash);

// Emoji
const emojiUrl = CDN.emoji(emojiId, { animated: true });

// App icons
const appIconUrl = CDN.appIcon(applicationId, assetId);
const appCoverImageUrl = CDN.appCoverImage(applicationId, assetId);

// All URLs include https://cdn.discordapp.com prefix
```

---

## Utilities

### Cache

```typescript
import { Cache } from "@hedystia/discord";

const cache = new Cache({
  maxSize: 100,
  ttl: 300000,           // 5 minutes
  dynamicTTL: true,      // Extend on access
  cleanupInterval: 60000,
});

// Basic operations
cache.set("key", "value");
cache.get("key");
cache.has("key");
cache.delete("key");
cache.clear();

// With per-item options
cache.set("key", "value", {
  ttl: 60000,           // Override TTL
  keepForever: true,    // Never expire
});

// Stats
const stats = cache.getStats();
console.log(`Hit ratio: ${(stats.hitRatio * 100).toFixed(2)}%`);
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
```

### Collection

```typescript
import { Collection } from "@hedystia/discord";

const collection = new Collection();

// Map-like operations
collection.set("key", "value");
collection.get("key");
collection.has("key");
collection.delete("key");
collection.clear();
collection.size;

// Array-like methods
collection.first();           // First value
collection.first(5);          // First 5 values
collection.last();            // Last value
collection.at(0);             // Value at index
collection.find((v, k) => v === "value");
collection.filter((v, k) => k.startsWith("prefix"));
collection.map((v, k) => v.toUpperCase());
collection.some((v, k) => v === "test");
collection.every((v, k) => v !== null);
collection.forEach((v, k) => console.log(k, v));

// Reduce
const sum = collection.reduce((acc, val) => acc + val, 0);

// Sorting
collection.sort((a, b) => a - b);
const sorted = collection.sorted((a, b) => a - b);

// Utilities
collection.clone();
collection.random();
collection.randomKey();
collection.equals(otherCollection);
collection.isEmpty();

// Set operations
const union = collection.union(other);
const intersection = collection.intersection(other);
const difference = collection.difference(other);
const symmetricDiff = collection.symmetricDifference(other);

// Math
collection.sum();
collection.average();
collection.min();
collection.max();
```

---

## Complete Example

```typescript
import Client, {
  Intents,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  SlashCommandBuilder,
  ActivityType,
} from "@hedystia/discord";

const client = new Client({
  token: process.env.DISCORD_TOKEN!,
  intents: Intents.guilds | Intents.guildMessages | Intents.messageContent,
  presence: {
    activities: [{ name: "Discord", type: ActivityType.Playing }],
    status: "online",
  },
});

client.on("ready", async () => {
  console.log(`✅ Logged in as ${client.me?.username}`);

  // Register commands
  await client.registerCommands([
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Check bot latency"),
  ]);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.type !== 2) return; // Not a command
  
  if (interaction.data.name === "ping") {
    const embed = new EmbedBuilder()
      .setTitle("🏓 Pong!")
      .setDescription(`Latency: ${client.ping}ms`)
      .setColor(0x00FF00)
      .setTimestamp();
    
    const button = ButtonBuilder.primary()
      .setLabel("Refresh")
      .setCustomId("refresh_ping");
    
    const row = new ActionRowBuilder().addComponents(button);
    
    // Reply to interaction using InteractionStructure methods
    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
    
    // Handle button clicks
    const collector = interaction.createButtonCollector("refresh_ping", { 
      time: 60000 
    });
    
    collector.on("collect", async (btnInteraction) => {
      embed.setDescription(`Latency: ${client.ping}ms (refreshed)`);
      
      // Edit the original response
      await btnInteraction.editOriginal({
        embeds: [embed],
      });
      
      // Acknowledge the button click (ephemeral)
      await btnInteraction.defer(true);
    });
  }
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  
  if (message.content === "!hello") {
    message.reply("Hello there! 👋");
  }
});

await client.login();
```

---

## License

MIT
