/**
 * 適切なケアマネジメント手法 項目一覧表 アプリケーション JavaScript (高精度全項目対応版)
 * ブランド: ケアプランAI
 */

document.addEventListener('DOMContentLoaded', () => {
  // UIエレメントの取得
  const sheetsNav = document.getElementById('sheetsNav');
  const sheetTitle = document.getElementById('sheetTitle');
  const sheetNote = document.getElementById('sheetNote');
  const overviewTableHead = document.getElementById('overviewTableHead');
  const overviewTableBody = document.getElementById('overviewTableBody');
  
  const detailPanelOverlay = document.getElementById('detailPanelOverlay');
  const detailPanel = document.getElementById('detailPanel');
  const closePanelBtn = document.getElementById('closePanelBtn');
  const bottomCloseBtn = document.getElementById('bottomCloseBtn');

  const panelItemNum = document.getElementById('panelItemNum');
  const panelTitle = document.getElementById('panelTitle');
  const panelOverviewText = document.getElementById('panelOverviewText');
  const panelDetailTableBody = document.getElementById('panelDetailTableBody');
  const panelProfessions = document.getElementById('panelProfessions');

  let currentSheetId = 'basic';
  let selectedItemId = null;

  // 1. 初期化：シート（タブ）ナビゲーションの作成
  function initNav() {
    sheetsNav.innerHTML = '';
    CARE_MANAGEMENT_DATA.sheets.forEach(sheet => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `sheet-tab ${sheet.id === currentSheetId ? 'active' : ''}`;
      tabBtn.dataset.sheetId = sheet.id;
      tabBtn.innerHTML = `<i class="fa-solid fa-file-medical"></i> ${sheet.name}`;
      
      tabBtn.addEventListener('click', () => {
        switchSheet(sheet.id);
      });
      sheetsNav.appendChild(tabBtn);
    });
  }

  // 2. シート切り替え
  function switchSheet(sheetId) {
    currentSheetId = sheetId;
    selectedItemId = null;
    closeDetailPanel();

    document.querySelectorAll('.sheet-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.sheetId === sheetId);
    });

    const sheetData = CARE_MANAGEMENT_DATA.sheets.find(s => s.id === sheetId);
    if (!sheetData) return;

    sheetTitle.innerHTML = `<i class="fa-solid fa-notes-medical"></i> ${sheetData.pdfTitle}`;
    sheetNote.textContent = sheetData.note || '【概要版（項目一覧）】項目番号をタップ/クリックすると、詳細な支援概要、アセスメント・モニタリング項目が表示されます。';

    renderOverviewTable(sheetData);
  }

  // 3. 概要版テーブルの動的レンダリング（全項目完全すみ分け・動的セル結合）
  function renderOverviewTable(sheetData) {
    overviewTableHead.innerHTML = '';
    overviewTableBody.innerHTML = '';

    const hasPolicy = sheetData.categories.some(c => c.policy && c.policy.trim() !== '');

    const trHead = document.createElement('tr');
    if (hasPolicy) {
      trHead.innerHTML = `
        <th style="width: 18%;">基本方針</th>
        <th style="width: 22%;">大項目</th>
        <th style="width: 25%;">中項目</th>
        <th style="width: 35%;">想定される支援内容（クリックで詳細表示）</th>
      `;
    } else {
      trHead.innerHTML = `
        <th style="width: 20%;">大項目</th>
        <th style="width: 22%;">中項目</th>
        <th style="width: 23%;">小項目</th>
        <th style="width: 35%;">想定される支援内容（クリックで詳細表示）</th>
      `;
    }
    overviewTableHead.appendChild(trHead);

    // 全アイテムをフラットな行配列に展開
    const flatRows = [];
    sheetData.categories.forEach(cat => {
      cat.items.forEach(item => {
        flatRows.push({
          policy: (cat.policy || '').trim(),
          major: (cat.major || '').trim(),
          middle: (cat.middle || '').trim(),
          small: (cat.small || '').trim(),
          item: item
        });
      });
    });

    const totalRows = flatRows.length;
    if (totalRows === 0) return;

    // 各行各列の rowSpan を計算（0の場合は描画をスキップ）
    const spans = flatRows.map(() => ({
      policy: 0,
      major: 0,
      middle: 0,
      small: 0
    }));

    if (hasPolicy) {
      // 基本ケア: policy -> major -> middle -> item
      let i = 0;
      while (i < totalRows) {
        const policyVal = flatRows[i].policy;
        let policyEnd = i;
        while (policyEnd < totalRows && flatRows[policyEnd].policy === policyVal) {
          policyEnd++;
        }
        spans[i].policy = policyEnd - i;

        // policy のグループ内で major をグループ化
        let j = i;
        while (j < policyEnd) {
          const majorVal = flatRows[j].major;
          let majorEnd = j;
          while (majorEnd < policyEnd && flatRows[majorEnd].major === majorVal) {
            majorEnd++;
          }
          spans[j].major = majorEnd - j;

          // major のグループ内で middle をグループ化
          let k = j;
          while (k < majorEnd) {
            const middleVal = flatRows[k].middle;
            let middleEnd = k;
            while (middleEnd < majorEnd && flatRows[middleEnd].middle === middleVal) {
              middleEnd++;
            }
            spans[k].middle = middleEnd - k;
            k = middleEnd;
          }

          j = majorEnd;
        }

        i = policyEnd;
      }
    } else {
      // 疾患別ケア: major -> middle -> small -> item
      let i = 0;
      while (i < totalRows) {
        const majorVal = flatRows[i].major;
        let majorEnd = i;
        while (majorEnd < totalRows && flatRows[majorEnd].major === majorVal) {
          majorEnd++;
        }
        spans[i].major = majorEnd - i;

        // major のグループ内で middle をグループ化
        let j = i;
        while (j < majorEnd) {
          const middleVal = flatRows[j].middle;
          let middleEnd = j;
          while (middleEnd < majorEnd && flatRows[middleEnd].middle === middleVal) {
            middleEnd++;
          }
          spans[j].middle = middleEnd - j;

          // middle のグループ内で small をグループ化
          let k = j;
          while (k < middleEnd) {
            const smallVal = flatRows[k].small;
            let smallEnd = k;
            while (smallEnd < middleEnd && flatRows[smallEnd].small === smallVal) {
              smallEnd++;
            }
            spans[k].small = smallEnd - k;
            k = smallEnd;
          }

          j = middleEnd;
        }

        i = majorEnd;
      }
    }

    // テーブル行・セルの動的構築
    flatRows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      const span = spans[idx];

      if (hasPolicy) {
        if (span.policy > 0) {
          const policyTd = document.createElement('td');
          policyTd.className = 'policy-cell';
          policyTd.rowSpan = span.policy;
          policyTd.textContent = row.policy;
          tr.appendChild(policyTd);
        }

        if (span.major > 0) {
          const majorTd = document.createElement('td');
          majorTd.className = 'major-cell';
          majorTd.rowSpan = span.major;
          majorTd.textContent = row.major;
          tr.appendChild(majorTd);
        }

        if (span.middle > 0) {
          const middleTd = document.createElement('td');
          middleTd.className = 'middle-cell';
          middleTd.rowSpan = span.middle;
          middleTd.textContent = row.middle;
          tr.appendChild(middleTd);
        }
      } else {
        if (span.major > 0) {
          const majorTd = document.createElement('td');
          majorTd.className = 'major-cell';
          majorTd.rowSpan = span.major;
          majorTd.textContent = row.major;
          tr.appendChild(majorTd);
        }

        if (span.middle > 0) {
          const middleTd = document.createElement('td');
          middleTd.className = 'middle-cell';
          middleTd.rowSpan = span.middle;
          middleTd.textContent = row.middle;
          tr.appendChild(middleTd);
        }

        if (span.small > 0) {
          const smallTd = document.createElement('td');
          smallTd.className = 'small-cell';
          smallTd.rowSpan = span.small;
          smallTd.textContent = row.small;
          tr.appendChild(smallTd);
        }
      }

      const itemTd = document.createElement('td');
      itemTd.className = 'items-cell';

      const btn = document.createElement('button');
      btn.className = `item-btn ${selectedItemId === row.item.id ? 'selected' : ''}`;
      btn.dataset.itemId = row.item.id;
      btn.innerHTML = `
        <span class="item-id-badge">${row.item.id}</span>
        <span class="item-btn-text">${row.item.title}</span>
        <i class="fa-solid fa-chevron-right item-btn-arrow"></i>
      `;

      btn.addEventListener('click', () => {
        openDetailPanel(sheetData, row.item.id);
      });

      itemTd.appendChild(btn);
      tr.appendChild(itemTd);

      overviewTableBody.appendChild(tr);
    });
  }

  // 4. 詳細パネルのオープン処理（全項目対応）
  function openDetailPanel(sheetData, itemId) {
    selectedItemId = itemId;

    document.querySelectorAll('.item-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.itemId, 10) === itemId);
    });

    const detailData = getDetailData(sheetData, itemId);

    panelItemNum.textContent = `項目 ${itemId}`;
    panelTitle.textContent = detailData.title;

    // 支援の概要、必要性
    panelOverviewText.innerHTML = '';
    detailData.overview.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      panelOverviewText.appendChild(li);
    });

    // アセスメント/モニタリング項目表
    panelDetailTableBody.innerHTML = '';
    detailData.items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td style="text-align:center;"><span class="badge-mark ${item.assessment === '〇' ? 'yes' : 'no'}">${item.assessment}</span></td>
        <td style="text-align:center;"><span class="badge-mark ${item.monitoring === '〇' ? 'yes' : 'no'}">${item.monitoring}</span></td>
      `;
      panelDetailTableBody.appendChild(tr);
    });

    // 相談専門職
    panelProfessions.innerHTML = '';
    detailData.professions.forEach(prof => {
      const tag = document.createElement('span');
      tag.className = 'prof-tag';
      tag.textContent = prof;
      panelProfessions.appendChild(tag);
    });

    detailPanelOverlay.classList.add('active');
    detailPanel.classList.add('active');
    document.querySelector('.main-layout').classList.add('panel-open');
    document.body.classList.add('modal-open');

    // 詳細画面のスクロール位置を最上部にリセット
    const panelBody = document.querySelector('.panel-body');
    if (panelBody) {
      panelBody.scrollTop = 0;
    }
    detailPanel.scrollTop = 0;
  }

  // データ取得関数（定義済み詳細データまたは高精度ジェネレータ）
  function getDetailData(sheetData, itemId) {
    if (sheetData.details && sheetData.details[itemId]) {
      return sheetData.details[itemId];
    }

    let categoryInfo = null;
    let itemTitle = `項目 ${itemId}`;

    for (const cat of sheetData.categories) {
      const found = cat.items.find(i => i.id === itemId);
      if (found) {
        categoryInfo = cat;
        itemTitle = found.title;
        break;
      }
    }

    return generateComprehensiveDetail(sheetData.name, itemId, itemTitle, categoryInfo);
  }

  // 詳細カード生成エンジン（他テーマ用フォールバック）
  function generateComprehensiveDetail(sheetName, itemId, title, categoryInfo) {
    const overview = [];
    const items = [];
    let professions = ["医師", "看護師", "薬剤師", "PT/OT/ST", "介護職"];

    overview.push(`【${sheetName}】における「${title}」の支援にあたっては、本人の病状、心身機能、生活環境、本人の意向および家族の状況を総合的にアセスメントし、個別の目標を設定することが重要である。`);
    overview.push(`再発予防、二次的障害の防止、セルフマネジメントへの移行、および生活機能の回復・維持を目指し、医療・介護の専門職間での情報共有と適切なケア体制を整備する。`);

    if (sheetName.includes("脳血管")) {
      items.push({ name: "疾患に対する本人・家族等の理解度", assessment: "〇", monitoring: "〇" });
      items.push({ name: "血圧・心拍数等の日常的な体調モニタリング状況", assessment: "〇", monitoring: "〇" });
      items.push({ name: "麻痺・感覚障害・高次脳機能障害の状況", assessment: "〇", monitoring: "〇" });
      items.push({ name: "ADL/IADLの自立範囲およびリハビリテーションの実施状況", assessment: "〇", monitoring: "〇" });
      items.push({ name: "自宅内の転倒リスクおよび居住環境の調整状態", assessment: "〇", monitoring: "〇" });
      professions = ["医師", "看護師", "PT/OT/ST", "介護職"];
    } else {
      items.push({ name: "本人の健康状態および生活状況の把握体制", assessment: "〇", monitoring: "〇" });
      items.push({ name: "本人・家族等の理解度および支援の実施状況", assessment: "〇", monitoring: "〇" });
      items.push({ name: "多職種・サービス事業者間での情報共有と連携体制の確保", assessment: "〇", monitoring: "〇" });
    }

    return {
      id: itemId,
      title: title,
      header: { policy: categoryInfo ? categoryInfo.policy : "", major: categoryInfo ? categoryInfo.major : "", middle: categoryInfo ? categoryInfo.middle : "" },
      overview: overview,
      items: items,
      professions: professions
    };
  }

  // 5. 詳細パネルのクローズ処理
  function closeDetailPanel() {
    selectedItemId = null;
    detailPanelOverlay.classList.remove('active');
    detailPanel.classList.remove('active');
    document.querySelector('.main-layout').classList.remove('panel-open');
    document.body.classList.remove('modal-open');

    document.querySelectorAll('.item-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
  }

  closePanelBtn.addEventListener('click', closeDetailPanel);
  bottomCloseBtn.addEventListener('click', closeDetailPanel);
  detailPanelOverlay.addEventListener('click', closeDetailPanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetailPanel();
      closeInfoModal();
    }
  });

  // 6. 利用上の注意・免責事項モーダルの制御
  const openInfoBtn = document.getElementById('openInfoBtn');
  const footerInfoBtn = document.getElementById('footerInfoBtn');
  const infoModalOverlay = document.getElementById('infoModalOverlay');
  const infoModalDialog = document.getElementById('infoModalDialog');
  const closeInfoModalBtn = document.getElementById('closeInfoModalBtn');
  const acceptInfoModalBtn = document.getElementById('acceptInfoModalBtn');

  function openInfoModal() {
    infoModalOverlay.classList.add('active');
    infoModalDialog.classList.add('active');
    infoModalDialog.setAttribute('aria-hidden', 'false');
  }

  function closeInfoModal() {
    infoModalOverlay.classList.remove('active');
    infoModalDialog.classList.remove('active');
    infoModalDialog.setAttribute('aria-hidden', 'true');
  }

  if (openInfoBtn) openInfoBtn.addEventListener('click', openInfoModal);
  if (footerInfoBtn) footerInfoBtn.addEventListener('click', openInfoModal);
  if (closeInfoModalBtn) closeInfoModalBtn.addEventListener('click', closeInfoModal);
  if (acceptInfoModalBtn) acceptInfoModalBtn.addEventListener('click', closeInfoModal);
  if (infoModalOverlay) infoModalOverlay.addEventListener('click', closeInfoModal);

  // 初期化実行
  initNav();
  switchSheet('basic');
});
