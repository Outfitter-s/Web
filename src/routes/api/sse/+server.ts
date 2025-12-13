import { PubSub } from '$lib/server/valkey/pubsub';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  const channel = url.searchParams.get('channel');
  if (!channel) {
    return new Response('Missing channel parameter', { status: 400 });
  }

  let subscriber: Awaited<ReturnType<typeof PubSub.subscribe>> | null = null;
  let heartbeat: ReturnType<typeof setInterval>;
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Heartbeat to keep connection alive
      heartbeat = setInterval(() => {
        if (!isClosed) {
          try {
            controller.enqueue(':\n\n');
          } catch (e) {
            // Controller is closed, stop heartbeat
            clearInterval(heartbeat);
            isClosed = true;
          }
        }
      }, 15000);

      try {
        subscriber = await PubSub.subscribe(channel, (message) => {
          if (!isClosed) {
            try {
              controller.enqueue(`data: ${message}\n\n`);
            } catch (e) {
              isClosed = true;
              clearInterval(heartbeat);
            }
          }
        });
      } catch (e) {
        clearInterval(heartbeat);
        controller.error(e);
      }
    },
    async cancel() {
      isClosed = true;
      clearInterval(heartbeat);
      if (subscriber) {
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
};

export const POST = async ({ request }) => {
  const { channel, message } = await request.json();
  try {
    await PubSub.publish(channel, message);
    return json({ status: 'ok' });
  } catch (e) {
    return json({
      status: 'error',
      msg: e instanceof Error ? e.message : 'errors.server.connectionRefused',
    });
  }
};
