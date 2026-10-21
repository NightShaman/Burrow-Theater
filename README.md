# Burrow Theater

![Burrow Theater — New role. Same bad influence.](docs/assets/hero.png)

**New role. Same bad influence.**

Burrow Theater is an optional lightweight roleplay mod for Burrow: a private stage for character conversation using any configured text model, including local models that do not support tools.

It deliberately bypasses the operational agent runtime. A turn is only:

```text
character card + scenario + pinned notes + scene transcript → selected text model → reply
```

No tools, agent profiles, operational context, task state, Brains, Tiddle, LoreMaster, Dreaming, handoffs, or runtime-proof machinery enter the theater. Characters and scenes live exclusively in the mod's Core-namespaced settings.

## Current experience

- RP-native character cards
- Configured model picker
- Editable scenario and pinned continuity notes
- Persistent isolated scenes and transcripts
- New scene, branch, edit, regenerate, export, and delete
- Fiction-aware stage-direction presentation

## Development

Requires Node.js 22.13+ and a sibling `Burrow-Backend` checkout for the Core contract test.

```sh
npm run build
npm test
```

Install through **Settings → Mods → Mod sources**, then explicitly enable the mod.
