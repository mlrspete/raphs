import "server-only";

type TurnstileVerifyResult = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(token: string | null, remoteIp?: string | null) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return {
      ok: true,
      skipped: true,
    };
  }

  if (!token) {
    return {
      ok: false,
      skipped: false,
      error: "Anti-bot verification is required.",
    };
  }

  const body = new URLSearchParams({
    response: token,
    secret: secretKey,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      body,
      method: "POST",
    });
    const result = (await response.json()) as TurnstileVerifyResult;

    if (!result.success) {
      return {
        ok: false,
        skipped: false,
        error: "Anti-bot verification failed.",
      };
    }

    return {
      ok: true,
      skipped: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Turnstile verification failed: ${message}`);

    return {
      ok: false,
      skipped: false,
      error: "Anti-bot verification could not be completed.",
    };
  }
}
