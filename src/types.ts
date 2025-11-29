/** @format */

export type ChatRequest = {
  model: string;
  message: string;
  paidKeyUse: boolean;
};

export type ChatResponse = {
  reply: string;
};
