# Google Sheets Contact Intake Setup

This package connects the website contact form to a Google Sheet and creates a private dashboard inside that same spreadsheet.

## What It Creates

- `Leads` sheet for raw submissions
- `Dashboard` sheet with:
  - total submissions
  - unique email addresses
  - submissions in the last 30 days
  - submissions by topic
  - submission trend over time
  - recent leads
- an email notification for each submission sent to the script owner email by default

## Data Columns

The `Leads` sheet stores these columns:

1. `Submitted At`
2. `First Name`
3. `Last Name`
4. `Email`
5. `Topic`
6. `Message`
7. `Page URL`
8. `Source`

## Recommended Setup

1. Create a new Google Sheet for your contact leads.
2. Open the sheet, then go to `Extensions -> Apps Script`.
3. Replace the default script with the contents of [`Code.js`](./Code.js).
4. Replace the manifest with [`appsscript.json`](./appsscript.json).
5. Leave `CONFIG.spreadsheetId` empty if the script is bound to that sheet.
   If you use a standalone Apps Script project instead, paste your target Google Sheet ID into `CONFIG.spreadsheetId`.
   If you want notifications sent to a different inbox, set `CONFIG.notificationEmail` to that address.
6. Run `setupContactWorkbook()` once from the Apps Script editor.
   Google will ask you to authorize spreadsheet access the first time.
7. Confirm the sheet now contains `Leads` and `Dashboard` tabs.
8. Run `sendTestNotification()` once so Google can authorize the mail permission and you can confirm notification emails arrive.
9. Click `Deploy -> New deployment`.
10. Choose `Web app`.
11. Set:
    - Execute as: `Me`
    - Who has access: `Anyone`
12. Deploy and copy the web app URL.
13. In [`index.html`](/Users/gab/Desktop/test-gpt-clonewebsites/index.html), replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` on the `#contact-form` element with that deployed URL.
14. Publish the updated website.
15. If Apps Script asks for new authorization later, approve the mail permission too so notification emails can be sent.

## Testing

1. Submit the contact form once from the website.
2. Confirm the visitor sees a success message instead of an email app opening.
3. Confirm one new row appears in `Leads`.
4. Confirm the `Dashboard` totals and charts update.
5. Test a second submission with a different topic so the topic chart changes.

## Maintenance

- If you change the contact topics on the website, update `CONFIG.allowedTopics` in `Code.js` to match.
- If you want to rebuild the dashboard layout later, run `refreshContactDashboard()`.
