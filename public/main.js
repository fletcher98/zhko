import { Dictionary } from "/js/dictionary.js";
import { SRSManager } from "/js/srs.js";

const QUERY_LIMIT = 25;
let legacyDictionary = [];
const DICT_FILEPATH = "/cedict_parsed.csv.gz";
const definitionCache = {};
let dict;
let curSegment = 0;
let srs;

async function initializeSRS() {
  console.log('Initializing SRS functionality');
  srs = new SRSManager();
  
  // Initialize Add to Deck button on word page if present
  const addToDeckBtn = document.querySelector('#add-to-deck-btn');
  if (addToDeckBtn) {
    console.log('Found Add to Deck button');
    const word = addToDeckBtn.dataset.word;
    const pinyin = addToDeckBtn.dataset.pinyin.split(' ');
    const definition = addToDeckBtn.dataset.definition;
    const status = document.querySelector('#deck-status');

    console.log('Button data:', { word, pinyin, definition });

    if (srs.isInDeck(word)) {
      addToDeckBtn.textContent = 'Added to Deck';
      addToDeckBtn.classList.add('added');
      const stats = srs.getCardStats(word);
      status.textContent = stats.isDue ? 'Due for review' : `Next review in ${stats.dueIn} days`;
    }

    addToDeckBtn.addEventListener('click', () => {
      console.log('Add to Deck button clicked');
      if (!srs.isInDeck(word)) {
        if (srs.addCard(word, pinyin, definition)) {
          console.log('Card added successfully');
          addToDeckBtn.textContent = 'Added to Deck';
          addToDeckBtn.classList.add('added');
          status.textContent = 'Added to review deck';
        }
      }
    });
  }
}

async function main() {
  await initializeSRS();
  
  document.querySelector("input#query")?.addEventListener("input", search);
  document.querySelector("form")?.addEventListener(
    "submit",
    (e) => e.preventDefault(),
  );

  const queryParams = new URLSearchParams(window.location.search);
  const query = queryParams.get("q");
  if (query) {
    document.querySelector("input#query").value = query;
  }

  legacyDictionary = await fetchDictionary();
  dict = new Dictionary(legacyDictionary);

  if (query) {
    search();
  }

  // Initialize deck page if we're on it
  const deckList = document.querySelector("#deck-list");
  if (deckList) {
    initializeDeckPage();
  }

  // Initialize review page if we're on it
  const reviewContainer = document.querySelector(".review-container");
  if (reviewContainer) {
    initializeReviewPage();
  }
}

function initializeDeckPage() {
  console.log('Initializing deck page');
  const cards = srs.getAllCards();
  const deckList = document.querySelector("#deck-list");
  const emptyDeck = document.querySelector("#empty-deck");
  const totalCards = document.querySelector("#total-cards");
  const dueToday = document.querySelector("#due-today");
  const template = document.querySelector("#deck-word-template");

  totalCards.textContent = cards.length;
  dueToday.textContent = srs.getDueCards().length;

  if (cards.length === 0) {
    emptyDeck.style.display = "block";
    return;
  }

  cards.forEach(card => {
    const node = template.content.cloneNode(true);
    const stats = srs.getCardStats(card.word);

    const rubyEl = document.createElement("ruby");
    card.word.split("").forEach((character, i) => {
      const charEl = document.createElement("span");
      charEl.innerText = character;
      rubyEl.appendChild(charEl);

      const rtEl = document.createElement("rt");
      rtEl.innerText = card.pinyin[i];
      rubyEl.appendChild(rtEl);
    });

    node.querySelector(".characters").appendChild(rubyEl);
    node.querySelector(".characters").href = `/word/${card.word}`;
    node.querySelector(".definitions").textContent = card.definition;
    node.querySelector(".next-review").textContent = 
      stats.isDue ? "Due now" : `Due in ${stats.dueIn} days`;
    node.querySelector(".review-count").textContent = 
      `Reviews: ${stats.repetitions}`;

    deckList.appendChild(node);
  });
}

