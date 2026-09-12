/**
 * ============================================================================
 * Word Puzzle — data/themes.js (plan/games/04-word-puzzle.md §5)
 * ============================================================================
 * The shipped puzzle content. A JS module (not JSON) on purpose: the game
 * loads it with a static ESM import, which every module-capable browser
 * supports. A JSON-module import (with/assert attributes) is unavailable on
 * Safari < 17.2 and Firefox < 128 — there the game would fail to start, so
 * this data must never be loaded that way again (plan §2/§11: zero fetches).
 * Validated by lintThemes() (core.js) — the jest suite lints this exact file.
 * ============================================================================
 */
export default {
  themes: [
    {
      id: 'animals',
      name: 'Animals',
      emoji: '🦁',
      levels: [
        {
          size: 8,
          parSec: 90,
          words: ['ELEPHANT', 'GIRAFFE', 'ZEBRA', 'TIGER', 'LION'],
        },
        {
          size: 10,
          parSec: 150,
          words: ['DOLPHIN', 'LEOPARD', 'RABBIT', 'BEAVER', 'FALCON', 'OTTER', 'KOALA'],
        },
        {
          size: 12,
          parSec: 240,
          words: [
            'CROCODILE',
            'ORANGUTAN',
            'CHAMELEON',
            'ALLIGATOR',
            'SQUIRREL',
            'HEDGEHOG',
            'PENGUIN',
            'FLAMINGO',
            'TORTOISE',
            'RACCOON',
          ],
        },
      ],
    },
    {
      id: 'food',
      name: 'Food',
      emoji: '🍎',
      levels: [
        {
          size: 8,
          parSec: 90,
          words: ['BANANA', 'MANGO', 'BREAD', 'OLIVE', 'PASTA'],
        },
        {
          size: 10,
          parSec: 150,
          words: ['AVOCADO', 'PUMPKIN', 'CABBAGE', 'TOMATO', 'RADISH', 'GARLIC', 'ONION'],
        },
        {
          size: 12,
          parSec: 240,
          words: [
            'PINEAPPLE',
            'BLUEBERRY',
            'RASPBERRY',
            'CHOCOLATE',
            'SPAGHETTI',
            'CROISSANT',
            'SANDWICH',
            'DUMPLING',
            'PANCAKE',
            'MEATBALL',
          ],
        },
      ],
    },
    {
      id: 'tech',
      name: 'Tech',
      emoji: '💻',
      levels: [
        {
          size: 8,
          parSec: 90,
          words: ['PIXEL', 'ROBOT', 'CLOUD', 'MOUSE', 'CACHE'],
        },
        {
          size: 10,
          parSec: 150,
          words: ['SERVER', 'ROUTER', 'BINARY', 'LAPTOP', 'KERNEL', 'PYTHON', 'JAVA'],
        },
        {
          size: 12,
          parSec: 240,
          words: [
            'ALGORITHM',
            'BANDWIDTH',
            'FIREWALL',
            'KEYBOARD',
            'HARDWARE',
            'SOFTWARE',
            'DATABASE',
            'PROTOCOL',
            'COMPILER',
            'TERMINAL',
          ],
        },
      ],
    },
    {
      id: 'space',
      name: 'Space',
      emoji: '🚀',
      levels: [
        {
          size: 8,
          parSec: 90,
          words: ['COMET', 'VENUS', 'ORBIT', 'PLUTO', 'LUNA'],
        },
        {
          size: 10,
          parSec: 150,
          words: ['JUPITER', 'MERCURY', 'METEOR', 'GALAXY', 'NEBULA', 'SATURN', 'COSMIC'],
        },
        {
          size: 12,
          parSec: 240,
          words: [
            'ASTEROID',
            'SATELLITE',
            'TELESCOPE',
            'SUPERNOVA',
            'UNIVERSE',
            'STARDUST',
            'STARLIGHT',
            'ECLIPSE',
            'GRAVITY',
            'APOLLO',
          ],
        },
      ],
    },
  ],
};
