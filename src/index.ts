import { Display, EventManager, Random } from 'roguelike-pumpkin-patch';
import FOV from './FOV';
import RoomBuilder, { hallBuilder } from './RoomBuilder';
import {default as Tile, RememberTile } from './Tile';
import Player from './Player';
import { isFunctionExpression } from 'typescript';

const displayDiv:HTMLElement|null = document.getElementById("display");

if (displayDiv) {
    const displayWidth=31;
    const displayHeight=31;
    const display = new Display({target:displayDiv, width: 31, height: 31});
    const center = [Math.ceil(displayWidth/2),Math.ceil(displayHeight/2)];
    display.tileSize = display.calculateTileSize();

    const random = new Random();

    const testRoom = [
        "########",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "########",
    ];

    const tileMap = RoomBuilder(testRoom.map(row=>row.split('')));
    const tileMap2 = RoomBuilder(testRoom.map(row=>row.split('')));

    const fov = new FOV(
        (tile:Tile) => {
            return tile.seeThrough;
        },
        ([x,y],tile:Tile) => {
            display.setTile(center[0]+x, center[1]+y, tile.getTile());
        },
        (tile:Tile) => {
            const toDisplay:any[][] = [];
            for(let i=0;i<displayWidth;i++) {
                const row:any = []
                for(let j=0;j<displayHeight;j++) {
                    row.push(-1);
                }
                toDisplay.push(row);
            }
            let distance = 0;
            let rememberList:RememberTile[] = [
                {
                    position:[center[0],center[1]],
                    tile:tile
                }
            ];
            while(distance < 50) {
                const nextRememberList:RememberTile[] = []
                rememberList.forEach(x=>{
                    x.tile.remember(x.position,toDisplay).forEach(y=>{
                        nextRememberList.push(y);
                    });
                });
                rememberList = nextRememberList;
                distance++;
            }

            for(let i=0;i<displayWidth;i++) {
                for(let j=0;j<displayHeight;j++) {
                   display.setTile(i,j,toDisplay[j][i]);
                }
            }
        }
    );
    
    const x = 2;
    const y = 2;
    const tile = tileMap[y][x];
    const event = new EventManager({type:'simple'});

    hallBuilder(tileMap,tileMap2,random);

    if(tile) {
        const player = new Player({
            startTile:tile,
            appearance:{
                content:'@',
                classList:['player'],
            },
            fov: fov,
        });
        event.add(player);
        const go = async ()=>{
            while(1===1) {
                await event.advance();
            }
        }
        go();
    }
}