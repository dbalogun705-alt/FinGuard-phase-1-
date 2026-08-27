# Server

The dashboard currently talks directly to the **live backend** maintained by
the backend team:

- Base URL: `https://finguard-api-n71k.onrender.com/api`
- API docs: https://documenter.getpostman.com/view/2449601/2sBYAsyCFz

No server code lives here yet. The frontend integration is in
[`../javascript/api.js`](../javascript/api.js).

## Open items with the backend team

- No email / phone verification (OTP) endpoint — `verify.html` is UI-only.
- No dedicated cashflow-buffer endpoint or agreed formula — the buffer figure
  on the dashboard is still static / a provisional client estimate.
- No "get my financial profile" route without an id — the frontend stores the
  profile id returned by `POST /financial-profile` in `localStorage`.
