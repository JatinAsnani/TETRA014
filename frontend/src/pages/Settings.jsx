import { useState } from 'react';
import Topbar from '../components/Topbar.jsx';

export default function Settings() {
  const [form, setForm] = useState({
    name: 'Ramesh Sharma',
    businessName: 'Sharma General Store',
    phone: '9876543210',
    gstin: '24ABCDE1234F1Z5',
    fy: '2024-25',
    address: '12, Market Road, Ahmedabad, Gujarat - 380001',
  });

  const [saved, setSaved] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section className="view" id="view-settings">
      <div className="settings-container">
        <Topbar title="Store Settings" />
        
        <p className="settings-subtitle">
          Manage your business profile, GSTIN tax identifiers, and general ledger configuration.
        </p>

        {saved && (
          <div className="banner" style={{ background: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.3)', color: '#34D399', textAlign: 'center', fontWeight: 600, marginBottom: 20 }}>
            ✓ Store settings updated successfully!
          </div>
        )}

        <div className="card form-card card-pad">
          <div className="section-title" style={{ padding: '0 0 18px', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            ⚙️ Business &amp; Store Profile
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Store Owner / Admin Name</label>
              <input value={form.name} onChange={update('name')} required />
            </div>

            <div className="form-row">
              <label>Registered Business Name</label>
              <input value={form.businessName} onChange={update('businessName')} required />
            </div>

            <div className="form-grid-2">
              <div className="form-row">
                <label>Contact Phone</label>
                <input value={form.phone} onChange={update('phone')} required />
              </div>

              <div className="form-row">
                <label>GSTIN Tax Number</label>
                <input value={form.gstin} onChange={update('gstin')} className="mono" required />
              </div>
            </div>

            <div className="form-row">
              <label>Current Financial Year</label>
              <input value={form.fy} onChange={update('fy')} className="mono" required />
            </div>

            <div className="form-row">
              <label>Registered Business Address</label>
              <textarea value={form.address} onChange={update('address')} rows={3} required />
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button type="submit" className="btn" style={{ minWidth: 200, justifyContent: 'center' }}>
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
