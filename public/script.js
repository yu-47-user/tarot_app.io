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

// カードデータを取得して表示
fetch('data/deck.json')
  .then(res => res.json())
  .then(deck => {
    const spreadArea = document.getElementById('spread-area');
    spreadArea.innerHTML = '';
    // 1枚だけサンプル表示（今後スプレッド対応）
    const card = deck[0];
    const cardDiv = document.createElement('div');
    cardDiv.className = 'tarot-card';
    cardDiv.style.display = 'inline-block';
    cardDiv.style.margin = '10px';
    cardDiv.style.textAlign = 'center';
    // 画像
    const img = document.createElement('img');
    img.src = 'assets/' + card.image;
    img.alt = card.name;
    img.style.width = '120px';
    img.style.height = '200px';
    cardDiv.appendChild(img);
    // カード名
    const name = document.createElement('div');
    name.textContent = card.name;
    name.style.marginTop = '8px';
    cardDiv.appendChild(name);
    spreadArea.appendChild(cardDiv);
  });
