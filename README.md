# This product is wip, do not use it will not work
# MAIRE Setup Guide

## Quick Start

### 1. Start the Go Backend

```bash
# In the project root directory
go run main.go
```

The backend will start on `http://localhost:8080`

### 2. Start the React Frontend

```bash
# In the project root directory
npm install
npm run dev
```

The frontend will start on `http://localhost:3000` and automatically proxy API requests to the backend.

## Testing with Stubs (No API Keys)

The system works out of the box with stub responses! You don't need any API keys to test the topology features.

### What Happens Without API Keys:
- Models will use local stubs that simulate responses
- You can test all three topologies: Standard Chain, Double Helix, and Star Topology
- Each stub includes a truncated version of your prompt for verification

## Using Real LLM APIs (Optional)

To use real LLM models, set these environment variables:

```bash
# For Grok (via OpenRouter with Llama 3.1)
export OPENROUTER_API_KEY="your-key-here"

# For Claude (via Hugging Face with Mixtral)
export HF_API_KEY="your-key-here"

# For GPT-4 (via Google Gemini 1.5 Flash)
export GOOGLE_API_KEY="your-key-here"
```

Then restart the Go backend:
```bash
go run main.go
```

## How It Works

### Topology Selection
- **Standard Chain**: Models process sequentially, each building on the previous output
- **Double Helix**: Two parallel passes (forward and reverse) run simultaneously
- **Star Topology**: Multiple independent reasoning arms process in parallel

### Model Configuration
- Toggle models on/off with the switches
- Drag to reorder models (affects processing order in Standard Chain)
- The backend automatically detects which models have API keys configured

### Reasoning Chain Audit
- Click "Reasoning Chain" to expand the full audit trail
- Each layer can be individually expanded to see the full response
- Responses automatically wrap for readability
- Immutable timestamp and ledger tracking

## Architecture

```
React Frontend (localhost:3000)
    ↓ (proxied)
Vite Dev Server
    ↓ /maire/* requests
Go Backend (localhost:8080)
    ↓
Real APIs or Stubs
```

The Vite proxy eliminates CORS issues during development by making the browser think all requests are same-origin.

## Troubleshooting

### Backend not responding
- Ensure Go backend is running: `go run main.go`
- Check it's on port 8080: `curl http://localhost:8080/maire/models`

### Frontend can't connect
- Ensure `vite.config.ts` has the proxy configuration
- Restart the dev server after config changes: `npm run dev`

### Models show as stubs
- This is normal! Set environment variables for real API access
- Stubs are perfect for testing the UI and topology features

## Development Tips

1. **Test Topologies**: Try each topology with the same prompt to see different reasoning patterns
2. **Audit Trails**: Expand individual layers to inspect how each model contributed
3. **Model Order**: In Standard Chain, reorder models to see how sequence affects output
4. **Parallel Processing**: Star Topology shows multiple independent reasoning paths

## Next Steps

- Add more model providers in `main.go`
- Customize topology algorithms
- Add visualization of reasoning paths
- Implement response synthesis across multiple models


  # Chatbot Interface Design

  This is a code bundle for Chatbot Interface Design. The original project is available at https://www.figma.com/design/R3gCM5qBc0DgEyKfeHCE1U/Chatbot-Interface-Design.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
