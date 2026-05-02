const SAVE_VERSION = '1.0.0';
const CARD_BACK_IMAGE = 'assets/tarot/tarot_back.jpg';
const CARD_WIDTH = 120;
const CARD_HEIGHT = 200;
const DEFAULT_SPREAD = {
  id: 'three-card',
  name: 'Three Card',
  positions: [
    { id: 'past', label: 'Past', x: 100, y: 200 },
    { id: 'present', label: 'Present', x: 300, y: 200 },
    { id: 'future', label: 'Future', x: 500, y: 200 }
  ]
};

const elements = {
  spreadArea: document.getElementById('spread-area'),
  note: document.getElementById('note'),
  saveBtn: document.getElementById('save-btn'),
  loadBtn: document.getElementById('load-btn')
};

const state = {
  deck: [],
  shuffledDeck: [],
  spreads: [DEFAULT_SPREAD],
  currentSpread: DEFAULT_SPREAD,
  freeMode: true,
  useMajorOnly: true,
  drawIndex: 0,
  cardIdCounter: 1
};

const controls = createControls();

document.addEventListener('DOMContentLoaded', init);
elements.saveBtn.addEventListener('click', saveReading);
elements.loadBtn.addEventListener('click', openSaveFile);

async function init() {
  setupLayout();
  await Promise.all([loadDeck(), loadSpreads()]);
  updateControls();
  resetBoard();
}

function setupLayout() {
  document.body.insertBefore(controls.deckModeArea, elements.spreadArea);
  document.body.insertBefore(controls.modeArea, elements.spreadArea);
  document.body.insertBefore(controls.deckArea, elements.spreadArea);
  elements.note.parentNode.insertBefore(controls.resetBtn, elements.note.nextSibling);

  controls.modeBtn.addEventListener('click', () => {
    state.freeMode = !state.freeMode;
    updateControls();
    resetBoard();
  });

  controls.deckModeBtn.addEventListener('click', () => {
    state.useMajorOnly = !state.useMajorOnly;
    updateControls();
    resetBoard();
  });

  controls.resetBtn.addEventListener('click', () => {
    elements.note.value = '';
    resetBoard();
  });
}

function createControls() {
  const deckModeArea = document.createElement('div');
  deckModeArea.id = 'deck-mode-area';

  const deckModeLabel = document.createElement('span');
  deckModeLabel.id = 'deck-mode-label';

  const deckModeBtn = document.createElement('button');
  deckModeBtn.id = 'deck-mode-btn';
  deckModeBtn.type = 'button';

  deckModeArea.append(deckModeLabel, deckModeBtn);

  const modeArea = document.createElement('div');
  modeArea.id = 'mode-area';

  const modeLabel = document.createElement('span');
  modeLabel.id = 'mode-label';

  const modeBtn = document.createElement('button');
  modeBtn.id = 'mode-btn';
  modeBtn.type = 'button';

  modeArea.append(modeLabel, modeBtn);

  const deckArea = document.createElement('div');
  deckArea.id = 'deck-area';

  const resetBtn = document.createElement('button');
  resetBtn.id = 'reset-btn';
  resetBtn.type = 'button';
  resetBtn.textContent = '初期化';

  return {
    deckModeArea,
    deckModeLabel,
    deckModeBtn,
    modeArea,
    modeLabel,
    modeBtn,
    deckArea,
    resetBtn
  };
}

async function loadDeck() {
  try {
    const response = await fetch('data/deck.json');
    if (!response.ok) throw new Error(`deck.json ${response.status}`);
    state.deck = await response.json();
  } catch (error) {
    console.error(error);
    alert('デッキデータを読み込めませんでした。');
    state.deck = [];
  }
}

async function loadSpreads() {
  try {
    const response = await fetch('data/spreads.json');
    if (!response.ok) throw new Error(`spreads.json ${response.status}`);
    const spreads = await response.json();
    if (Array.isArray(spreads) && spreads.length > 0) {
      state.spreads = spreads;
      state.currentSpread = spreads[0];
    }
  } catch (error) {
    console.warn('スプレッド定義は既定値を使います。', error);
    state.spreads = [DEFAULT_SPREAD];
    state.currentSpread = DEFAULT_SPREAD;
  }
}

function updateControls() {
  controls.modeLabel.textContent = state.freeMode ? 'モード: 自由配置' : 'モード: スプレッド';
  controls.modeBtn.textContent = state.freeMode ? 'スプレッドモードに切替' : '自由配置モードに切替';
  controls.deckModeLabel.textContent = state.useMajorOnly ? 'デッキ: 大アルカナのみ' : 'デッキ: 大＋小アルカナ';
  controls.deckModeBtn.textContent = state.useMajorOnly ? '大＋小アルカナに切替' : '大アルカナのみに切替';
}

function resetBoard() {
  state.drawIndex = 0;
  state.cardIdCounter = 1;
  elements.spreadArea.innerHTML = '';
  controls.deckArea.innerHTML = '';
  state.shuffledDeck = shuffle(getActiveDeck());
  renderDeck();
}

