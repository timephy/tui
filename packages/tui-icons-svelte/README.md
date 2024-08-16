# tui-icons-svelte

```svelte
<script lang="ts">
    import Icon from "@timephy/tui-components-svelte/Icon.svelte"

    import camera_video_fill from "@timephy/tui-icons-svelte/camera_video_fill"
    import display from "@timephy/tui-icons-svelte/display"
    import gear_wide_connected from "@timephy/tui-icons-svelte/gear_wide_connected"
    import mic_fill from "@timephy/tui-icons-svelte/mic_fill"
    import volume_mute_fill from "@timephy/tui-icons-svelte/volume_mute_fill"
</script>

<Icon data={camera_video_fill} class="size-[18px]" />
<Icon data={display} class="size-[18px]" />
<Icon data={gear_wide_connected} class="size-[18px]" />
<Icon data={mic_fill} class="size-[18px]" />
<Icon data={volume_mute_fill} class="size-[18px]" />
```

## Notable Versions

### 1.11.6

- Made barrel file optional and fixed auto-imports for TypeScript and Svelte files
- Prefixed filenames and identifiers starting with a digit with the letter "n"
- Reexports `<Icon />` and `IconType` from `svelte-awesome` for easy use

## Notes

- `package.json > exports` seem to have to be listed all seperately, the following pattern does work for TS autocomplete imports, but sadly not in Svelte files

```json
{
    "exports": {
        // does work in .ts files for auto-import, BUT not in .svelte files
        "./*": {
            "types": "./dist/icons/*.d.ts",
            "default": "./dist/icons/*.js"
        },
        // does work in .ts files for auto-import, AND in .svelte files
        "./n0_circle": "./dist/icons/n0_circle.js"
    },
}
```
