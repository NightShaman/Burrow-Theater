# Optional Forge images

**Allow Forge images** lets roles occasionally illustrate their replies. It is off by default and saved separately for each role. A role’s setting applies wherever that role participates.

## Turn images on

1. Open **Settings → Burrow Theater → Roles**.
2. Select the role under **Saved roles**.
3. Enable **Allow Forge images**.
4. Choose **Save role**, then return to the conversation.

The checkbox is disabled when Core reports that Forge images are unavailable. Its help text carries the availability reason. Theater does not have a separate image-model selector or provider-key form. Configure Forge through Burrow. Core requires a selected image model whose catalog entry is currently available. The availability reasons can include `forge_selection_missing` or `forge_model_unavailable`. Text conversations remain usable without this feature.

Enabling images permits a role to request an illustration; it does not require an image on every turn. Image generation may incur usage through Burrow’s configured Forge provider.

Theater uses the normal Burrow authentication context for role settings and image reconciliation. It does not introduce a separate Forge login or per-agent tool grant.

## Per-role access

In a group, only roles with this setting enabled receive image-direction instructions and have their image requests recognized. Giving one role image access does not enable it for the other participants.

Earlier development builds used a conversation-level switch. That old conversation setting is ignored by this version; existing roles without an explicit image setting default to off. Enable each intended role in Settings.

Turning a role’s setting off prevents new recognized requests from that role on subsequent turns. It does not cancel image cards already queued or pending.

## What happens next

A role can append one structured image request to its reply. Theater recognizes a valid request, removes that directive from the displayed prose, and saves a pending image card attributed to that role.

The text turn returns before Forge job creation. While the conversation is open, the UI reconciles pending image cards with Forge and shows:

- **Creating image…** while the job is pending.
- The preview when a successful job has an image preview URL.
- An error state when Forge reports a failed or otherwise unsuccessful result.

Pending cards are checked again when the conversation is opened or reloaded. Each card has a stable request identity so retrying reconciliation can reuse its Forge job.

## Important boundaries

This is a narrow, optional image-generation path supplied by the mod. Theater still sends text-model requests with no model tools.

Generated images are not fed back into the roles’ text context. An illustration is not a claim that the role inspected an image, used a shell, or performed a real-world action.

A malformed image directive can remain visible as reply text instead of generating an image. A terminal failed image has no dedicated retry button in this snapshot. Transient reconciliation errors may leave a card pending for another check.

