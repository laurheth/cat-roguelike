import { Display } from 'roguelike-pumpkin-patch';

const displayDiv:HTMLElement|null = document.getElementById("display");

if (displayDiv) {
    const display = new Display({target:displayDiv, width: 30, height: 30});
    display.tileSize = display.calculateTileSize();
}