function initializeReviewPage() {
  console.log('Initializing review page');
  const dueCards = srs.getDueCards();
  let currentCard = null;
  
  const reviewContainer = document.querySelector(".review-container");
  const cardContainer = document.querySelector("#card-container");
  const reviewButtons = document.querySelector("#review-buttons");
  const noReviews = document.querySelector("#no-reviews");
  const newCount = document.querySelector("#new-count");
  const dueCount = document.querySelector("#due-count");
  const doneCount = document.querySelector("#done-count");

  function updateCounts() {
    const cards = srs.getAllCards();
    const dueCards = srs.getDueCards();
    const newCards = cards.filter(c => c.repetitions === 0);
    newCount.textContent = newCards.length;
    dueCount.textContent = dueCards.length;
    // Done count is cards reviewed today
    const today = new Date().toDateString();
    const doneCards = cards.filter(c => 
      c.lastReview && new Date(c.lastReview).toDateString() === today
    );
    doneCount.textContent = doneCards.length;
  }

  function showNextCard() {
    const dueCards = srs.getDueCards();
    if (dueCards.length === 0) {
      cardContainer.style.display = "none";
      reviewButtons.style.display = "none";
      noReviews.style.display = "block";
      updateCounts();
      return;
    }

    currentCard = dueCards[0];
    cardContainer.classList.remove("flipped");
    
    // Update front
    const front = cardContainer.querySelector(".card-front .characters");
    front.textContent = currentCard.word;

    // Update back
    const back = cardContainer.querySelector(".card-back");
    back.querySelector(".pinyin").textContent = currentCard.pinyin.join(" ");
    back.querySelector(".definitions").textContent = currentCard.definition;

    // Show card and buttons
    cardContainer.style.display = "block";
    reviewButtons.style.display = "none";
    noReviews.style.display = "none";
    updateCounts();
  }

  // Card flip handling
  cardContainer.addEventListener("click", () => {
    console.log('Card clicked');
    if (!currentCard) return;
    cardContainer.classList.add("flipped");
    reviewButtons.style.display = "flex";
  });

  // Review button handling
  reviewButtons.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      console.log('Review button clicked:', button.className);
      if (!currentCard) return;
      const quality = parseInt(button.dataset.interval);
      srs.reviewCard(currentCard.word, quality);
      showNextCard();
    });
  });

  // Start reviews
  showNextCard();
}

async function fetchDictionary() {
  const response = await fetch(DICT_FILEPATH);
  const decompStream = response.body.pipeThrough(
    new DecompressionStream("gzip"),
  );
  const decompResp = await new Response(decompStream);
  const blob = await decompResp.blob();
  const text = await blob.text();

  const data = text.split(/\r?\n/).map((row, i) => {
    let [simplified, pinyin, definition, percentile] = row.split("∙");
    if (pinyin) {
      pinyin = pinyin.split("_");
    } else {
      pinyin = [];
    }
    if (!definition) {
      definition = "";
    }
    const searchablePinyin = pinyin.join("").normalize("NFD").replace(
      /[-]/g,
      "",
    ).toLowerCase();
    return {
      simplified: simplified,
      pinyin: pinyin,
      searchablePinyin: searchablePinyin,
      definition: definition.split("■").join("\n"),
      percentile: Number(percentile),
    };
  });
  return data;
}

