import { notFound } from "../http/response.ts";
import { pri as wrapper } from "../http/wrapper.ts";
import {
  delIntercom,
  getIntercom,
  getIntercomForOwner,
  listIntercom,
  setStatusIntercom,
} from "../database/intercom.ts";
import { ringCall } from "../database/intercom-call.ts";

const PRE = "/api/pri/intercom";

// -----------------------------------------------------------------------------
async function get(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const intercomId = pl.id;

  return await getIntercom(identityId, intercomId);
}

// -----------------------------------------------------------------------------
async function list(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const microsec = Number(pl.value) || 0;
  const limit = 10;
  const offset = 0;

  return await listIntercom(identityId, microsec, limit, offset);
}

// -----------------------------------------------------------------------------
async function del(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const intercomId = pl.id;

  return await delIntercom(identityId, intercomId);
}

// -----------------------------------------------------------------------------
async function delWithNotification(
  req: Request,
  identityId: string,
): Promise<unknown> {
  const pl = await req.json();
  const intercomId = pl.id;

  await getIntercomForOwner(identityId, intercomId);

  return await delIntercom(identityId, intercomId);
}

// -----------------------------------------------------------------------------
async function setAccepted(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const intercomId = pl.id;

  return await setStatusIntercom(identityId, intercomId, "accepted");
}

// -----------------------------------------------------------------------------
async function setRejected(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const intercomId = pl.id;

  return await setStatusIntercom(identityId, intercomId, "rejected");
}

// -----------------------------------------------------------------------------
async function setSeen(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const intercomId = pl.id;

  // The optional fourth argument is "ifNone".
  // Update as "seen" if the current status is "none". Otherwise, dont update.
  return await setStatusIntercom(identityId, intercomId, "seen", true);
}

// -----------------------------------------------------------------------------
async function ring(req: Request, identityId: string): Promise<unknown> {
  const pl = await req.json();
  const intercomId = pl.id;

  return await ringCall(identityId, intercomId);
}

// -----------------------------------------------------------------------------
export function streamIntercom(
  _req: Request,
  identityId: string,
): Response {
  let microsec = 0;
  let closed = false;
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      while (!closed) {
        try {
          const rows = await listIntercom(
            identityId,
            microsec,
            10,
            0,
          );
          if (rows.length > 0) {
            const last = rows.at(-1);
            if (last && last.microsec_created_at > microsec) {
              microsec = last.microsec_created_at;
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(rows)}\n\n`),
            );
          }
        } catch {
          break;
        }
        if (closed) break;
        await new Promise<void>((resolve) => setTimeout(resolve, 2500));
      }
      if (!closed) controller.close();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// -----------------------------------------------------------------------------
export default async function routeIntercom(
  req: Request,
  path: string,
  identityId: string,
): Promise<Response> {
  if (path === `${PRE}/get`) {
    return await wrapper(get, req, identityId);
  } else if (path === `${PRE}/list`) {
    return await wrapper(list, req, identityId);
  } else if (path === `${PRE}/del`) {
    return await wrapper(del, req, identityId);
  } else if (path === `${PRE}/del-with-notification`) {
    return await wrapper(delWithNotification, req, identityId);
  } else if (path === `${PRE}/set/accepted`) {
    return await wrapper(setAccepted, req, identityId);
  } else if (path === `${PRE}/set/rejected`) {
    return await wrapper(setRejected, req, identityId);
  } else if (path === `${PRE}/set/seen`) {
    return await wrapper(setSeen, req, identityId);
  } else if (path === `${PRE}/call/ring`) {
    return await wrapper(ring, req, identityId);
  } else {
    return notFound();
  }
}
