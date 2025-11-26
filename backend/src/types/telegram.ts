// Types de base
export interface TelegramUpdate {
  update_id: number;

  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
  can_connect_to_business?: boolean;
  has_main_web_app?: boolean;
}

export type TelegramChatType = "private" | "group" | "supergroup" | "channel";

export interface TelegramChat {
  id: number;
  type: TelegramChatType;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_forum?: boolean;
  is_direct_messages?: boolean;
}

export type TelegramMessageEntityType =
  | "mention"
  | "hashtag"
  | "cashtag"
  | "bot_command"
  | "url"
  | "email"
  | "phone_number"
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "spoiler"
  | "blockquote"
  | "expandable_blockquote"
  | "code"
  | "pre"
  | "text_link"
  | "text_mention"
  | "custom_emoji";

export interface TelegramMessageEntity {
  type: TelegramMessageEntityType;
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
  language?: string;
  custom_emoji_id?: string;
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramAnimation {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: TelegramPhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramAudio {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  thumbnail?: TelegramPhotoSize;
}

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  thumbnail?: TelegramPhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramStory {
  chat: TelegramChat;
  id: number;
}

export interface TelegramVideo {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: TelegramPhotoSize;
  cover?: TelegramPhotoSize[];
  start_timestamp?: number;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramVideoNote {
  file_id: string;
  file_unique_id: string;
  length: number;
  duration: number;
  thumbnail?: TelegramPhotoSize;
  file_size?: number;
}

export interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
  vcard?: string;
}

export interface TelegramDice {
  emoji: string;
  value: number;
}

export interface TelegramPollOption {
  text: string;
  text_entities?: TelegramMessageEntity[];
  voter_count: number;
}

export interface TelegramPoll {
  id: string;
  question: string;
  question_entities?: TelegramMessageEntity[];
  options: TelegramPollOption[];
  total_voter_count: number;
  is_closed: boolean;
  is_anonymous: boolean;
  type: "regular" | "quiz";
  allows_multiple_answers: boolean;
  correct_option_id?: number;
  explanation?: string;
  explanation_entities?: TelegramMessageEntity[];
  open_period?: number;
  close_date?: number;
}

export interface TelegramLocation {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number;
  live_period?: number;
  heading?: number;
  proximity_alert_radius?: number;
}

export interface TelegramVenue {
  location: TelegramLocation;
  title: string;
  address: string;
  foursquare_id?: string;
  foursquare_type?: string;
  google_place_id?: string;
  google_place_type?: string;
}

// --------------------------------------
// Message = objet "Message" de la doc
// --------------------------------------

export interface TelegramMessage {
  message_id: number;
  message_thread_id?: number;
  direct_messages_topic?: unknown; // DirectMessagesTopic

  from?: TelegramUser;
  sender_chat?: TelegramChat;
  sender_boost_count?: number;
  sender_business_bot?: TelegramUser;
  date: number;
  business_connection_id?: string;
  chat: TelegramChat;

  forward_origin?: unknown; // MessageOrigin
  is_topic_message?: boolean;
  is_automatic_forward?: boolean;
  reply_to_message?: TelegramMessage;
  external_reply?: unknown; // ExternalReplyInfo
  quote?: unknown; // TextQuote
  reply_to_story?: TelegramStory;
  reply_to_checklist_task_id?: number;
  via_bot?: TelegramUser;
  edit_date?: number;
  has_protected_content?: boolean;
  is_from_offline?: boolean;
  is_paid_post?: boolean;
  media_group_id?: string;
  author_signature?: string;
  paid_star_count?: number;

  text?: string;
  entities?: TelegramMessageEntity[];
  link_preview_options?: unknown; // LinkPreviewOptions
  suggested_post_info?: unknown; // SuggestedPostInfo
  effect_id?: string;

  animation?: TelegramAnimation;
  audio?: TelegramAudio;
  document?: TelegramDocument;
  paid_media?: unknown; // PaidMediaInfo
  photo?: TelegramPhotoSize[];
  sticker?: unknown; // Sticker
  story?: TelegramStory;
  video?: TelegramVideo;
  video_note?: TelegramVideoNote;
  voice?: TelegramVoice;

  caption?: string;
  caption_entities?: TelegramMessageEntity[];
  show_caption_above_media?: boolean;
  has_media_spoiler?: boolean;

  checklist?: unknown; // Checklist
  contact?: TelegramContact;
  dice?: TelegramDice;
  game?: unknown; // Game
  poll?: TelegramPoll;
  venue?: TelegramVenue;
  location?: TelegramLocation;

  new_chat_members?: TelegramUser[];
  left_chat_member?: TelegramUser;
  new_chat_title?: string;
  new_chat_photo?: TelegramPhotoSize[];
  delete_chat_photo?: boolean;
  group_chat_created?: boolean;
  supergroup_chat_created?: boolean;
  channel_chat_created?: boolean;
  message_auto_delete_timer_changed?: unknown; // MessageAutoDeleteTimerChanged
  migrate_to_chat_id?: number;
  migrate_from_chat_id?: number;
  pinned_message?: TelegramMessage | unknown; // MaybeInaccessibleMessage

  invoice?: unknown; // Invoice
  successful_payment?: unknown; // SuccessfulPayment
  refunded_payment?: unknown; // RefundedPayment
  users_shared?: unknown; // UsersShared
  chat_shared?: unknown; // ChatShared
  gift?: unknown; // GiftInfo
  unique_gift?: unknown; // UniqueGiftInfo
  connected_website?: string;
  write_access_allowed?: unknown; // WriteAccessAllowed
  passport_data?: unknown; // PassportData
  proximity_alert_triggered?: unknown; // ProximityAlertTriggered
  boost_added?: unknown; // ChatBoostAdded
  chat_background_set?: unknown; // ChatBackground
  checklist_tasks_done?: unknown; // ChecklistTasksDone
  checklist_tasks_added?: unknown; // ChecklistTasksAdded
  direct_message_price_changed?: unknown; // DirectMessagePriceChanged
  forum_topic_created?: unknown; // ForumTopicCreated
  forum_topic_edited?: unknown; // ForumTopicEdited
  forum_topic_closed?: unknown; // ForumTopicClosed
  forum_topic_reopened?: unknown; // ForumTopicReopened
  general_forum_topic_hidden?: unknown; // GeneralForumTopicHidden
  general_forum_topic_unhidden?: unknown; // GeneralForumTopicUnhidden
  giveaway_created?: unknown; // GiveawayCreated
  giveaway?: unknown; // Giveaway
  giveaway_winners?: unknown; // GiveawayWinners
  giveaway_completed?: unknown; // GiveawayCompleted
  paid_message_price_changed?: unknown; // PaidMessagePriceChanged
  suggested_post_approved?: unknown; // SuggestedPostApproved
  suggested_post_approval_failed?: unknown; // SuggestedPostApprovalFailed
  suggested_post_declined?: unknown; // SuggestedPostDeclined
  suggested_post_paid?: unknown; // SuggestedPostPaid
  suggested_post_refunded?: unknown; // SuggestedPostRefunded

  reply_markup?: unknown; // InlineKeyboardMarkup
}
export interface FileInfo {
  ok: boolean;
  result: {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
    file_path?: string;
  };
}
