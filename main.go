package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// ── Types ─────────────────────────────────────
type Layer struct {
	Model    string `json:"model"`
	Response string `json:"response"`
}

type PacketHeader struct {
	OriginalPrompt string
	Ledger         []struct {
		Direction string
		Index     int
		Model     string
		Hash      string
		Time      string
	}
	mu sync.Mutex
}

type req struct {
	OriginalPrompt string   `json:"original_prompt"`
	Topology       string   `json:"topology"`
	Models         []string `json:"models"`
}

type resp struct {
	FinalResponse string  `json:"final_response"`
	HeaderStack   []Layer `json:"header_stack"`
}

type modelResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ── CORS Middleware ─────────────────────────────
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		// Handle preflight
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next(w, r)
	}
}

// ── Ledger Methods ─────────────────────────────
func (p *PacketHeader) Add(dir string, idx int, model, body string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(body)))[:12]
	p.Ledger = append(p.Ledger, struct {
		Direction string
		Index     int
		Model     string
		Hash      string
		Time      string
	}{dir, idx, model, hash, time.Now().Format(time.RFC3339)})
}

func (p *PacketHeader) Build() string {
	var b strings.Builder
	b.WriteString("<LEDGER>\nOriginal: " + p.OriginalPrompt + "\n\n")
	for _, e := range p.Ledger {
		b.WriteString(fmt.Sprintf("%s%d | %s | %s | %s\n", e.Direction, e.Index, e.Model, e.Hash, e.Time))
	}
	b.WriteString("</LEDGER>\n")
	return b.String()
}

// ── Real LLM Calls (Safe, Never Panic) ────────
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func Call(model, prompt string) string {
	openrouterKey := os.Getenv("OPENROUTER_API_KEY")
	hfKey := os.Getenv("HF_API_KEY")
	googleKey := os.Getenv("GOOGLE_API_KEY")

	// Fallback stub
	resp := CallStub(model, prompt)

	// 1. Grok → OpenRouter (Llama 3.1)
	if strings.Contains(strings.ToLower(model), "grok") && openrouterKey != "" {
		if text, ok := callOpenRouter(prompt, openrouterKey); ok {
			return text
		}
	}

	// 2. GPT-4 label → Google Gemini 1.5 Flash
	if strings.Contains(strings.ToLower(model), "gpt") && googleKey != "" {
		if text, ok := callGemini(prompt, googleKey); ok {
			return text
		}
	}

	// 3. Claude label → Hugging Face Mixtral
	if strings.Contains(strings.ToLower(model), "claude") && hfKey != "" {
		if text, ok := callHuggingFace(prompt, hfKey); ok {
			return text
		}
	}

	return resp
}

func callOpenRouter(prompt, key string) (string, bool) {
	body := map[string]any{
		"model": "meta-llama/llama-3.1-8b-instruct",
		"messages": []map[string]string{{"role": "user", "content": prompt}},
	}
	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(jsonBody))
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", "http://localhost:5173")
	req.Header.Set("X-Title", "MAIRE")
	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp == nil || resp.StatusCode != 200 {
		return "", false
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	var data struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if json.Unmarshal(b, &data) == nil && len(data.Choices) > 0 {
		return data.Choices[0].Message.Content, true
	}
	return "", false
}

func callHuggingFace(prompt, key string) (string, bool) {
	url := "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"
	payload := map[string]any{
		"inputs": prompt,
		"parameters": map[string]any{
			"max_new_tokens": 1024,
			"return_full_text": false,
		},
	}
	jsonBody, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp == nil {
		return "", false
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", false
	}
	body, _ := io.ReadAll(resp.Body)
	var result []struct {
		GeneratedText string `json:"generated_text"`
	}
	if json.Unmarshal(body, &result) == nil && len(result) > 0 {
		return result[0].GeneratedText, true
	}
	return string(body), true
}

