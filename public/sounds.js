// /public/sounds.js

// Effect IDs as per README, used by app.js to randomly select an effect
export const EFFECT_IDS = [
  'fade_out', 'shrink_fade', 'sparkle_burst', 'confetti_pop',
  'bounce_drop', 'particle_dissolve', 'pulse_glow',
  'wiggle_spin', 'slide_away', 'star_trail'
];

// Animal manifest with sound URLs and emoji details
export const animals = [
  {
    name: 'Cat',
    emoji: '🐱',
    size: [60, 120], // min/max size in px
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01011751.wav', // cat_purr
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01011754.wav'      // cat_meow
  },
  {
    name: 'Dog',
    emoji: '🐶',
    size: [60, 120],
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01003046.wav', // puppy_whimper
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01003039.wav'      // dog_bark_single
  },
  {
    name: 'Sheep',
    emoji: '🐑',
    size: [60, 120],
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01019012.wav', // sheep_bleat_soft
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01019008.wav'      // sheep_baa
  },
  {
    name: 'Cow',
    emoji: '🐄',
    size: [60, 120],
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01009165.wav', // cow_moo_low
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01009159.wav'      // cow_moo_excited
  },
  {
    name: 'Bird',
    emoji: '🐦',
    size: [60, 120],
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01021022.wav', // bird_coo
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01021031.wav'      // bird_chirp_flurry
  },
  {
    name: 'Chick',
    emoji: '🐤',
    size: [60, 120],
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01021038.wav', // chick_peep_soft
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01021040.wav'      // chick_rapid_peeps
  },
  {
    name: 'Duck',
    emoji: '🦆',
    size: [60, 120],
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01014014.wav', // duck_quack_gentle
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01014018.wav'      // duck_quack_loud
  },
  {
    name: 'Frog',
    emoji: '🐸',
    size: [60, 120],
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01015001.wav', // frog_croak_single
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01015004.wav'      // frog_croak_series
  },
  {
    name: 'Rabbit',
    emoji: '🐰',
    size: [60, 120],
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01022005.wav', // rabbit_sniff
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01022009.wav'      // rabbit_squeak
  },
  {
    name: 'Penguin',
    emoji: '🐧',
    size: [60, 120],
    soundAppear: 'https://bbcsfx.acropolis.org.uk/assets/01017012.wav', // penguin_call_soft
    soundTap: 'https://bbcsfx.acropolis.org.uk/assets/01017016.wav'      // penguin_squawk
  }
];

// Pastel colors for background, as per README
export const PASTELS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E3BAFF', '#FFD1DC', '#C1FFD7', '#FBE7C6', '#D3C0FF'
];
