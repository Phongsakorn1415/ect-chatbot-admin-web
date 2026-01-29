import {
  useChatContext,
  Message,
  UseChatReturn,
} from "@/lib/contexts/ChatContext";

export type { Message, UseChatReturn };

export const useChat = () => {
  return useChatContext();
};
