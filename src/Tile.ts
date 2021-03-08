import { textChangeRangeIsUnchanged } from 'typescript';
import Critter from './Critter';

interface Neighbours {
    [key:string]:Tile;
}

type Step = number[];

/**
 * Slightly esoteric tile definition, but I think it might be fun.
 */
export default class Tile {
    private neighbours:Neighbours;
    private appearance:any;
    private critter:Critter|null;
    readonly passable:boolean;
    readonly seeThrough:boolean;
    constructor(neighours:Neighbours,appearance:any, passable:boolean, seeThrough:boolean) {
        this.neighbours = neighours;
        this.appearance = appearance;
        this.critter = null;
        this.passable = passable;
        this.seeThrough = seeThrough;
    }

    /** Get neigjbour tile along a direction */
    public getNeighbour(step:Step):Tile|undefined {
        return this.neighbours[this.toKey(step)];
    }

    /** Translate a step into a string key */
    private toKey(step:Step):string {
        return step.map(x=>x.toString()).join(',');
    }

    /** Add a neighbour */
    public addNeighbour(step:Step, tile:Tile):boolean {
        const key = this.toKey(step);
        if(key in this.neighbours) {
            return false;
        } else {
            this.neighbours[key] = tile;
            return true;
        }
    }

    /** Get what the tile should look like on the display */
    public getTile() {
        if (this.critter) {
            return this.critter.appearance;
        } else {
            return this.appearance;
        }
    }

    /** Attempt to move a critter into the tile */
    public enterTile(critter:Critter):Critter|true|false {
        if (this.critter) {
            return this.critter;
        } else if (!this.passable) {
            return false;
        } else {
            this.critter = critter;
            return true;
        }
    }

    /** Clear critter from the tile */
    public exitTile() {
        this.critter = null;
    }
}
