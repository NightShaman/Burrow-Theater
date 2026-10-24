# Conversations and group chats

## Find a conversation

Choose a role in the **Roles** rail, then use the conversation selector. The selector shows conversations that include that role, including groups. **New session** starts a separate transcript for the selected role.

Switching roles or conversations clears an unsent composer draft. Send or copy it first if you need to keep it.

Use **Rename**, **Archive**, and **Delete** beside the conversation selector to manage a transcript. Archived conversations remain available in the selector and are clearly marked; Theater never silently expires them. Choose **Restore** before sending another message in an archived conversation. Delete permanently removes the transcript after confirmation. Lifecycle actions are disabled while text or Forge image work is pending. New conversations receive a cast-and-time fallback title; the first submitted message supplies an automatic title unless you have named the conversation yourself.

## Choose a model

The toolbar exposes **Provider**, **Model**, **Effort**, and **Temp**.

- Provider and Model choose a configured Core text model.
- Effort is available only when the model advertises reasoning-effort options.
- Temp is available only when the model advertises temperature support. Its range is 0–2.
- Switching model keeps the transcript and applies the new model’s advertised defaults in the UI.

These settings belong to the conversation. A group uses the same selected model and controls for every participating role.

## Create a group

1. Create at least two saved roles.
2. Select **Group Chat**.
3. Check at least two participants.
4. Choose **Create group**.
5. Send a message to the group.

Each selected role answers once per operator message, in participant order. Generation is sequential: a later role sees the text that earlier roles produced in that turn. Replies keep their role attribution.

A group therefore makes one text-generation request per role per turn. A larger cast can take longer and consume more provider usage than a single-role conversation. Your message appears immediately while the group writes. Role replies arrive after the complete text turn; they are not streamed one by one.

## Theater operator profile

Open **Settings → Theater → Operator profile** to choose the preferred name and optional Markdown/context that Theater roles receive about you. This profile is Theater-specific: it does not change your normal Burrow identity or any agent profile. Your preferred name is also used to attribute your Theater messages. The name is required (up to 120 characters); profile/context is optional (up to 24,000). The profile is copied into the submitted turn’s snapshot, so edits do not rewrite an already pending turn.

## What each role receives

- Its own current SOUL.
- Theater’s fiction boundary.
- Your Theater-specific operator name and profile/context.
- Names of the participants and an instruction to reply as itself.
- The conversation’s text, including earlier replies from the current group turn.
- Optional image-direction instructions when that role’s Forge images setting is enabled.

There is no Brains retrieval, agent tool execution, workspace loading, or automatic conversation compaction in this path. Image messages are excluded from later text prompts; roles are not shown the generated image pixels.

## Saving and failed turns

Conversations persist in Theater’s Core-managed settings. Submitting a turn saves your message and a pending text-generation record, then returns without waiting for the model. The active view reconciles it through Core’s durable generation jobs (about every 1.8 seconds while work is pending). Reopening/selecting a pending conversation resumes reconciliation; closing the view is not cancellation.

Group roles are generated sequentially, but their replies become visible together only after every participant succeeds. A later role failure does not publish a partial cast reply. The saved user message and a failed-generation card remain; provider requests already made may still count toward usage. There is no dedicated retry button for a failed text generation.

A request failure before the UI receives a successful submission response removes only its temporary optimistic message and restores the submitted text if the composer is empty; a newer draft is preserved. That is different from an accepted turn that later fails during generation. Reopen the conversation and inspect its saved state before resending after an uncertain response. Copy anything important before navigating away.

You can type your next message while a reply is being generated, but cannot send it until the active turn finishes. Role replies render a supported Markdown subset, including emphasis, lists, headings, links, quotations, and code blocks. Operator messages remain plain text. Raw HTML is ignored, and Markdown image syntax does not load remote images; scene illustrations use Forge cards.

At the transcript limit, start a new session. That creates a fresh transcript; it does not automatically carry forward the old story. See [limits](troubleshooting.md#conversation-limits).


