# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cnfVP-qnWHuxuZKN0SI9WDLuiZ_4pC12

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## UI Components

The app includes a comprehensive set of reusable UI components for consistent loading and empty states:

- **LoadingState**: Branded loading indicators with contextual messages
- **EmptyState**: Informative empty states with optional actions
- **SkeletonCard**: Layout-matching loading placeholders

For detailed documentation, see [UI_COMPONENTS_GUIDE.md](./UI_COMPONENTS_GUIDE.md).
