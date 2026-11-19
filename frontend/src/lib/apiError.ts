export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, code?: string) {
    super(String(status));
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiErrorFrom(res: Response): Promise<ApiError> {
  let code: string | undefined;
  try {
    const body = await res.json();
    if (typeof body?.error?.code === 'string') code = body.error.code;
  } catch {
    // an error response without a JSON body carries only its status
  }
  return new ApiError(res.status, code);
}

// The API refuses a room whose slug another room of the domain already uses,
// in any letter case: both would open the same Jitsi conference.
export function isRoomNameTaken(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'room_name_taken';
}
