package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

// Store all body contents keyed by their hash in-memory for now
var bodyStore = map[string]string{}

func main() {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("Enter your prompt: ")
	origPrompt, _ := reader.ReadString('\n')
	origPrompt = strings.TrimSpace(origPrompt)

	var ledger PacketHeader
	ledger.OriginalPrompt = origPrompt

	models := []string{"grok-4.1", "gpt-4", "claude-2"}

	// Forward pass
	for i, m := range models {
		instruction := fmt.Sprintf("Please analyze as %s.", m)
		// Build a packet for the model with ledger info only
		prompt := ledger.BuildHeader() + "\n" + instruction
		resp := callModel(m, prompt) // full LLM output
		hash := ledger.AddLedger("F", i, m, resp)
		bodyStore[hash] = resp
	}

	// Return pass (reverse)
	for i := len(models) - 1; i >= 0; i-- {
		m := models[i]
		instruction := fmt.Sprintf("Review previous responses as %s.", m)
		prompt := ledger.BuildHeader() + "\n" + instruction
		resp := callModel(m, prompt)
		hash := ledger.AddLedger("R", i, m, resp)
		bodyStore[hash] = resp
	}

	fmt.Println("\n--- IMMUTABLE LEDGER ---")
	fmt.Println(ledger.BuildHeader())

	fmt.Println("\n--- BODY STORE ---")
	for _, entry := range ledger.Ledger {
		fmt.Printf("%s (%s):\n", entry.Model, entry.Reference)
		fmt.Println(bodyStore[entry.Reference])
		fmt.Println("---")
	}
}

// Stub model call - replace with real API logic
func callModel(model, prompt string) string {
	return fmt.Sprintf("Full response from %s: \"%s\"", model, prompt)
}
