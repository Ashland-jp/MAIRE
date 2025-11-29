package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

// === DATA STRUCTURES ===

type Layer struct {
	Model    string `json:"model"`    // The user-facing model name/ID
	Response string `json:"response"` // The LLM's response
}

type req struct {
	OriginalPrompt string            `json:"original_prompt"`
	Topology       string            `json:"topology"`
	Models         []string          `json:"models"`
	ApiKeys        map[string]string `json:"api_keys"`
}

type resp struct {
	FinalResponse string  `json:"final_response"`
	HeaderStack   []Layer `json:"header_stack"`
}

type ModelProvider struct {
	ID              string
	Name            string
	CallFunc        func(prompt, apiKey, modelName string) string
	UnderlyingModel string
}

// === MODEL CONFIGURATION ===

var modelProviders = map[string]ModelProvider{
	"grok": {
		ID:              "grok",
		Name:            "Grok (Llama 3.1)",
		CallFunc:        callOpenRouter,
		UnderlyingModel: "meta-llama/llama-3.1-8b-instruct",
	},
	"gpt-4": {
		ID:              "gpt-4",
		Name:            "GPT-4 (Gemini Flash)",
		CallFunc:        callGoogleAI,
		UnderlyingModel: "gemini-1.5-flash",
	},
	"claude": {
		ID:              "claude",
		Name:            "Claude (Mixtral)",
		CallFunc:        callHuggingFace,
		UnderlyingModel: "mistralai/Mixtral-8x7B-Instruct-v0.1",
	},
}

// === UTILITIES ===

func calculateHash(content string) string {
	hash := sha256.Sum256([]byte(content))
	return hex.EncodeToString(hash[:])[:12] // Short hash for readability
}

// generateRingPath creates the [1-2-3-2-1] topology for a specific start index
func generateRingPath(startIdx int, totalModels int, modelIDs []string) []string {
	path := []string{}

	// Forward pass (Start -> Next -> Next)
	curr := startIdx
	for i := 0; i < totalModels; i++ {
		path = append(path, modelIDs[curr])
		curr = (curr + 1) % totalModels // Circular ring topology
	}

	// Backward pass (Retrace steps, skipping the peak)
	// Example: If forward is [A, B, C], we add [B, A]
	for i := len(path) - 2; i >= 0; i-- {
		path = append(path, path[i])
	}
	
	return path
}

func reverse(s []string) []string {
	r := make([]string, len(s))
	for i, v := range s {
		r[len(s)-1-i] = v
	}
	return r
}

func escape(input string) string {
	escaped := strings.ReplaceAll(input, "<", "&lt;")
	escaped = strings.ReplaceAll(escaped, ">", "&gt;")
	return escaped
}

// === LLM CALL DISPATCHER ===

func Call(modelId, prompt, apiKey string) string {
	if provider, ok := modelProviders[modelId]; ok && apiKey != "" {
		return provider.CallFunc(prompt, apiKey, provider.UnderlyingModel)
	}
	return fmt.Sprintf("[LOCAL MOCK %s]\nProcessing: %s...", modelId, prompt[:min(50, len(prompt))])
}

// === CORE CHAIN LOGIC ===

// runChain executes a sequence of models, passing the ledger forward.
// It returns the chain history and the final output string.
func runChain(chainName string, originalPrompt string, path []string, apiKeys map[string]string) ([]Layer, string) {
	var chainHistory []Layer
	
	// The accumulated context (The Ledger)
	ledgerContext := ""
	currentHash := calculateHash(originalPrompt) // Initial Genesis Hash

	for i, modelID := range path {
		stepLabel := fmt.Sprintf("Step %d", i+1)
		
		// 1. Update Ledger with previous state (Immutable Record)
		ledgerDisplay := fmt.Sprintf("[%s | PrevHash:%s]", chainName, currentHash)
		
		// 2. Construct Prompt
		prompt := fmt.Sprintf(`<SYSTEM>
You are Node %s in the %s.
Your Goal: Answer the Original Prompt: "%s"
View the <LEDGER> below as the history of thoughts. 
You must output a response that either refines, agrees, or corrects the previous entry.
</SYSTEM>

<LEDGER>
%s
</LEDGER>`, modelID, chainName, originalPrompt, ledgerContext)

		// 3. Call Model
		response := Call(modelID, prompt, apiKeys[modelID])
		
		// 4. Update Hash & Context for next node
		// We hash the response to create the "Chain of Custody"
		currentHash = calculateHash(response)
		
		// Append to the text ledger passed to the next LLM
		ledgerContext += fmt.Sprintf("\n--- %s (%s) ---\n%s\n", stepLabel, modelID, response)
		
		// Add to visual stack
		chainHistory = append(chainHistory, Layer{
			Model:    fmt.Sprintf("%s → %s (%s)", chainName, modelID, stepLabel),
			Response: response,
		})
	}

	return chainHistory, ledgerContext
}

// === TOPOLOGIES ===

