import Tile from './Tile';
import { Appearance } from './commonInterfaces';

const nonSeeThrough = ['#'];
const nonPassable = ['#'];

/**
 * Takes a 2d array and builds some interconnected tiles with it.
 * This bullshit tile system will not be practical without a helper function like this.
 */
const RoomBuilder = (
    room:Array<Array<string>>,
    theme:{[key:string]:string[]} = {'#':['wall'],'.':['floor']}
    ) => {
    // Make a 2d array of tiles
    const tileMap = room.map(row=>{
        return row.map(x=>{
            if (x && x !== " ") {
                const appearance:Appearance = {
                    content:x,
                    classList:[]
                }
                if (theme[x]) {
                    appearance.classList = theme[x];
                }
                return new Tile({},appearance,!nonPassable.includes(x),!nonSeeThrough.includes(x));
            } else {
                return null;
            }
        });
    });

    // Now connect them all
    tileMap.forEach((row,j)=>{
        row.forEach((col,i)=>{
            if (col) {
                for (let ii=-1;ii<2;ii++) {
                    for(let jj=-1;jj<2;jj++) {
                        if (ii===0 && jj===0) {
                            continue;
                        }
                        if(tileMap[j+jj]) {
                            const tile = tileMap[j+jj][i+ii];
                            if (tile) {
                                col.addNeighbour([ii,jj],tile);
                            }
                        }
                    }
                }
            }
        });
    });

    // Return the whole tileMap; something else can handle the logic of putting the pieces together
    return tileMap;
};

export default RoomBuilder;