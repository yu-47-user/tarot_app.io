const SAVE_VERSION = '2.0.0';
const CARD_BACK_IMAGE = './assets/tarot/tarot_back.jpg';
const TOUCH_HOLD_MS = 280;
const CARD_ASPECT_RATIO = 1.68;

const elements = {
  question: document.getElementById('question'),
  spreadSelect: document.getElementById('spread-select'),
  deckSummary: document.getElementById('deck-summary'),
  deckNote: document.getElementById('deck-note'),
  progressSummary: document.getElementById('progress-summary'),
  statusMessage: document.getElementById('status-message'),
  boardSubtitle: document.getElementById('board-subtitle'),
  drawResetBtn: document.getElementById('draw-reset-btn'),
  saveBtn: document.getElementById('save-btn'),
  loadBtn: document.getElementById('load-btn'),
  deckArea: document.getElementById('deck-area'),
  spreadArea: document.getElementById('spread-area'),
  note: document.getElementById('note'),
  emptyDetail: document.getElementById('empty-detail'),
  cardDetail: document.getElementById('card-detail'),
  detailPosition: document.getElementById('detail-position'),
  detailName: document.getElementById('detail-name'),
  detailOrientation: document.getElementById('detail-orientation'),
  detailKeywords: document.getElementById('detail-keywords'),
  detailMeaning: document.getElementById('detail-meaning')
};

const state = {
  deck: [],
  spreads: [],
  selectedSpreadId: '',
  shuffledDeck: [],
  drawnCards: [],
  selectedDrawId: null
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  await Promise.all([loadDeck(), loadSpreads()]);
  initializeControls();
  startNewReading();
}

function bindEvents() {
  elements.spreadSelect.addEventListener('change', () => {
    state.selectedSpreadId = elements.spreadSelect.value;
    startNewReading();
  });
  elements.drawResetBtn.addEventListener('click', handlePrimaryAction);
  elements.saveBtn.addEventListener('click', saveReading);
  elements.loadBtn.addEventListener('click', openSaveFile);
  window.addEventListener('resize', renderBoard);
}

async function loadDeck() {
  try {
    const response = await fetch('./data/deck.json');
    if (!response.ok) {
      throw new Error(`deck.json ${response.status}`);
    }
    const deck = await response.json();
    state.deck = Array.isArray(deck) ? deck : [];
  } catch (error) {
    console.error(error);
    alert('カードデータを読み込めませんでした。');
    state.deck = [];
  }
}

async function loadSpreads() {
  try {
    const response = await fetch('./data/spreads.json');
    if (!response.ok) {
      throw new Error(`spreads.json ${response.status}`);
    }
    const spreads = await response.json();
    state.spreads = Array.isArray(spreads) ? spreads : [];
  } catch (error) {
    console.error(error);
    alert('スプレッド定義を読み込めませんでした。');
    state.spreads = [];
  }
}

function initializeControls() {
  const availableCount = state.deck.length;
  elements.deckSummary.textContent = `大アルカナ ${availableCount}枚`;
  elements.deckNote.textContent = '画像がそろっているカードだけで構成しています。';
  elements.spreadSelect.innerHTML = '';

  state.spreads.forEach(spread => {
    const option = document.createElement('option');
    option.value = spread.id;
    option.textContent = spread.nameJa || spread.name;
    elements.spreadSelect.appendChild(option);
  });

  const initialSpread = state.spreads[0];
  state.selectedSpreadId = initialSpread ? initialSpread.id : '';
  elements.spreadSelect.value = state.selectedSpreadId;
}

function getCurrentSpread() {
  return state.spreads.find(spread => spread.id === state.selectedSpreadId) || state.spreads[0] || null;
}

function startNewReading() {
  state.selectedDrawId = null;
  state.drawnCards = [];
  state.shuffledDeck = shuffle(state.deck);
  clearDetail();
  updateStatus();
  renderBoard();
}

function handlePrimaryAction() {
  const spread = getCurrentSpread();
  if (!spread) {
    return;
  }

  if (state.drawnCards.length >= spread.positions.length) {
    startNewReading();
    return;
  }

  drawNextCard();
}

function drawNextCard() {
  const spread = getCurrentSpread();
  if (!spread) {
    return;
  }

  const position = spread.positions[state.drawnCards.length];
  const nextCard = state.shuffledDeck.shift();
  if (!position || !nextCard) {
    return;
  }

  const boardPoint = getBoardPoint(position);
  state.drawnCards.push({
    ...nextCard,
    drawId: createId(),
    position: {
      id: position.id,
      label: position.label,
      helper: position.helper || ''
    },
    x: boardPoint.x,
    y: boardPoint.y,
    revealed: false,
    upright: Math.random() >= 0.5
  });

  updateStatus();
  renderBoard();
}

