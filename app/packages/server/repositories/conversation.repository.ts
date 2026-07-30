// implementation of conversation repository

// keep private
const conversations = new Map<string, string>();

// instead of exporting the conversation repository,
// we can publish the interface of this coversation.

// getting and setting the last response ID for a conversation
// export function getLastResponseId(conversationId: string): string | undefined {
//    return conversations.get(conversationId);
// }
// export function setLastResponseId(
//    conversationId: string,
//    responseId: string
// ): void {
//    conversations.set(conversationId, responseId);
// }

// instead of publishing getter and setter methods, we can publish an object conversationRepository with these methods as its properties.
export const conversationRepository = {
   getLastResponseId(conversationId: string): string | undefined {
      return conversations.get(conversationId);
   },
   setLastResponseId(conversationId: string, responseId: string): void {
      conversations.set(conversationId, responseId);
   },
};
