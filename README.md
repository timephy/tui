# tui

A collection of UI styles, tools and components.

## `tui/icons`

The [Bootstrap SVG icons](https://github.com/twbs/icons) converted to be used with [Svelte Awesome](https://github.com/RobBrazier/svelte-awesome).

---

## Todos

- [ ] Port Scrollbar
- [ ] Checkbox (animated?)
- [ ] Switch (animated!)
- [ ] Input Text (Field+Area)
- [ ] Input Text with Buttons left/right
- [x] Slider
- [ ]

## Notes

## ⚠️ Somehow the SvelteKit project does not work in a "default npm workspace"

It complains about a dependency importing from `svelte/internal`.
This is resolved when running `bun install` instead of `npm install`.
Somehow the splitting of dependencies goes wrong.
