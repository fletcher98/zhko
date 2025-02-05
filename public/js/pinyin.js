// Mapping of vowels to their diacritic forms for each tone
const toneMarks = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'], // v is used as a substitute for ü
};

// Order of vowels to apply tone marks (when there are multiple vowels)
const vowelPriority = ['a', 'e', 'o', 'i', 'u', 'v', 'ü'];

export function numericToMarkedPinyin(pinyin) {
  if (!pinyin) return '';
  
  // Extract tone number from end of pinyin syllable
  const tone = parseInt(pinyin.match(/[1-5]$/)?.[0] || '5') - 1;
  const pinyinWithoutTone = pinyin.replace(/[1-5]$/, '');
  
  // Find the vowel to modify based on priority
  let vowelToModify = '';
  let vowelIndex = -1;
  
  for (const vowel of vowelPriority) {
    const index = pinyinWithoutTone.indexOf(vowel);
    if (index !== -1) {
      vowelToModify = vowel;
      vowelIndex = index;
      break;
    }
  }
  
  if (!vowelToModify) return pinyin; // No vowel found
  
  // Replace the vowel with its corresponding tone mark version
  return pinyinWithoutTone.substring(0, vowelIndex) +
         toneMarks[vowelToModify][tone] +
         pinyinWithoutTone.substring(vowelIndex + 1);
}