function getActiveDeck() {
  return state.useMajorOnly ? state.deck.filter(card => card.arcana === 'Major') : state.deck;
}

function shuffle(cards) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function renderDeck() {
  if (state.shuffledDeck.length === 0) return;

  const deck = document.createElement('button');
  deck.className = 'tarot-deck';
  deck.type = 'button';
  deck.setAttribute('aria-label', 'カードを引く');

  const image = document.createElement('img');
  image.src = CARD_BACK_IMAGE;
  image.alt = '山札';
  deck.appendChild(image);

  deck.addEventListener('click', drawCard);
  controls.deckArea.appendChild(deck);
}

function drawCard() {
  const limit = state.freeMode ? state.shuffledDeck.length : state.currentSpread.positions.length;
  if (state.drawIndex >= limit || state.drawIndex >= state.shuffledDeck.length) {
    controls.deckArea.innerHTML = '';
    return;
  }

  const card = state.shuffledDeck[state.drawIndex];
  const placement = getNextPlacement();
  const readingCard = {
    id: card.id,
    drawId: state.cardIdCounter,
    name: card.name,
    arcana: card.arcana,
    number: card.number,
    suit: card.suit || null,
    image: card.image,
    position: placement.position,
    x: placement.x,
    y: placement.y,
    upright: Math.random() < 0.5,
    revealed: false
  };

  elements.spreadArea.appendChild(createCardElement(readingCard));
  state.cardIdCounter += 1;
  state.drawIndex += 1;

  if (state.drawIndex >= limit || state.drawIndex >= state.shuffledDeck.length) {
    controls.deckArea.innerHTML = '';
  }
}

function getNextPlacement() {
  if (!state.freeMode) {
    const position = state.currentSpread.positions[state.drawIndex];
    return {
      x: position.x,
      y: position.y,
      position: {
        id: position.id,
        label: position.label
      }
    };
  }

  const areaWidth = elements.spreadArea.offsetWidth || window.innerWidth;
  const cardsPerRow = Math.max(1, Math.floor(areaWidth / (CARD_WIDTH + 20)));
  const row = Math.floor(state.drawIndex / cardsPerRow);
  const col = state.drawIndex % cardsPerRow;

  return {
    x: 20 + col * (CARD_WIDTH + 20),
    y: 20 + row * (CARD_HEIGHT + 20),
    position: null
  };
}

function createCardElement(card) {
  const cardElement = document.createElement('div');
  cardElement.className = 'tarot-card';
  cardElement.draggable = true;
  cardElement.dataset.card = JSON.stringify(card);
  cardElement.style.left = `${card.x}px`;
  cardElement.style.top = `${card.y}px`;

  const image = document.createElement('img');
  image.src = card.revealed ? getCardImage(card) : CARD_BACK_IMAGE;
  image.alt = card.revealed ? card.name : '裏面';

  const name = document.createElement('div');
  name.className = 'tarot-card-name';
  name.textContent = getCardLabel(card);
  name.hidden = !card.revealed;

  cardElement.append(image, name);
  applyCardFace(cardElement, card);
  bindCardEvents(cardElement);

  return cardElement;
}

function getCardLabel(card) {
  const position = card.position ? ` (${card.position.label})` : '';
  return `${card.name}：${card.drawId}${position}`;
}

function getCardImage(card) {
  return card.image.startsWith('assets/') ? card.image : `assets/${card.image}`;
}

function bindCardEvents(cardElement) {
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let cardStartLeft = 0;
  let cardStartTop = 0;
  let isTouchDragging = false;
  let touchHandled = false;
  let holdTimer = null;

  cardElement.addEventListener('click', () => {
    if (touchHandled) {
      touchHandled = false;
      return;
    }
    toggleCard(cardElement);
  });

  cardElement.addEventListener('dragstart', event => {
    const rect = cardElement.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
  });

  cardElement.addEventListener('dragend', event => {
    if (event.clientX === 0 && event.clientY === 0) return;
    const areaRect = elements.spreadArea.getBoundingClientRect();
    moveCard(cardElement, event.clientX - areaRect.left - dragOffsetX, event.clientY - areaRect.top - dragOffsetY);
  });

  cardElement.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    isTouchDragging = false;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    cardStartLeft = parseInt(cardElement.style.left, 10) || 0;
    cardStartTop = parseInt(cardElement.style.top, 10) || 0;
    holdTimer = setTimeout(() => {
      isTouchDragging = true;
      cardElement.style.opacity = '0.7';
      document.body.style.overflow = 'hidden';
    }, 300);
  }, { passive: true });

  cardElement.addEventListener('touchmove', event => {
    if (!isTouchDragging) return;
    event.preventDefault();
    const moveX = event.touches[0].clientX - touchStartX;
    const moveY = event.touches[0].clientY - touchStartY;
    moveCard(cardElement, cardStartLeft + moveX, cardStartTop + moveY);
  }, { passive: false });

  cardElement.addEventListener('touchend', () => {
    clearTimeout(holdTimer);
    if (isTouchDragging) {
      isTouchDragging = false;
      cardElement.style.opacity = '';
      document.body.style.overflow = '';
      return;
    }

    touchHandled = true;
    setTimeout(() => {
      touchHandled = false;
    }, 400);
    toggleCard(cardElement);
  });
}

