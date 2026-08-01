# TallAI — AI Accounting + Invoice Risk Scanner (React/JSX)

This is the same TallAI dashboard you had as one big HTML file, split into a
proper multi-page React app. Every sidebar section is now its own page/route.

## Structure

```
src/
  main.jsx              entry point (mounts <App/> inside a router)
  App.jsx                shell layout (sidebar + routes)
  index.css               all the original styling (unchanged classnames)
  components/
    Sidebar.jsx            left nav, highlights the active route
    Topbar.jsx              reusable page header ("Sharma General Store | Logout")
    SalesChart.jsx           the Sales vs Expenses SVG bar chart
  pages/
    Dashboard.jsx            /
    AIChat.jsx                /chat
    Invoices.jsx               /invoices
    ScanExtract.jsx             /scan
    Reconciliation.jsx           /recon
    AuditTrail.jsx                 /audit
    Expenses.jsx                    /expenses
    Customers.jsx                    /customers
    Vendors.jsx                       /vendors
    Payments.jsx                       /payments
    Ledger.jsx                          /ledger
    Stock.jsx                            /stock
    Reports.jsx                           /reports
    GST.jsx                                /gst
    Settings.jsx                            /settings
```

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Notes

- Navigation uses `react-router-dom` instead of the old `showView()` JS
  function — clicking a sidebar item actually changes the URL now.
- All the CSS classnames from the original file are untouched, so the look
  is identical; `index.css` is imported once in `main.jsx`.
- Data (invoices, customers, etc.) is hardcoded as arrays at the top of each
  page file — swap these for real API calls whenever you're ready.
- `Settings.jsx` and `AIChat.jsx` are wired up with `useState` so the fields
  and chat input are actually interactive (the rest are static mockups, same
  as the original).
