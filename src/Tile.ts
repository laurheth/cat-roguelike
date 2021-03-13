import Critter from './Critter';
import { Appearance } from './commonInterfaces';
import Item from './Item';

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
    private extraClass:string[];
    private lastSeenAppearance:Appearance;
    public critter:Critter|null;
    public item:Item|null;
    public passable:boolean;
    public seeThrough:boolean;
    public remembered:number;
    public isStair:boolean;
    public isPortal:boolean;
    public isDoor:boolean;
    private seen:boolean;
    constructor(neighours:Neighbours,appearance:Appearance, passable:boolean, seeThrough:boolean) {
        this.neighbours = neighours;
        this.appearance = appearance;
        this.lastSeenAppearance = appearance;
        this.critter = null;
        this.item = null;
        this.passable = passable;
        this.seeThrough = seeThrough;
        this.seen=false;
        this.remembered=1;
        this.extraClass=[];
        this.isStair=false;
        this.isPortal=false;
        this.isDoor=false;
    }

    public open() {
        if (this.isDoor) {
            this.isDoor=false;
            this.passable=true;
            this.seeThrough=true;
            this.setContent(".");
        }
    }

    /** Get neigjbour tile along a direction */
    public getNeighbour(step:Step):Tile|undefined {
        return this.neighbours[this.toKey(step)];
    }

    /** Get all neighbours */
    public getNeighbours():Tile[] {
        const neighbours:Tile[] = [];
        for(let key in this.neighbours) {
            if(this.neighbours[key]) {
                neighbours.push(this.neighbours[key]);
            }
        }
        return neighbours;
    }

    /** Find empty neighbour */
    public findEmptyNeigbour(check:(tile:Tile)=>boolean):Tile|undefined {
        let toReturn:Tile|undefined = undefined;
        if(check(this)) {
            toReturn = this;
        } else {
            const toCheck:Tile[] = this.getNeighbours();
            const checked:Tile[] = [this];
            while(!toReturn && checked.length<50) {
                if (toCheck.length <= 0) {
                    break;
                }
                const checkThis = toCheck.shift();
                if (checkThis) {
                    if(check(checkThis)) {
                        toReturn = checkThis;
                    } else {
                        checkThis.getNeighbours().forEach(x=>{
                            if(!checked.includes(x) && !toCheck.includes(x)) {
                                toCheck.push(x);
                            }
                        })
                    }
                }
            }
        }
        return toReturn;
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
                const critterAppearance = this.critter.appearance;
                appearance = {
                    content: critterAppearance.content,
                    classList:[...critterAppearance.classList,...this.appearance.classList,...this.extraClass]
                };
            } else if (this.item) {
                const itemAppearance = this.item.appearance;
                appearance = {
                    content: itemAppearance.content,
                    classList:[...itemAppearance.classList,...this.appearance.classList,...this.extraClass]
                };
            } else {
                appearance = {
                    content:this.appearance.content,
                    classList:[...this.appearance.classList,...this.extraClass]
                };
            }
            this.lastSeenAppearance = appearance;
            return appearance;
        }
    }

    public getTileContent() {
        return this.appearance.content;
    }

    public setContent(str:string) {
        this.appearance.content = str;
    }

    public setTile(appearance:Appearance) {
        this.appearance = appearance;
    }

    public addClass(className:string) {
        this.extraClass.push(className);
    }

    public removeClass(className:string) {
        this.extraClass = this.extraClass.filter(x=>x!==className);
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
        if (!this.remembered) {
            this.remembered = distance+1;
            if(this.seen && toRemember[y] && toRemember[y][x] && toRemember[y][x] === -1) {
                toRemember[y][x]=this.getTile(false);
            }
            const returnList:RememberTile[] = [];
            for(let i=-1;i<2;i++) {
                for(let j=-1;j<2;j++) {
                    if (Math.abs(i)+Math.abs(j) !== 1) {
                        continue;
                    }
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