function toggleCard(cardElement) {
  const card = getCardData(cardElement);
  card.revealed = !card.revealed;
  setCardData(cardElement, card);
  applyCardFace(cardElement, card);
}

function applyCardFace(cardElement, card) {
  const image = cardElement.querySelector('img');
  const name = cardElement.querySelector('.tarot-card-name');

  if (card.revealed) {
    image.src = getCardImage(card);
    image.alt = card.name;
    name.hidden = false;
    cardElement.classList.toggle('reverse', !card.upright);
  } else {
    image.src = CARD_BACK_IMAGE;
    image.alt = '裏面';
    name.hidden = true;
    cardElement.classList.remove('reverse');
  }
}

function moveCard(cardElement, rawLeft, rawTop) {
  const left = clamp(rawLeft, 0, elements.spreadArea.offsetWidth - cardElement.offsetWidth);
  const top = clamp(rawTop, 0, elements.spreadArea.offsetHeight - cardElement.offsetHeight);
  const card = getCardData(cardElement);

  card.x = Math.round(left);
  card.y = Math.round(top);
  cardElement.style.left = `${card.x}px`;
  cardElement.style.top = `${card.y}px`;
  setCardData(cardElement, card);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

function getCardData(cardElement) {
  return JSON.parse(cardElement.dataset.card);
}

function setCardData(cardElement, card) {
  cardElement.dataset.card = JSON.stringify(card);
}

function collectCards() {
  return Array.from(elements.spreadArea.querySelectorAll('.tarot-card')).map(cardElement => {
    const card = getCardData(cardElement);
    return {
      ...card,
      x: parseInt(cardElement.style.left, 10) || card.x,
      y: parseInt(cardElement.style.top, 10) || card.y
    };
  });
}

async function saveReading() {
  const saveData = {
    version: SAVE_VERSION,
    date: new Date().toISOString(),
    mode: state.freeMode ? 'free' : 'spread',
    deckMode: state.useMajorOnly ? 'major' : 'full',
    spread: state.freeMode ? null : {
      id: state.currentSpread.id,
      name: state.currentSpread.name,
      positions: state.currentSpread.positions
    },
    cards: collectCards(),
    note: elements.note.value
  };

  downloadJson(saveData);
  await downloadScreenshot();
}

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, `tarot_save_${Date.now()}.json`);
  URL.revokeObjectURL(url);
}

async function downloadScreenshot() {
  if (typeof html2canvas !== 'function') return;

  try {
    const canvas = await html2canvas(elements.spreadArea, {
      backgroundColor: '#f8f8f8',
      useCORS: true
    });
    const url = canvas.toDataURL('image/png');
    downloadUrl(url, `tarot_board_${Date.now()}.png`);
  } catch (error) {
    console.warn('スクリーンショット保存に失敗しました。', error);
  }
}

function downloadUrl(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function openSaveFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    loadSaveFile(file);
  });
  input.click();
}

function loadSaveFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', event => {
    try {
      const data = JSON.parse(event.target.result);
      restoreReading(normalizeSaveData(data));
    } catch (error) {
      console.error(error);
      alert('読込失敗: ファイル形式が不正です');
    }
  });
  reader.readAsText(file);
}

function normalizeSaveData(data) {
  return {
    version: data.version || 'legacy',
    mode: data.mode === 'spread' ? 'spread' : 'free',
    deckMode: data.deckMode === 'full' ? 'full' : 'major',
    spread: data.spread || null,
    note: data.note || '',
    cards: Array.isArray(data.cards) ? data.cards.map(normalizeCardData).filter(Boolean) : []
  };
}

function normalizeCardData(card) {
  if (card.id && card.image) return card;

  const name = card.name || '';
  const deckCard = state.deck.find(item => item.name === name);
  if (!deckCard) return null;

  return {
    id: deckCard.id,
    drawId: card.id || card.drawId || null,
    name: deckCard.name,
    arcana: deckCard.arcana,
    number: deckCard.number,
    suit: deckCard.suit || null,
    image: deckCard.image,
    position: card.position || null,
    x: card.x || card.left || 0,
    y: card.y || card.top || 0,
    upright: typeof card.upright === 'boolean' ? card.upright : true,
    revealed: typeof card.revealed === 'boolean' ? card.revealed : Boolean(card.isFace)
  };
}

function restoreReading(data) {
  state.freeMode = data.mode !== 'spread';
  state.useMajorOnly = data.deckMode !== 'full';
  state.cardIdCounter = 1;
  elements.note.value = data.note;
  elements.spreadArea.innerHTML = '';
  controls.deckArea.innerHTML = '';

  data.cards.forEach(card => {
    const restoredCard = {
      ...card,
      drawId: card.drawId || state.cardIdCounter
    };
    elements.spreadArea.appendChild(createCardElement(restoredCard));
    state.cardIdCounter = Math.max(state.cardIdCounter, restoredCard.drawId + 1);
  });

  updateControls();
}
