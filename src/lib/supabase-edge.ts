import { supabase } from "@/integrations/supabase/client";

type InvokePayload = Record<string, unknown>;

function parseInvokeError(error: unknown, data: unknown): string {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Edge function request failed.";
}

/** Invoke a Supabase Edge Function (deployed via `supabase functions deploy`). */
export async function invokeEdgeFunction<T>(name: string, body: InvokePayload): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(parseInvokeError(error, data));
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    throw new Error(data.error);
  }
  return data as T;
}
