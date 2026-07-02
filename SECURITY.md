# Security Policy

## Supported release

The actively maintained release in this repository is version 1.3.7 unless a later version is documented in `VERSION.txt`.

## Reporting a vulnerability

Use GitHub's private security-advisory feature when enabled for the repository. Otherwise, contact the repository owner privately through an established organization channel. Do not publish credentials, personal information, or a working exploit in a public issue.

## Repository security rules

- Never commit API tokens, passwords, cookies, private endpoints, or personal rosters.
- Treat third-party responses as untrusted input.
- Keep dependency-free static deployment where practical.
- Review changes to external URLs, HTML injection, file imports, generated downloads, and local-storage parsing carefully.
- Test service-worker updates to prevent stale or poisoned caches.

## External services

This project cannot guarantee the security, availability, or privacy practices of linked third-party services.
