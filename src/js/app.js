/**
 * DemoBank UI controller.
 * Handles navigation, card management, transactions, and local persistence.
 */

class DemoBankAppController {
  constructor() {
    this.currentTab = 'home';
    this.txFilter = 'all';
    this.secretClickCount = 0;
    this.secretTimer = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderAll();
  }

  bindEvents() {
    // 底部 5 大原生 Tab 切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // 隐蔽触发彩蛋：连续三次点击 Mine 页面黄娃娃头像 或 首页登录图标
    const secretTriggers = ['secret-mascot-trigger', 'secret-login-trigger'];
    secretTriggers.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          this.secretClickCount++;
          clearTimeout(this.secretTimer);
          this.secretTimer = setTimeout(() => {
            this.secretClickCount = 0;
          }, 1200);

          if (this.secretClickCount >= 3) {
            this.secretClickCount = 0;
            this.openProfileEditorModal();
          }
        });
      }
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => {
      if (b.getAttribute('data-tab') === tabName) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-page').forEach(page => {
      if (page.id === `page-${tabName}`) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    this.renderAll();
  }

  formatMoney(num) {
    if (typeof num !== 'number') return '0.00';
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  renderAll() {
    const data = window.demoBankStore.getData();
    this.renderHome(data);
    this.renderAccountOverview(data);
    this.renderAssetManagement(data);
    this.renderMine(data);
    this.renderTransactions(data);
  }

  renderHome(data) {
    // 首页无需太多额外动态渲染，基础信息自适应即可
  }

  // === 账户总览页 ===
  renderAccountOverview(data) {
    const totalEl = document.getElementById('overview-total-asset');
    const profitEl = document.getElementById('overview-yesterday-profit');
    const container = document.getElementById('real-card-list-container');

    if (totalEl) {
      totalEl.textContent = data.profile.hideNumbers ? '******' : this.formatMoney(data.profile.totalAsset);
    }
    if (profitEl) {
      profitEl.textContent = data.profile.hideNumbers ? '**' : (data.profile.yesterdayProfit || '--');
    }

    if (!container) return;

    container.innerHTML = data.cards.map(card => {
      const thumbClass = card.type === 'credit' ? 'gold' : 'blue';
      const balDisplay = data.profile.hideNumbers ? '******' : this.formatMoney(card.balance);

      return `
        <div class="demo-bank-card-real-item" onclick="demoBankApp.showEditCardModal('${card.id}')">
          <div class="real-card-top">
            <div class="real-card-thumb ${thumbClass}">
              <span>DemoBank</span>
            </div>
            <div>
              <div class="real-card-no">${card.cardNumber}</div>
              <div class="real-card-type">${card.typeName}</div>
            </div>
          </div>
          <div class="real-card-balance-row">
            <span style="color: #64748B;">账面余额</span>
            <span style="font-weight: 700; color: #1E293B;">人民币元 ${balDisplay}</span>
          </div>
          <div class="real-card-actions" onclick="event.stopPropagation();">
            <div class="action-link" onclick="demoBankApp.openTxPage('${card.id}')">交易明细</div>
            <div class="action-link" style="color: #1A6CDE;" onclick="alert('模拟转账功能：从卡号 ${card.cardNumber} 汇出')">转账</div>
            <div class="action-link" onclick="alert('模拟进入理财频道')">买理财</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // === 资产管理页 ===
  renderAssetManagement(data) {
    const totalEl = document.getElementById('asset-mgmt-total');
    const timeEl = document.getElementById('asset-mgmt-timestamp');
    const demandEl = document.getElementById('asset-demand-deposit');

    if (totalEl) totalEl.textContent = data.profile.hideNumbers ? '******' : this.formatMoney(data.profile.totalAsset);
    if (demandEl) demandEl.textContent = data.profile.hideNumbers ? '******' : this.formatMoney(data.profile.totalAsset);

    if (timeEl) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      timeEl.textContent = `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss} ↻`;
    }
  }

  // === 我的页 ===
  renderMine(data) {
    const nameEl = document.getElementById('mine-display-name');
    const loginEl = document.getElementById('mine-last-login');
    const assetEl = document.getElementById('mine-asset-val');
    const profitEl = document.getElementById('mine-profit-val');

    if (nameEl) nameEl.textContent = `${data.profile.greeting || '晚上好'}，${data.profile.name || 'Demo User'}`;
    if (loginEl) loginEl.textContent = `上次登录:${data.profile.lastLogin || '2026/07/10 01:10:38'}`;
    if (assetEl) assetEl.textContent = data.profile.hideNumbers ? '******' : this.formatMoney(data.profile.totalAsset);
    if (profitEl) profitEl.textContent = data.profile.hideNumbers ? '******' : (data.profile.yesterdayProfit || '--');
  }

  // === 交易明细与 2026 年数据过滤 ===
  renderTransactions() {
    const data = window.demoBankStore.getData();
    const listEl = document.getElementById('tx-main-list');
    const incomeEl = document.getElementById('tx-month-income');
    const expenseEl = document.getElementById('tx-month-expense');

    if (!listEl) return;

    let totalIncome = 0;
    let totalExpense = 0;

    // 仅展示 2026 年的数据明细
    const filtered2026 = data.transactions.filter(t => {
      return t.datetime.startsWith('2026');
    });

    filtered2026.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpense += Math.abs(t.amount);
    });

    const histIncomeEl = document.getElementById('tx-hist-income');
    const histExpenseEl = document.getElementById('tx-hist-expense');

    if (incomeEl) incomeEl.textContent = `¥ ${this.formatMoney(totalIncome)}`;
    if (expenseEl) expenseEl.textContent = `¥ ${this.formatMoney(totalExpense)}`;
    if (histIncomeEl) histIncomeEl.textContent = `¥ ${this.formatMoney(totalIncome)}`;
    if (histExpenseEl) histExpenseEl.textContent = `¥ ${this.formatMoney(totalExpense)}`;

    if (filtered2026.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding: 40px; color: #86909C;">暂无 2026 年交易明细</div>`;
      return;
    }

    listEl.innerHTML = filtered2026.map(tx => {
      const isIncome = tx.type === 'income';
      const colorClass = isIncome ? '#DC2626' : '#1D2129';
      const prefix = isIncome ? '+ ' : '- ';

      return `
        <div style="background: #FFF; border-radius: 12px; padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.03);" onclick="demoBankApp.showReceiptModal('${tx.id}')">
          <div>
            <div style="font-size: 14px; font-weight: 700; color: #1D2129;">${tx.title}</div>
            <div style="font-size: 11px; color: #86909C; margin-top: 3px; font-weight:600;">${tx.datetime}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 15px; font-weight: 700; color: ${colorClass};">${prefix}¥ ${this.formatMoney(Math.abs(tx.amount))}</div>
            <div style="font-size: 11px; color: #86909C; font-weight:600; margin-top:2px;">余额 ${data.profile.hideNumbers ? '******' : this.formatMoney(tx.balanceAfter)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  openTxPage(cardId) {
    this.switchTab('history');
  }

  // === 银行卡管理弹窗 ===
  showAddCardModal(cardId = null) {
    const data = window.demoBankStore.getData();
    const card = cardId ? data.cards.find(c => c.id === cardId) : null;
    const isEdit = !!card;

    const modal = document.getElementById('common-modal');
    const titleEl = document.getElementById('modal-header-title');
    const bodyEl = document.getElementById('modal-body-content');

    titleEl.textContent = isEdit ? '修改 / 删除DemoBank Card' : '+ 手动添加卡 / 账户';

    bodyEl.innerHTML = `
      <div class="form-group">
        <label>账户类型与名称</label>
        <input type="text" id="card-type-name" class="form-input" value="${isEdit ? card.typeName : 'DemoBank Debit Card'}">
      </div>
      <div class="form-group">
        <label>脱敏展示卡号 (例如：6217 ****** 4548)</label>
        <input type="text" id="card-display-num" class="form-input" value="${isEdit ? card.cardNumber : '6217 ****** 4548'}">
      </div>
      <div class="form-group">
        <label>账面余额 (人民币元)</label>
        <input type="number" step="0.01" id="card-bal" class="form-input" value="${isEdit ? card.balance : '15004.28'}">
      </div>
      <div class="btn-row">
        ${isEdit ? `<button class="demo-bank-btn-danger" onclick="demoBankApp.deleteCardAction('${card.id}')">删除此卡</button>` : ''}
        <button class="demo-bank-btn-primary" onclick="demoBankApp.saveCardAction('${card ? card.id : ''}')">保存生效</button>
      </div>
    `;

    modal.classList.add('active');
  }

  showEditCardModal(cardId) {
    this.showAddCardModal(cardId);
  }

  saveCardAction(cardId) {
    const typeName = document.getElementById('card-type-name').value;
    const cardNumber = document.getElementById('card-display-num').value;
    const balance = parseFloat(document.getElementById('card-bal').value) || 0;

    if (cardId) {
      window.demoBankStore.updateCard(cardId, { typeName, cardNumber, balance });
    } else {
      window.demoBankStore.addCard({ typeName, cardNumber, balance });
    }

    this.closeModal();
    this.renderAll();
  }

  deleteCardAction(cardId) {
    if (confirm("确定要删除这张DemoBank Card吗？")) {
      window.demoBankStore.deleteCard(cardId);
      this.closeModal();
      this.renderAll();
    }
  }

  // === 交易明细管理弹窗 ===
  showAddTxModal(txId = null) {
    const data = window.demoBankStore.getData();
    const tx = txId ? data.transactions.find(t => t.id === txId) : null;
    const isEdit = !!tx;

    const modal = document.getElementById('common-modal');
    const titleEl = document.getElementById('modal-header-title');
    const bodyEl = document.getElementById('modal-body-content');

    titleEl.textContent = isEdit ? '修改交易明细' : '+ 新增收支明细流水';

    bodyEl.innerHTML = `
      <div class="form-group">
        <label>收支类型</label>
        <select id="tx-type-sel" class="form-input">
          <option value="income" ${isEdit && tx.type === 'income' ? 'selected' : ''}>收入 (+ 人民币)</option>
          <option value="expense" ${isEdit && tx.type === 'expense' ? 'selected' : ''}>支出 (- 人民币)</option>
        </select>
      </div>
      <div class="form-group">
        <label>交易描述标题</label>
        <input type="text" id="tx-title-inp" class="form-input" value="${isEdit ? tx.title : '转账收入-跨行汇入'}">
      </div>
      <div class="form-group">
        <label>金额 (元)</label>
        <input type="number" step="0.01" id="tx-amount-inp" class="form-input" value="${isEdit ? Math.abs(tx.amount) : '1000.00'}">
      </div>
      <div class="form-group">
        <label>对方户名 / 商户名</label>
        <input type="text" id="tx-counter-inp" class="form-input" value="${isEdit ? tx.counterparty : 'Demo Payer'}">
      </div>
      <div class="btn-row">
        ${isEdit ? `<button class="demo-bank-btn-danger" onclick="demoBankApp.deleteTxAction('${tx.id}')">删除此流水</button>` : ''}
        <button class="demo-bank-btn-primary" onclick="demoBankApp.saveTxAction('${tx ? tx.id : ''}')">确定保存</button>
      </div>
    `;

    modal.classList.add('active');
  }

  saveTxAction(txId) {
    const type = document.getElementById('tx-type-sel').value;
    const title = document.getElementById('tx-title-inp').value;
    const amount = parseFloat(document.getElementById('tx-amount-inp').value) || 0;
    const counterparty = document.getElementById('tx-counter-inp').value;

    if (txId) {
      const finalAmount = type === 'income' ? Math.abs(amount) : -Math.abs(amount);
      window.demoBankStore.updateTransaction(txId, { type, title, amount: finalAmount, counterparty });
    } else {
      window.demoBankStore.addTransaction({ type, title, amount, counterparty });
    }

    this.closeModal();
    this.renderAll();
  }

  deleteTxAction(txId) {
    if (confirm("确定要删除这条收支流水吗？")) {
      window.demoBankStore.deleteTransaction(txId);
      this.closeModal();
      this.renderAll();
    }
  }

  // === 电子回单查看 ===
  showReceiptModal(txId) {
    const data = window.demoBankStore.getData();
    const tx = data.transactions.find(t => t.id === txId);
    if (!tx) return;

    const modal = document.getElementById('common-modal');
    const titleEl = document.getElementById('modal-header-title');
    const bodyEl = document.getElementById('modal-body-content');

    titleEl.textContent = 'DemoBank Transaction Receipt';
    bodyEl.innerHTML = `
      <div style="text-align: center; border-bottom: 1px dashed #E2E8F0; padding-bottom: 16px; margin-bottom: 16px;">
        <div style="font-size: 12px; color: #64748B;">交易凭据金额</div>
        <div style="font-size: 30px; font-weight: 800; color: ${tx.type === 'income' ? '#DC2626' : '#1E293B'}; margin-top: 4px;">
          ${tx.type === 'income' ? '+' : '-'} ¥ ${this.formatMoney(Math.abs(tx.amount))}
        </div>
        <div style="font-size: 12px; color: #16A34A; margin-top: 4px; font-weight:600;">● 交易成功 (DemoBank Sandbox)</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748B;">摘要说明</span>
          <span style="font-weight: 600;">${tx.title}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748B;">对方户名/商户</span>
          <span style="font-weight: 600;">${tx.counterparty || 'DemoBank'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748B;">记账时间</span>
          <span>${tx.datetime}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748B;">凭证流水单号</span>
          <span style="font-family: monospace;">${tx.serialNo}</span>
        </div>
      </div>
      <div class="receipt-seal">
        <span>DemoBank</span>
        <span style="font-size: 8px;">电子凭条专用章</span>
      </div>
      <div class="btn-row" style="margin-top: 14px;">
        <button class="demo-bank-btn-secondary" onclick="demoBankApp.showAddTxModal('${tx.id}')">编辑修改</button>
        <button class="demo-bank-btn-danger" onclick="demoBankApp.deleteTxAction('${tx.id}')">删除此项</button>
      </div>
    `;

    modal.classList.add('active');
  }

  // === 客户参数设定 ===
  openProfileEditorModal() {
    const data = window.demoBankStore.getData();
    const modal = document.getElementById('common-modal');
    const titleEl = document.getElementById('modal-header-title');
    const bodyEl = document.getElementById('modal-body-content');

    titleEl.textContent = '设定DemoBank客户及初始参数';
    bodyEl.innerHTML = `
      <div class="form-group">
        <label>客户姓名 / 脱敏称谓</label>
        <input type="text" id="prof-name" class="form-input" value="${data.profile.name || 'Demo User'}">
      </div>
      <div class="form-group">
        <label>问候语</label>
        <input type="text" id="prof-greet" class="form-input" value="${data.profile.greeting || '晚上好'}">
      </div>
      <div class="form-group">
        <label>上次登录提示</label>
        <input type="text" id="prof-login" class="form-input" value="${data.profile.lastLogin || '2026/07/10 01:10:38'}">
      </div>
      <div class="form-group">
        <label>总资产余额 (元)</label>
        <input type="number" step="0.01" id="prof-total" class="form-input" value="${data.profile.totalAsset}">
      </div>
      <div class="btn-row">
        <button class="demo-bank-btn-primary" onclick="demoBankApp.saveProfileChanges()">保存更改</button>
      </div>
    `;

    modal.classList.add('active');
  }

  saveProfileChanges() {
    const name = document.getElementById('prof-name').value;
    const greeting = document.getElementById('prof-greet').value;
    const lastLogin = document.getElementById('prof-login').value;
    const totalAsset = parseFloat(document.getElementById('prof-total').value);

    window.demoBankStore.updateProfile({
      name,
      greeting,
      lastLogin,
      totalAsset: isNaN(totalAsset) ? 15004.28 : totalAsset,
      demandDeposit: isNaN(totalAsset) ? 15004.28 : totalAsset
    });

    this.closeModal();
    this.renderAll();
  }

  closeModal() {
    const modal = document.getElementById('common-modal');
    if (modal) modal.classList.remove('active');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.demoBankApp = new DemoBankAppController();
});
