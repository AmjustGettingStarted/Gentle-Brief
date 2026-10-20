import { errorText, readEnv } from "@/lib/env";
import { estimateDuration } from "@/lib/script";
import { isSessionId, saveAudio } from "@/lib/store/digests";
import type { AudioResult } from "@/types/digest";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function synthesizeSpeech(
  script: string,
  sessionId: string,
  voiceId = readEnv("ELEVENLABS_VOICE_ID") || DEFAULT_VOICE_ID,
): Promise<AudioResult> {
  const duration = estimateDuration(script);
  const apiKey = readEnv("ELEVENLABS_API_KEY");
  const voiceLabel =
    voiceId === "XB0fDUnXU5powFXDhCwa"
      ? "charlotte"
      : voiceId === "pNInz6obpgDQGcFmaJgB"
        ? "adam"
        : voiceId === DEFAULT_VOICE_ID
          ? "default"
          : "other";
  // #region agent log
  fetch("http://127.0.0.1:7779/ingest/41dc1293-3851-4b10-979f-d27ffb3a16ff",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"6ca59f"},body:JSON.stringify({sessionId:"6ca59f",runId:"pre-fix",hypothesisId:"B,D",location:"lib/services/elevenlabs.ts:start",message:"tts voice label",data:{voiceLabel,hasKey:Boolean(apiKey)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (!apiKey || !isSessionId(sessionId)) {
    console.warn("[gentlebrief] ElevenLabs key missing. Using the browser voice.");
    // #region agent log
    fetch("http://127.0.0.1:7779/ingest/41dc1293-3851-4b10-979f-d27ffb3a16ff",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"6ca59f"},body:JSON.stringify({sessionId:"6ca59f",runId:"pre-fix",hypothesisId:"B",location:"lib/services/elevenlabs.ts:fallback",message:"tts fallback",data:{voiceLabel,reason:"missing-key-or-id"},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { mode: "fixture", audioUrl: null, duration, fallback: true };
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: script.slice(0, 5000),
        model_id: "eleven_turbo_v2_5",
        speed: 0.85,
        voice_settings: {
          stability: 0.8,
          similarity_boost: 0.55,
          style: 0.1,
          use_speaker_boost: false,
        },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 400);
      console.error(`[gentlebrief] ElevenLabs HTTP ${response.status}: ${errorText(detail, [apiKey, voiceId])}`);
      // #region agent log
      fetch("http://127.0.0.1:7779/ingest/41dc1293-3851-4b10-979f-d27ffb3a16ff",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"6ca59f"},body:JSON.stringify({sessionId:"6ca59f",runId:"pre-fix",hypothesisId:"B",location:"lib/services/elevenlabs.ts:http",message:"tts http fallback",data:{voiceLabel,status:response.status},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return { mode: "fixture", audioUrl: null, duration, fallback: true };
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 100) {
      console.error("[gentlebrief] ElevenLabs returned an empty audio file.");
      return { mode: "fixture", audioUrl: null, duration, fallback: true };
    }

    const audioUrl = await saveAudio(sessionId, bytes);
    console.info(`[gentlebrief] ElevenLabs audio saved (${bytes.byteLength} bytes)`);
    // #region agent log
    fetch("http://127.0.0.1:7779/ingest/41dc1293-3851-4b10-979f-d27ffb3a16ff",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"6ca59f"},body:JSON.stringify({sessionId:"6ca59f",runId:"pre-fix",hypothesisId:"B,C",location:"lib/services/elevenlabs.ts:saved",message:"tts saved",data:{voiceLabel,bytes:bytes.byteLength},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { mode: "live", audioUrl, duration, fallback: false };
  } catch (error) {
    console.error(`[gentlebrief] ElevenLabs failed: ${errorText(error, [apiKey, voiceId])}`);
    return { mode: "fixture", audioUrl: null, duration, fallback: true };
  }
}
