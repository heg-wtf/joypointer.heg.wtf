# joypointer.heg.wtf — static storefront for JoyPointer (GitHub Pages).
PORT ?= 4173
NPM  ?= npm

.PHONY: help install format lint test serve clean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'

install: ## Install dev dependencies (eslint, prettier)
	$(NPM) install

format: ## Format HTML/CSS/JS/JSON/Markdown with prettier
	$(NPM) run --silent format

lint: format ## Run eslint (formats first)
	$(NPM) run --silent lint

test: ## Run site tests (node --test)
	$(NPM) test

serve: ## Serve the site locally on http://localhost:$(PORT)
	python3 -m http.server $(PORT)

clean: ## Remove installed dependencies
	rm -rf node_modules
