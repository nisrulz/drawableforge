.PHONY: help serve build clean

PORT ?= 8000
HOST ?= 127.0.0.1

help: ## Show available commands
	@echo "DrawableForge - commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Run the dev server:"
	@echo "  make serve                       # http://127.0.0.1:8000"
	@echo "  make serve PORT=8080             # custom port (finds a free one if busy)"
	@echo "  make serve PORT=8080 HOST=0.0.0.0# listen on all interfaces"

serve: ## Run the local static dev server
	@go run . --port $(PORT) --host $(HOST)

build: ## Build the dev server binary
	go build -o bin/drawableforge .

clean: ## Remove build artifacts
	rm -rf bin
