import type { PageServerLoad } from './$types';

export const load = (async () => {
  return {
    cards: [
      {
        id: 1,
        title: 'Card 1',
        description: 'This is card number 1',
        imageSrc: 'https://placehold.co/400x400',
      },
      {
        id: 2,
        title: 'Card 2',
        description: 'This is card number 2',
        imageSrc: 'https://placehold.co/400x400',
      },
      {
        id: 3,
        title: 'Card 3',
        description: 'This is card number 3',
        imageSrc: 'https://placehold.co/400x400',
      },
    ],
  };
}) satisfies PageServerLoad;
