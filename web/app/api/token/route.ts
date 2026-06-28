import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

// ─── Обмеження частоти (rate limit) ──────────────────────────────────────────
// Простий in-memory лічильник: фіксоване вікно на IP + глобальний бекстоп.
// Best-effort: на serverless стан живе в межах одного інстансу й скидається на
// cold start, тож це не куленепробивний захист, а дешевий перший бар'єр проти
// автоматизованого зловживання (детальніше — у README, розділ про /api/token).
// Для durable-ліміту через інстанси — Upstash Redis (@upstash/ratelimit).
const WINDOW_MS = 60_000;
const MAX_PER_IP = 5; // стартів дзвінка з одного IP за хвилину
const MAX_GLOBAL = 30; // сумарно стартів за хвилину (бекстоп)

type Bucket = { count: number; resetAt: number };
const ipBuckets = new Map<string, Bucket>();
let globalBucket: Bucket = { count: 0, resetAt: 0 };

function checkRateLimit(ip: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();

  if (now > globalBucket.resetAt) globalBucket = { count: 0, resetAt: now + WINDOW_MS };

  let bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    ipBuckets.set(ip, bucket);
  }

  // Періодичне прибирання застарілих ключів, щоб Map не ріс безмежно.
  if (ipBuckets.size > 5000) {
    for (const [key, value] of ipBuckets) if (now > value.resetAt) ipBuckets.delete(key);
  }

  if (bucket.count >= MAX_PER_IP) {
    return { limited: true, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  if (globalBucket.count >= MAX_GLOBAL) {
    return { limited: true, retryAfter: Math.ceil((globalBucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  globalBucket.count++;
  return { limited: false, retryAfter: 0 };
}

export async function POST(req: Request) {
  // Цей роут видає LiveKit-токен анонімному відвідувачу, щоб він міг поговорити з агентом —
  // це публічна демо-фіча, тож токен навмисно доступний без автентифікації.
  // РИЗИК: будь-хто з посиланням може створювати кімнати й витрачати ваші LiveKit/OpenAI-хвилини.
  // Пом'якшення: виставте ліміти витрат у LiveKit Cloud і OpenAI. Швидкий вимикач демо —
  // змінна оточення CALLS_DISABLED=1 (без редеплою коду).
  if (process.env.CALLS_DISABLED === '1') {
    return new NextResponse('Голосове демо тимчасово вимкнено.', { status: 503 });
  }

  // Обмеження частоти за IP (Vercel проставляє x-forwarded-for).
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const { limited, retryAfter } = checkRateLimit(ip);
  if (limited) {
    return new NextResponse('Забагато запитів. Спробуйте за хвилину.', {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Parse room config from request body.
    const body = await req.json();
    const roomConfig = body?.room_config
      ? RoomConfiguration.fromJson(body.room_config, { ignoreUnknownFields: true })
      : new RoomConfiguration();

    // Generate participant token
    const participantName = 'user';
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      roomConfig
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantName,
      participantToken,
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  roomConfig: RoomConfiguration | undefined
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (roomConfig) {
    at.roomConfig = roomConfig;
  }

  return at.toJwt();
}
