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

  // 3. 概要版テーブルの動的レンダリング
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

    sheetData.categories.forEach(cat => {
      const rowCount = cat.items.length;

      cat.items.forEach((item, index) => {
        const tr = document.createElement('tr');

        if (index === 0) {
          if (hasPolicy) {
            const policyTd = document.createElement('td');
            policyTd.className = 'policy-cell';
            policyTd.rowSpan = rowCount;
            policyTd.textContent = cat.policy || '';
            tr.appendChild(policyTd);
          }

          const majorTd = document.createElement('td');
          majorTd.className = 'major-cell';
          majorTd.rowSpan = rowCount;
          majorTd.textContent = cat.major || '';
          tr.appendChild(majorTd);

          const middleTd = document.createElement('td');
          middleTd.className = 'middle-cell';
          middleTd.rowSpan = rowCount;
          middleTd.textContent = cat.middle || '';
          tr.appendChild(middleTd);

          if (!hasPolicy) {
            const smallTd = document.createElement('td');
            smallTd.className = 'small-cell';
            smallTd.rowSpan = rowCount;
            smallTd.textContent = cat.small || '';
            tr.appendChild(smallTd);
          }
        }

        const itemTd = document.createElement('td');
        itemTd.className = 'items-cell';

        const btn = document.createElement('button');
        btn.className = `item-btn ${selectedItemId === item.id ? 'selected' : ''}`;
        btn.dataset.itemId = item.id;
        btn.innerHTML = `
          <span class="item-id-badge">${item.id}</span>
          <span class="item-btn-text">${item.title}</span>
          <i class="fa-solid fa-chevron-right item-btn-arrow"></i>
        `;

        btn.addEventListener('click', () => {
          openDetailPanel(sheetData, item.id);
        });

        itemTd.appendChild(btn);
        tr.appendChild(itemTd);

        overviewTableBody.appendChild(tr);
      });
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
    if (e.key === 'Escape') closeDetailPanel();
  });

  // 初期化実行
  initNav();
  switchSheet('basic');
});
