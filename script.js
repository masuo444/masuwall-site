document.addEventListener('DOMContentLoaded', async () => {
    const masuContainer = document.querySelector('.masu-container');
    if (!masuContainer) return;

    // --- DOM要素を取得 ---
    const colHeaders = document.querySelector('.col-headers');
    const rowHeaders = document.querySelector('.row-headers');
    const popover = document.getElementById('popover');
    const selectedMasuSpan = document.getElementById('selected-masu');
    const selectedAreaSpan = document.getElementById('selected-area');
    const priceSpan = document.getElementById('price');
    const reservationForm = document.getElementById('reservation-form');

    // --- 定数定義 ---
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'X', 'Y', 'Z', 'α', 'β', 'θ'];
    const cols = 23;
    let selectedMasuData = {};

    // --- 枡の販売状況を取得して反映 ---
    let masuAvailability = {};
    try {
        const response = await fetch('/api/masu-status');
        const data = await response.json();
        data.forEach(item => { masuAvailability[item.id] = item.is_available; });
    } catch (error) {
        console.error('Failed to fetch masu status:', error);
    }

    // --- ヘッダーを生成 ---
    for (let i = 1; i <= cols; i++) { colHeaders.appendChild(Object.assign(document.createElement('div'), { textContent: i })); }
    for (const row of rows) { rowHeaders.appendChild(Object.assign(document.createElement('div'), { textContent: row })); }

    // --- 枡グリッドを生成 ---
    for (let i = 0; i < rows.length; i++) {
        for (let j = 1; j <= cols; j++) {
            const masu = document.createElement('div');
            masu.classList.add('masu');
            const isSellable = (i + j) % 2 === 1;

            if (isSellable) {
                const masuId = `${rows[i]}${j}`;
                masu.dataset.id = masuId;

                let area, price;
                if (i < 4 || i >= rows.length - 4) {
                    area = 'ライトエリア'; price = 3000; masu.classList.add('light-area');
                } else {
                    area = 'スタンダード'; price = 5000; masu.classList.add('standard');
                }

                // 販売状況をチェック
                const isAvailable = masuAvailability[masuId] === undefined ? true : masuAvailability[masuId];
                if (isAvailable) {
                    masu.classList.add('sellable');
                    masu.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectedMasuData = { masuId, area, price };
                        updatePopover(masu, masuId, area, price);
                        updateBookingInfo(masu, masuId, area, price);
                    });
                } else {
                    masu.classList.add('reserved'); // 販売停止中の枡はreservedクラスを付与
                }
            } else {
                masu.classList.add('wall');
            }
            masuContainer.appendChild(masu);
        }
    }

    // --- フォーム送信処理 ---
    reservationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedMasuData.masuId) {
            alert('枡を選択してください。');
            return;
        }

        // ECサイトへリダイレクト
        window.location.href = 'https://fomus.official.ec/items/102631006';
    });

    // --- ヘルパー関数 ---
    function updateBookingInfo(masu, masuId, area, price) {
        const currentSelected = document.querySelector('.masu.selected');
        if (currentSelected) currentSelected.classList.remove('selected');
        masu.classList.add('selected');
        selectedMasuSpan.textContent = masuId;
        selectedAreaSpan.textContent = area;
        priceSpan.textContent = `¥${price.toLocaleString()}`;
        popover.classList.add('visible');
    }

    function updatePopover(target, id, area, price) {
        popover.innerHTML = `<div class="popover-header">${id}</div><div class="popover-body"><div>エリア: <span>${area}</span></div><div>価格: <span>¥${price.toLocaleString()}</span></div></div>`;
        popover.style.left = `${target.offsetLeft + target.offsetWidth + 15}px`;
        popover.style.top = `${target.offsetTop}px`;
    }

    document.addEventListener('click', (e) => { if (!popover.contains(e.target)) popover.classList.remove('visible'); });
});
