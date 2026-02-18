export type TokenMode = "estimate" | "exact";

export type OpenAITokenizeRequest = {
  id: number;
  text: string;
  encoding: "o200k_base";
};

export type OpenAITokenizeSuccess = {
  id: number;
  tokenCount: number;
};

export type OpenAITokenizeFailure = {
  id: number;
  error: string;
};

export type OpenAITokenizeResponse = OpenAITokenizeSuccess | OpenAITokenizeFailure;

