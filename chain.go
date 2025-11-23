package main

import (
	"crypto/sha256"
	"fmt"
	"strings"
	"time"
)

// LedgerEntry is an immutable header record for a hop
type LedgerEntry struct {
	Direction string // "F" or "R"
	Index     int
	Model     string
	Reference string // SHA256 hash of body content
	Timestamp string // RFC3339 time
}

// PacketHeader is the immutable, append-only ledger storing only metadata and content hashes
type PacketHeader struct {
	OriginalPrompt string
	Ledger         []LedgerEntry // Strict append-only
}

// Ledger append operation
func (p *PacketHeader) AddLedger(direction string, index int, model string, bodyContent string) string {
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(bodyContent)))
	entry := LedgerEntry{
		Direction: direction,
		Index:     index,
		Model:     model,
		Reference: hash,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	p.Ledger = append(p.Ledger, entry)
	return hash // so caller can store full body with this hash
}

// The header (ledger) printout
func (p *PacketHeader) BuildHeader() string {
	var b strings.Builder
	b.WriteString("<LEDGER>\n")
	b.WriteString("Original: ")
	b.WriteString(p.OriginalPrompt)
	b.WriteString("\n\n")
	for _, e := range p.Ledger {
		b.WriteString(fmt.Sprintf("%s%d | %s | ref:%s | %s\n",
			e.Direction, e.Index, e.Model, e.Reference[:8], e.Timestamp))
	}
	b.WriteString("</LEDGER>\n")
	return b.String()
}
