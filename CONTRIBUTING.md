# Contributing

## Scope

Contributions should preserve the toolkit's static deployment model, module isolation, graceful degradation, and ability to run from a GitHub Pages project path.

## Workflow

1. Create a branch from `main`.
2. Make focused changes.
3. Update documentation when controls, data behavior, or external sources change.
4. Run `python scripts/validate_package.py`.
5. Serve the repository locally and smoke-test every affected module.
6. Open a pull request with reproduction steps, screenshots where useful, and test results.

## Code considerations

- Do not hardcode a specific GitHub repository URL for local runtime files.
- Keep local paths relative to the site root.
- Do not commit secrets or private organization data.
- Handle external-source failures without blocking unrelated modules.
- Change the service-worker cache name whenever cached runtime files change.
- Preserve accessibility labels and keyboard behavior.

## Data changes

Document the source, retrieval date, patch relevance, and transformation for significant data changes. Clearly distinguish official information from community estimates or rumors.
