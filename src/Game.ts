import { Display, EventManager, Random } from 'roguelike-pumpkin-patch';
import FOV from './FOV';
import {default as Tile, RememberTile } from './Tile';
import Player from './Player';
import MapGenerator from './MapGenerator';
import Foe from './Foe';

/** Container for the entire game */
export default class Game {
    displayDiv:HTMLElement;
    displayWidth:number;
    displayHeight:number;
    center:number[];
    display:Display;
    random:Random;
    map:{startTile:Tile,allTiles:Tile[]};
    event:EventManager;
    constructor() {
        const displayDiv:HTMLElement|null = document.getElementById("display");
        
        if (displayDiv) {
            this.displayDiv = displayDiv;
        } else {
            throw new Error("Unable to find display.");
        }

        this.displayWidth=15;
        this.displayHeight=15;
        this.display = new Display({target:displayDiv, width: this.displayWidth, height: this.displayHeight});
        this.center = [Math.ceil(this.displayWidth/2),Math.ceil(this.displayHeight/2)];
        this.display.tileSize = this.display.calculateTileSize();

        this.random = new Random();
            
        this.map = MapGenerator(1,this.random);
        const tile = this.map.startTile;

        const fov = new FOV(
            (tile:Tile) => {
                return tile.seeThrough;
            },
            ([x,y],tile:Tile) => {
                this.display.setTile(this.center[0]+x, this.center[1]+y, tile.getTile());
            },
            (tile:Tile) => {

                this.map.allTiles.forEach(tile=>tile.remembered=0);

                const toDisplay:any[][] = [];
                for(let i=0;i<this.displayWidth;i++) {
                    const row:any = []
                    for(let j=0;j<this.displayHeight;j++) {
                        row.push(-1);
                    }
                    toDisplay.push(row);
                }
                let distance = 0;
                let rememberList:RememberTile[] = [
                    {
                        position:[this.center[0],this.center[1]],
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

                for(let i=0;i<this.displayWidth;i++) {
                    for(let j=0;j<this.displayHeight;j++) {
                        this.display.setTile(i,j,toDisplay[j][i]);
                    }
                }
            },7
        );

        this.event = new EventManager({type:'simple'});

        if(tile) {
            const player = new Player({
                startTile:tile,
                fov: fov,
            });
            const foe = new Foe({
                type:'mouse',
                startTile: this.random.getRandomElement(this.map.allTiles.filter(x=>x.passable)),
                rng:this.random
            })
            this.event.add(player);
            this.event.add(foe);
            const go = async ()=>{
                while(1===1) {
                    await this.event.advance();
                }
            }
            go();
        } else {
            // Update this to figure out an alternative (i.e. maybe try again?)
            throw new Error("No initial tile found.");
        }
    }
}