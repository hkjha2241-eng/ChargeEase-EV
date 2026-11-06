/**
 * ChargeEase EV - Digital Wallet & UPI Engine
 * Instant top-up presets, mock UPI gateway flow (GPay, PhonePe, Paytm, BHIM),
 * and itemized transaction ledger.
 */

class WalletEngine {
  constructor() {
    this.balance = 840.00;
    this.transactions = [
      {
        id: 'TXN-9021',
        type: 'CREDIT',
        title: 'UPI Top-up (Google Pay)',
        amount: 500.00,
        date: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        reference: 'UPI/6382910281/SBIN'
      },
      {
        id: 'TXN-8842',
        type: 'DEBIT',
        title: 'Charging Session @ Koramangala 4th Block',
        amount: 86.25,
        energyKwh: 6.9,
        date: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
        reference: 'CE-SESSION-4821'
      },
      {
        id: 'TXN-8510',
        type: 'CREDIT',
        title: 'UPI Top-up (PhonePe)',
        amount: 1000.00,
        date: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
        reference: 'UPI/9920182736/HDFC'
      }
    ];
    this.listeners = [];
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.balance, this.transactions));
  }

  async topUp(amount, provider = 'Google Pay') {
    soundEngine.click();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return false;

    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, provider })
      });
      if (res.ok) {
        const data = await res.json();
        this.balance = data.balance;
        this.transactions.unshift(data.transaction);
        soundEngine.success();
        this.notify();
        return true;
      }
    } catch (e) {
      // Offline fallback
    }

    this.balance += parsed;
    this.transactions.unshift({
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'CREDIT',
      title: `UPI Top-up (${provider})`,
      amount: parsed,
      date: new Date().toISOString(),
      reference: `UPI/${Math.floor(1000000000 + Math.random() * 9000000000)}/HDFC`
    });
    soundEngine.success();
    this.notify();
    return true;
  }

  async deductSession(totalAmount, energyKwh, stationName) {
    const amount = parseFloat(totalAmount) || 0;
    try {
      const res = await fetch('/api/charge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount: amount, energyKwh, stationName })
      });
      if (res.ok) {
        const data = await res.json();
        this.balance = data.remainingBalance;
        this.transactions.unshift(data.transaction);
        this.notify();
        return data.invoiceNumber;
      }
    } catch (e) {
      // Local fallback
    }

    this.balance = Math.max(0, this.balance - amount);
    const invoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    this.transactions.unshift({
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'DEBIT',
      title: `Charging Session @ ${stationName}`,
      amount: amount,
      energyKwh: energyKwh,
      date: new Date().toISOString(),
      reference: invoiceNum
    });
    this.notify();
    return invoiceNum;
  }
}

const walletEngine = new WalletEngine();

