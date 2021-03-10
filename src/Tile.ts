import { textChangeRangeIsUnchanged } from 'typescript';
import Critter from './Critter';
import { Appearance } from './commonInterfaces';

interface Neighbours {
    [key:string]:Tile;
}

type Step = number[];

export interface RememberTile {
    position:[number,number];
    tile:Tile;
}

/**
 * Slightly esoteric tile definition, but I think it might be fun.
 */
export default class Tile {
    private neighbours:Neighbours;
    private appearance:Appearance;
    private lastSeenAppearance:Appearance;
    private critter:Critter|null;
    public passable:boolean;
    public seeThrough:boolean;
    public remembered:number;
    private seen:boolean;
    constructor(neighours:Neighbours,appearance:Appearance, passable:boolean, seeThrough:boolean) {
        this.neighbours = neighours;
        this.appearance = appearance;
        this.lastSeenAppearance = appearance;
        this.critter = null;
        this.passable = passable;
        this.seeThrough = seeThrough;
        this.seen=false;
        this.remembered=1;
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
    public getTile(direct=true):Appearance {
        this.seen = true;
        if (!direct) {
            return {
                content:this.lastSeenAppearance.content,
                classList:[...this.lastSeenAppearance.classList, 'memory']
            };
        } else {
            let appearance:Appearance;
            if (this.critter) {
                appearance = this.critter.appearance;
            } else {
                appearance = this.appearance;
            }
            this.lastSeenAppearance = appearance;
            return appearance;
        }
    }

    public setTile(appearance:Appearance) {
        this.appearance = appearance;
    }

    /** Check if a tile has been seen */
    public wasSeen() {
        return this.seen;
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

    /** Tile memory */
    public remember([x,y]:[number,number], toRemember:any[][],distance:number):RememberTile[] {
        if (this.seen && !this.remembered) {
            this.remembered = distance+1;
            if(toRemember[y] && toRemember[y][x] && toRemember[y][x] === -1) {
                toRemember[y][x]=this.getTile(false);
            }
            const returnList:RememberTile[] = [];
            for(let i=-1;i<2;i++) {
                for(let j=-1;j<2;j++) {
                    const nextTile = this.getNeighbour([i,j]);
                    if (nextTile) {
                        returnList.push({
                            position:[x+i,y+j],
                            tile:nextTile
                        });
                    }
                }
            }
            return returnList;
        } else {
            return [];
        }
    }

    /** Make sure neighbours are correct */
    public reconcileNeighbours() {
        for(let i=-1;i<2;i++) {
            for(let j=-1;j<2;j++) {
                if (i===0 && j===0) {
                    continue;
                }
                const neighbour1 = this.getNeighbour([i,j]);
                if(neighbour1) {
                    for(let ii=-1;ii<2;ii++) {
                        for(let jj=-1;jj<2;jj++) {
                            if (i+ii === 0 && j+jj === 0) {
                                continue;
                            }
                            const neighbour2 = this.getNeighbour([i+ii,j+jj]);
                            if (neighbour2) {
                                neighbour1.addNeighbour([ii,jj],neighbour2);
                                neighbour2.addNeighbour([-ii,-jj],neighbour1);
                            }
                        }
                    }
                }
            }
        }
    }
}
