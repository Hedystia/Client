class Intents {
  static Flags: {
    Guilds: number;
    Guild_Members: number;
    Guild_Moderation: number;
    Guild_Emojis_And_Stickers: number;
    Guild_Integrations: number;
    Guild_Webhooks: number;
    Guild_Invites: number;
    Guild_Voice_States: number;
    Guild_Presences: number;
    Guild_Messages: number;
    Guild_Message_Reactions: number;
    Guild_Message_Typing: number;
    Direct_Messages: number;
    Direct_Message_Reactions: number;
    Direct_Message_Typing: number;
    Message_Content: number;
    Guild_Scheduled_Events: number;
    Auto_Moderation_Configuration: number;
    Auto_Moderation_Execution: number;
  };
  static Default: number;
  static All: number;

  convert(flags: number[]): number {
    return Object.values(flags).reduce((a, b) => a | b, Intents.Default);
  }
}

Intents.Flags = {
  Guilds: 1 << 0,
  Guild_Members: 1 << 1,
  Guild_Moderation: 1 << 2,
  Guild_Emojis_And_Stickers: 1 << 3,
  Guild_Integrations: 1 << 4,
  Guild_Webhooks: 1 << 5,
  Guild_Invites: 1 << 6,
  Guild_Voice_States: 1 << 7,
  Guild_Presences: 1 << 8,
  Guild_Messages: 1 << 9,
  Guild_Message_Reactions: 1 << 10,
  Guild_Message_Typing: 1 << 11,
  Direct_Messages: 1 << 12,
  Direct_Message_Reactions: 1 << 13,
  Direct_Message_Typing: 1 << 14,
  Message_Content: 1 << 15,
  Guild_Scheduled_Events: 1 << 16,
  Auto_Moderation_Configuration: 1 << 20,
  Auto_Moderation_Execution: 1 << 21,
};

Intents.Default = 0;

Intents.All = Object.values(Intents.Flags).reduce((a, b) => a | b, Intents.Default);

export default Intents;
