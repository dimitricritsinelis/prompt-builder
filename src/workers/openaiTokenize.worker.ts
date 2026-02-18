/// <reference lib="webworker" />

import model from "@dqbd/tiktoken/encoders/o200k_base.json";
import wasmUrl from "@dqbd/tiktoken/lite/tiktoken_bg.wasm?url";
import type { OpenAITokenizeRequest, OpenAITokenizeResponse } from "../lib/openaiTokenWorker";

type Encoder = {
  encode: (text: string) => Uint32Array;
};

let encoder: Encoder | null = null;
let encoderPromise: Promise<Encoder> | null = null;

async function getEncoder(): Promise<Encoder> {
  if (encoder) {
    return encoder;
  }

  if (!encoderPromise) {
    encoderPromise = (async () => {
      const [{ init, Tiktoken }, wasmResponse] = await Promise.all([
        import("@dqbd/tiktoken/lite/init"),
        fetch(wasmUrl),
      ]);

      if (!wasmResponse.ok) {
        throw new Error(`Failed to load tokenizer wasm (${wasmResponse.status})`);
      }

      const wasmBytes = await wasmResponse.arrayBuffer();
      await init((imports) => WebAssembly.instantiate(wasmBytes, imports));

      encoder = new Tiktoken(model.bpe_ranks, model.special_tokens, model.pat_str) as Encoder;
      return encoder;
    })();
  }

  return encoderPromise;
}

self.onmessage = async (event: MessageEvent<OpenAITokenizeRequest>) => {
  const { id, text } = event.data;

  try {
    const instance = await getEncoder();
    const tokenCount = instance.encode(text).length;
    const response: OpenAITokenizeResponse = { id, tokenCount };
    self.postMessage(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tokenizer unavailable";
    const response: OpenAITokenizeResponse = { id, error: message };
    self.postMessage(response);
  }
};