function updateStatus() {
  const spread = getCurrentSpread();
  const total = spread ? spread.positions.length : 0;
  const drawn = state.drawnCards.length;
  const title = spread ? (spread.nameJa || spread.name) : '未設定';

  if (drawn === 0) {
    elements.progressSummary.textContent = `${title} / 0 / ${total}`;
    elements.statusMessage.textContent = '山札をタップしてカードを引いてください。';
    elements.boardSubtitle.textContent = '質問を整えたら山札からカードを引きます。';
    elements.drawResetBtn.textContent = 'カードを引く';
    return;
  }

  if (drawn < total) {
    elements.progressSummary.textContent = `${title} / ${drawn} / ${total}`;
    elements.statusMessage.textContent = `残り ${total - drawn} 枚です。カードをタップすると表になります。`;
    elements.boardSubtitle.textContent = '裏向きで並んだカードをひとつずつめくれます。';
    elements.drawResetBtn.textContent = '次のカードを引く';
    return;
  }

  elements.progressSummary.textContent = `${title} / 完了`;
  elements.statusMessage.textContent = '引き終わりました。カードを選んで意味を確認できます。';
  elements.boardSubtitle.textContent = '必要ならドラッグで位置を整え、メモと一緒に保存してください。';
  elements.drawResetBtn.textContent = '引き直す';
}

function renderBoard() {
  renderDeck();
  renderSpreadSlots();
  renderCards();
}

function renderDeck() {
  elements.deckArea.innerHTML = '';
  const spread = getCurrentSpread();
  if (!spread) {
    return;
  }

  const deckButton = document.createElement('button');
  deckButton.type = 'button';
  deckButton.className = 'deck-stack';
  deckButton.disabled = state.drawnCards.length >= spread.positions.length;
  deckButton.setAttribute('aria-label', 'カードを引く');
  deckButton.addEventListener('click', drawNextCard);

  const remaining = spread.positions.length - state.drawnCards.length;
  deckButton.innerHTML = `
    <span class="deck-stack__cards" aria-hidden="true">
      <img src="${CARD_BACK_IMAGE}" alt="">
      <img src="${CARD_BACK_IMAGE}" alt="">
      <img src="${CARD_BACK_IMAGE}" alt="">
    </span>
    <span class="deck-stack__label">${remaining > 0 ? `残り ${remaining} 枚` : '引き終わり'}</span>
  `;

  elements.deckArea.appendChild(deckButton);
}

function renderSpreadSlots() {
  elements.spreadArea.innerHTML = '';
  const spread = getCurrentSpread();
  if (!spread) {
    return;
  }

  spread.positions.forEach((position, index) => {
    const slot = document.createElement('section');
    slot.className = 'spread-slot';
    slot.dataset.positionId = position.id;
    slot.style.left = `${position.x}%`;
    slot.style.top = `${position.y}%`;

    const label = document.createElement('p');
    label.className = 'spread-slot__label';
    label.textContent = `${index + 1}. ${position.label}`;

    const helper = document.createElement('p');
    helper.className = 'spread-slot__helper';
    helper.textContent = position.helper || '';

    slot.append(label, helper);
    elements.spreadArea.appendChild(slot);
  });
}

function renderCards() {
  state.drawnCards.forEach(card => {
    const cardElement = createCardElement(card);
    elements.spreadArea.appendChild(cardElement);
  });
}

function createCardElement(card) {
  const article = document.createElement('article');
  article.className = 'reading-card';
  if (card.revealed) {
    article.classList.add('is-revealed');
  }
  if (card.drawId === state.selectedDrawId) {
    article.classList.add('is-selected');
  }
  article.dataset.drawId = card.drawId;
  article.style.left = `${card.x}px`;
  article.style.top = `${card.y}px`;
  article.style.setProperty('--card-rotate', card.upright ? '0deg' : '180deg');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'reading-card__button';
  button.setAttribute('aria-label', `${card.position.label} のカード`);

  const image = document.createElement('img');
  image.className = 'reading-card__image';
  image.src = card.revealed ? card.image : CARD_BACK_IMAGE;
  image.alt = card.revealed ? `${card.nameJa} ${card.upright ? '正位置' : '逆位置'}` : '裏向きのカード';

  const meta = document.createElement('div');
  meta.className = 'reading-card__meta';

  const position = document.createElement('span');
  position.className = 'reading-card__position';
  position.textContent = card.position.label;

  const name = document.createElement('strong');
  name.className = 'reading-card__name';
  name.textContent = card.revealed ? card.nameJa : '伏せたカード';

  meta.append(position, name);
  button.append(image, meta);
  article.appendChild(button);

  bindCardInteractions(article, card);
  return article;
}

