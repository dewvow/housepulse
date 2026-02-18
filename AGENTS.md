# Agent Notes

## Debugging Bookmarklets

When debugging bookmarklets that extract data from websites (like realestate.com.au), note that:

- The user can paste HTML content directly for analysis
- This is useful when:
  - The website blocks automated fetching (429 errors)
  - The content requires authentication
  - The DOM structure needs to be inspected

## Workflow

1. If fetching fails, ask the user to paste the relevant HTML
2. Use the pasted HTML to debug extraction logic
3. Update the bookmarklet code accordingly

## Bookmarklet Updates

**IMPORTANT**: When updating `public/bookmarklet.js`, you MUST also update `INSTRUCTIONS.md`:

1. Minify the bookmarklet code using:
   ```bash
   cat public/bookmarklet.js | tr '\n' ' ' | sed 's/  */ /g' | sed 's/\/\*[^*]*\*\+\([^\/][^*]*\*\+\)*\// /g' | sed 's/  */ /g'
   ```
2. Replace the bookmarklet code in INSTRUCTIONS.md (after "URL: Copy and paste this entire line:")
3. The INSTRUCTIONS.md contains the minified bookmarklet that users copy-paste
4. Keep both files in sync so users get the latest version
