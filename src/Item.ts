import Tile from "./Tile";
import Player from './Player';
import { Appearance } from "./commonInterfaces";
import Game from './Game';

type UseFunction = (item:Item, user:Player, game:Game)=>(Item|null);

export type itemTypes = "food"|"key"|"victory"|"special";

interface ItemParams {
    appearance:Appearance;
    name:string;
    type:itemTypes;
    tile:Tile;
    value?:number;
    onUse?:UseFunction;
    useVerb?:string;
}


export default class Item {
    private _appearance:Appearance;
    readonly usable:boolean;
    public value:number;
    readonly name:string;
    readonly useVerb:string;
    private onUse:UseFunction;
    readonly type:itemTypes;
    readonly isKey:boolean;
    constructor(params:ItemParams) {
        const { appearance, name, type, tile, value=0, useVerb="Use", ...rest } = params;
        let onUse = rest.onUse;
        this.type=type;
        this._appearance = appearance;
        const possibleTile = tile.findEmptyNeigbour((tile:Tile)=>!tile.item);
        if (possibleTile) {
            possibleTile.item = this;
        } else {
            throw new Error("No available space.");
        }
        this.usable=false;
        this.name=name;
        this.value=value;
        this.useVerb=useVerb;
        if(type === "food") {
            this.usable = true;
            this.useVerb="Eat";
            if (!onUse) {
                onUse = (item:Item, user:Player,game:Game)=>{
                    user.feed(item.value);
                    return null;
                }
            }
        } else if(type === "special") {
            this.usable = true;
        }
        if(type === "key") {
            this.isKey=true;
        } else {
            this.isKey=false;
        }
        if (!onUse) {
            onUse = (item:Item, user:Player, game:Game) => null;
        }
        this.onUse = onUse;
    }

    // Use the item. Return the item after use.
    public use(user:Player,game:Game) {
        return this.onUse(this, user, game);
    }

    get appearance() {
        return this._appearance;
    }
}