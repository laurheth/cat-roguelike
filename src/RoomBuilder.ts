import Tile from './Tile';
import { Appearance } from './commonInterfaces';
import { Random } from 'roguelike-pumpkin-patch';

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

// export default RoomBuilder;

const hallBuilder = (room1:Tile[],room2:Tile[],rng:Random,
        theme:{[key:string]:string[]} = {'#':['wall'],'.':['floor']},
        range:[number,number]=[1,5],
    ) => {
    // Find appropriate connection points in room1 and room2
    const dirs = [[-1,0],[1,0],[0,1],[0,-1]];
    const startDirection = [0,0];
    const endDirection = [0,0];
    room1.sort(()=>rng.getRandom()-0.5);
    const tile1 = room1.find((tile)=>{
        if (!tile.passable) {
            const neighbours = dirs.map(dir=>tile.getNeighbour(dir));
            if( neighbours[0] && !neighbours[0].passable && neighbours[1] && !neighbours[1].passable ) {
                if (neighbours[2] && neighbours[2].passable) {
                    startDirection[1] = -1;
                    return true;
                } else if (neighbours[3] && neighbours[3].passable) {
                    startDirection[1] = 1;
                    return true;
                }
            } else if( neighbours[2] && !neighbours[2].passable && neighbours[3] && !neighbours[3].passable ) {
                if (neighbours[0] && neighbours[0].passable) {
                    startDirection[0] = 1;
                    return true;
                } else if (neighbours[1] && neighbours[1].passable) {
                    startDirection[0] = -1;
                    return true;
                }
            }
            return false;
        }
    });
    room2.sort(()=>rng.getRandom()-0.5);
    const tile2 = room2.find((tile)=>{
        if (!tile.passable) {
            const neighbours = dirs.map(dir=>tile.getNeighbour(dir));
            if( neighbours[0] && !neighbours[0].passable && neighbours[1] && !neighbours[1].passable ) {
                if (neighbours[2] && neighbours[2].passable) {
                    endDirection[1] = 1;
                    return true;
                } else if (neighbours[3] && neighbours[3].passable) {
                    endDirection[1] = -1;
                    return true;
                }
            } else if( neighbours[2] && !neighbours[2].passable && neighbours[3] && !neighbours[3].passable ) {
                if (neighbours[0] && neighbours[0].passable) {
                    endDirection[0] = -1;
                    return true;
                } else if (neighbours[1] && neighbours[1].passable) {
                    endDirection[0] = 1;
                    return true;
                }
            }
            return false;
        }
    });

    // Check we found tiles, otherwise, damn
    if (!tile1 || !tile2 || tile1 === tile2) {
        return false;
    }
    // Now, carve a hallway from start to finish
    let recentlyTurned = true;
    let currentTile = tile1;

    const allAddedTiles:Tile[] = [];

    const carve = (tile:Tile) => {
        tile.passable = true;
        tile.seeThrough = true;
        if(theme['.']) {
            tile.setTile({
                content:'.',
                classList:theme['.']
            });
        } else {
            tile.setTile({
                content:'.',
                classList:[]
            });
        }
        const wallTheme:Appearance = {
            content:'#',
            classList:[]
        }
        if (theme['#']) {
            wallTheme.classList = theme['#'];
        }
        for(let i=-1;i<2;i++) {
            for (let j=-1;j<2;j++) {
                if (i===0 && j===0) {
                    continue;
                }
                let otherTile = tile.getNeighbour([i,j]);
                if(!otherTile) {
                    otherTile = new Tile({},wallTheme,false,false);
                    allAddedTiles.push(otherTile);
                    tile.addNeighbour([i,j],otherTile);
                    otherTile.addNeighbour([-i,-j],tile);
                }
            }
        }
        tile.reconcileNeighbours();
    }
    let steps=rng.getNumber(...range);
    const direction = [...startDirection];
    let limiter=100;

    while(limiter > 0 && (!direction.every((x,i)=>x===endDirection[i]) || recentlyTurned)) {
        limiter--;
        carve(currentTile);
        if (recentlyTurned) {
            recentlyTurned = false;
            steps = rng.getNumber(...range);
        } else {
            steps--;
            if (steps<=0) {
                if (rng.getRandom()>0.5) {
                    [direction[0],direction[1]] = [Math.round(direction[1]),Math.round(-direction[0])];
                } else {
                    [direction[0],direction[1]] = [Math.round(-direction[1]),Math.round(direction[0])];
                }
                recentlyTurned = true;
            }
        }
        const nextTile = currentTile.getNeighbour(direction);
        if (nextTile) {
            currentTile = nextTile;
        } else {
            // oh no!
            return false;
        }
    }
    // Finally, connect the other end
    console.log(direction,currentTile,tile2);
    if (currentTile) {
        currentTile.addNeighbour(direction,tile2);
        tile2.addNeighbour(direction.map(x=>-x),currentTile);
        carve(currentTile);
        carve(tile2);
        console.log(tile2);
        return allAddedTiles;
    }
    return false;
}

export { RoomBuilder as default, hallBuilder };