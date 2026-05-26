# RanchoAP Fix Notes

This version addresses the reported issues:

1. **Admin menu editing**
   - Admin users now see **Edit menu** in the left sidebar.
   - Admin can add, rename, delete, and lock main menu items and sub-items.
   - Navigation is saved in Firestore at `settings/navigation`.

2. **Schedule persistence**
   - Schedules are now stored as one Firestore document per date under `schedules/{YYYY-MM-DD}`.
   - This avoids schedule data disappearing after re-login or refresh.

3. **Refresh / 404 / logout**
   - The app now uses `HashRouter`, so page refreshes on free static hosting should not show a 404.
   - A `/logout` route and signed-out page were added.

4. **File upload**
   - Admin can upload multiple files at once.
   - Supported types include PDF, Excel, Word, TXT, Markdown, CSV, PNG, JPG, JPEG.

5. **Markdown images**
   - In the Markdown editor, click **Insert image**.
   - The image uploads to Firebase Storage and inserts Markdown automatically:
     `![filename](download-url)`

6. **Markdown highlights and comments**
   - Open a Markdown page.
   - Select text in the rendered page.
   - Add a comment in the right-side **Highlights & comments** panel.
   - Highlights/comments are saved in Firestore under `markdownHighlights/{markdownId}/items`.

7. **Proposals for every sub-item**
   - The **Proposals** tab now appears on every sub-item, not only Manual pages.

8. **UI polish**
   - Added more Apple-like glass panels, cleaner sidebar, polished cards, reader layout, upload area, and highlight panel.

9. **Grammar correction**
   - `Discuss Board` was corrected to **Discussion Board**.

## Run locally on macOS

```bash
cd ranchoap-main
npm install
npm run dev
```

Then open the local URL shown in Terminal, usually:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Free deployment options

Recommended free static hosting:

- Firebase Hosting
- Netlify
- GitHub Pages
- Cloudflare Pages

Because this version uses `HashRouter`, refresh behavior is safer on all free static hosts.
