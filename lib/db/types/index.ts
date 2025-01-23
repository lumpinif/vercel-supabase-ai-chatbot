import type { Enums, Tables } from '@/supabase/types/database.types';

export type Suggestion = Tables<'suggestion'>;
export type Message = Tables<'message'>;
export type Chat = Tables<'chat'>;
export type Profile = Tables<'profile'>;
export type Vote = Tables<'vote'>;
export type Document = Tables<'document'>;
export type Attachment = Tables<'attachment'>;

export type VisibilityType = Enums<'visibility_type'>;
export type BlockKind = Enums<'block_kind'>;
