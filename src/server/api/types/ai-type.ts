export type TAITransactionDetail = {
  name: string | null;
  amount: string | number | null;
  category?: string | null;
};

export type TAIResponse = {
  type: string | null;
  category?: string | null;
  purpose: string;
  details: TAITransactionDetail[];
  trxDate: string | null;
  trxTime: string | null;
  walletName?: string | null;
  walletId?: string | null;
};

export type TAIReplyIntent = "SAVE" | "CONVERSATION";

export type TAIChatCompletionUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost?: number;
  is_byok?: boolean;
  prompt_tokens_details?: {
    cached_tokens?: number;
    cache_write_tokens?: number;
    audio_tokens?: number;
    video_tokens?: number;
  };
  cost_details?: {
    upstream_inference_cost?: number;
    upstream_inference_prompt_cost?: number;
    upstream_inference_completions_cost?: number;
  };
  completion_tokens_details?: {
    reasoning_tokens?: number;
    image_tokens?: number;
    audio_tokens?: number;
  };
};

export type TAITransacribeResponse = {
  text: string;
  usage: TAITranscribeCompletionUsage;
};

export type TAITranscribeCompletionUsage = {
  seconds: number;
  cost: number;
};