function bindCardInteractions(cardElement, card) {
  const button = cardElement.querySelector('.reading-card__button');
  let pressTimer = null;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let dragging = false;
  let pointerStarted = false;

  const beginDrag = event => {
    dragging = true;
    cardElement.classList.add('is-dragging');
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    originX = card.x;
    originY = card.y;
    button.setPointerCapture(pointerId);
  };

  const clearPressTimer = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType !== 'touch') {
      return;
    }
    pointerStarted = true;
    startX = event.clientX;
    startY = event.clientY;

    if (event.pointerType === 'mouse') {
      beginDrag(event);
      return;
    }

    pressTimer = setTimeout(() => beginDrag(event), TOUCH_HOLD_MS);
  });

  button.addEventListener('pointermove', event => {
    if (!dragging) {
      if (event.pointerType === 'touch' && pressTimer) {
        const moveDistance = Math.hypot(event.clientX - startX, event.clientY - startY);
        if (moveDistance > 8) {
          clearPressTimer();
        }
      }
      return;
    }

    event.preventDefault();
    const nextX = originX + (event.clientX - startX);
    const nextY = originY + (event.clientY - startY);
    moveCard(card.drawId, nextX, nextY);
  });

  button.addEventListener('pointerup', event => {
    clearPressTimer();

    if (!dragging) {
      if (pointerStarted) {
        revealOrSelect(card.drawId);
      }
      pointerStarted = false;
      return;
    }

    dragging = false;
    pointerStarted = false;
    finishDrag(button, cardElement, event.pointerId);
  });

  button.addEventListener('pointercancel', event => {
    clearPressTimer();
    if (dragging) {
      dragging = false;
      finishDrag(button, cardElement, event.pointerId);
      return;
    }
    pointerStarted = false;
    if (pointerId !== null && button.hasPointerCapture(pointerId)) {
      button.releasePointerCapture(pointerId);
    }
  });
}

function finishDrag(button, cardElement, activePointerId) {
  cardElement.classList.remove('is-dragging');
  draggingCleanup(button, activePointerId);
}

function draggingCleanup(button, activePointerId) {
  if (activePointerId !== null && button.hasPointerCapture(activePointerId)) {
    button.releasePointerCapture(activePointerId);
  }
}

function revealOrSelect(drawId) {
  const card = state.drawnCards.find(item => item.drawId === drawId);
  if (!card) {
    return;
  }

  if (!card.revealed) {
    card.revealed = true;
  }
  state.selectedDrawId = drawId;
  updateDetail(card);
  renderBoard();
}

function moveCard(drawId, x, y) {
  const card = state.drawnCards.find(item => item.drawId === drawId);
  if (!card) {
    return;
  }

  const bounds = getCardBounds();
  card.x = clamp(x, 0, bounds.maxX);
  card.y = clamp(y, 0, bounds.minY, bounds.maxY);
  const cardElement = elements.spreadArea.querySelector(`[data-draw-id="${drawId}"]`);
  if (cardElement) {
    cardElement.style.left = `${card.x}px`;
    cardElement.style.top = `${card.y}px`;
  }
}

function getCardBounds() {
  const width = getCardSize().width;
  const height = getCardSize().height;
  return {
    maxX: Math.max(0, elements.spreadArea.clientWidth - width),
    minY: 0,
    maxY: Math.max(0, elements.spreadArea.clientHeight - height)
  };
}

function getCardSize() {
  const boardWidth = elements.spreadArea.clientWidth || 320;
  const width = clamp(boardWidth * 0.18, 112, 156);
  const height = Math.round(width * CARD_ASPECT_RATIO);
  return { width, height };
}

function getBoardPoint(position) {
  const { width, height } = getCardSize();
  const boardWidth = elements.spreadArea.clientWidth || 320;
  const boardHeight = elements.spreadArea.clientHeight || 520;
  return {
    x: clamp(Math.round((boardWidth * position.x) / 100 - width / 2), 0, Math.max(0, boardWidth - width)),
    y: clamp(Math.round((boardHeight * position.y) / 100 - height / 2), 0, Math.max(0, boardHeight - height))
  };
}

