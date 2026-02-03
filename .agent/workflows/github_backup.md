---
description: Standardized procedure to backup and deploy the codebase to GitHub.
---

# GitHub Backup & Deployment Protocol

This workflow ensures the codebase is safely committed and pushed to the remote repository.

1.  **Status Check**
    - Check the current status of the repository to see pending changes.
    ```bash
    git status
    ```

2.  **Stage Changes**
    - Stage all modified and new files.
    // turbo
    ```bash
    git add .
    ```

3.  **Commit**
    - Create a commit with a timestamped message or a user-provided message.
    - *Agent Note: If the user didn't provide a specific message, generate a concise summary of recent changes.*
    ```bash
    git commit -m "backup: [Date] Automated backup and deployment"
    ```

4.  **Push**
    - Push changes to the main branch.
    ```bash
    git push origin main
    ```

5.  **Verification**
    - Confirm the push was successful.
    ```bash
    git log -1
    ```
