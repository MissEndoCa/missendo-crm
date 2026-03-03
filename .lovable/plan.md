

## Fix Ad Performance Dashboard: Currency & Date Range Issues

### Problem Analysis

1. **Currency**: The dashboard hardcodes `$` in `formatCurrency`, but the ad account uses TL (Turkish Lira). Facebook API returns spend/cpc values in the ad account's native currency, so we need to fetch the account's currency and display it correctly.

2. **Last 30 days returning no data**: The campaign appears to be newly created (today). Facebook's `last_30d` preset should still return today's data, but there may be edge cases. The fix is to also request `time_increment=1` or use `time_range` with explicit dates as a fallback approach. More importantly, we should add pagination support since Facebook may return data across multiple pages.

### Changes

#### 1. Edge Function (`fetch-ad-insights/index.ts`)
- Fetch the ad account's currency via `GET /{adAccountId}?fields=currency` before fetching insights
- Return the `currency` field alongside `campaigns` in the response
- Add pagination: follow `fbData.paging.next` to collect all results

#### 2. Frontend (`AdPerformanceDashboard.tsx`)
- Accept `currency` from the API response and store it in state
- Replace hardcoded `$` in `formatCurrency` with the actual currency symbol (e.g., `TL` for TRY, using `Intl.NumberFormat` or a simple mapping)
- Update all places that display monetary values: Spend summary card, Avg CPC card, table cells, chart tooltips

### Technical Details

**Currency mapping approach**: Use `Intl.NumberFormat` with `style: 'currency'` and the ISO currency code returned by Facebook (e.g., `TRY` for Turkish Lira). This automatically handles symbol placement and formatting.

**Edge function currency fetch**:
```
GET https://graph.facebook.com/v21.0/{adAccountId}?fields=currency&access_token=...
```
Returns `{ "currency": "TRY", "id": "act_xxx" }`.

**Pagination fix**: After the initial fetch, check `fbData.paging?.next` and follow it to get all campaign data pages, merging results.

