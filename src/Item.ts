import Tile from "./Tile";
import { Appearance } from "./commonInterfaces";

interface ItemParams {
    appearance:Appearance;
    name:string;
    type:"food"|"key";
    tile:Tile;
}

export default class Item {
    private _appearance:Appearance;
    constructor(params:ItemParams) {
        const { appearance, name, type, tile, ...rest } = params;
        this._appearance = appearance;
        const possibleTile = tile.findEmptyNeigbour((tile:Tile)=>!tile.item);
        if (possibleTile) {
            possibleTile.item = this;
        } else {
            throw new Error("No available space.");
        }
    }

    get appearance() {
        return this._appearance;
    }
}