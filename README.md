# tui

A collection of UI styles, components and tools for building user interfaces.

## Release

How to publish all packages to npm:

```bash
nx run-many -t package
pnpm publish -r
```

---

## Todos

- [x] Replace all `context="module"` with `module`
- [ ] Change TW plugins to use TS and then export to JS
- [ ] util class that does flex not shrink past min-w- and crush layout
- [ ] export type Color, BGColor, etc from `tui-colors-tw`
