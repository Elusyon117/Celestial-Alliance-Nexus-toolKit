# Security policy

Report security issues privately to the repository owner rather than opening a public issue containing exploit details.

## Deployment notes

- The toolkit is a static browser application and stores user-created state in browser storage.
- Do not place secrets, API keys, GitHub tokens, or private credentials in `index.html`, workflow files, data mirrors, or client-side storage.
- GitHub Actions use the short-lived repository `GITHUB_TOKEN` with the minimum declared permissions.
- Release assets used by the SCMDB importer are validated as JSON and checked for expected patch/channel/count before commit.
- External links and third-party data remain subject to their providers’ availability and content.
