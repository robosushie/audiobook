export interface VoiceSample {
  id: string;
  name: string;
  language: string;
  audioBlob?: Blob;
  audioUrl?: string;
  createdAt: Date;
}

export const LANGUAGES = [
  'Arabic',
  'Bengali',
  'Chinese (Mandarin)',
  'English',
  'French',
  'German',
  'Gujarati',
  'Hindi',
  'Italian',
  'Japanese',
  'Kannada',
  'Korean',
  'Malayalam',
  'Marathi',
  'Odia',
  'Portuguese',
  'Punjabi',
  'Russian',
  'Spanish',
  'Tamil',
  'Telugu',
  'Turkish',
  'Urdu',
];

export const SAMPLE_TEXTS: Record<string, string> = {
  Arabic: 'في يوم من الأيام، كان هناك طفل صغير يحب القراءة كثيراً.',
  Bengali: 'একদিন একটি ছোট্ট ছেলে বই পড়তে খুব ভালোবাসতো।',
  'Chinese (Mandarin)': '从前，有一个小男孩非常喜欢读书。',
  English:
    'Once upon a time, there was a little child who loved to read books every day.',
  French: 'Il était une fois, un petit enfant qui aimait lire des livres chaque jour.',
  German: 'Es war einmal ein kleines Kind, das jeden Tag gerne Bücher las.',
  Gujarati: 'એક સમયે એક નાનો છોકરો હતો જેને દરરોજ પુસ્તકો વાંચવાનું ગમતું.',
  Hindi: 'एक समय की बात है, एक छोटा बच्चा था जिसे हर दिन किताबें पढ़ना बहुत पसंद था।',
  Italian: "C'era una volta un bambino che amava leggere libri ogni giorno.",
  Japanese: 'むかしむかし、毎日本を読むのが大好きな子どもがいました。',
  Kannada: 'ಒಂದಾನೊಂದು ಕಾಲದಲ್ಲಿ ಪ್ರತಿದಿನ ಪುಸ್ತಕ ಓದಲು ಇಷ್ಟಪಡುವ ಮಗುವೊಂದಿತ್ತು.',
  Korean: '옛날 옛적에 매일 책 읽기를 좋아하는 어린아이가 있었습니다.',
  Malayalam: 'ഒരിക്കൽ ഒരു ചെറിയ കുട്ടി ഉണ്ടായിരുന്നു, അവന് എല്ലാ ദിവസവും പുസ്തകങ്ങൾ വായിക്കാൻ വളരെ ഇഷ്ടമായിരുന്നു.',
  Marathi: 'एकदा एक लहान मूल होतं ज्याला दररोज पुस्तकं वाचायला खूप आवडायचं.',
  Odia: 'ଥରେ ଗୋଟିଏ ସାନ ପିଲା ଥିଲା ଯାହାକୁ ପ୍ରତିଦିନ ବହି ପଢ଼ିବାକୁ ବହୁତ ଭଲ ଲାଗୁଥିଲା।',
  Portuguese: 'Era uma vez uma criança que adorava ler livros todos os dias.',
  Punjabi: 'ਇੱਕ ਵਾਰ ਇੱਕ ਛੋਟਾ ਬੱਚਾ ਸੀ ਜਿਸਨੂੰ ਹਰ ਰੋਜ਼ ਕਿਤਾਬਾਂ ਪੜ੍ਹਨਾ ਬਹੁਤ ਪਸੰਦ ਸੀ।',
  Russian: 'Жил-был маленький ребёнок, который очень любил читать книги каждый день.',
  Spanish: 'Había una vez un niño pequeño que amaba leer libros todos los días.',
  Tamil: 'ஒரு காலத்தில் ஒரு சிறு குழந்தை இருந்தது, அதற்கு தினமும் புத்தகங்கள் படிக்க மிகவும் பிடிக்கும்.',
  Telugu: 'ఒకప్పుడు ఒక చిన్న పిల్లవాడు ఉండేవాడు, అతనికి ప్రతిరోజూ పుస్తకాలు చదవడం చాలా ఇష్టం.',
  Turkish: 'Bir zamanlar her gün kitap okumayı çok seven küçük bir çocuk varmış.',
  Urdu: 'ایک دفعہ کی بات ہے، ایک چھوٹا بچہ تھا جسے ہر روز کتابیں پڑھنا بہت پسند تھا۔',
};
