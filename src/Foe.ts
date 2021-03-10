import Tile from './Tile';
import {default as Critter, CritterParams } from './Critter';
import { Random } from 'roguelike-pumpkin-patch';

interface FoeParams {
    type:string;
    startTile:Tile;
    rng:Random;
}

/** Foe */
export default class Foe extends Critter {
    private type:string;
    private rng:Random;
    private awake:number;
    private enthusiasm:number;
    constructor(params:FoeParams) {
        const { type, startTile, rng, ...rest } = params;
        const critterParams:CritterParams = {
            startTile:startTile,
            appearance:{
                content:'g',
                classList:[]
            }
        };
        let enthusiasm = 5;
        console.log(type);
        switch(type) {
            case 'mouse':
                critterParams.appearance = {
                    content:'<img src="./assets/mouse.png" alt="A mouse.">',
                    classList:['mouse']
                };
                break;
            default:
            case 'bug':
                critterParams.appearance = {
                    content:'b',
                    classList:['bug']
                };
                break;
        }

        super(critterParams);
        this.type = type;
        this.rng = rng;
        this.awake=-1;
        this.enthusiasm = enthusiasm;
    }

    get appearance() {
        this.awake = this.enthusiasm;
        return this.getAppearance();
    }

    /** Act */
    act() {
        if (this.awake < 0) {
            const options = [[-1,0],[1,0],[0,1],[0,-1]];
            const step = this.rng.getRandomElement(options);
            this.step(step[0],step[1])
        } else {
            const possibleTiles:{tile:Tile,step:[number,number]}[] = [];
            for(let i=-1;i<2;i++) {
                for(let j=-1;j<2;j++) {
                    if (Math.abs(i) + Math.abs(j) !== 1) {
                        continue;
                    }
                    const tile = this.currentTile.getNeighbour([i,j]);
                    if (tile && tile.passable) {
                        possibleTiles.push({
                            tile:tile,
                            step:[i,j],
                        });
                    }
                }
            }
            const min = possibleTiles.find(x=>{
                return x.tile.remembered === Math.min(...possibleTiles.map(y=>y.tile.remembered));
            });
            if (min) {
                this.step(min.step[0],min.step[1]);
            }
        }
    }
}