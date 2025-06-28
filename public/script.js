// タロット占いアプリ メインスクリプト
// 今後、カード表示・シャッフル・保存/読込機能などを実装

document.getElementById('save-btn').addEventListener('click', () => {
  // spread-area内のカード情報を収集
  const spreadArea = document.getElementById('spread-area');
  const cardDivs = spreadArea.querySelectorAll('.tarot-card');
  const cards = Array.from(cardDivs).map(cardDiv => {
    const img = cardDiv.querySelector('img');
    const nameDiv = cardDiv.querySelector('div');
    // 正逆位置はカード名末尾の（正位置）（逆位置）で判定
    const nameText = nameDiv.textContent;
    const upright = nameText.includes('正位置');
    // 配置座標
    const left = parseInt(cardDiv.style.left);
    const top = parseInt(cardDiv.style.top);
    // 表裏状態
    const isFace = !img.src.includes('tarot_back.jpg');
    // カード名本体
    const cardName = nameText.replace(/（正位置）|（逆位置）/g, '').replace(/\(.+\)$/,'').trim();
    return { name: cardName, left, top, upright, isFace };
  });
  // メモ欄
  const note = document.getElementById('note').value;
  // 保存データ
  const saveData = { mode: freeMode ? 'free' : 'spread', cards, note, date: new Date().toISOString() };
  // JSONダウンロード
  const blob = new Blob([JSON.stringify(saveData, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tarot_save_' + Date.now() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
document.getElementById('load-btn').addEventListener('click', () => {
  // ファイル選択ダイアログを表示
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        // メモ欄復元
        document.getElementById('note').value = data.note || '';
        // モード復元
        freeMode = (data.mode === 'free');
        updateModeUI();
        // カード配置復元
        const spreadArea = document.getElementById('spread-area');
        spreadArea.innerHTML = '';
        data.cards.forEach(card => {
          // deck.jsonから画像パスを取得
          fetch('data/deck.json')
            .then(res => res.json())
            .then(deck => {
              const cardInfo = deck.find(d => d.name === card.name);
              if (!cardInfo) return;
              const cardDiv = document.createElement('div');
              cardDiv.className = 'tarot-card';
              cardDiv.style.position = 'absolute';
              cardDiv.style.left = card.left + 'px';
              cardDiv.style.top = card.top + 'px';
              cardDiv.style.textAlign = 'center';
              cardDiv.setAttribute('draggable', 'true');
              // 画像
              const img = document.createElement('img');
              img.src = card.isFace ? ('assets/' + cardInfo.image) : 'assets/tarot/tarot_back.jpg';
              img.alt = card.name;
              img.style.width = '120px';
              img.style.height = '200px';
              img.style.cursor = 'pointer';
              img.style.transform = card.upright ? 'none' : 'rotate(180deg)';
              // カード名
              const name = document.createElement('div');
              name.textContent = card.name + (card.upright ? '（正位置）' : '（逆位置）');
              name.style.marginTop = '8px';
              name.style.display = card.isFace ? 'block' : 'none';
              cardDiv.appendChild(img);
              cardDiv.appendChild(name);
              spreadArea.appendChild(cardDiv);
              // タップで表裏切替
              img.addEventListener('click', () => {
                if (img.src.includes('tarot_back.jpg')) {
                  img.src = 'assets/' + cardInfo.image;
                  img.alt = card.name;
                  name.style.display = 'block';
                  img.style.transform = card.upright ? 'none' : 'rotate(180deg)';
                } else {
                  img.src = 'assets/tarot/tarot_back.jpg';
                  img.alt = '裏面';
                  name.style.display = 'none';
                  img.style.transform = 'none';
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
                let newLeft = e.clientX - rect.left - offsetX;
                let newTop = e.clientY - rect.top - offsetY;
                newLeft = Math.max(0, Math.min(newLeft, spreadArea.offsetWidth - cardDiv.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, spreadArea.offsetHeight - cardDiv.offsetHeight));
                cardDiv.style.left = newLeft + 'px';
                cardDiv.style.top = newTop + 'px';
              });
            });
        });
      } catch (err) {
        alert('読込失敗: ファイル形式が不正です');
      }
    };
    reader.readAsText(file);
  };
  input.click();
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

// --- モード切替UI ---
const modeArea = document.createElement('div');
modeArea.id = 'mode-area';
modeArea.style.margin = '10px 0';
modeArea.style.textAlign = 'center';
const modeLabel = document.createElement('span');
modeLabel.id = 'mode-label';
modeLabel.style.fontWeight = 'bold';
modeLabel.style.marginRight = '16px';
const modeBtn = document.createElement('button');
modeBtn.id = 'mode-btn';
modeBtn.style.marginLeft = '8px';
modeArea.appendChild(modeLabel);
modeArea.appendChild(modeBtn);
document.body.insertBefore(modeArea, document.getElementById('spread-area'));

let freeMode = true; // 初期は自由配置

function updateModeUI() {
  modeLabel.textContent = freeMode ? 'モード: 自由配置' : 'モード: スプレッド';
  modeBtn.textContent = freeMode ? 'スプレッドモードに切替' : '自由配置モードに切替';
}
updateModeUI();

modeBtn.onclick = () => {
  freeMode = !freeMode;
  updateModeUI();
  renderTarot();
};

function renderTarot() {
  // deck-area, spread-areaを初期化
  let deckArea = document.getElementById('deck-area');
  if (!deckArea) {
    deckArea = document.createElement('div');
    deckArea.id = 'deck-area';
    // deck-areaをspread-areaの直前に配置
    document.body.insertBefore(deckArea, document.getElementById('spread-area'));
  }
  deckArea.innerHTML = '';
  const spreadArea = document.getElementById('spread-area');
  spreadArea.innerHTML = '';
  spreadArea.style.position = 'relative';
  spreadArea.style.height = (200 * 3.5) + 'px'; // カード縦3.5枚分
  spreadArea.style.width = '100%'; // 横幅を可変に
  spreadArea.style.maxWidth = '1200px'; // 最大幅を設定（任意）
  spreadArea.style.margin = '0 auto 16px auto'; // 中央寄せ
  // デッキをシャッフル
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  fetch('data/deck.json')
    .then(res => res.json())
    .then(deck => {
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
      if (freeMode) {
        // --- 自由配置モード ---
        deckDiv.addEventListener('click', () => {
          if (drawIndex >= shuffled.length) return;
          const card = shuffled[drawIndex];
          // 正位置・逆位置をランダム決定
          const upright = Math.random() < 0.5;
          // --- カードをspread-area左上から順に配置（重ならないように） ---
          const areaWidth = spreadArea.offsetWidth;
          const cardsPerRow = Math.max(1, Math.floor(areaWidth / 140)); // 120px+余白20px
          const cardRow = Math.floor(drawIndex / cardsPerRow);
          const cardCol = drawIndex % cardsPerRow;
          const left = 20 + cardCol * 140;
          const top = 20 + cardRow * 220;
          const cardDiv = document.createElement('div');
          cardDiv.className = 'tarot-card';
          cardDiv.style.position = 'absolute';
          cardDiv.style.left = left + 'px';
          cardDiv.style.top = top + 'px';
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
          // カード名（初期は非表示）
          const name = document.createElement('div');
          name.textContent = card.name + (upright ? '（正位置）' : '（逆位置）');
          name.style.marginTop = '8px';
          name.style.display = 'none';
          cardDiv.appendChild(img);
          cardDiv.appendChild(name);
          spreadArea.appendChild(cardDiv);
          // タップで表裏切替
          img.addEventListener('click', () => {
            if (img.src.includes('tarot_back.jpg')) {
              img.src = 'assets/' + card.image;
              img.alt = card.name;
              name.style.display = 'block';
              // 逆位置なら180度回転
              img.style.transform = upright ? 'none' : 'rotate(180deg)';
            } else {
              img.src = 'assets/tarot/tarot_back.jpg';
              img.alt = '裏面';
              name.style.display = 'none';
              img.style.transform = 'none';
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
            let newLeft = e.clientX - rect.left - offsetX;
            let newTop = e.clientY - rect.top - offsetY;
            // 配置エリア外に出せないよう制限
            newLeft = Math.max(0, Math.min(newLeft, spreadArea.offsetWidth - cardDiv.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, spreadArea.offsetHeight - cardDiv.offsetHeight));
            cardDiv.style.left = newLeft + 'px';
            cardDiv.style.top = newTop + 'px';
          });
          drawIndex++;
          if (drawIndex >= shuffled.length) {
            deckArea.innerHTML = '';
          }
        });
      } else {
        // --- スプレッドモード ---
        deckDiv.addEventListener('click', () => {
          if (drawIndex >= spread.positions.length) return;
          const card = shuffled[drawIndex];
          const pos = spread.positions[drawIndex];
          // 正位置・逆位置をランダム決定
          const upright = Math.random() < 0.5;
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
          // カード名（初期は非表示）
          const name = document.createElement('div');
          name.textContent = card.name + ' (' + pos.label + ')' + (upright ? '（正位置）' : '（逆位置）');
          name.style.marginTop = '8px';
          name.style.display = 'none';
          cardDiv.appendChild(img);
          cardDiv.appendChild(name);
          spreadArea.appendChild(cardDiv);
          // タップで表裏切替
          img.addEventListener('click', () => {
            if (img.src.includes('tarot_back.jpg')) {
              img.src = 'assets/' + card.image;
              img.alt = card.name;
              name.style.display = 'block';
              img.style.transform = upright ? 'none' : 'rotate(180deg)';
            } else {
              img.src = 'assets/tarot/tarot_back.jpg';
              img.alt = '裏面';
              name.style.display = 'none';
              img.style.transform = 'none';
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
            let newLeft = e.clientX - rect.left - offsetX;
            let newTop = e.clientY - rect.top - offsetY;
            // 配置エリア外に出せないよう制限
            newLeft = Math.max(0, Math.min(newLeft, spreadArea.offsetWidth - cardDiv.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, spreadArea.offsetHeight - cardDiv.offsetHeight));
            cardDiv.style.left = newLeft + 'px';
            cardDiv.style.top = newTop + 'px';
          });
          drawIndex++;
          if (drawIndex >= spread.positions.length) {
            deckArea.innerHTML = '';
          }
        });
      }
    });
}

// --- 盤面初期化ボタン ---
const resetBtn = document.createElement('button');
resetBtn.id = 'reset-btn';
resetBtn.textContent = '初期化';
resetBtn.style.marginLeft = '8px';
const noteElem = document.getElementById('note');
// noteの直後に追加
noteElem.parentNode.insertBefore(resetBtn, noteElem.nextSibling);

resetBtn.addEventListener('click', () => {
  // 盤面・メモを初期化
  document.getElementById('spread-area').innerHTML = '';
  document.getElementById('deck-area').innerHTML = '';
  document.getElementById('note').value = '';
  // 山札・UIを再描画
  renderTarot();
});

document.addEventListener('DOMContentLoaded', () => {
  renderTarot();
});
