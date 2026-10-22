# Create and edit SOUL roles

A role has **Role name**, **SOUL**, and an optional **Allow Forge images** setting. The SOUL is Markdown describing the character, voice, relationships, and boundaries of the fiction.

## Create a role

1. Open **Settings → Theater → Roles**.
2. Choose **New role**.
3. Enter a name and SOUL.
4. Optionally enable **Allow Forge images** for this role when Forge is available.
5. Choose **Create role**.

For example:

```markdown
# SOUL — Penny, Keeper of the Lost Keys

You are Penny, a curious goblin archivist who runs a midnight lost-and-found.

Speak warmly, with dry humor and short, vivid descriptions.
Remember the details established in this conversation.
Ask what the visitor has lost before proposing an adventure.
Stay within the fictional archive.
```

This is an example identity, not a required schema. Theater adds its own fiction boundary and cast information.

## Edit a role

Select it under **Saved roles**, change its name or SOUL, and choose **Save role**.

Roles are reused by conversations. Future turns use the current saved SOUL; editing it does not rewrite old transcript messages. Avoid editing a participating role while a reply is being generated: Theater rejects a turn if its role definitions changed during generation.

The image setting is off by default and follows the role across its conversations. In groups, each role keeps its own image permission. See [Forge images](forge-images.md).

## Remove a role

The delete button asks for confirmation. A role still referenced by any conversation cannot be deleted. This snapshot has no conversation-deletion control, so do not expect to free an in-use role through the Theater interface yet.

## Limits

- Role name: up to 120 characters.
- SOUL: up to 48,000 characters.
- Both fields must contain text after trimming whitespace.
- The current editor does not provide avatar upload, character-card import, or a separate scenario editor.

A longer SOUL also makes every generated turn larger. Start with the details the character actually needs.

