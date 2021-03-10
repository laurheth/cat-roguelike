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
    constructor(params:FoeParams) {
        const { type, startTile, rng, ...rest } = params;
        const critterParams:CritterParams = {
            startTile:startTile,
            appearance:{
                content:'g',
                classList:[]
            }
        };
        switch(type) {
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
    }

    /** Act */
    act() {
        const options = [[-1,0],[1,0],[0,1],[0,-1]];
        const step = this.rng.getRandomElement(options);
        // const randomTile = this.currentTile.getNeighbour();
        this.step(step[0],step[1])
    }
}