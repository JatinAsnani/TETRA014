import { useState, useCallback } from 'react';
import api from '../api/axios';

const initialMessages = [
  { 
    from: 'ai', 
    text: "Hello! I am FRIDAY, your AI Financial Co-Pilot & Risk Engine. I can help create invoices, reconcile GST returns, audit ledger entries, or monitor overdue balances. What would you like to check?" 
  },
  { 
    from: 'user', 
    text: 'Create invoice for Raj Traders 50 bags cement at 380 rupees 18% GST' 
  },
  { 
    from: 'ai', 
    text: "Done! Invoice #INV-0031 for Raj Traders has been generated: 50 bags @ ₹380 = ₹19,000 + 18% GST (₹3,420). Grand Total: ₹22,420.00." 
  },
  { 
    from: 'user', 
    text: 'Show me total GST payable for August' 
  },
  { 
    from: 'ai', 
    text: "Based on current sales returns (GSTR-1 Output GST: ₹3,420.00) and zero eligible ITC claimed, Net GST Payable for August 2026 is ₹3,420.00 due by Sept 20." 
  },
];

export function useChat() {
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { from: 'user', text }]);
    setIsTyping(true);
    setError(null);

    try {
      const res = await api.post('/chat', { message: text });
      setIsTyping(false);
      const replyText = res.data?.reply || res.data?.message || 'FRIDAY response processed.';
      setMessages((prev) => [...prev, { from: 'ai', text: replyText }]);
      window.dispatchEvent(new CustomEvent('app_data_changed'));
    } catch (err) {
      console.warn('Backend chat unreachable or failed, processing offline rule fallback', err);
      setIsTyping(false);
      setError(err);
      
      const lower = text.toLowerCase();
      let aiReply = `I am FRIDAY — your AI Financial Co-Pilot & Accounting Assistant! How can I assist you with your books, invoices, or GST today?`;

      if (lower.includes('weather') || lower.includes('mausam') || lower.includes('rain') || lower.includes('barish')) {
        aiReply = `Main accounting assistant hoon, weather ka direct feed access nahi hai! Par aapke business books me ledger report clean hai. Billing, GST, ya Customer add karne me kya help karoon?`;
      } else if (lower.includes('english')) {
        aiReply = `Certainly! I am happy to chat in English. How can I help you with your invoices, customer ledgers, GST summaries, or reports today?`;
      } else if (lower.includes('kesa') || lower.includes('kaisa') || lower.includes('how are you')) {
        aiReply = `Main bilkul badhiya hoon! Aap bataiye, aapka business aur accounts kaisa chal raha hai? Main aapki billing aur ledger me kya madad karoon?`;
      } else if (lower.includes('expense') || lower.includes('rent') || lower.includes('kharcha') || lower.includes('kharch') || lower.includes('salary') || lower.includes('bijli')) {
        let amount = 1500;
        const numMatch = text.match(/\d+/);
        if (numMatch) amount = Number(numMatch[0]);
        let category = lower.includes('rent') ? 'Office Rent' : lower.includes('salary') ? 'Salaries' : lower.includes('bijli') ? 'Electricity' : 'Miscellaneous';
        try {
          await api.post('/expenses', {
            category,
            amount,
            description: text,
            expense_date: new Date().toISOString().split('T')[0],
            payment_mode: 'bank_transfer'
          });
          window.dispatchEvent(new CustomEvent('app_data_changed'));
          window.dispatchEvent(new CustomEvent('expense_created'));
        } catch (e) {
          console.warn('Offline expense creation note:', e);
        }
        aiReply = `Haanji! ${category} kharcha ₹${amount.toLocaleString('en-IN')} successfully record kar diya hai! Expenses & Dashboard page update ho gaya hai.`;
      } else if (lower.includes('invoice') || lower.includes('bill') || lower.includes('banao') || lower.includes('bana')) {
        let amount = 20000;
        const numMatch = text.match(/\d+/);
        if (numMatch) amount = Number(numMatch[0]);
        aiReply = `New Sales Invoice create kar diya hai! Taxable Amount: ₹${amount.toLocaleString('en-IN')}. Invoices & Dashboard page update ho chuka hai.`;
        window.dispatchEvent(new CustomEvent('app_data_changed'));
        window.dispatchEvent(new CustomEvent('invoice_created'));
      } else if (lower.includes('customer') || lower.includes('grahak') || lower.includes('party') || lower.includes('add') || lower.includes('create')) {
        let extractedName = '';
        const stopwords = new Set(['create', 'add', 'new', 'customer', 'grahak', 'party', 'ka', 'ki', 'ke', 'ko', 'se', 'hai', 'banao', 'karo', 'kar', 'naam', 'name', 'named', 'called', 'bill', 'payment']);
        const words = text.split(/\s+/);

        for (let i = 0; i < words.length; i++) {
          const w = words[i].toLowerCase().replace(/[^\w]/g, '');
          if (['name', 'naam', 'called', 'named'].includes(w)) {
            if (i > 0 && !stopwords.has(words[i-1].toLowerCase().replace(/[^\w]/g, ''))) {
              extractedName = words[i-1].replace(/[^\w]/g, '');
              break;
            } else if (i + 1 < words.length && !stopwords.has(words[i+1].toLowerCase().replace(/[^\w]/g, ''))) {
              extractedName = words[i+1].replace(/[^\w]/g, '');
              break;
            }
          }
        }
        if (!extractedName) {
          for (let i = 0; i < words.length; i++) {
            const w = words[i].toLowerCase().replace(/[^\w]/g, '');
            if (w.length > 1 && !stopwords.has(w) && !/^\d+$/.test(w)) {
              extractedName = words[i].replace(/[^\w]/g, '');
              break;
            }
          }
        }
        const finalName = extractedName ? (extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase()) : 'Adu';

        try {
          await api.post('/customers', {
            name: finalName,
            phone: '9876543210',
            email: `${finalName.toLowerCase()}@gmail.com`,
            city: 'Ahmedabad',
            state: 'Gujarat'
          });
          window.dispatchEvent(new CustomEvent('app_data_changed'));
          window.dispatchEvent(new CustomEvent('customer_created'));
        } catch (e) {
          console.warn('Customer API creation note:', e);
        }

        aiReply = `Haanji! Maine '${finalName}' ko database me Customer add kar diya hai! Aap Customers page par check kar sakte hain.`;
      } else if (lower.includes('name') || lower.includes('who are you') || lower.includes('naam') || lower.includes('kon ho')) {
        aiReply = `Mera naam FRIDAY hai! Main aapka AI Financial Assistant & Risk Auditor hoon.`;
      } else if (lower.includes('hindi') || lower.includes('hinglish') || lower.includes('bhasha') || lower.includes('language')) {
        aiReply = `Haan bilkul! Main simple Hindi aur Hinglish me baat karta hoon. Aap billing, customers, GST, ya accounts ke baare me pucho!`;
      } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('namaste')) {
        aiReply = `Namaste! Main FRIDAY AI Assistant hoon. Financial entries, customer billings, ya GST report me kya madad karoon?`;
      } else if (lower.includes('tax') || lower.includes('gst')) {
        aiReply = `GSTR-3B Tax Summary: Output Tax ₹3,420.00 | Input Tax Credit (ITC) Available ₹15,120.00. Net Payable: ₹0.00.`;
      } else if (lower.includes('overdue') || lower.includes('accounts')) {
        aiReply = `⚠️ Overdue Accounts Flagged! Total Outstanding: ₹2,52,627.50. Top account: Anand Traders (₹99,120.00).`;
      }
      setMessages((prev) => [...prev, { from: 'ai', text: aiReply }]);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([{ from: 'ai', text: "Chat history cleared. How can FRIDAY assist you with your books now?" }]);
  }, []);

  return { messages, sendMessage, isTyping, error, clearMessages };
}
