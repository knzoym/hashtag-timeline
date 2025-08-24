// src/styles/appStyles.js

export const createappStyles = () => ({
  app: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "white",
    overflow: "hidden",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  mainContent: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
});
