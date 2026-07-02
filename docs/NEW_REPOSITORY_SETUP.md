# Create the new GitHub repository

This release is designed to be committed to a completely new repository and published from the root of the `main` branch.

## Recommended repository name

A clear name is:

```text
celestial-nexus-toolkit-v1-3-7
```

Any available repository name will work. The final Pages address will normally be:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```

## Create the repository on GitHub

1. On GitHub, select **New repository**.
2. Choose the owner account.
3. Enter the repository name.
4. Set visibility to **Public** when using GitHub Free Pages.
5. Do **not** initialize it with a README, `.gitignore`, or license; those files are already included or intentionally documented in this package.
6. Select **Create repository**.

## Publish with PowerShell and Git

Extract the ZIP, open PowerShell inside the extracted folder, and run:

```powershell
git init
git config user.name "Elusyon117"
git config user.email "Elusyon117@users.noreply.github.com"
git add --all
git commit -m "Publish Celestial Nexus v1.3.7"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY-NAME.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPOSITORY-NAME` before running the remote command.

## Enable GitHub Pages

After the files are visible on GitHub:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch **main**.
4. Select folder **/(root)**.
5. Select **Save**.
6. Open **Actions** and wait for the generated **pages build and deployment** run.

This package deliberately does not include a custom deployment workflow. A static application without a build step is appropriately published from the branch root.

## Verify the new site

After the deployment turns green:

1. Open the URL shown in **Settings → Pages**.
2. Use a private/incognito window for the first test.
3. Confirm the Tool Hub appears.
4. Open each module once.
5. Confirm roster fallback data and Wikelo artwork load.
6. Test one save/export action.
7. Reload the page and confirm the application remains functional.

## Keep the old repository temporarily

Do not delete the old repository immediately. Keep it as an archive until the new URL has passed production checks and organization links have been updated.