func callGemini(prompt, key string) (string, bool) {
	body := map[string]any{
		"contents": []map[string]any{{"parts": []map[string]string{{"text": prompt}}}},
	}
	jsonBody, _ := json.Marshal(body)
	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + key
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp == nil {
		return "", false
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	var data struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if json.Unmarshal(b, &data) == nil && len(data.Candidates) > 0 && len(data.Candidates[0].Content.Parts) > 0 {
		return data.Candidates[0].Content.Parts[0].Text, true
	}
	return "", false
}

func CallStub(model, prompt string) string {
	time.Sleep(200 * time.Millisecond)
	short := prompt
	if len(short) > 120 {
		short = short[:120] + "…"
	}
	return fmt.Sprintf("[%s - local stub]\n%s", model, short)
}

// ── Topologies ───────────────────────────────────
func standardChain(prompt string, models []string) (string, []Layer) {
	l := &PacketHeader{OriginalPrompt: prompt}
	var stack []Layer
	current := prompt
	
	for i, m := range models {
		p := l.Build() + "\n\n→ " + m + "\nContinue and improve:\n" + current
		resp := Call(m, p)
		l.Add("F", i, m, resp)
		stack = append(stack, Layer{Model: m, Response: resp})
		current = resp // Pass output to next model
	}
	
	finalResponse := current
	if len(stack) > 0 {
		finalResponse = stack[len(stack)-1].Response
	}
	
	return finalResponse, stack
}

func doubleHelix(prompt string, models []string) (string, []Layer) {
	l := &PacketHeader{OriginalPrompt: prompt}
	var stack []Layer
	var mu sync.Mutex
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		current := prompt
		for i, m := range models {
			p := l.Build() + "\n\n[Forward Pass] You are " + m + ". Build upon:\n" + current
			resp := Call(m, p)
			mu.Lock()
			l.Add("F", i, m, resp)
			stack = append(stack, Layer{Model: m + " (forward)", Response: resp})
			current = resp
			mu.Unlock()
		}
	}()

	go func() {
		defer wg.Done()
		current := prompt
		for i := len(models) - 1; i >= 0; i-- {
			m := models[i]
			p := l.Build() + "\n\n[Reverse Pass] You are " + m + ". Critique and refine:\n" + current
			resp := Call(m, p)
			mu.Lock()
			l.Add("R", i, m, resp)
			stack = append(stack, Layer{Model: m + " (reverse)", Response: resp})
			current = resp
			mu.Unlock()
		}
	}()

	wg.Wait()
	
	// Synthesize final response from both passes
	finalResponse := "Double Helix reasoning complete with forward and reverse passes"
	if len(stack) > 0 {
		finalResponse = stack[len(stack)-1].Response
	}
	
	return finalResponse, stack
}

func starTopology(prompt string, models []string) (string, []Layer) {
	var wg sync.WaitGroup
	var mu sync.Mutex
	var stack []Layer
	steps := int(math.Max(3, float64(len(models))))

	for i, m := range models {
		wg.Add(1)
		go func(idx int, model string) {
			defer wg.Done()
			l := &PacketHeader{OriginalPrompt: prompt}
			
			for s := 0; s < steps; s++ {
				p := fmt.Sprintf("<LEDGER>\nOriginal: %s\n</LEDGER>\n\nYou are %s in independent reasoning arm #%d, step %d/%d. Respond directly to the original prompt.", 
					prompt, model, idx+1, s+1, steps)
				resp := Call(model, p)
				l.Add("S", s, model, resp)
				mu.Lock()
				stack = append(stack, Layer{
					Model:    fmt.Sprintf("%s (arm-%d step-%d)", model, idx+1, s+1),
					Response: resp,
				})
				mu.Unlock()
			}
		}(i, m)
	}
	wg.Wait()
	
	// Synthesize from all arms
	finalResponse := fmt.Sprintf("Star Topology complete: %d parallel reasoning arms, %d steps each", len(models), steps)
	if len(stack) > 0 {
		finalResponse = stack[len(stack)-1].Response
	}
	
	return finalResponse, stack
}

// ── HTTP Handlers ──────────────────────────────
func handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	
	var in req
	if json.NewDecoder(r.Body).Decode(&in) != nil {
		http.Error(w, "bad json", 400)
		return
	}
	
	if len(in.Models) == 0 {
		http.Error(w, "no models provided", 400)
		return
	}

	var final string
	var stack []Layer

	log.Printf("Running topology: %s with models: %v", in.Topology, in.Models)

	switch in.Topology {
	case "star-topology":
		final, stack = starTopology(in.OriginalPrompt, in.Models)
	case "double-helix":
		final, stack = doubleHelix(in.OriginalPrompt, in.Models)
	case "standard-chain":
		final, stack = standardChain(in.OriginalPrompt, in.Models)
	default:
		final, stack = standardChain(in.OriginalPrompt, in.Models)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp{FinalResponse: final, HeaderStack: stack})
}

// Dynamic model list endpoint
func modelsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "GET only", http.StatusMethodNotAllowed)
		return
	}
	
	available := []modelResponse{}
	
	if os.Getenv("OPENROUTER_API_KEY") != "" {
		available = append(available, modelResponse{ID: "grok", Name: "Grok (Llama 3.1 via OpenRouter)"})
	}
	if os.Getenv("HF_API_KEY") != "" {
		available = append(available, modelResponse{ID: "claude", Name: "Claude (Mixtral via Hugging Face)"})
	}
	if os.Getenv("GOOGLE_API_KEY") != "" {
		available = append(available, modelResponse{ID: "gpt-4", Name: "GPT-4 (Gemini 1.5 Flash)"})
	}
	
	// Add stub models for testing
	if len(available) == 0 {
		available = []modelResponse{
			{ID: "grok", Name: "Grok (Stub)"},
			{ID: "claude", Name: "Claude (Stub)"},
			{ID: "gpt-4", Name: "GPT-4 (Stub)"},
		}
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(available)
}

// ── Server ───────────────────────────────────────
func main() {
	http.HandleFunc("/maire/run", enableCORS(handler))
	http.HandleFunc("/maire/models", enableCORS(modelsHandler))

	fmt.Println("")
	fmt.Println("🚀 MAIRE backend LIVE")
	fmt.Println("→ http://localhost:8080/maire/run")
	fmt.Println("→ http://localhost:8080/maire/models")
	fmt.Println("")
	log.Fatal(http.ListenAndServe(":8080", nil))
}