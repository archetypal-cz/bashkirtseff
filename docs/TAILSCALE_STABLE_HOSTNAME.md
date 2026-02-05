# Tailscale Stable Hostname in GitHub Actions

This document explains how to maintain a consistent Tailscale hostname across GitHub Actions deployments when using Headscale as the control server.

## Current Setup Analysis

The current workflow (`.github/workflows/deploy.yml`) uses the Tailscale GitHub Action with:

```yaml
- name: Setup Tailscale
  uses: tailscale/github-action@v3
  with:
    oauth-client-id: ""
    oauth-secret: ""
    authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
    args: --login-server=${{ secrets.HEADSCALE_URL }}
    hostname: github-actions-deploy
```

**Key observations:**
- The `hostname` parameter is already set to `github-actions-deploy`
- Authentication uses an auth key (not OAuth)
- Connects to a Headscale server (self-hosted control server)
- Uses version 3 of the Tailscale GitHub Action

## The Problem

When using ephemeral nodes with Tailscale/Headscale, hostname conflicts occur because:

1. **Ephemeral node cleanup delay**: Ephemeral nodes are auto-removed anywhere from 30 minutes to 48 hours after last activity, not immediately upon disconnection.

2. **New deployment timing**: When a new GitHub Actions workflow starts, the previous ephemeral node may still exist in the control server's node list.

3. **Hostname collision**: Tailscale enforces unique hostnames. When a new node requests a hostname that's already in use, it receives a suffixed name (e.g., `github-actions-deploy-1`).

4. **DNS unpredictability**: This makes the MagicDNS name unpredictable, though in this workflow SSH connects to the deployment target via its Tailscale hostname.

## Recommended Solutions

### Solution 1: Ensure Immediate Node Removal (Recommended)

The Tailscale GitHub Action already handles logout automatically when the workflow completes, which should trigger immediate ephemeral node removal. However, there are additional steps to ensure this works correctly:

**Step 1: Verify auth key settings**

Ensure the `TAILSCALE_AUTHKEY` secret is configured with an ephemeral, reusable key. For Headscale, create the key with:

```bash
headscale preauthkeys create --user <username> --reusable --ephemeral
```

Note: Without `--expiration`, keys expire in 1 hour by default. For long-term use:

```bash
headscale preauthkeys create --user <username> --reusable --ephemeral --expiration 365d
```

**Step 2: Upgrade to latest action version**

Update to v4 of the Tailscale GitHub Action which has improved ephemeral node handling:

```yaml
- name: Setup Tailscale
  uses: tailscale/github-action@v4
  with:
    authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
    args: --login-server=${{ secrets.HEADSCALE_URL }}
    hostname: github-actions-deploy
    tags: tag:ci
```

**Step 3: Verify Headscale version**

Ensure your Headscale server is running a recent version that properly supports ephemeral node immediate removal on logout. There have been bugs in some alpha versions where ephemeral nodes were not handled correctly.

### Solution 2: Use State Directory (For Persistent Identity)

If you need the exact same node identity across runs (same IP, same key), you can persist the Tailscale state. However, this is complex with GitHub-hosted runners since they are ephemeral.

For self-hosted runners only:

```yaml
- name: Setup Tailscale
  uses: tailscale/github-action@v4
  with:
    authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
    args: --login-server=${{ secrets.HEADSCALE_URL }}
    hostname: github-actions-deploy
    statedir: /path/to/persistent/tailscale-state/
```

### Solution 3: Unique Hostnames Per Run (Workaround)

If hostname conflicts persist, use unique hostnames per run:

```yaml
- name: Setup Tailscale
  uses: tailscale/github-action@v4
  with:
    authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
    args: --login-server=${{ secrets.HEADSCALE_URL }}
    hostname: github-actions-deploy-${{ github.run_id }}
```

This avoids conflicts but means each deployment gets a new hostname.

## Implementation Steps

### Immediate Changes (Recommended)

1. **Update the workflow** to use action v4:

```yaml
- name: Setup Tailscale
  uses: tailscale/github-action@v4
  with:
    authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
    args: --login-server=${{ secrets.HEADSCALE_URL }}
    hostname: github-actions-deploy
    tags: tag:ci
```

2. **Verify/recreate the auth key** on Headscale:

```bash
# Check existing keys
headscale preauthkeys list --user <username>

# Create new ephemeral, reusable key with long expiration
headscale preauthkeys create --user <username> --reusable --ephemeral --expiration 365d
```

3. **Update the GitHub secret** `TAILSCALE_AUTHKEY` with the new key.

### Verification

After implementing changes, verify the fix by:

1. Running two deployments in quick succession
2. Checking the Headscale admin (`headscale nodes list`) to verify:
   - Only one node appears with hostname `github-actions-deploy`
   - No `-1` suffixed duplicates exist
3. Monitoring the workflow logs for any hostname-related warnings

## Headscale-Specific Considerations

When using Headscale instead of Tailscale's control server:

1. **Version compatibility**: Ensure Headscale version supports ephemeral node logout behavior (check release notes)

2. **Known issues**: Some Headscale versions have had bugs with:
   - Ephemeral nodes being removed prematurely or not at all
   - Hostname changes not being reflected
   - `lastSeen` timestamps not updating correctly

3. **ACL configuration**: If using ACLs, ensure the CI tag has appropriate permissions

## References

- [Tailscale GitHub Action Documentation](https://tailscale.com/kb/1276/tailscale-github-action)
- [Tailscale Ephemeral Nodes](https://tailscale.com/kb/1111/ephemeral-nodes)
- [Ephemeral Logout Blog Post](https://tailscale.com/blog/ephemeral-logout)
- [Machine Names Documentation](https://tailscale.com/kb/1098/machine-names)
- [GitHub Action Repository](https://github.com/tailscale/github-action)
- [Feature Request: Hostname Override](https://github.com/tailscale/tailscale/issues/5400)
- [Headscale Preauth Keys Issue](https://github.com/juanfont/headscale/issues/1550)