function searchDict(query) {
  const finalQuery = query.trim().toLowerCase();

  const results = legacyDictionary.filter((entry) => {
    if (
      entry.simplified && entry.simplified.toLowerCase().includes(finalQuery)
    ) {
      return true;
    } else if (entry.searchablePinyin.includes(finalQuery)) {
      return true;
    } else if (
      entry.definition && entry.definition.toLowerCase().includes(finalQuery)
    ) {
      return true;
    }
  });

  function defExactMatch(queryString, entry) {
    if (entry.simplified in definitionCache === false) {
      definitionCache[entry.simplified] = entry.definition.toLowerCase().split(
        "\n",
      );
    }

    for (const definition of definitionCache[entry.simplified]) {
      if (definition === queryString) {
        return true;
      }
    }
    return false;
  }

  function defPartialMatch(queryString, entry) {
    return definitionCache[entry.simplified].includes(queryString);
  }

  results.sort((a, b) => {
    const aExact = a.searchablePinyin === finalQuery ||
      defExactMatch(finalQuery, a);
    const bExact = b.searchablePinyin === finalQuery ||
      defExactMatch(finalQuery, b);
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const queryInA = a.searchablePinyin.includes(finalQuery) ||
      defPartialMatch(finalQuery, a);
    const queryInB = b.searchablePinyin.includes(finalQuery) ||
      defPartialMatch(finalQuery, b);
    if (queryInA && !queryInB) return -1;
    else if (queryInB && !queryInA) return 1;

    return b.percentile - a.percentile;
  });

  return results.slice(0, QUERY_LIMIT);
}

function search() {
  const query = document.querySelector("input#query").value;

  if (!query) {
    document.querySelector("#results").innerHTML = "";
    return;
  }

  const segments = updateSegments(query);
  if (segments.length == 0) {
    return;
  }
  if (curSegment >= segments.length) {
    curSegment = 0;
  }
  const keyword = segments[curSegment];

  const results = searchDict(keyword);
  document.querySelector("#results").innerHTML = "";
  const resultTemplate = document.querySelector("#search-result-li");
  results.forEach((result) => {
    const node = resultTemplate.content.cloneNode(true);
    let commonClass = "common";
    if (result.percentile == 0) {
      commonClass = "uncommon";
    }

    const rubyEl = document.createElement("ruby");
    result.simplified.split("").forEach((character, i) => {
      const charEl = document.createElement("span");
      charEl.innerText = character;
      rubyEl.appendChild(charEl);

      const rtEl = document.createElement("rt");
      rtEl.innerText = result.pinyin[i];
      rubyEl.appendChild(rtEl);
    });

    node.querySelector(".characters").appendChild(rubyEl);
    node.querySelector(".characters").classList.add(commonClass);
    node.querySelector(".characters").href = `/word/${result.simplified}`;

    node.querySelector(".definitions").innerText = result.definition;
    let percentileText = "(uncommon)";
    if (result.percentile > 0) {
      percentileText = "p" + result.percentile;
    }
    node.querySelector(".percentile").innerText = percentileText;

    // Add "Add to Deck" button
    const wordDiv = node.querySelector(".word");
    const addButton = document.createElement("button");
    addButton.className = "add-to-deck";
    addButton.textContent = srs.isInDeck(result.simplified) ? "Added" : "Add to Deck";
    if (srs.isInDeck(result.simplified)) {
      addButton.classList.add("added");
    }
    addButton.addEventListener("click", () => {
      console.log('Add to Deck clicked in search results');
      if (!srs.isInDeck(result.simplified)) {
        if (srs.addCard(result.simplified, result.pinyin, result.definition)) {
          console.log('Card added from search results');
          addButton.textContent = "Added";
          addButton.classList.add("added");
        }
      }
    });
    wordDiv.appendChild(addButton);

    document.querySelector("#results").appendChild(node);
  });
}

function updateSegments(query) {
  if (!dict) {
    return;
  }

  const segments = dict.segmentText(query);

  window.segments.innerHTML = "";

  if (segments.length <= 1) {
    return segments;
  }

  const wordTemplate = document.querySelector("#word-segment");
  segments.forEach((segment, index) => {
    const node = wordTemplate.content.cloneNode(true);
    node.querySelector('.segment').innerText = segment;
    window.segments.appendChild(node);

    const realNode = window.segments.children[index];
    if (index === curSegment) {
      realNode.style.borderBottom = 'solid 2px #E84A5F';
    }

    const makeChangeSegmentCallback = (index) => {
      return () => {
        curSegment = index;
        search();
      };
    };
    realNode.addEventListener('click', makeChangeSegmentCallback(index));
  })

  return segments;
}

main();
