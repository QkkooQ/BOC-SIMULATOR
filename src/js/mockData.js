/**
 * DemoBank UI Simulator - entirely fictional demonstration data.
 */

const DEFAULT_DEMO_DATA = {
  profile: {
    name: "Demo User",
    greeting: "晚上好",
    lastLogin: "2026/07/10 01:10:38",
    avatarMascot: "demo-bank-doll",
    vipLevel: "大众客户",
    totalAsset: 15004.28,
    yesterdayProfit: "0.15",
    totalLiability: 0.00,
    demandDeposit: 15004.28,
    structuredDeposit: 0.00,
    hideNumbers: false
  },
  cards: [
    {
      id: "card-debit-101",
      type: "debit",
      typeName: "DemoBank Debit Card",
      cardNumber: "DEMO-****-****-0001",
      balance: 15004.28,
      currency: "人民币元",
      theme: "demo-bank-debit-real",
      status: "正常",
      bankName: "DemoBank"
    }
  ],
  transactions: [
    {
      id: "tx-20260224-01",
      title: "跨行汇入-转账收入",
      type: "income",
      amount: 7000.00,
      datetime: "2026-02-24 14:32:18",
      counterparty: "Demo Payer",
      cardId: "card-debit-101",
      balanceAfter: 15004.28,
      serialNo: "DemoBank202602241432188901"
    },
    {
      id: "tx-20260218-02",
      title: "DemoPay wallet transfer",
      type: "income",
      amount: 8000.00,
      datetime: "2026-02-18 09:20:05",
      counterparty: "DemoPay Network",
      cardId: "card-debit-101",
      balanceAfter: 8004.28,
      serialNo: "DemoBank202602180920053312"
    },
    {
      id: "tx-20260101-03",
      title: "个人活期存款结息",
      type: "income",
      amount: 4.28,
      datetime: "2026-01-01 06:00:00",
      counterparty: "DemoBank Clearing Center",
      cardId: "card-debit-101",
      balanceAfter: 4.28,
      serialNo: "DemoBank202601010600000102"
    }
  ]
};

const STORAGE_KEY = 'demo_bank_ui_v1';

class DemoBankStore {
  constructor() {
    this.data = this.load();
    this.recalculateRunningBalances();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  }

  getData() {
    return this.data;
  }

  toggleHideNumbers() {
    this.data.profile.hideNumbers = !this.data.profile.hideNumbers;
    this.save();
    return this.data.profile.hideNumbers;
  }

  updateProfile(profileData) {
    this.data.profile = { ...this.data.profile, ...profileData };
    this.save();
  }

  addCard(card) {
    const newCard = {
      id: "card-" + Date.now(),
      type: card.type || "debit",
      typeName: card.typeName || "DemoBank Debit Card",
      cardNumber: card.cardNumber || "DEMO-****-****-" + String(Math.floor(1 + Math.random() * 9999)).padStart(4, "0"),
      balance: parseFloat(card.balance) || 0.00,
      currency: "人民币元",
      theme: card.theme || "demo-bank-debit-real",
      status: "正常",
      bankName: "DemoBank"
    };
    this.data.cards.push(newCard);
    this.recalculateTotalAsset();
    this.recalculateRunningBalances();
    this.save();
    return newCard;
  }

  updateCard(cardId, updateData) {
    const idx = this.data.cards.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      this.data.cards[idx] = { ...this.data.cards[idx], ...updateData };
      this.recalculateTotalAsset();
      this.recalculateRunningBalances();
      this.save();
    }
  }

  deleteCard(cardId) {
    this.data.cards = this.data.cards.filter(c => c.id !== cardId);
    this.recalculateTotalAsset();
    this.recalculateRunningBalances();
    this.save();
  }

  addTransaction(tx) {
    const amountNum = parseFloat(tx.amount) || 0;
    const isIncome = tx.type === 'income';
    const finalAmount = isIncome ? Math.abs(amountNum) : -Math.abs(amountNum);

    const targetCard = this.data.cards.find(c => c.id === (tx.cardId || (this.data.cards[0] && this.data.cards[0].id)));
    if (targetCard) {
      targetCard.balance += finalAmount;
    }

    const newTx = {
      id: "tx-" + Date.now(),
      title: tx.title || (isIncome ? "跨行汇入-转账收入" : "快捷支付-消费支出"),
      type: isIncome ? "income" : "expense",
      amount: finalAmount,
      datetime: tx.datetime || new Date().toISOString().replace('T', ' ').substring(0, 19),
      counterparty: tx.counterparty || "DemoBank特约商户",
      cardId: targetCard ? targetCard.id : "",
      balanceAfter: targetCard ? targetCard.balance : finalAmount,
      serialNo: "DemoBank" + Date.now()
    };

    this.data.transactions.unshift(newTx);
    this.recalculateTotalAsset();
    this.recalculateRunningBalances();
    this.save();
    return newTx;
  }

  updateTransaction(txId, updateData) {
    const idx = this.data.transactions.findIndex(t => t.id === txId);
    if (idx !== -1) {
      const tx = this.data.transactions[idx];
      const targetCard = this.data.cards.find(c => c.id === tx.cardId);

      // Revert old transaction effect on card balance
      if (targetCard) {
        targetCard.balance -= tx.amount;
      }

      // Compute new amount
      const amountNum = parseFloat(updateData.amount) || 0;
      const isIncome = updateData.type === 'income';
      const finalAmount = isIncome ? Math.abs(amountNum) : -Math.abs(amountNum);

      // Apply new transaction effect on card balance
      if (targetCard) {
        targetCard.balance += finalAmount;
      }

      // Update tx fields
      this.data.transactions[idx] = {
        ...tx,
        ...updateData,
        amount: finalAmount
      };

      this.recalculateTotalAsset();
      this.recalculateRunningBalances();
      this.save();
    }
  }

  deleteTransaction(txId) {
    const tx = this.data.transactions.find(t => t.id === txId);
    if (tx) {
      const targetCard = this.data.cards.find(c => c.id === tx.cardId);
      if (targetCard) {
        targetCard.balance -= tx.amount; // Revert the transaction effect!
      }
      this.data.transactions = this.data.transactions.filter(t => t.id !== txId);
      this.recalculateTotalAsset();
      this.recalculateRunningBalances();
      this.save();
    }
  }

  recalculateRunningBalances() {
    this.data.cards.forEach(card => {
      // Find all transactions for this card
      const cardTxs = this.data.transactions
        .filter(t => t.cardId === card.id)
        .sort((a, b) => new Date(b.datetime) - new Date(a.datetime)); // newest first

      let running = card.balance;
      cardTxs.forEach(tx => {
        tx.balanceAfter = running;
        running -= tx.amount;
      });
    });
  }

  recalculateTotalAsset() {
    let sum = 0;
    this.data.cards.forEach(c => {
      if (c.type !== 'credit') {
        sum += parseFloat(c.balance) || 0;
      }
    });
    this.data.profile.totalAsset = sum;
    this.data.profile.demandDeposit = sum;
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA));
    this.save();
    return this.data;
  }
}

window.demoBankStore = new DemoBankStore();
