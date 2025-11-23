package main

import "fmt"

// Model represents a pluggable model or API
type Model interface {
	Call(prompt string) string
	Name() string
}

// StubModel - replace this with your custom model logic and API connection
type StubModel struct {
	name string
}

func (m *StubModel) Call(prompt string) string {
	return fmt.Sprintf("Stub(%s): Response to '%s'", m.name, prompt)
}
func (m *StubModel) Name() string {
	return m.name
}
