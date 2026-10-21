# Set up Theater

## Release availability

:::note Upcoming release preview
Checked October 21, 2026: an installable public Theater release and a compatible public Core version have not yet been verified. This guide describes Theater 2026.10.21.12, including per-role Forge images. Wait for the coordinated public release before following the installation steps below.
:::

## What you need

- A Burrow installation whose mod host supports Theater’s model-generation contract.
- At least one configured text model available through Core.
- For optional scene images, compatible Core Forge image support and an available image-generation configuration.

Theater uses Burrow’s existing model connections. There is no separate provider-key form in Theater.

## Install and enable

Use **Settings → Mods → Mod sources** to install the Theater source supplied for your release, then explicitly enable the mod. Its manifest ID is `burrow-theater`; its display name is **Burrow Theater**.

Open Theater’s control view for conversations. Open **Settings → Burrow Theater → Roles** to manage its saved identities.

A fresh role inventory supplies **The House Goblin**. You can use that role immediately or create your own. If you deliberately remove every saved role, Theater leaves the inventory empty instead of silently recreating the default.

## First conversation

1. Open Theater and expand the **Roles** rail if it is collapsed.
2. Choose a role.
3. Select **New session**.
4. Check the **Provider** and **Model** selectors. A new session initially uses the first model Core supplies.
5. Type a message and press **Enter** or the send button.

Use **Shift+Enter** for another line. The emoji button inserts an emoji into your draft.

If no configured text model is available, configure one in Burrow first. If the role’s Forge setting is unavailable, you can still use ordinary text conversations.

