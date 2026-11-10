# Remotion on GitHub Actions — isolated smoke test

This is a **standalone demo using the published Remotion packages**, not a fork or build of the entire `remotion-dev/remotion` monorepo. It is isolated inside `Web-dev-mini-projects`.

## Automated test

The repository workflow `.github/workflows/remotion-smoke.yml` runs on pull requests changing this demo, or manually from the Actions tab **after the workflow exists on the default branch**.

The job installs Node.js 22, Chrome's Linux dependencies, and Remotion 4.0.542; checks TypeScript and composition registration; renders a 3-second 1280x720 H.264 MP4 at 30 FPS; verifies the video stream, resolution, frame rate, and duration with FFprobe; and uploads an artifact containing the MP4 and JSON test report.

### Download output

Open the GitHub Actions run → **Artifacts** → **remotion-smoke-mp4**.

### Run locally

```bash
npm install
npm run typecheck
npx remotion browser ensure
npm run compositions
npm run render
npm run verify
```

Preview with `npm run dev`.

## Scope and limitations

- This verifies that **the published Remotion rendering stack** works in GitHub Actions. It does not run the full upstream monorepo test suite.
- Dependencies are pinned to consistent Remotion versions. This trial deliberately avoids external assets, API secrets, and production deployments.
- GitHub Actions minutes and artifact storage are subject to GitHub's plan limits.
- Remotion uses a tiered license; check [its terms](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) before commercial rollout.
