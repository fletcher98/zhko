console.log('Loading SRS module');

// SM-2 Algorithm implementation
export class SRSManager {
  constructor() {
    console.log('Initializing SRS Manager');
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage is not available');
      }
      this.loadDeck();
    } catch (e) {
      console.error('Error initializing SRS:', e);
      this.deck = {};
    }
  }

  loadDeck() {
    console.log('Loading deck from localStorage');
    try {
      const deckData = localStorage.getItem('zhko_deck');
      this.deck = deckData ? JSON.parse(deckData) : {};
      console.log('Loaded deck:', this.deck);
    } catch (e) {
      console.error('Error loading deck:', e);
      this.deck = {};
    }
  }

  saveDeck() {
    console.log('Saving deck to localStorage:', this.deck);
    try {
      localStorage.setItem('zhko_deck', JSON.stringify(this.deck));
    } catch (e) {
      console.error('Error saving deck:', e);
    }
  }

  addCard(word, pinyin, definition) {
    console.log('Adding card:', { word, pinyin, definition });
    if (!this.deck[word]) {
      this.deck[word] = {
        pinyin,
        definition,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        dueDate: new Date().toISOString(),
        lastReview: null
      };
      this.saveDeck();
      console.log('Card added successfully');
      return true;
    }
    console.log('Card already exists');
    return false;
  }

  removeCard(word) {
    console.log('Removing card:', word);
    if (this.deck[word]) {
      delete this.deck[word];
      this.saveDeck();
      console.log('Card removed successfully');
      return true;
    }
    console.log('Card not found');
    return false;
  }

  getDueCards() {
    console.log('Getting due cards');
    const now = new Date();
    const dueCards = Object.entries(this.deck)
      .filter(([_, card]) => new Date(card.dueDate) <= now)
      .map(([word, card]) => ({
        word,
        ...card
      }));
    console.log('Due cards:', dueCards);
    return dueCards;
  }

  getAllCards() {
    console.log('Getting all cards');
    const cards = Object.entries(this.deck).map(([word, card]) => ({
      word,
      ...card
    }));
    console.log('All cards:', cards);
    return cards;
  }

  isInDeck(word) {
    const result = word in this.deck;
    console.log('Checking if word is in deck:', word, result);
    return result;
  }

  // SM-2 algorithm implementation
  reviewCard(word, quality) {
    console.log('Reviewing card:', word, 'with quality:', quality);
    if (!this.deck[word]) return false;

    const card = this.deck[word];
    const now = new Date();

    // Quality: 0 = again, 1 = hard, 2 = good, 3 = easy
    if (quality >= 2) {
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions++;
    } else {
      card.repetitions = 0;
      card.interval = 0;
    }

    // Update ease factor
    card.easeFactor = Math.max(
      1.3,
      card.easeFactor + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02))
    );

    // Calculate next due date
    const nextDue = new Date(now);
    nextDue.setDate(nextDue.getDate() + card.interval);
    card.dueDate = nextDue.toISOString();
    card.lastReview = now.toISOString();

    this.saveDeck();
    console.log('Card reviewed successfully');
    return true;
  }

  getCardStats(word) {
    console.log('Getting stats for card:', word);
    const card = this.deck[word];
    if (!card) return null;

    const now = new Date();
    const dueDate = new Date(card.dueDate);
    const lastReview = card.lastReview ? new Date(card.lastReview) : null;

    const stats = {
      isDue: dueDate <= now,
      dueIn: Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)),
      repetitions: card.repetitions,
      easeFactor: card.easeFactor,
      lastReview: lastReview ? lastReview.toLocaleDateString() : 'Never'
    };
    console.log('Card stats:', stats);
    return stats;
  }
}