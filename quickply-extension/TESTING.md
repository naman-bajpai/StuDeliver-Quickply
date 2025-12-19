# Testing the JobFill Extension

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **Chrome/Edge browser** (for testing the extension)
3. **Supabase account** (for authentication)

## Setup Steps

### 1. Install Dependencies

```bash
cd quickply-extension
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the "Project URL" and "anon/public" key
- Paste them into your `.env` file

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Build the Extension

```bash
npm run build
```

This will:
- Compile TypeScript
- Bundle the extension
- Create a `dist` folder with all the extension files

### 4. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist` folder from your project directory:
   ```
   /Users/namanbajpai/Desktop/Quickply/quickply-extension/dist
   ```
5. The extension should now appear in your extensions list

### 5. Test the Extension

#### A. Test Authentication (Options Page)

1. Click the extension icon in your browser toolbar
2. If not signed in, click "Open Options" or right-click the extension icon → "Options"
3. In the Options page:
   - Sign up with a new account (or sign in if you have one)
   - Fill in your personal information (name, email, phone, address, etc.)
   - Click "Save Information"

#### B. Test Form Filling

1. Navigate to any website with a form (e.g., a job application form)
2. Click the extension icon in your browser toolbar
3. Click **"Fill Current Page"** button
4. The extension should automatically fill in matching form fields

#### C. Test Field Extraction (Optional)

You can test field extraction by:
1. Opening the browser console (F12)
2. Navigate to a page with a form
3. The content script should log: "JobFill content script loaded"
4. You can manually test extraction by sending a message (advanced)

## Troubleshooting

### Extension not loading
- Make sure you selected the `dist` folder, not the root folder
- Check the browser console for errors (F12 → Console tab)
- Verify `manifest.json` is in the `dist` folder

### Authentication not working
- Verify your `.env` file has the correct Supabase credentials
- Check that environment variables are loaded (rebuild after changing `.env`)
- Open browser DevTools → Console to see any error messages

### Form filling not working
- Make sure you've saved your information in the Options page
- Check that the form fields have recognizable names/ids (e.g., "firstName", "email")
- Open browser DevTools → Console to see any errors

### Rebuilding after changes
- After making code changes, run `npm run build` again
- In Chrome extensions page, click the **reload** icon (🔄) on your extension card
- Or remove and re-add the extension

## Development Mode (Optional)

For faster development with hot reload, you can use:

```bash
npm run dev
```

However, note that Vite dev server is for web apps, not extensions. For extension development, you'll need to:
1. Make changes to source files
2. Run `npm run build`
3. Reload the extension in Chrome

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Options page opens and displays correctly
- [ ] Can sign up/create account
- [ ] Can sign in with existing account
- [ ] Can save user information
- [ ] Popup displays when clicking extension icon
- [ ] Form filling works on a test page
- [ ] Extension persists data after browser restart

## Example Test Form

You can create a simple HTML file to test form filling:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Form</title>
</head>
<body>
    <form>
        <label>First Name: <input name="firstName" type="text"></label><br>
        <label>Last Name: <input name="lastName" type="text"></label><br>
        <label>Email: <input name="email" type="email"></label><br>
        <label>Phone: <input name="phone" type="tel"></label><br>
        <label>Address: <input name="address" type="text"></label><br>
        <label>City: <input name="city" type="text"></label><br>
        <label>State: <input name="state" type="text"></label><br>
        <label>Zip Code: <input name="zipCode" type="text"></label><br>
        <button type="submit">Submit</button>
    </form>
</body>
</html>
```

Save this as `test-form.html` and open it in your browser to test the extension.

