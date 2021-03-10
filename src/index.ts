import { Display, EventManager, Random } from 'roguelike-pumpkin-patch';
import FOV from './FOV';
import RoomBuilder, { hallBuilder } from './RoomBuilder';
import {default as Tile, RememberTile } from './Tile';
import Player from './Player';
import MapGenerator from './MapGenerator';
import Foe from './Foe';

const displayDiv:HTMLElement|null = document.getElementById("display");

if (displayDiv) {
    const displayWidth=31;
    const displayHeight=31;
    const display = new Display({target:displayDiv, width: 31, height: 31});
    const center = [Math.ceil(displayWidth/2),Math.ceil(displayHeight/2)];
    display.tileSize = display.calculateTileSize();

    const random = new Random();
        
    const map = MapGenerator(1,random);
    const tile = map.startTile;

    const fov = new FOV(
        (tile:Tile) => {
            return tile.seeThrough;
        },
        ([x,y],tile:Tile) => {
            display.setTile(center[0]+x, center[1]+y, tile.getTile());
        },
        (tile:Tile) => {

            map.allTiles.forEach(tile=>tile.remembered=0);

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
                    x.tile.remember(x.position,toDisplay,distance).forEach(y=>{
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

    const event = new EventManager({type:'simple'});

    if(tile) {
        const player = new Player({
            startTile:tile,
            appearance:{
                content:'@',
                classList:['player'],
            },
            fov: fov,
        });
        const foe = new Foe({
            type:'bug',
            startTile: random.getRandomElement(map.allTiles.filter(x=>x.passable)),
            rng:random
        })
        event.add(player);
        event.add(foe);
        const go = async ()=>{
            while(1===1) {
                await event.advance();
            }
        }
        go();
    }
}