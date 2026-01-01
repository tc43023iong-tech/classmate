export const STORAGE_KEY_STUDENTS = 'pokeclass_students_v1';
export const STORAGE_KEY_LOGS = 'pokeclass_logs_v1';

export const getPokemonImage = (id: number) => 
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export const TOTAL_POKEMON_AVAILABLE = 1010; 

export const SOUND_EFFECTS = {
  positive: [
    'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/605/605-preview.mp3'
  ],
  negative: [
    'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/286/286-preview.mp3',
    'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'
  ]
};

export const POSITIVE_BEHAVIORS = [
  { label: "Active Participation", labelZh: "積極參與", points: 1 },
  { label: "Homework Complete", labelZh: "作業完成", points: 2 },
  { label: "Helped a Friend", labelZh: "幫助同學", points: 3 },
  { label: "Creative Thinking", labelZh: "創意思考", points: 2 },
  { label: "Good Manners", labelZh: "有禮貌", points: 1 },
  { label: "Clean Desk", labelZh: "桌面整潔", points: 1 },
  { label: "Speaking English", labelZh: "說英文", points: 2 },
  { label: "Respect Teacher", labelZh: "尊重容老師", points: 3 },
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

// 學生名單定義
const LIST_4B = "陳沁儀,陳信豪,周詩蕎,鄭瑩瑩,鄭泓昊,蔣沁妍,甘子賢,關子謙,謝欣晏,黃楚堯,黃翰皓,容毓俊,李可欣,陸皆橋,馬超芸,麥嘉俐,牟智杰,潘思涵,蕭珈睿,黃一進,王美琳,趙梓琳,趙慕辰";
const LIST_5B = "歐陽卓軒,陳至濠,謝穎琳,鄭智泓,鄭澳因,陳靜妍,陳浩,霍菁,黃羲辰,郭芷晴,林安娜,劉樂澄,李梓樂,李天恩,梁康妮,梁語翹,梁智中,梁賢正,梁伽藍,梁凱嵐,劉一鳴,盧子君,呂建羲,馬梓倫,吳子軒,吳梓浩,吳穎詩,彭賢信,施泓軒,蕭昊恩,蘇健羽,田浩成,唐敏裕,黃浩藍";
const LIST_4C = "曾子朗,鄭翊翔,陳梓晴,許芝霖,康安娜,胡栩豪,黃璐媛,黃詩皓,嚴穎兒,林晉毅,林雅妍,林寶堅,李凱聰,梁語穎,龍紀潼,盧航俊,盧俊俐,莫芷晴,歐陽健豐,邱佳茵,余樂恆,鍾倬民,鍾倬承";
const LIST_3B = "陳芷柔,陳沛詩,鄭穎彤,張晉熙,朱善恆,馮子陽,傅玥寧,高宇皓,何梓瑤,何金霏,何冠奇,黃欣彤,黎芷楹,黎子滔,林子洋,林曉棟,雷翊權,李祤軒,梁子泓,梁皓宸,梁依晴,廖巧澄,駱峻霆,伍嘉豪,蕭家軒,譚灝楊,丁子皓,黃芊諭,王美樂,許君豪,周海嵐,朱麗媛";

// 預設班級資料 - 已調整為從小到大排序 (3 -> 4 -> 5)
export const PRESET_CLASSES = [
  { name: "三乙 英文", students: LIST_3B },
  { name: "三乙 普通話", students: LIST_3B },
  { name: "四乙 普通話", students: LIST_4B },
  { name: "四乙 英文", students: LIST_4B },
  { name: "四丙 普通話", students: LIST_4C },
  { name: "四丙 公民", students: LIST_4C },
  { name: "五乙 普通話", students: LIST_5B }
];