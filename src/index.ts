import { Display } from 'roguelike-pumpkin-patch';
import FOV from './FOV';
import RoomBuilder from './RoomBuilder';
import Tile from './Tile';
import Player from './Player';

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
            return tile.seeThrough;
        },
        ([x,y],tile:Tile) => {
            if (tile.getTile()) {
                display.setTile(center[0]+x, center[1]+y, tile.getTile());
            }
        }
    );
    
    const x = 2;
    const y = 2;
    const tile = tileMap[y][x];
    console.log(tile);
    if(tile) {
        const player = new Player({
            startTile:tile,
            appearance:'@',
        });
        console.log(tile.enterTile(player));
        fov.look(tile);
    }
    console.log(tileMap);
}