function updateDetail(card) {
  elements.emptyDetail.hidden = true;
  elements.cardDetail.hidden = false;
  elements.detailPosition.textContent = `${card.position.label}${card.position.helper ? ` / ${card.position.helper}` : ''}`;
  elements.detailName.textContent = `${card.nameJa} / ${card.name}`;
  elements.detailOrientation.textContent = card.upright ? '正位置' : '逆位置';
  elements.detailKeywords.textContent = `キーワード: ${card.upright ? card.keywords.upright.join(' / ') : card.keywords.reversed.join(' / ')}`;
  elements.detailMeaning.textContent = card.upright ? card.meaning.upright : card.meaning.reversed;
}

function clearDetail() {
  state.selectedDrawId = null;
  elements.emptyDetail.hidden = false;
  elements.cardDetail.hidden = true;
  elements.detailPosition.textContent = '';
  elements.detailName.textContent = '';
  elements.detailOrientation.textContent = '';
  elements.detailKeywords.textContent = '';
  elements.detailMeaning.textContent = '';
}

function shuffle(cards) {
  const list = [...cards];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
  return list;
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value, min, max, fallbackMax = max) {
  const upper = fallbackMax;
  return Math.max(min, Math.min(value, upper));
}

async function saveReading() {
  const spread = getCurrentSpread();
  if (!spread) {
    return;
  }

  const payload = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    question: elements.question.value.trim(),
    spreadId: spread.id,
    spreadName: spread.nameJa || spread.name,
    note: elements.note.value,
    cards: state.drawnCards.map(card => ({
      id: card.id,
      drawId: card.drawId,
      position: card.position,
      revealed: card.revealed,
      upright: card.upright,
      x: card.x,
      y: card.y
    }))
  };

  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `tarot-reading-${Date.now()}.json`
  );
  await saveBoardImage();
}

async function saveBoardImage() {
  if (typeof html2canvas !== 'function') {
    return;
  }

  try {
    const canvas = await html2canvas(elements.spreadArea, {
      backgroundColor: '#fbf7ef',
      useCORS: true
    });
    const url = canvas.toDataURL('image/png');
    downloadUrl(url, `tarot-reading-${Date.now()}.png`);
  } catch (error) {
    console.warn('盤面画像の保存に失敗しました。', error);
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  URL.revokeObjectURL(url);
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
    const [file] = event.target.files;
    if (file) {
      loadSaveFile(file);
    }
  });
  input.click();
}

function loadSaveFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', event => {
    try {
      const raw = JSON.parse(String(event.target.result));
      restoreReading(raw);
    } catch (error) {
      console.error(error);
      alert('保存データを読み込めませんでした。');
    }
  });
  reader.readAsText(file);
}

function restoreReading(data) {
  const spread = state.spreads.find(item => item.id === data.spreadId) || state.spreads[0];
  if (!spread) {
    return;
  }

  state.selectedSpreadId = spread.id;
  elements.spreadSelect.value = spread.id;
  elements.question.value = typeof data.question === 'string' ? data.question : '';
  elements.note.value = typeof data.note === 'string' ? data.note : '';

  state.drawnCards = Array.isArray(data.cards)
    ? data.cards.map(savedCard => normalizeCard(savedCard, spread)).filter(Boolean)
    : [];

  const usedIds = new Set(state.drawnCards.map(card => card.id));
  state.shuffledDeck = shuffle(state.deck.filter(card => !usedIds.has(card.id)));
  const selected = state.drawnCards.find(card => card.revealed) || null;
  if (!selected) {
    clearDetail();
  } else {
    state.selectedDrawId = selected.drawId;
    updateDetail(selected);
  }

  updateStatus();
  renderBoard();
}

function normalizeCard(savedCard, spread) {
  const master = state.deck.find(card => card.id === savedCard.id);
  if (!master) {
    return null;
  }

  const fallbackPosition = spread.positions.find(position => position.id === savedCard.position?.id) || spread.positions[0];
  const point = getBoardPoint(fallbackPosition);
  return {
    ...master,
    drawId: savedCard.drawId || createId(),
    position: savedCard.position || {
      id: fallbackPosition.id,
      label: fallbackPosition.label,
      helper: fallbackPosition.helper || ''
    },
    revealed: Boolean(savedCard.revealed),
    upright: typeof savedCard.upright === 'boolean' ? savedCard.upright : true,
    x: Number.isFinite(Number(savedCard.x)) ? Number(savedCard.x) : point.x,
    y: Number.isFinite(Number(savedCard.y)) ? Number(savedCard.y) : point.y
  };
}
