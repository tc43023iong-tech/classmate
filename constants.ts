export const STORAGE_KEY_STUDENTS = 'pokeclass_students_v1';
export const STORAGE_KEY_LOGS = 'pokeclass_logs_v1';

// Base URL for high-quality official artwork from PokeAPI GitHub
export const getPokemonImage = (id: number) => 
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

// Updated to 500 as requested
export const TOTAL_POKEMON_AVAILABLE = 500; 

export const SOUND_EFFECTS = {
  positive: [
    'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Coin
    'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Success Chime
    'https://assets.mixkit.co/active_storage/sfx/605/605-preview.mp3',   // Magic
    'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',  // Checkpoint
    'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3'     // Bubbles
  ],
  negative: [
    'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Hit
    'https://assets.mixkit.co/active_storage/sfx/286/286-preview.mp3',   // Fail Low
    'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', // Retro Error
    'https://assets.mixkit.co/active_storage/sfx/892/892-preview.mp3',    // Cartoon Splat
    'https://assets.mixkit.co/active_storage/sfx/2044/2044-preview.mp3'    // Boom
  ]
};

export const POSITIVE_BEHAVIORS = [
  { label: "Active Participation", labelZh: "積極參與", points: 1 },
  { label: "Homework Complete", labelZh: "作業完成", points: 2 },
  { label: "Helped a Friend", labelZh: "幫助同學", points: 3 },
  { label: "Creative Thinking", labelZh: "創意思考", points: 2 },
  { label: "Perfect Attendance", labelZh: "全勤表現", points: 5 },
  { label: "Good Manners", labelZh: "有禮貌", points: 1 },
  { label: "Clean Desk", labelZh: "桌面整潔", points: 1 },
  { label: "Teamwork", labelZh: "團隊合作", points: 2 },
  { label: "Speaking English", labelZh: "說英文", points: 2 },
];

export const NEGATIVE_BEHAVIORS = [
  { label: "Distracting Others", labelZh: "干擾他人", points: -2 },
  { label: "Forgot Homework", labelZh: "忘記作業", points: -2 },
  { label: "Late to Class", labelZh: "上課遲到", points: -1 },
  { label: "Disruptive", labelZh: "搗亂秩序", points: -3 },
  { label: "No Supplies", labelZh: "沒帶用品", points: -1 },
  { label: "Sleeping", labelZh: "上課睡覺", points: -2 },
  { label: "Eating in Class", labelZh: "偷吃東西", points: -1 },
];