func runNHelix(originalPrompt string, models []string, apiKeys map[string]string) (string, []Layer) {
	var finalStack []Layer
	var wg sync.WaitGroup
	var mutex sync.Mutex // Mutex to safely append to finalStack from multiple threads

	n := len(models)
	
	// Channels to collect the final text from each chain for the summary
	resultsChan := make(chan string, n)

	// ---> FAN OUT: Launch N Chains <---
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(startIdx int) {
			defer wg.Done()
			
			// 1. Generate the ring path (e.g., 1-2-3-2-1)
			path := generateRingPath(startIdx, n, models)
			chainName := fmt.Sprintf("HELIX-%d", startIdx+1)

			// 2. Run the chain
			layers, finalLedger := runChain(chainName, originalPrompt, path, apiKeys)

			// 3. thread-safe append to the visual stack
			mutex.Lock()
			finalStack = append(finalStack, layers...)
			mutex.Unlock()

			// 4. Send final ledger to collector
			resultsChan <- fmt.Sprintf("<COMPLETED_LEDGER_CHAIN_%d>\n%s\n</COMPLETED_LEDGER_CHAIN_%d>", startIdx+1, finalLedger, startIdx+1)
		}(i)
	}

	wg.Wait()
	close(resultsChan)

	// ---> FAN IN: Summarization <---
	
	// Collect all chain ledgers
	combinedLedgers := ""
	for res := range resultsChan {
		combinedLedgers += res + "\n\n"
	}

	// Model 1 (Index 0) acts as the Supreme Judge
	summaryPrompt := fmt.Sprintf(`Analyze the following %d parallel reasoning chains regarding: "%s".
Compare their conclusions. Synthesize a final, authoritative answer.

%s`, n, originalPrompt, combinedLedgers)

	finalSummary := Call(models[0], summaryPrompt, apiKeys[models[0]])
	
	finalStack = append(finalStack, Layer{
		Model:    "★ N-HELIX FINAL CONSENSUS (Model 1) ★",
		Response: finalSummary,
	})

	return finalSummary, finalStack
}

// === HTTP HANDLERS ===

func handler(w http.ResponseWriter, r *http.Request) {
	// CORS setup (basic)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	
	if r.Method == "OPTIONS" { return }
	if r.URL.Path != "/maire/run" {
		http.Error(w, "not found", 404)
		return
	}

	var in req
	if json.NewDecoder(r.Body).Decode(&in) != nil {
		http.Error(w, "bad json", 400)
		return
	}

	var final string
	var stack []Layer

	// Route based on Topology
	switch in.Topology {
	case "n-helix", "star-topology": // Support both names
		final, stack = runNHelix(in.OriginalPrompt, in.Models, in.ApiKeys)
	case "double-helix":
		// Adapted Double Helix using the new runChain logic
		// Path 1: Forward Ring
		p1 := generateRingPath(0, len(in.Models), in.Models)
		// Path 2: Reverse Ring (starts at last model)
		p2 := generateRingPath(len(in.Models)-1, len(in.Models), reverse(in.Models)) // Simple reverse logic
		
		l1, txt1 := runChain("Helix-A", in.OriginalPrompt, p1, in.ApiKeys)
		l2, txt2 := runChain("Helix-B", in.OriginalPrompt, p2, in.ApiKeys)
		
		stack = append(stack, l1...)
		stack = append(stack, l2...)
		
		summaryPrompt := fmt.Sprintf("Compare these two helix chains:\n%s\n%s", txt1, txt2)
		final = Call(in.Models[0], summaryPrompt, in.ApiKeys[in.Models[0]])
		stack = append(stack, Layer{Model: "Double Helix Summary", Response: final})
		
	default:
		// Fallback to simple chain
		path := in.Models
		stack, _ = runChain("Standard", in.OriginalPrompt, path, in.ApiKeys)
		if len(stack) > 0 {
			final = stack[len(stack)-1].Response
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp{FinalResponse: final, HeaderStack: stack})
}

func modelsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	avail := []map[string]string{}
	for _, provider := range modelProviders {
		avail = append(avail, map[string]string{"id": provider.ID, "name": provider.Name})
	}
	json.NewEncoder(w).Encode(avail)
}

// === API PROVIDERS (Keep existing implementations) ===

func callOpenRouter(prompt, key, modelName string) string {
	payload := map[string]any{
		"model": modelName,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
	}
	b, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(b))
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 90 * time.Second}
	res, err := client.Do(req)
	if err != nil { return "[Network Error]" }
	defer res.Body.Close()
	var data struct {
		Choices []struct {
			Message struct{ Content string } `json:"message"`
		} `json:"choices"`
	}
	if json.NewDecoder(res.Body).Decode(&data) == nil && len(data.Choices) > 0 {
		return data.Choices[0].Message.Content
	}
	return "[No Response]"
}

func callGoogleAI(prompt, key, modelName string) string {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", modelName)
	payload := map[string]any{"contents": []map[string]any{{"parts": []map[string]string{{"text": prompt}}}}}
	b, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(b))
	req.Header.Set("x-goog-api-key", key)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 90 * time.Second}
	res, err := client.Do(req)
	if err != nil { return "[Network Error]" }
	defer res.Body.Close()
	var data struct {
		Candidates []struct {
			Content struct{ Parts []struct{ Text string } } `json:"content"`
		} `json:"candidates"`
	}
	if json.NewDecoder(res.Body).Decode(&data) == nil && len(data.Candidates) > 0 && len(data.Candidates[0].Content.Parts) > 0 {
		return data.Candidates[0].Content.Parts[0].Text
	}
	return "[No Response]"
}

func callHuggingFace(prompt, key, modelName string) string {
	url := "https://api-inference.huggingface.co/models/" + modelName
	payload := map[string]any{
		"inputs":     prompt,
		"parameters": map[string]any{"max_new_tokens": 1024},
	}
	b, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(b))
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 120 * time.Second}
	res, err := client.Do(req)
	if err != nil { return "[Network Error]" }
	defer res.Body.Close()
	var result []map[string]string
	if json.NewDecoder(res.Body).Decode(&result) == nil && len(result) > 0 {
		return result[0]["generated_text"]
	}
	return "[No Response]"
}

func min(a, b int) int {
	if a < b { return a }
	return b
}

func main() {
	http.HandleFunc("/maire/run", handler)
	http.HandleFunc("/maire/models", modelsHandler)
	fmt.Println("\nMAIRE v4 — N-HELIX ARCHITECTURE LIVE")
	fmt.Println("→ http://localhost:8080/maire/run")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
