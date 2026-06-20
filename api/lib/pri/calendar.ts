import { notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import { getLimit, getOffset } from "../database/common.ts";
import { listSessionByMonth } from "../database/calendar.ts";
import {
  getOrCreateCalendarToken,
  regenerateCalendarToken,
} from "../database/calendar-token.ts";

const PRE = "/api/pri/calendar";

// -----------------------------------------------------------------------------
async function listByMonth(
  req: Request,
  identityId: string,
): Promise<unknown> {
  const pl = await req.json();
  const date = pl.value;
  const limit = getLimit(pl.limit);
  const offset = getOffset(pl.offset);

  return await listSessionByMonth(identityId, date, limit, offset);
}

// -----------------------------------------------------------------------------
async function getToken(
  _req: Request,
  identityId: string,
): Promise<unknown> {
  const token = await getOrCreateCalendarToken(identityId);

  return [{ token }];
}

// -----------------------------------------------------------------------------
async function regenerateToken(
  _req: Request,
  identityId: string,
): Promise<unknown> {
  const token = await regenerateCalendarToken(identityId);

  return [{ token }];
}

// -----------------------------------------------------------------------------
export default async function routeCalendar(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/list/bymonth`) {
    return await wrapper(listByMonth, req, identityId);
  } else if (path === `${PRE}/token/get`) {
    return await wrapper(getToken, req, identityId);
  } else if (path === `${PRE}/token/regenerate`) {
    return await wrapper(regenerateToken, req, identityId);
  } else {
    return notFound();
  }
}
