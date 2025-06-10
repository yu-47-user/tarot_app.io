// タロット占いアプリ メインスクリプト
// 今後、カード表示・シャッフル・保存/読込機能などを実装

document.getElementById('save-btn').addEventListener('click', () => {
  // スクリーンショット＋JSON保存処理（後で実装）
  alert('保存機能は今後実装されます');
});
document.getElementById('load-btn').addEventListener('click', () => {
  // ファイル読込処理（後で実装）
  alert('読込機能は今後実装されます');
});

// スプレッド定義（Three Card Spread）
const spread = {
  name: "Three Card",
  positions: [
    { id: "past", label: "Past", x: 100, y: 200 },
    { id: "present", label: "Present", x: 300, y: 200 },
    { id: "future", label: "Future", x: 500, y: 200 }
  ]
};

// カードデータを取得してスプレッドに従い3枚表示＋シャッフル＋タップで表裏切替
fetch('data/deck.json')
  .then(res => res.json())
  .then(deck => {
    // deck-areaをspread-area外に作成
    let deckArea = document.getElementById('deck-area');
    if (!deckArea) {
      deckArea = document.createElement('div');
      deckArea.id = 'deck-area';
      document.body.appendChild(deckArea);
    }
    deckArea.innerHTML = '';
    // デッキをシャッフル
    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    const shuffled = shuffle([...deck]);
    let drawIndex = 0;
    // 山札（裏面）をdeck-areaに表示
    const deckDiv = document.createElement('div');
    deckDiv.className = 'tarot-deck';
    deckDiv.style.cursor = 'pointer';
    const deckImg = document.createElement('img');
    deckImg.src = 'assets/tarot/tarot_back.jpg';
    deckImg.alt = '山札';
    deckImg.style.width = '120px';
    deckImg.style.height = '200px';
    deckDiv.appendChild(deckImg);
    deckArea.appendChild(deckDiv);
    // spread-areaを初期化
    const spreadArea = document.getElementById('spread-area');
    spreadArea.innerHTML = '';
    spreadArea.style.position = 'relative';
    spreadArea.style.height = '420px';
    // 山札クリックで1枚ずつ場に出す
    deckDiv.addEventListener('click', () => {
      if (drawIndex >= spread.positions.length) return;
      const card = shuffled[drawIndex];
      const pos = spread.positions[drawIndex];
      const cardDiv = document.createElement('div');
      cardDiv.className = 'tarot-card';
      cardDiv.style.position = 'absolute';
      cardDiv.style.left = pos.x + 'px';
      cardDiv.style.top = pos.y + 'px';
      cardDiv.style.textAlign = 'center';
      cardDiv.setAttribute('draggable', 'true');
      cardDiv.dataset.index = drawIndex;
      // 画像（初期は裏面）
      const img = document.createElement('img');
      img.src = 'assets/tarot/tarot_back.jpg';
      img.alt = '裏面';
      img.style.width = '120px';
      img.style.height = '200px';
      img.style.cursor = 'pointer';
      cardDiv.appendChild(img);
      // カード名（初期は非表示）
      const name = document.createElement('div');
      name.textContent = card.name + ' (' + pos.label + ')';
      name.style.marginTop = '8px';
      name.style.display = 'none';
      cardDiv.appendChild(name);
      spreadArea.appendChild(cardDiv);
      // タップで表裏切替
      img.addEventListener('click', () => {
        if (img.src.includes('tarot_back.jpg')) {
          img.src = 'assets/' + card.image;
          img.alt = card.name;
          name.style.display = 'block';
        } else {
          img.src = 'assets/tarot/tarot_back.jpg';
          img.alt = '裏面';
          name.style.display = 'none';
        }
      });
      // ドラッグ＆ドロップ
      let offsetX, offsetY;
      cardDiv.addEventListener('dragstart', (e) => {
        offsetX = e.offsetX;
        offsetY = e.offsetY;
      });
      cardDiv.addEventListener('dragend', (e) => {
        const rect = spreadArea.getBoundingClientRect();
        cardDiv.style.left = (e.clientX - rect.left - offsetX) + 'px';
        cardDiv.style.top = (e.clientY - rect.top - offsetY) + 'px';
      });
      drawIndex++;
      if (drawIndex >= spread.positions.length) {
        deckArea.innerHTML = '';
      }
    });
  });
