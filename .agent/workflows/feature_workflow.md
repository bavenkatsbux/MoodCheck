---
description: Workflow for developing new features, deploying to Firebase preview, and merging.
---

1.  **Create Feature Branch**
    -   Check status: `git status` (ensure clean)
    -   Create branch: `git checkout -b feature/your-feature-name`

2.  **Implementation**
    -   Make code changes.
    -   Commit changes: `git add .`, `git commit -m "Implement feature..."`

3.  **Deploy to Firebase Preview**
    -   Build project: `npm run build`
    -   Deploy to preview channel: `npx firebase hosting:channel:deploy [channel-name] --expires 1d`
        -   *Note: `channel-name` is usually the feature name.*

4.  **Verification**
    -   Share the preview URL with the user.
    -   Wait for user confirmation.

5.  **Merge & Cleanup**
    -   Switch to master: `git checkout master`
    -   Merge feature: `git merge feature/your-feature-name`
    -   Push to GitHub: `git push origin master`
    -   Deploy to Production (optional but recommended): `npx firebase deploy --only hosting`
    -   Delete local branch: `git branch -d feature/your-feature-name`
