import { Display } from 'roguelike-pumpkin-patch';
import FOV from './FOV';
import RoomBuilder from './RoomBuilder';
import Tile from './Tile';

const displayDiv:HTMLElement|null = document.getElementById("display");

if (displayDiv) {
    const display = new Display({target:displayDiv, width: 31, height: 31});
    const center = [15,15];
    display.tileSize = display.calculateTileSize();

    const testRoom = [
        "#######################",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#.....................#",
        "#######################",
    ];

    const tileMap = RoomBuilder(testRoom.map(row=>row.split('')));

    const fov = new FOV(
        (tile:Tile) => {
            return tile.content !== '#';
        },
        ([x,y],tile:Tile) => {
            if (tile.content) {
                display.setTile(center[0]+x, center[1]+y, tile.content);
            }
        }
    );
    
    const x = 1;
    const y = 1;
    const tile = tileMap[y][x];
    if(tile) {
        tile.content = '@';
        console.log(tile);
        fov.look(tile);
    }

    console.log(tileMap);
}