from dataclasses import dataclass


@dataclass
class TUI_Color:
    name: str
    light: tuple[int, int, int]
    dark: tuple[int, int, int]
